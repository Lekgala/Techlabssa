import cors from 'cors';
import crypto from 'node:crypto';
import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import { DatabaseConflict, getDatabase, saveDatabase } from './data/store.ts';
import { yocoRouter, yocoWebhook } from './services/yoco-routes.ts';
import { YocoError } from './services/yoco-ledger.ts';
import { forwardAsyncErrors } from './services/async-express.ts';
import { generateBrandedDocumentPDF, generateInvoiceHTML, generateInvoicePDF } from './services/invoice-service.ts';
import { emailAutomationEngine } from './services/email-automation.ts';
import { bulkOperationsService } from './services/bulk-operations.ts';
import { escapeHtml, sendEmail } from './services/email-service.ts';
import { notifyAdmissions } from './services/application-notification.ts';
import { runPaymentReminders } from './services/payment-reminders.ts';
import { createLabPilotRouter } from './services/lab-pilot.ts';
import { createProofStorage, proofNotFound } from './services/proof-storage.ts';
import { buildCohortCalendar, buildCurriculumSchedule } from '../src/lib/curriculumSchedule.ts';

type Session = { role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'; userId: string; email: string; expiresAt: number };
type AuthedRequest = Request & { session?: Session; rawBody?: string };
const app = express();
forwardAsyncErrors(app);
const PORT = Number(process.env.PORT || 4000);
const appOrigin = process.env.APP_ORIGIN || 'http://localhost:3000';
const isProduction = process.env.NODE_ENV === 'production';
const sessionCookieName = 'techlabs_session';
const csrfCookieName = 'techlabs_csrf';
const requestWindows = new Map<string, { count: number; resetAt: number }>();
const adminEmail = (process.env.ADMIN_EMAIL || 'admin@localhost').toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || '';
const proofStorage = createProofStorage();
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestWindows) if (value.resetAt <= now) requestWindows.delete(key);
}, 10 * 60 * 1000).unref();

app.disable('x-powered-by');
app.use(cors({ origin: appOrigin, credentials: true, methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'], allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-File-Name', 'X-EFT-Reference'] }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Content-Security-Policy', "default-src 'self'; base-uri 'self'; frame-ancestors 'none'; object-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:; font-src 'self' data:");
  if (isProduction) res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
app.post('/api/webhooks/yoco', ...yocoWebhook());
app.use(express.json({ limit: '256kb', verify: (req: AuthedRequest, _res, buffer) => { req.rawBody = buffer.toString('utf8'); } }));

const parseCookies = (header?: string) => Object.fromEntries((header || '').split(';').map(value => value.trim().split('=').filter(Boolean)).filter(parts => parts.length >= 2).map(([key, ...value]) => [key, decodeURIComponent(value.join('='))]));
const setCookie = (res: Response, name: string, value: string, options: { httpOnly: boolean; maxAge: number }) => {
  const attributes = [`${name}=${encodeURIComponent(value)}`, 'Path=/', `Max-Age=${Math.floor(options.maxAge / 1000)}`, `SameSite=${isProduction ? 'None' : 'Lax'}`];
  if (options.httpOnly) attributes.push('HttpOnly');
  if (isProduction) attributes.push('Secure');
  res.append('Set-Cookie', attributes.join('; '));
};
const setSessionCookie = (res: Response, token: string) => setCookie(res, sessionCookieName, token, { httpOnly: true, maxAge: 8 * 60 * 60 * 1000 });
const clearSessionCookie = (res: Response) => res.append('Set-Cookie', `${sessionCookieName}=; Path=/; Max-Age=0; SameSite=${isProduction ? 'None' : 'Lax'}${isProduction ? '; Secure' : ''}; HttpOnly`);
const ensureCsrfCookie = (req: Request, res: Response) => {
  const cookies = parseCookies(req.header('cookie'));
  const token = cookies[csrfCookieName] || crypto.randomBytes(24).toString('base64url');
  if (!cookies[csrfCookieName]) setCookie(res, csrfCookieName, token, { httpOnly: false, maxAge: 8 * 60 * 60 * 1000 });
  return token;
};
app.use((req, res, next) => {
  const csrf = ensureCsrfCookie(req, res);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method) || req.path === '/api/webhooks/yoco' || req.path === '/api/webhooks/resend') return next();
  const cookies = parseCookies(req.header('cookie'));
  if (cookies[sessionCookieName] && !req.header('authorization') && req.header('x-csrf-token') !== csrf) return res.status(403).json({ error: 'CSRF validation failed' });
  next();
});

const safeEqual = (left: string, right: string) => {
  const a = Buffer.from(left); const b = Buffer.from(right);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const requiredText = (value: unknown, max = 200) => typeof value === 'string' && value.trim().length > 0 && value.length <= max;
const validEmail = (value: unknown) => requiredText(value, 254) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value as string);
const calculateTuition = (tier: string, settings: Awaited<ReturnType<typeof getDatabase>>['academySettings']) => {
  const prices: Record<string, number> = { STARTER: 1999, PROFESSIONAL: 3499, CAREER_ACCELERATOR: 4999 };
  const configuredPrice = settings.courseTierPricing?.[tier as 'STARTER' | 'PROFESSIONAL' | 'CAREER_ACCELERATOR']?.priceZAR;
  const base = configuredPrice ?? prices[tier];
  if (!base) return undefined;
  const sale = settings.flashSale;
  const targeted = sale?.enabled && sale.discountPercent > 0 && sale.discountPercent < 100 && (!sale.targetTiers?.length || sale.targetTiers.includes(tier as any));
  return targeted ? Math.round(base * (1 - sale.discountPercent / 100)) : base;
};
const calculateTuitionBreakdown = (tier: string, settings: Awaited<ReturnType<typeof getDatabase>>['academySettings']) => {
  const prices: Record<string, number> = { STARTER: 1999, PROFESSIONAL: 3499, CAREER_ACCELERATOR: 4999 };
  const listPriceZAR = settings.courseTierPricing?.[tier as 'STARTER' | 'PROFESSIONAL' | 'CAREER_ACCELERATOR']?.priceZAR ?? prices[tier];
  const sale = settings.flashSale;
  const discounted = Boolean(sale?.enabled && sale.discountPercent > 0 && sale.discountPercent < 100 && (!sale.targetTiers?.length || sale.targetTiers.includes(tier as any)));
  const discountPercent = discounted ? sale!.discountPercent : 0;
  const amountZAR = discounted ? Math.round(listPriceZAR * (1 - discountPercent / 100) * 100) / 100 : listPriceZAR;
  return { amountZAR, listPriceZAR, discountZAR: Math.round((listPriceZAR - amountZAR) * 100) / 100, discountPercent };
};
const renderStoredTemplate = (db: Awaited<ReturnType<typeof getDatabase>>, templateId: string, variables: Record<string, unknown>) => {
  const template = db.emailTemplates.find(item => item.id === templateId && item.enabled);
  if (!template) return null;
  let subject = template.subject; let html = template.htmlBody;
  for (const [key, value] of Object.entries(variables)) { const placeholder = new RegExp(`\\{${key}\\}`, 'g'); subject = subject.replace(placeholder, String(value)); html = html.replace(placeholder, String(value)); }
  return { subject, html };
};
const makeId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
const maskAuditValue = (key: string, value: unknown) => key === 'accountNumber' && typeof value === 'string' ? `****${value.slice(-4)}` : value;
const auditChanges = (before: Record<string, any>, after: Record<string, any>, keys: string[]) => Object.fromEntries(keys.filter(key => JSON.stringify(before[key]) !== JSON.stringify(after[key])).map(key => [key, { before: maskAuditValue(key, before[key]), after: maskAuditValue(key, after[key]) }]));
const addAudit = (db: Awaited<ReturnType<typeof getDatabase>>, req: AuthedRequest, action: string, entityType: string, entityId: string, summary: string, changes?: Record<string, { before: unknown; after: unknown }>) => {
  db.auditLogs.unshift({ id: makeId('audit'), action, actorEmail: req.session?.email || 'system', entityType, entityId, summary, ...(changes && Object.keys(changes).length ? { changes } : {}), ipAddress: req.ip || req.socket.remoteAddress, createdAt: new Date().toISOString() });
};
const syncInstallmentStatuses = (db: Awaited<ReturnType<typeof getDatabase>>, invoiceId: string) => {
  const invoice = db.invoices.find(item => item.id === invoiceId); if (!invoice) return;
  let remainingPaid = invoice.paidZAR ?? 0; const today = new Date().toISOString().slice(0, 10);
  for (const installment of db.paymentInstallments.filter(item => item.invoiceId === invoiceId).sort((a, b) => a.sequence - b.sequence)) {
    installment.paidZAR = Math.min(installment.amountZAR, Math.max(0, remainingPaid)); remainingPaid -= installment.paidZAR;
    installment.status = installment.paidZAR >= installment.amountZAR ? 'PAID' : installment.paidZAR > 0 ? 'PARTIALLY_PAID' : installment.dueDate < today ? 'OVERDUE' : 'PENDING';
    if (installment.status === 'PAID') installment.paidAt ||= invoice.paidAt || today; else delete installment.paidAt;
  }
};
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');
const issueSession = async (data: Omit<Session, 'expiresAt'>) => {
  const token = crypto.randomBytes(32).toString('base64url');
  const db = await getDatabase();
  const now = new Date();
  db.sessions = db.sessions.filter(item => new Date(item.expiresAt).getTime() > now.getTime());
  db.sessions.push({ id: makeId('session'), tokenHash: hashToken(token), ...data, createdAt: now.toISOString(), expiresAt: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString() });
  await saveDatabase(db);
  return token;
};
const passwordIsStrong = (password: string) => password.length >= 10 && password.length <= 128 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
const hashPassword = (password: string) => new Promise<string>((resolve, reject) => {
  const salt = crypto.randomBytes(16).toString('hex');
  crypto.scrypt(password, salt, 64, (error, derivedKey) => error ? reject(error) : resolve(`scrypt:${salt}:${derivedKey.toString('hex')}`));
});
const verifyPassword = (password: string, encoded?: string) => new Promise<boolean>((resolve) => {
  const [, salt, stored] = String(encoded || '').split(':');
  if (!salt || !stored) return resolve(false);
  crypto.scrypt(password, salt, 64, (error, derivedKey) => {
    if (error) return resolve(false);
    const expected = Buffer.from(stored, 'hex');
    resolve(expected.length === derivedKey.length && crypto.timingSafeEqual(expected, derivedKey));
  });
});
const createAuthToken = (db: Awaited<ReturnType<typeof getDatabase>>, applicationId: string, purpose: 'SETUP' | 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'MAGIC_LOGIN', minutes: number) => {
  const raw = crypto.randomBytes(32).toString('base64url');
  db.authTokens = db.authTokens.filter(item => item.applicationId !== applicationId || item.purpose !== purpose || Boolean(item.usedAt));
  db.authTokens.push({ id: makeId('auth'), applicationId, tokenHash: hashToken(raw), purpose, createdAt: new Date().toISOString(), expiresAt: new Date(Date.now() + minutes * 60_000).toISOString() });
  return raw;
};
const verifyResendWebhook = (req: AuthedRequest) => {
  const secret = process.env.RESEND_WEBHOOK_SECRET;
  const id = req.header('svix-id'); const timestamp = req.header('svix-timestamp'); const signature = req.header('svix-signature');
  if (!secret || !id || !timestamp || !signature || !req.rawBody) return false;
  if (Math.abs(Date.now() / 1000 - Number(timestamp)) > 300) return false;
  try {
    const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
    const expected = crypto.createHmac('sha256', key).update(`${id}.${timestamp}.${req.rawBody}`).digest('base64');
    return signature.split(' ').some(item => item.startsWith('v1,') && safeEqual(item.slice(3), expected));
  } catch { return false; }
};
async function authenticate(req: AuthedRequest, res: Response, next: NextFunction) {
  const cookies = parseCookies(req.header('cookie'));
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '') || cookies[sessionCookieName];
  const db = await getDatabase();
  const stored = token ? db.sessions.find(item => item.tokenHash === hashToken(token)) : undefined;
  if (!stored || new Date(stored.expiresAt).getTime() <= Date.now()) {
    if (stored) { db.sessions = db.sessions.filter(item => item.id !== stored.id); await saveDatabase(db); }
    clearSessionCookie(res);
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.session = { role: stored.role, userId: stored.userId, email: stored.email, expiresAt: new Date(stored.expiresAt).getTime() }; next();
}
const requireRole = (role: Session['role']) => (req: AuthedRequest, res: Response, next: NextFunction) =>
  req.session?.role === role ? next() : res.status(403).json({ error: 'Forbidden' });
const requireAnyRole = (...roles: Session['role'][]) => (req: AuthedRequest, res: Response, next: NextFunction) =>
  req.session && roles.includes(req.session.role) ? next() : res.status(403).json({ error: 'Forbidden' });
let enrollmentQueue: Promise<void> = Promise.resolve();
const serializeEnrollment = async (_req: Request, res: Response, next: NextFunction) => {
  const previous = enrollmentQueue; let release!: () => void;
  enrollmentQueue = new Promise<void>(resolve => { release = resolve; });
  await previous;
  let released = false; const finish = () => { if (!released) { released = true; release(); } };
  res.once('finish', finish); res.once('close', finish); next();
};
const rateLimit = (name: string, limit: number, windowMs: number) => (req: Request, res: Response, next: NextFunction) => {
  const key = `${name}:${req.ip || req.socket.remoteAddress || 'unknown'}`;
  const now = Date.now();
  const current = requestWindows.get(key);
  const entry = !current || current.resetAt <= now ? { count: 1, resetAt: now + windowMs } : { ...current, count: current.count + 1 };
  requestWindows.set(key, entry);
  res.setHeader('RateLimit-Limit', String(limit));
  res.setHeader('RateLimit-Remaining', String(Math.max(0, limit - entry.count)));
  res.setHeader('RateLimit-Reset', String(Math.ceil(entry.resetAt / 1000)));
  if (entry.count > limit) return res.status(429).json({ error: 'Too many requests. Please try again later.' });
  next();
};
app.use('/api', yocoRouter(authenticate, requireRole('STUDENT'), requireRole('ADMIN'), rateLimit('yoco-checkout', 10, 60_000)));

app.use('/api/lab-pilot', authenticate, rateLimit('lab-pilot', 60, 60 * 1000), createLabPilotRouter({ getTickets: async () => (await getDatabase()).tickets }));
app.get('/api/admin/lab-pilot-students', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res, next) => {
  try { const db = await getDatabase(); res.json(db.applications.filter(a => a.status === 'ENROLLED').map(a => ({ id: a.id, name: `${a.firstName} ${a.lastName}` }))); } catch (error) { next(error); }
});
app.post('/api/admin/lab-pilot-tickets', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res, next) => {
  try {
    const scenarios: Record<string, { title: string; description: string }> = {
      'TEST-001': { title: 'Practice incident: lab marker remains present', description: 'Locate C:\\ProgramData\\TechLabs\\LabAgent\\Sandbox\\broken.txt in the assigned VM. Remove only this marker file, explain your action, and request verification.' },
      'WIN-001': { title: 'Printing is unavailable on the lab workstation', description: 'Investigate why the lab workstation cannot print. Restore printing services and document your diagnosis.' },
      'DNS-001': { title: 'The lab workstation cannot resolve expected hostnames', description: 'Investigate the lab network configuration and restore the instructor-approved DNS configuration. Document your checks and repair.' },
    };
    const scenario = scenarios[req.body?.faultId];
    if (!scenario || !['TEST-001', 'WIN-001', 'DNS-001'].includes(req.body?.faultId)) return res.status(400).json({ error: 'Choose a pilot scenario.' });
    const db = await getDatabase(); const student = db.applications.find(a => a.id === req.body?.studentId && a.status === 'ENROLLED');
    if (!student) return res.status(400).json({ error: 'Choose an enrolled student.' });
    const ticket = { id: makeId('tkt'), ticketNumber: `LAB-${crypto.randomUUID().slice(0, 8).toUpperCase()}`, priority: 'P3' as const, department: 'Training Lab', companyName: 'TechLabs', requestedBy: 'Lab instructor', device: 'Assigned pilot VM', issueTitle: scenario.title, description: scenario.description, systemEnvironment: 'Disposable Windows lab VM', stepsToReproduce: [], troubleshootingGuidance: [], expectedFix: '', status: 'OPEN' as const, assignedStudentId: student.id };
    db.tickets.push(ticket); addAudit(db, req, 'LAB_TICKET_CREATED', 'ticket', ticket.id, `Pilot ticket assigned to ${student.id}`); await saveDatabase(db); res.status(201).json(ticket);
  } catch (error) { next(error); }
});
app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'techlabs-api', timestamp: new Date().toISOString() }));
app.post('/api/webhooks/resend', async (req: AuthedRequest, res) => {
  if (!verifyResendWebhook(req)) return res.status(401).json({ error: 'Invalid webhook signature' });
  const providerId = req.body?.data?.email_id;
  const statusMap: Record<string, 'DELIVERED' | 'BOUNCED' | 'SUPPRESSED' | 'COMPLAINED' | 'FAILED'> = { 'email.delivered': 'DELIVERED', 'email.bounced': 'BOUNCED', 'email.suppressed': 'SUPPRESSED', 'email.complained': 'COMPLAINED', 'email.failed': 'FAILED' };
  const status = statusMap[req.body?.type];
  if (providerId && status) {
    const db = await getDatabase();
    db.emailDeliveries = db.emailDeliveries.map(item => item.providerId === providerId ? { ...item, status, reason: req.body?.data?.bounce?.message || req.body?.data?.suppressed?.message || item.reason } : item);
    await saveDatabase(db);
  }
  res.status(204).send();
});
app.get('/api/data', async (_req, res) => {
  const db = await getDatabase();
  const { bankName: _bankName, accountName: _accountName, accountNumber: _accountNumber, branchCode: _branchCode, ...publicSettings } = db.academySettings;
  res.json({ cohorts: db.cohorts, labs: db.labs, courseModules: db.courseModules, settings: publicSettings });
});

app.post('/api/auth/admin', rateLimit('admin-login', 5, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const db = await getDatabase();
  const staff = db.staffAccounts.find(item => item.email === email && item.active);
  if (staff && await verifyPassword(password, staff.passwordHash)) {
    const token = await issueSession({ role: staff.role, userId: staff.id, email });
    setSessionCookie(res, token);
    return res.json({ token, user: { id: staff.id, name: staff.name, email, role: staff.role } });
  }
  if (!adminPassword || !safeEqual(email, adminEmail) || !safeEqual(password, adminPassword)) return res.status(401).json({ error: 'Invalid credentials' });
  const token = await issueSession({ role: 'ADMIN', userId: 'admin', email });
  setSessionCookie(res, token);
  res.json({ token, user: { id: 'admin', name: 'TechLabs Administrator', email, role: 'ADMIN' } });
});

app.post('/api/auth/student', rateLimit('student-login', 10, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const password = String(req.body?.password || '');
  const db = await getDatabase();
  const credential = db.studentCredentials.find(item => item.email === email);
  const application = credential && db.applications.find(item => item.id === credential.applicationId);
  if (!application || !credential?.passwordHash || !(await verifyPassword(password, credential.passwordHash))) return res.status(401).json({ error: 'Invalid email or password' });
  if (!credential.emailVerifiedAt) return res.status(403).json({ error: 'Verify your email before signing in' });
  const token = await issueSession({ role: 'STUDENT', userId: application.id, email });
  setSessionCookie(res, token);
  res.json({ token, user: { id: application.id, name: `${application.firstName} ${application.lastName}`, email: application.email, role: 'STUDENT', whatsapp: application.whatsapp, cohortId: application.cohortId } });
});

const findUsableAuthToken = (db: Awaited<ReturnType<typeof getDatabase>>, raw: string, purposes: Array<'SETUP' | 'VERIFY_EMAIL' | 'RESET_PASSWORD' | 'MAGIC_LOGIN'>) =>
  db.authTokens.find(item => item.tokenHash === hashToken(raw) && purposes.includes(item.purpose) && !item.usedAt && new Date(item.expiresAt).getTime() > Date.now());
const portalLink = (action: string, token: string) => `${process.env.APP_ORIGIN || 'http://localhost:3000'}/student/login?action=${action}&token=${encodeURIComponent(token)}`;

app.get('/api/auth/token', rateLimit('auth-token-check', 30, 15 * 60 * 1000), async (req, res) => {
  const db = await getDatabase();
  const record = findUsableAuthToken(db, String(req.query.token || ''), ['SETUP', 'VERIFY_EMAIL', 'RESET_PASSWORD', 'MAGIC_LOGIN']);
  if (!record) return res.status(400).json({ error: 'This link is invalid or has expired' });
  res.json({ purpose: record.purpose });
});

app.post('/api/auth/set-password', rateLimit('set-password', 10, 15 * 60 * 1000), async (req, res) => {
  const raw = String(req.body?.token || ''); const password = String(req.body?.password || '');
  if (!passwordIsStrong(password)) return res.status(400).json({ error: 'Use at least 10 characters with uppercase, lowercase and a number' });
  const db = await getDatabase(); const record = findUsableAuthToken(db, raw, ['SETUP', 'RESET_PASSWORD']);
  if (!record) return res.status(400).json({ error: 'This password link is invalid or has expired' });
  const application = db.applications.find(item => item.id === record.applicationId);
  if (!application) return res.status(404).json({ error: 'Student account not found' });
  const now = new Date().toISOString();
  let credential = db.studentCredentials.find(item => item.applicationId === application.id);
  if (!credential) { credential = { applicationId: application.id, email: application.email.toLowerCase(), createdAt: now, updatedAt: now }; db.studentCredentials.push(credential); }
  credential.passwordHash = await hashPassword(password); credential.emailVerifiedAt = credential.emailVerifiedAt || now; credential.updatedAt = now; record.usedAt = now;
  db.authTokens = db.authTokens.map(item => item.applicationId === application.id && !item.usedAt ? { ...item, usedAt: now } : item);
  db.sessions = db.sessions.filter(item => item.userId !== application.id);
  await saveDatabase(db);
  res.json({ ok: true, message: 'Password saved and email verified. You can now sign in.' });
});

app.post('/api/auth/request-access', rateLimit('request-access', 5, 15 * 60 * 1000), async (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase();
  const requested = String(req.body?.type || 'RESET_PASSWORD');
  const db = await getDatabase(); const application = db.applications.find(item => item.email.toLowerCase() === email);
  const generic = { ok: true, message: 'If an eligible account exists, an email will arrive shortly.' };
  if (!application || !['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(application.status)) return res.json(generic);
  let credential = db.studentCredentials.find(item => item.applicationId === application.id);
  const now = new Date().toISOString();
  if (!credential) { credential = { applicationId: application.id, email, createdAt: now, updatedAt: now }; db.studentCredentials.push(credential); }
  const purpose = requested === 'MAGIC_LOGIN' && credential.emailVerifiedAt ? 'MAGIC_LOGIN' : requested === 'VERIFY_EMAIL' && credential.passwordHash && !credential.emailVerifiedAt ? 'VERIFY_EMAIL' : credential.passwordHash ? 'RESET_PASSWORD' : 'SETUP';
  const raw = createAuthToken(db, application.id, purpose, purpose === 'MAGIC_LOGIN' ? 15 : 60);
  const link = portalLink(purpose === 'MAGIC_LOGIN' ? 'magic' : purpose === 'SETUP' ? 'setup' : purpose === 'VERIFY_EMAIL' ? 'verify' : 'reset', raw);
  const subject = purpose === 'MAGIC_LOGIN' ? 'Your secure TechLabs sign-in link' : purpose === 'SETUP' ? 'Create your TechLabs portal password' : purpose === 'VERIFY_EMAIL' ? 'Verify your TechLabs email address' : 'Reset your TechLabs portal password';
  const action = purpose === 'MAGIC_LOGIN' ? 'sign in to your student portal' : purpose === 'SETUP' ? 'create your student portal password and verify your email' : purpose === 'VERIFY_EMAIL' ? 'verify your email address' : 'set a new student portal password';
  const delivery = await sendEmail({ to: email, subject, html: `<h2>${escapeHtml(subject)}</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>Use the secure link below to ${escapeHtml(action)}.</p><p><a href="${escapeHtml(link)}" style="display:inline-block;padding:12px 18px;background:#000;color:#fff;text-decoration:none;border-radius:8px">Continue securely</a></p><p>This link expires in ${purpose === 'MAGIC_LOGIN' ? '15 minutes' : '1 hour'} and can be used once. Complete this step in the same browser before returning to the portal.</p><p>If you did not request this email, ignore it. If the link has expired, request a new one from the student login page; do not contact admissions for a replacement link.</p><p>Regards,<br>TechLabs Academy</p>` });
  db.emailDeliveries.unshift({ id: makeId('email'), providerId: delivery.id, recipient: email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: now });
  await saveDatabase(db); res.json(generic);
});

app.post('/api/auth/magic-login', rateLimit('magic-login', 10, 15 * 60 * 1000), async (req, res) => {
  const db = await getDatabase(); const record = findUsableAuthToken(db, String(req.body?.token || ''), ['MAGIC_LOGIN']);
  if (!record) return res.status(400).json({ error: 'This sign-in link is invalid or has expired' });
  const application = db.applications.find(item => item.id === record.applicationId); const credential = db.studentCredentials.find(item => item.applicationId === record.applicationId);
  if (!application || !credential?.emailVerifiedAt) return res.status(403).json({ error: 'Account email is not verified' });
  record.usedAt = new Date().toISOString(); await saveDatabase(db);
  const token = await issueSession({ role: 'STUDENT', userId: application.id, email: application.email.toLowerCase() });
  setSessionCookie(res, token);
  res.json({ token, user: { id: application.id, name: `${application.firstName} ${application.lastName}`, email: application.email, role: 'STUDENT', whatsapp: application.whatsapp, cohortId: application.cohortId } });
});

app.post('/api/auth/verify-email', rateLimit('verify-email', 10, 15 * 60 * 1000), async (req, res) => {
  const db = await getDatabase(); const record = findUsableAuthToken(db, String(req.body?.token || ''), ['VERIFY_EMAIL']);
  if (!record) return res.status(400).json({ error: 'This verification link is invalid or has expired' });
  const credential = db.studentCredentials.find(item => item.applicationId === record.applicationId);
  if (!credential) return res.status(404).json({ error: 'Student account not found' });
  const now = new Date().toISOString(); credential.emailVerifiedAt = now; credential.updatedAt = now; record.usedAt = now; await saveDatabase(db);
  res.json({ ok: true, message: 'Email verified. You can now sign in.' });
});

app.post('/api/auth/logout', authenticate, (req: AuthedRequest, res) => {
  const token = req.header('authorization')?.replace(/^Bearer\s+/i, '');
  const cookieToken = parseCookies(req.header('cookie'))[sessionCookieName];
  void (async () => { if (token || cookieToken) { const db = await getDatabase(); db.sessions = db.sessions.filter(item => item.tokenHash !== hashToken(token || cookieToken)); await saveDatabase(db); } })().finally(() => { clearSessionCookie(res); res.status(204).send(); });
});
app.get('/api/session', authenticate, async (req: AuthedRequest, res) => {
  const session = req.session!;
  const db = await getDatabase();
  if (session.role === 'ADMIN' || session.role === 'INSTRUCTOR') {
    if (session.userId === 'admin' && session.role === 'ADMIN') return res.json({ user: { id: 'admin', name: 'TechLabs Administrator', email: session.email, role: 'ADMIN' } });
    const staff = db.staffAccounts.find(item => item.id === session.userId && item.active);
    if (!staff) return res.status(401).json({ error: 'Staff account is no longer active' });
    return res.json({ user: { id: staff.id, name: staff.name, email: staff.email, role: staff.role } });
  }
  const application = db.applications.find(item => item.id === session.userId);
  if (!application) return res.status(401).json({ error: 'Session user no longer exists' });
  res.json({ user: { id: application.id, name: `${application.firstName} ${application.lastName}`, email: application.email, role: 'STUDENT', whatsapp: application.whatsapp, cohortId: application.cohortId } });
});
app.get('/api/admin/data', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res) => {
  const db = await getDatabase();
  const { studentCredentials: _studentCredentials, authTokens: _authTokens, sessions: _sessions, auditLogs: _auditLogs, staffAccounts: _staffAccounts, ...safeAdminData } = db;
  res.json(safeAdminData);
});
app.get('/api/admin/staff', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res) => {
  const db = await getDatabase();
  const staff = db.staffAccounts.map(({ passwordHash: _passwordHash, ...account }) => account);
  if (!staff.some(item => item.email === adminEmail)) staff.unshift({ id: 'primary-admin', name: 'Primary Administrator', email: adminEmail, role: 'ADMIN', active: true, createdAt: 'SYSTEM', createdBy: 'SYSTEM' });
  res.json(staff);
});
app.post('/api/admin/staff', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const name = String(req.body?.name || '').trim(); const email = String(req.body?.email || '').trim().toLowerCase(); const password = String(req.body?.password || ''); const role = req.body?.role;
  if (!requiredText(name, 120) || !validEmail(email) || !['ADMIN', 'INSTRUCTOR'].includes(role)) return res.status(400).json({ error: 'Name, email, and a valid staff role are required' });
  if (!passwordIsStrong(password)) return res.status(400).json({ error: 'Password must be 10-128 characters with uppercase, lowercase, and a number' });
  const db = await getDatabase();
  if (email === adminEmail || db.staffAccounts.some(item => item.email === email)) return res.status(409).json({ error: 'A staff account already uses this email' });
  const staff = { id: makeId('staff'), name, email, role: role as 'ADMIN' | 'INSTRUCTOR', passwordHash: await hashPassword(password), active: true, createdAt: new Date().toISOString(), createdBy: req.session!.email };
  db.staffAccounts.push(staff); addAudit(db, req, 'STAFF_CREATED', 'staff', staff.id, `${staff.role} account created for ${staff.email}`); await saveDatabase(db);
  const { passwordHash: _passwordHash, ...safeStaff } = staff; res.status(201).json(safeStaff);
});
app.delete('/api/admin/staff/:id', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const staff = db.staffAccounts.find(item => item.id === req.params.id);
  if (!staff) return res.status(404).json({ error: 'Staff account not found' });
  if (staff.id === req.session!.userId) return res.status(400).json({ error: 'You cannot remove your own account' });
  db.staffAccounts = db.staffAccounts.filter(item => item.id !== staff.id); db.sessions = db.sessions.filter(item => item.userId !== staff.id); addAudit(db, req, 'STAFF_REMOVED', 'staff', staff.id, `${staff.role} account removed for ${staff.email}`); await saveDatabase(db); res.status(204).send();
});
app.get('/api/email/deliveries', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res) => {
  const db = await getDatabase();
  res.json(db.emailDeliveries);
});
app.get('/api/admin/audit-logs', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res) => {
  const db = await getDatabase();
  res.json(db.auditLogs.slice(0, 1000));
});
app.get('/api/admin/action-centre', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (_req, res) => {
  const db = await getDatabase(); const today = new Date().toISOString().slice(0, 10);
  for (const invoice of db.invoices) syncInstallmentStatuses(db, invoice.id);
  const hardware = db.applications.filter(item => ['NEW', 'UNDER_REVIEW'].includes(item.status));
  const pops = db.payments.filter(item => item.status === 'SUBMITTED');
  const overdueInvoiceIds = new Set(db.paymentInstallments.filter(item => item.status === 'OVERDUE').map(item => item.invoiceId));
  const overdue = db.invoices.filter(item => item.balanceZAR > 0 && (item.dueDate < today || overdueInvoiceIds.has(item.id)));
  const cohorts = db.cohorts.filter(item => !['Closed', 'Completed'].includes(item.status) && item.capacity > 0 && (item.capacity - item.enrolledCount <= 3 || item.enrolledCount / item.capacity >= 0.8));
  const emails = db.emailDeliveries.filter(item => ['FAILED', 'BOUNCED', 'SUPPRESSED'].includes(item.status));
  const openTasks = db.admissionTasks.filter(item => item.status === 'OPEN'); const followUpApplicationIds = new Set(openTasks.map(item => item.applicationId));
  const followUps = db.applications.filter(item => followUpApplicationIds.has(item.id));
  res.json({
    generatedAt: new Date().toISOString(),
    hardware: { count: hardware.length, items: hardware.slice(0, 5).map(item => ({ id: item.id, label: `${item.firstName} ${item.lastName}`, detail: `${item.referenceNumber} · submitted ${item.submissionDate}` })) },
    pops: { count: pops.length, items: pops.slice(0, 5).map(item => { const application = db.applications.find(candidate => candidate.id === item.studentId); return { id: application?.id || item.studentId, label: application ? `${application.firstName} ${application.lastName}` : item.studentId, detail: `R${item.amountZAR.toLocaleString('en-ZA')} · ${item.originalFileName}` }; }) },
    overdue: { count: overdue.length, items: overdue.slice(0, 5).map(item => ({ id: db.applications.find(application => application.email.toLowerCase() === item.studentEmail.toLowerCase())?.id || item.id, label: item.studentName, detail: `${item.invoiceNumber} · R${item.balanceZAR.toLocaleString('en-ZA')} outstanding` })) },
    cohorts: { count: cohorts.length, items: cohorts.slice(0, 5).map(item => ({ id: item.id, label: item.name, detail: `${Math.max(0, item.capacity - item.enrolledCount)} of ${item.capacity} seats remaining` })) },
    emails: { count: emails.length, items: emails.slice(0, 5).map(item => ({ id: item.id, label: item.recipient, detail: `${item.status} · ${item.subject}` })) },
    followUps: { count: followUps.length, items: followUps.slice(0, 5).map(item => { const tasks = openTasks.filter(task => task.applicationId === item.id); const overdueCount = tasks.filter(task => task.dueDate < today).length; return { id: item.id, label: `${item.firstName} ${item.lastName}`, detail: `${tasks.length} open task${tasks.length === 1 ? '' : 's'}${overdueCount ? ` · ${overdueCount} overdue` : ''}` }; }) },
  });
});
app.get('/api/admin/applications/:id/timeline', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
  const applicationPayments = db.payments.filter(item => item.studentId === application.id || item.invoiceId === invoice?.id);
  const attendanceRecords = db.attendance.filter(item => item.studentId === application.id);
  const assessmentRecords = db.assessments.filter((item: any) => item.studentId === application.id);
  const relatedIds = new Set([application.id, invoice?.id, ...applicationPayments.map(item => item.id), ...attendanceRecords.map(item => item.id), ...assessmentRecords.map(item => item.id)].filter(Boolean));
  const events: any[] = [{ id: `submitted-${application.id}`, occurredAt: `${application.submissionDate}T09:00:00.000Z`, category: 'APPLICATION', title: 'Application submitted', detail: `${application.firstName} ${application.lastName} applied for ${application.selectedTier}.`, status: 'NEW' }];
  if (application.adminNotes) events.push({ id: `notes-${application.id}`, occurredAt: `${application.submissionDate}T09:01:00.000Z`, category: 'NOTE', title: 'Admin notes', detail: application.adminNotes });
  for (const delivery of db.emailDeliveries.filter(item => item.recipient.toLowerCase() === application.email.toLowerCase())) events.push({ id: `delivery-${delivery.id}`, occurredAt: delivery.createdAt, category: delivery.subject.startsWith('TechLabs invoice') ? 'INVOICE' : 'EMAIL', title: delivery.subject.startsWith('TechLabs invoice') ? 'Invoice emailed' : 'Email update', detail: delivery.subject, status: delivery.status });
  for (const payment of applicationPayments) {
    events.push({ id: `pop-${payment.id}`, occurredAt: payment.submittedAt, category: 'PAYMENT', title: 'POP uploaded', detail: `${payment.type} POP uploaded for R${payment.amountZAR.toLocaleString('en-ZA')} using reference ${payment.eftReference}.`, status: 'SUBMITTED' });
    if (payment.verifiedAt) events.push({ id: `review-${payment.id}`, occurredAt: payment.verifiedAt, category: 'PAYMENT', title: payment.status === 'VERIFIED' ? 'Payment verified' : 'POP rejected', detail: payment.status === 'VERIFIED' ? `R${payment.amountZAR.toLocaleString('en-ZA')} confirmed by ${payment.verifiedBy || 'admissions'}.` : payment.rejectionReason || 'Proof of payment rejected.', status: payment.status, actorEmail: payment.verifiedBy });
    if (payment.status === 'VERIFIED' && payment.type === 'DEPOSIT' && ['ENROLLED', 'COMPLETED'].includes(application.status)) events.push({ id: `enrolled-${payment.id}`, occurredAt: payment.verifiedAt || payment.submittedAt, category: 'ENROLLMENT', title: 'Enrollment activated', detail: 'Seat deposit verified and student access activated.', status: 'ENROLLED' });
  }
  for (const attendance of attendanceRecords) events.push({ id: `attendance-${attendance.id}`, occurredAt: `${attendance.sessionDate}T12:00:00.000Z`, category: 'ATTENDANCE', title: 'Attendance recorded', detail: `${attendance.sessionTopic}: ${attendance.status}${attendance.checkInTime ? ` at ${attendance.checkInTime}` : ''}.`, status: attendance.status });
  for (const assessment of assessmentRecords) events.push({ id: `assessment-${assessment.id}`, occurredAt: `${assessment.dueDate}T12:00:00.000Z`, category: 'ASSESSMENT', title: `Assessment ${assessment.status.toLowerCase()}`, detail: `${assessment.title}${assessment.studentScore !== undefined ? ` - ${assessment.studentScore}/${assessment.totalMarks}` : ''}.`, status: assessment.status });
  for (const audit of db.auditLogs.filter(item => relatedIds.has(item.entityId))) {
    if (['PAYMENT_VERIFIED', 'POP_REJECTED', 'INVOICE_EMAILED'].includes(audit.action)) continue;
    let category = audit.action === 'APPLICATION_APPROVED' || audit.action.includes('HARDWARE') || Object.keys(audit.changes || {}).some(key => ['isLaptopCompliant','ramGB','cpu','freeStorageGB'].includes(key)) ? 'HARDWARE' : audit.action.includes('INVOICE') ? 'INVOICE' : audit.action.includes('PAYMENT') || audit.action.includes('POP') ? 'PAYMENT' : audit.action.includes('ENROLL') ? 'ENROLLMENT' : audit.action.includes('ATTENDANCE') ? 'ATTENDANCE' : audit.action.includes('ASSESSMENT') ? 'ASSESSMENT' : audit.action.includes('NOTE') || Object.keys(audit.changes || {}).includes('adminNotes') ? 'NOTE' : 'APPLICATION';
    const title = audit.action === 'APPLICATION_APPROVED' ? 'Hardware approved' : audit.action.replaceAll('_', ' ').toLowerCase().replace(/^./, value => value.toUpperCase());
    events.push({ id: `audit-${audit.id}`, occurredAt: audit.createdAt, category, title, detail: audit.summary, actorEmail: audit.actorEmail });
  }
  for (const note of db.admissionNotes.filter(item => item.applicationId === application.id)) events.push({ id: `note-${note.id}`, occurredAt: note.createdAt, category: 'NOTE', title: 'Internal note added', detail: note.body, actorEmail: note.authorEmail });
  for (const task of db.admissionTasks.filter(item => item.applicationId === application.id)) events.push({ id: `task-${task.id}`, occurredAt: task.createdAt, category: 'NOTE', title: `Follow-up task: ${task.title}`, detail: `Assigned to ${task.assignedStaffName}; due ${task.dueDate}.`, status: task.status, actorEmail: task.createdBy });
  res.json(events.sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime()));
});

app.get('/api/admin/applications/:id/workflow', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  res.json({ notes: db.admissionNotes.filter(item => item.applicationId === application.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), tasks: db.admissionTasks.filter(item => item.applicationId === application.id).sort((a, b) => a.status.localeCompare(b.status) || a.dueDate.localeCompare(b.dueDate)) });
});

app.put('/api/admin/applications/:id/assignment', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const staffId = String(req.body?.staffId || ''); const before = application.assignedStaffEmail || null;
  if (!staffId) { delete application.assignedStaffId; delete application.assignedStaffName; delete application.assignedStaffEmail; }
  else {
    const staff = staffId === 'primary-admin' ? { id: staffId, name: 'Primary Administrator', email: adminEmail, active: true } : db.staffAccounts.find(item => item.id === staffId && item.active);
    if (!staff) return res.status(400).json({ error: 'Select an active administrator or instructor' });
    application.assignedStaffId = staff.id; application.assignedStaffName = staff.name; application.assignedStaffEmail = staff.email;
  }
  addAudit(db, req, 'APPLICATION_ASSIGNED', 'application', application.id, application.assignedStaffEmail ? `Application assigned to ${application.assignedStaffEmail}` : 'Application assignment cleared', { assignedStaffEmail: { before, after: application.assignedStaffEmail || null } });
  await saveDatabase(db); res.json(application);
});

app.post('/api/admin/applications/:id/notes', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id); const body = String(req.body?.body || '').trim();
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (body.length < 2 || body.length > 2000) return res.status(400).json({ error: 'Note must contain between 2 and 2,000 characters' });
  const note = { id: makeId('note'), applicationId: application.id, body, authorEmail: req.session!.email, createdAt: new Date().toISOString() };
  db.admissionNotes.unshift(note); addAudit(db, req, 'APPLICATION_NOTE_ADDED', 'application', application.id, 'Internal admissions note added'); await saveDatabase(db); res.status(201).json(note);
});

app.post('/api/admin/applications/:id/tasks', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id); const title = String(req.body?.title || '').trim(); const dueDate = String(req.body?.dueDate || ''); const priority = String(req.body?.priority || 'MEDIUM'); const staffId = String(req.body?.assignedStaffId || '');
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (title.length < 2 || title.length > 300 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate) || !['LOW', 'MEDIUM', 'HIGH'].includes(priority)) return res.status(400).json({ error: 'Task title, valid due date and priority are required' });
  const staff = staffId === 'primary-admin' ? { id: staffId, name: 'Primary Administrator', email: adminEmail, active: true } : db.staffAccounts.find(item => item.id === staffId && item.active);
  if (!staff) return res.status(400).json({ error: 'Select an active task owner' });
  const task = { id: makeId('task'), applicationId: application.id, title, dueDate, priority: priority as 'LOW' | 'MEDIUM' | 'HIGH', status: 'OPEN' as const, assignedStaffId: staff.id, assignedStaffName: staff.name, assignedStaffEmail: staff.email, createdBy: req.session!.email, createdAt: new Date().toISOString() };
  db.admissionTasks.unshift(task); addAudit(db, req, 'FOLLOW_UP_TASK_CREATED', 'application', application.id, `Follow-up task created for ${staff.email}: ${title}`); await saveDatabase(db); res.status(201).json(task);
});

app.put('/api/admin/applications/:id/tasks/:taskId', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const task = db.admissionTasks.find(item => item.id === req.params.taskId && item.applicationId === req.params.id);
  if (!task) return res.status(404).json({ error: 'Follow-up task not found' });
  const completed = Boolean(req.body?.completed); const before = task.status; task.status = completed ? 'COMPLETED' : 'OPEN';
  if (completed) { task.completedAt = new Date().toISOString(); task.completedBy = req.session!.email; } else { delete task.completedAt; delete task.completedBy; }
  addAudit(db, req, completed ? 'FOLLOW_UP_TASK_COMPLETED' : 'FOLLOW_UP_TASK_REOPENED', 'application', req.params.id, `${completed ? 'Completed' : 'Reopened'} task: ${task.title}`, { taskStatus: { before, after: task.status } }); await saveDatabase(db); res.json(task);
});
app.post('/api/admin/payment-reminders/run', authenticate, requireRole('ADMIN'), async (_req, res) => {
  const db = await getDatabase();
  const result = await runPaymentReminders(db);
  await saveDatabase(db);
  res.json(result);
});
app.get('/api/admin/invoices/:id/installments', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req, res) => {
  const db = await getDatabase(); if (!db.invoices.some(item => item.id === req.params.id)) return res.status(404).json({ error: 'Invoice not found' });
  syncInstallmentStatuses(db, req.params.id); res.json(db.paymentInstallments.filter(item => item.invoiceId === req.params.id).sort((a, b) => a.sequence - b.sequence));
});
app.put('/api/admin/invoices/:id/installments', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const invoice = db.invoices.find(item => item.id === req.params.id); const rows = req.body?.installments;
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (invoice.paymentOption === 'FULL') return res.status(409).json({ error: 'This student selected full payment, so an installment plan cannot be added' });
  if ((invoice.paidZAR ?? 0) >= invoice.amountZAR || invoice.balanceZAR <= 0) return res.status(409).json({ error: 'A fully paid invoice cannot be converted to installments' });
  if (!Array.isArray(rows) || rows.length < 2 || rows.length > 24) return res.status(400).json({ error: 'An installment plan requires between 2 and 24 payments' });
  const normalized = rows.map((row: any, index: number) => ({ label: String(row?.label || `Installment ${index + 1}`).trim().slice(0, 80), amountZAR: Number(row?.amountZAR), dueDate: String(row?.dueDate || '') }));
  if (normalized.some(row => !Number.isFinite(row.amountZAR) || row.amountZAR <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(row.dueDate))) return res.status(400).json({ error: 'Every installment needs a positive amount and valid due date' });
  if (Math.round(normalized[0].amountZAR * 100) !== Math.round(Math.min(1000, invoice.amountZAR) * 100)) return res.status(400).json({ error: 'The first installment must be the R1,000 seat deposit' });
  if (normalized.some((row, index) => index > 0 && row.dueDate < normalized[index - 1].dueDate)) return res.status(400).json({ error: 'Installment due dates must be in chronological order' });
  const planTotalCents = normalized.reduce((sum, row) => sum + Math.round(row.amountZAR * 100), 0); const invoiceTotalCents = Math.round(invoice.amountZAR * 100);
  if (planTotalCents !== invoiceTotalCents) return res.status(400).json({ error: `Installment amounts must total R${invoice.amountZAR.toLocaleString('en-ZA')}` });
  const createdAt = new Date().toISOString(); db.paymentInstallments = db.paymentInstallments.filter(item => item.invoiceId !== invoice.id).concat(normalized.map((row, index) => ({ id: makeId('inst'), invoiceId: invoice.id, sequence: index + 1, label: row.label || `Installment ${index + 1}`, amountZAR: row.amountZAR, paidZAR: 0, dueDate: row.dueDate, status: 'PENDING' as const, createdAt })));
  invoice.paymentOption = 'INSTALLMENTS'; invoice.dueDate = normalized[0].dueDate; const application = db.applications.find(item => item.email.toLowerCase() === invoice.studentEmail.toLowerCase()); if (application) application.paymentOption = 'INSTALLMENTS'; syncInstallmentStatuses(db, invoice.id);
  addAudit(db, req, 'PAYMENT_PLAN_UPDATED', 'invoice', invoice.id, `${normalized.length}-part installment schedule created for ${invoice.invoiceNumber}`, { installmentCount: { before: null, after: normalized.length }, scheduleTotalZAR: { before: null, after: invoice.amountZAR } }); await saveDatabase(db);
  res.json(db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence));
});
app.get('/api/student/payment-plan', authenticate, requireRole('STUDENT'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.session!.userId); const invoice = application && db.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
  if (!invoice) return res.json([]); syncInstallmentStatuses(db, invoice.id); res.json(db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence));
});
app.put('/api/settings', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase();
  const updates = req.body || {};
  const allowedKeys = ['academyName','companyName','location','campusAddress','whatsappNumber','studentSupportWhatsappNumber','admissionsEmail','leadInstructorName','studentWelcomeMessage','studentSupportMessage','admissionsAcknowledgement','paymentInstructions','whatsappGreeting','applicationsEnabled','onlinePaymentsEnabled','showPricing','showUpcomingCohorts','maintenanceMode','publicAnnouncement','defaultLandingPage','privacyContactEmail','informationOfficerContact','privacyPolicyVersion','termsVersion','consentTextVersion','dataRetentionDays','cookieNoticeVersion','bankName','accountName','accountNumber','branchCode','referenceFormat','flashSale','courseTierPricing'];
  const safeUpdates = Object.fromEntries(Object.entries(updates).filter(([key]) => allowedKeys.includes(key)));
  const textLimits: Record<string, number> = { academyName: 120, companyName: 160, location: 160, campusAddress: 240, whatsappNumber: 40, studentSupportWhatsappNumber: 40, admissionsEmail: 254, leadInstructorName: 120, studentWelcomeMessage: 500, studentSupportMessage: 800, admissionsAcknowledgement: 800, paymentInstructions: 1200, whatsappGreeting: 500, publicAnnouncement: 500, defaultLandingPage: 80, privacyContactEmail: 254, informationOfficerContact: 240, privacyPolicyVersion: 40, termsVersion: 40, consentTextVersion: 40, cookieNoticeVersion: 40, bankName: 120, accountName: 160, accountNumber: 80, branchCode: 40, referenceFormat: 120 };
  if (Object.entries(textLimits).some(([key, limit]) => safeUpdates[key] !== undefined && !requiredText(safeUpdates[key], limit))) return res.status(400).json({ error: 'One or more text settings are invalid' });
  const booleanKeys = ['applicationsEnabled', 'onlinePaymentsEnabled', 'showPricing', 'showUpcomingCohorts', 'maintenanceMode'];
  if (booleanKeys.some(key => safeUpdates[key] !== undefined && typeof safeUpdates[key] !== 'boolean')) return res.status(400).json({ error: 'Website control settings must be true or false' });
  const retentionDays = safeUpdates.dataRetentionDays === undefined ? undefined : Number(safeUpdates.dataRetentionDays);
  if (retentionDays !== undefined && (!Number.isInteger(retentionDays) || retentionDays < 30 || retentionDays > 3650)) return res.status(400).json({ error: 'Data retention must be between 30 and 3650 days' });
  if (safeUpdates.courseTierPricing !== undefined) {
    const pricing = safeUpdates.courseTierPricing as Record<string, { priceZAR?: unknown; displayName?: unknown; description?: unknown; features?: unknown; badgeLabel?: unknown }>;
    const tiers = ['STARTER', 'PROFESSIONAL', 'CAREER_ACCELERATOR'];
    if (!pricing || typeof pricing !== 'object' || tiers.some(tier => !Number.isFinite(Number(pricing[tier]?.priceZAR)) || Number(pricing[tier].priceZAR) < 1 || Number(pricing[tier].priceZAR) > 100_000)) return res.status(400).json({ error: 'Each course tier price must be between R1 and R100,000' });
    if (tiers.some(tier => (pricing[tier].displayName !== undefined && !requiredText(pricing[tier].displayName, 80)) || (pricing[tier].description !== undefined && !requiredText(pricing[tier].description, 400)) || (pricing[tier].badgeLabel !== undefined && !requiredText(pricing[tier].badgeLabel, 40)) || (pricing[tier].features !== undefined && (!Array.isArray(pricing[tier].features) || pricing[tier].features.length > 10 || pricing[tier].features.some(feature => !requiredText(feature, 160)))))) return res.status(400).json({ error: 'Tier card content is invalid' });
    safeUpdates.courseTierPricing = Object.fromEntries(tiers.map(tier => [tier, { ...pricing[tier], priceZAR: Math.round(Number(pricing[tier].priceZAR) * 100) / 100, ...(Array.isArray(pricing[tier].features) ? { features: pricing[tier].features.map(feature => String(feature).trim()).filter(Boolean) } : {}) }]));
  }
  const before = { ...db.academySettings };
  db.academySettings = { ...db.academySettings, ...safeUpdates };
  const changes = auditChanges(before, db.academySettings, Object.keys(safeUpdates));
  if (Object.keys(changes).length) addAudit(db, req, 'SETTINGS_UPDATED', 'academySettings', 'academy', `Updated settings: ${Object.keys(changes).join(', ')}`, changes);
  await saveDatabase(db);
  res.json(db.academySettings);
});
app.get('/api/student/data', authenticate, requireRole('STUDENT'), async (req: AuthedRequest, res) => {
  const db = await getDatabase();
  const application = db.applications.find(a => a.id === req.session!.userId);
  if (!application) return res.status(404).json({ error: 'Student record not found' });
  const email = application.email.toLowerCase();
  const canPay = ['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(application.status);
  res.json({ application, cohort: db.cohorts.find(c => c.id === application.cohortId), invoices: db.invoices.filter(i => i.studentEmail.toLowerCase() === email), payments: db.payments.filter(p => p.studentId === application.id), paymentSettings: canPay ? { bankName: db.academySettings.bankName, accountName: db.academySettings.accountName, accountNumber: db.academySettings.accountNumber, branchCode: db.academySettings.branchCode, referenceFormat: db.academySettings.referenceFormat } : undefined, tickets: db.tickets.filter(t => t.assignedStudentId === application.id), attendance: db.attendance.filter(a => a.studentId === application.id), assessments: db.assessments.filter((a: any) => !a.studentId || a.studentId === application.id), certificates: db.certificates.filter((c: any) => c.studentId === application.id), labs: db.labs, courseModules: db.courseModules });
});

app.get(['/api/student/documents/:type/:recordId?', '/api/admin/applications/:applicationId/documents/:type/:recordId?'], authenticate, requireAnyRole('STUDENT', 'ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase();
  const applicationId = req.session!.role === 'STUDENT' ? req.session!.userId : req.params.applicationId;
  const application = db.applications.find(item => item.id === applicationId);
  if (!application) return res.status(404).json({ error: 'Student record not found' });
  const cohort = db.cohorts.find(item => item.id === application.cohortId);
  const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
  const issuedDate = new Date().toISOString().slice(0, 10);
  const branding = { companyName: db.academySettings.companyName || db.academySettings.academyName || 'TechLabs Academy SA', academyName: db.academySettings.academyName || 'TechLabs Academy SA', companyAddress: db.academySettings.campusAddress || db.academySettings.location || 'Cape Town, South Africa', admissionsEmail: db.academySettings.admissionsEmail };
  let pdf: Buffer; let filename: string;

  if (req.params.type === 'application') {
    pdf = generateBrandedDocumentPDF({ documentTitle: 'Student Application', documentNumber: application.referenceNumber, issuedDate: application.submissionDate, ...branding, sections: [{ heading: 'Applicant Details', lines: [{ label: 'Full name', value: `${application.firstName} ${application.lastName}`, bold: true }, { label: 'Email', value: application.email }, { label: 'WhatsApp', value: application.whatsapp }, { label: 'Location', value: `${application.city}, ${application.province}` }, { label: 'Application status', value: application.status, bold: true }] }, { heading: 'IT Background', lines: [{ label: 'Highest qualification', value: application.highestQualification }, { label: 'IT experience', value: application.itExperienceYears }, { label: 'Employment status', value: application.currentEmploymentStatus }, { label: 'Current role', value: application.currentRole || 'Not provided' }, { label: 'Technologies', value: application.technologiesKnown?.join(', ') || 'None provided' }] }, { heading: 'Laptop Declaration', lines: [{ label: 'Laptop', value: application.laptopBrand }, { label: 'Processor', value: application.cpu }, { label: 'Memory', value: `${application.ramGB} GB RAM` }, { label: 'Storage', value: `${application.storageType}; ${application.freeStorageGB} GB free` }, { label: 'Operating system', value: application.os }, { label: 'Virtualization', value: application.hasVirtualizationEnabled ? 'Declared supported / enabled' : 'Not confirmed' }, { label: 'Automated assessment', value: application.isLaptopCompliant ? 'COMPLIANT' : 'REVIEW REQUIRED', bold: true }] }, { heading: 'Course Selection & Consent', lines: [{ label: 'Course tier', value: application.selectedTier }, { label: 'Payment option', value: application.paymentOption || 'DEPOSIT' }, { label: 'Cohort', value: cohort?.name || application.cohortId }, { label: 'Terms accepted', value: application.acceptedTerms ? 'Yes' : 'No' }, { label: 'Privacy accepted', value: application.acceptedPrivacy ? 'Yes' : 'No' }] }], closingNote: 'This document is a system-generated record of the information submitted through the TechLabs Academy application form.' });
    filename = `application-${application.referenceNumber}.pdf`;
  } else if (req.params.type === 'invoice') {
    if (!invoice) return res.status(404).json({ error: 'Invoice is not available yet' });
    const invoicePayments = db.payments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
    pdf = await generateInvoicePDF({ invoiceNumber: invoice.invoiceNumber, invoiceDate: invoice.invoiceDate || application.submissionDate, dueDate: invoice.dueDate, studentName: invoice.studentName, studentEmail: invoice.studentEmail, studentPhone: application.whatsapp, studentCity: application.city, amount: invoice.amountZAR, description: 'TechLabs Academy IT Support Bootcamp tuition', reference: invoice.invoiceNumber, ...branding, courseTier: invoice.courseTier, listPrice: invoice.listPriceZAR, discountAmount: invoice.discountZAR, discountPercent: invoice.discountPercent, paidAmount: invoice.paidZAR ?? 0, balanceAmount: invoice.balanceZAR, bankName: db.academySettings.bankName, accountName: db.academySettings.accountName, accountNumber: db.academySettings.accountNumber, branchCode: db.academySettings.branchCode, paymentTerms: ['Use the invoice number as the EFT payment reference.', 'Upload the bank-generated POP in the student portal.', 'Payments are confirmed only after admissions verification.'], installments: db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence), payments: invoicePayments.map(payment => ({ date: (payment.verifiedAt || payment.submittedAt).slice(0, 10), type: payment.type, amount: payment.amountZAR, reference: payment.eftReference, status: payment.status })) });
    filename = `${invoice.invoiceNumber}.pdf`;
  } else if (req.params.type === 'admission') {
    if (application.status !== 'ENROLLED') return res.status(403).json({ error: 'Admission confirmation is available after enrollment' });
    pdf = generateBrandedDocumentPDF({ documentTitle: 'Admission Confirmation', documentNumber: application.referenceNumber, issuedDate, ...branding, sections: [{ heading: 'Student', lines: [{ label: 'Full name', value: `${application.firstName} ${application.lastName}`, bold: true }, { label: 'Email', value: application.email }, { label: 'Application reference', value: application.referenceNumber }] }, { heading: 'Confirmed Admission', lines: [{ label: 'Programme', value: 'TechLabs IT Support Bootcamp', bold: true }, { label: 'Course tier', value: application.selectedTier }, { label: 'Cohort', value: cohort?.name || application.cohortId }, { label: 'Enrollment status', value: 'ENROLLED', bold: true }] }], closingNote: 'This letter confirms that the named student has secured a place in the stated TechLabs Academy cohort.' });
    filename = `admission-${application.referenceNumber}.pdf`;
  } else if (req.params.type === 'schedule') {
    if (!cohort) return res.status(404).json({ error: 'Course schedule is not available yet' });
    const visibleModules = db.courseModules.filter(module => module.published !== false); const scheduledModules = buildCurriculumSchedule(visibleModules, cohort); const induction = buildCohortCalendar(visibleModules, cohort).find(event => event.type === 'INDUCTION');
    pdf = generateBrandedDocumentPDF({ documentTitle: 'Course Schedule', documentNumber: cohort.id, issuedDate, ...branding, sections: [{ heading: 'Cohort', lines: [{ label: 'Cohort', value: cohort.name, bold: true }, { label: 'Programme', value: 'TechLabs IT Support Bootcamp' }, { label: 'Course dates', value: `${cohort.startDate} to ${cohort.endDate}` }, { label: 'Class schedule', value: cohort.scheduleFormat }, { label: 'Delivery', value: `${cohort.deliveryMode} - ${cohort.location}` }] }, { heading: 'Induction', lines: [{ label: 'Student induction', value: `${induction?.date || cohort.startDate} - portal orientation, course expectations, support channels, and lab-readiness check`, bold: true }] }, { heading: 'Curriculum Timeline', lines: scheduledModules.map(module => ({ label: `Module ${module.number}`, value: `${module.scheduleLabel} - ${module.title}`, bold: module.number === 1 || module.number === scheduledModules.length })) }], closingNote: 'Induction and module dates are generated from the cohort dates and update automatically when the cohort schedule changes.' });
    filename = `course-schedule-${cohort.id}.pdf`;
  } else if (req.params.type === 'receipt') {
    const payment = db.payments.find(item => item.id === req.params.recordId && item.studentId === application.id && item.status === 'VERIFIED');
    if (!payment || !invoice) return res.status(404).json({ error: 'Verified payment receipt not found' });
    pdf = generateBrandedDocumentPDF({ documentTitle: 'Payment Receipt', documentNumber: payment.eftReference, issuedDate: payment.verifiedAt?.slice(0, 10) || issuedDate, ...branding, sections: [{ heading: 'Received From', lines: [{ label: 'Student', value: `${application.firstName} ${application.lastName}`, bold: true }, { label: 'Email', value: application.email }, { label: 'Invoice', value: invoice.invoiceNumber }] }, { heading: 'Payment Confirmation', lines: [{ label: 'Payment type', value: payment.type }, { label: 'Amount received', value: `R ${payment.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`, bold: true }, { label: payment.provider === 'YOCO' ? 'Yoco payment reference' : 'EFT reference', value: payment.eftReference }, { label: 'Verified date', value: payment.verifiedAt || 'Verified' }, { label: 'Remaining invoice balance', value: `R ${invoice.balanceZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` }] }], closingNote: payment.provider === 'YOCO' ? 'This receipt confirms a payment verified through Yoco.' : 'This computer-generated receipt confirms payment verification by TechLabs Academy admissions.' });
    filename = `receipt-${payment.eftReference}.pdf`;
  } else if (req.params.type === 'pop') {
    const payment = db.payments.find(item => item.id === req.params.recordId && item.studentId === application.id);
    if (!payment) return res.status(404).json({ error: 'Proof of payment record not found' });
    if (payment.provider === 'YOCO') return res.status(404).json({ error: 'Use the payment receipt for card payments' });
    pdf = generateBrandedDocumentPDF({ documentTitle: 'POP Submission Record', documentNumber: payment.eftReference, issuedDate: payment.submittedAt.slice(0, 10), ...branding, sections: [{ heading: 'Submission', lines: [{ label: 'Student', value: `${application.firstName} ${application.lastName}`, bold: true }, { label: 'Invoice', value: invoice?.invoiceNumber || payment.invoiceId }, { label: 'Original POP file', value: payment.originalFileName }, { label: 'Submitted', value: payment.submittedAt }] }, { heading: 'Verification Record', lines: [{ label: 'Payment type', value: payment.type }, { label: 'Declared amount', value: `R ${payment.amountZAR.toLocaleString('en-ZA', { minimumFractionDigits: 2 })}` }, { label: 'EFT reference', value: payment.eftReference }, { label: 'Status', value: payment.status, bold: true }, { label: 'Document fingerprint', value: payment.sha256.slice(0, 40) }] }], closingNote: 'The original bank-generated POP remains securely stored and linked to this submission record.' });
    filename = `pop-record-${payment.eftReference}.pdf`;
  } else if (req.params.type === 'certificate') {
    const certificate = db.certificates.find(item => item.studentId === application.id);
    if (!certificate) return res.status(404).json({ error: 'Certificate is not available yet' });
    pdf = generateBrandedDocumentPDF({ documentTitle: 'Certificate of Completion', documentNumber: certificate.certificateNumber, issuedDate: certificate.completionDate, ...branding, sections: [{ heading: 'Certificate of Completion', lines: [{ value: 'This records that', bold: true }, { value: certificate.studentName, bold: true }, { value: `has successfully completed ${certificate.courseName}.` }, { label: 'Completion date', value: certificate.completionDate }, { label: 'Instructor', value: certificate.instructorName }, ...(certificate.gradeDistinction ? [{ label: 'Achievement', value: certificate.gradeDistinction, bold: true }] : [])] }, { heading: 'TechLabs Verification', lines: [{ label: 'Certificate number', value: certificate.certificateNumber, bold: true }, { label: 'Verification URL', value: certificate.verificationUrl }] }], closingNote: 'Independent, non-accredited practical training. This is not an SAQA/NQF qualification, SETA/QCTO-accredited award, university qualification, or Microsoft/vendor certification. Employment is not guaranteed.' });
    filename = `certificate-${certificate.certificateNumber}.pdf`;
  } else return res.status(404).json({ error: 'Document type not found' });

  res.type('application/pdf').setHeader('Content-Disposition', `inline; filename="${filename.replace(/[^A-Za-z0-9._-]/g, '-')}"`).send(pdf);
});

app.post('/api/student/invoices/:id/proof', authenticate, requireRole('STUDENT'), express.raw({ type: ['application/pdf', 'image/jpeg', 'image/png'], limit: '5mb' }), async (req: AuthedRequest, res, next) => {
  try {
  const mimeType = req.header('content-type') as 'application/pdf' | 'image/jpeg' | 'image/png';
  const file = req.body as Buffer;
  const originalFileName = decodeURIComponent(req.header('x-file-name') || 'proof-of-payment');
  const eftReference = String(req.header('x-eft-reference') || '').trim();
  if (!Buffer.isBuffer(file) || file.length === 0 || !['application/pdf', 'image/jpeg', 'image/png'].includes(mimeType)) return res.status(400).json({ error: 'A PDF, JPG, or PNG proof is required' });
  const signatureIsValid = mimeType === 'application/pdf' ? file.subarray(0, 5).toString() === '%PDF-' : mimeType === 'image/png' ? file.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) : file[0] === 0xff && file[1] === 0xd8 && file[file.length - 2] === 0xff && file[file.length - 1] === 0xd9;
  if (!signatureIsValid) return res.status(400).json({ error: 'The uploaded file contents do not match its declared type' });
  if (!requiredText(eftReference, 100)) return res.status(400).json({ error: 'EFT reference is required' });
  const db = await getDatabase();
  const application = db.applications.find(item => item.id === req.session!.userId);
  const invoice = db.invoices.find(item => item.id === req.params.id && item.studentEmail.toLowerCase() === req.session!.email.toLowerCase());
  if (!application || !invoice) return res.status(404).json({ error: 'Invoice not found' });
  if (db.yocoCheckouts?.some(i => i.invoiceId === invoice.id && i.mode === 'live' && ['PENDING', 'REVIEW'].includes(i.status))) return res.status(409).json({ error: 'A card payment is pending or needs review. Contact admissions before submitting an EFT proof.' });
  if (!['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(application.status)) return res.status(403).json({ error: 'Payment is available after application approval' });
  if (db.payments.some(item => item.invoiceId === invoice.id && item.status === 'SUBMITTED')) return res.status(409).json({ error: 'A payment is already awaiting verification' });
  const sha256 = crypto.createHash('sha256').update(file).digest('hex');
  if (db.payments.some(item => item.sha256 === sha256)) return res.status(409).json({ error: 'This proof-of-payment file has already been submitted. Upload a new bank-generated document.' });
  const paidZAR = invoice.paidZAR ?? 0;
  const type = paidZAR === 0 && invoice.paymentOption !== 'FULL' ? 'DEPOSIT' : 'BALANCE';
  syncInstallmentStatuses(db, invoice.id);
  const nextInstallment = db.paymentInstallments.filter(item => item.invoiceId === invoice.id && item.status !== 'PAID').sort((a, b) => a.sequence - b.sequence)[0];
  const amountZAR = nextInstallment ? nextInstallment.amountZAR - nextInstallment.paidZAR : type === 'DEPOSIT' ? Math.min(1000, invoice.amountZAR) : invoice.amountZAR - paidZAR;
  const extension = mimeType === 'application/pdf' ? '.pdf' : mimeType === 'image/png' ? '.png' : '.jpg';
  const id = makeId('pay');
  const storageKey = await proofStorage.put(`${id}${extension}`, file, mimeType);
  const payment = { id, invoiceId: invoice.id, studentId: application.id, amountZAR, type, status: 'SUBMITTED', originalFileName: originalFileName.slice(0, 255), storageKey, mimeType, sizeBytes: file.length, sha256, eftReference, submittedAt: new Date().toISOString() } as const;
  db.payments = [payment, ...db.payments];
  invoice.status = 'AWAITING_VERIFICATION'; invoice.proofOfPaymentUrl = `/api/payments/${id}/proof`;
  if (application.status !== 'ENROLLED') application.status = 'PAYMENT_REQUIRED';
  await saveDatabase(db);
  res.status(201).json({ payment, invoice });
  } catch (error) { next(error); }
});

app.get('/api/payments/:id/proof', authenticate, async (req: AuthedRequest, res, next) => {
  try {
  const db = await getDatabase(); const payment = db.payments.find(item => item.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment proof not found' });
  if (payment.provider === 'YOCO') return res.status(404).json({ error: 'Card payments do not have an uploaded proof' });
  if (req.session!.role !== 'ADMIN' && payment.studentId !== req.session!.userId) return res.status(403).json({ error: 'Forbidden' });
  const file = await proofStorage.get(payment.storageKey, payment.sha256);
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Type', payment.mimeType);
  res.setHeader('Content-Length', String(file.length));
  res.setHeader('Cache-Control', 'private, no-store');
  res.setHeader('Content-Disposition', `inline; filename="${payment.originalFileName.replace(/[^\x20-\x7E]|["\\]/g, '_')}"`).send(file);
  } catch (error) { if (proofNotFound(error)) return res.status(404).json({ error: 'Payment proof file not found' }); next(error); }
});

app.post('/api/admin/payments/:id/verify', authenticate, requireRole('ADMIN'), serializeEnrollment, async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const payment = db.payments.find(item => item.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (payment.status !== 'SUBMITTED') return res.status(409).json({ error: 'Payment has already been reviewed' });
  const invoice = db.invoices.find(item => item.id === payment.invoiceId); const application = db.applications.find(item => item.id === payment.studentId);
  if (!invoice || !application) return res.status(409).json({ error: 'Linked invoice or application is missing' });
  const cohort = db.cohorts.find(item => item.id === application.cohortId);
  if (!cohort) return res.status(409).json({ error: 'Linked cohort is missing' });
  const confirmedAmount = Number(req.body?.amountZAR);
  if (!Number.isFinite(confirmedAmount) || confirmedAmount <= 0 || confirmedAmount > invoice.amountZAR - (invoice.paidZAR ?? 0)) return res.status(400).json({ error: 'Confirmed amount is invalid' });
  if (payment.type === 'DEPOSIT' && confirmedAmount !== Math.min(1000, invoice.amountZAR)) return res.status(400).json({ error: 'The seat deposit must be exactly R1,000' });
  const previousPaid = invoice.paidZAR ?? 0; const previousBalance = invoice.balanceZAR; const submittedAmount = payment.amountZAR; const previousApplicationStatus = application.status;
  payment.amountZAR = confirmedAmount; payment.status = 'VERIFIED'; payment.verifiedAt = new Date().toISOString(); payment.verifiedBy = req.session!.email;
  invoice.paidZAR = (invoice.paidZAR ?? 0) + confirmedAmount; invoice.balanceZAR = Math.max(0, invoice.amountZAR - invoice.paidZAR); invoice.paidAt = new Date().toISOString().slice(0, 10); invoice.status = invoice.balanceZAR === 0 ? 'VERIFIED' : 'PARTIALLY_PAID';
  syncInstallmentStatuses(db, invoice.id);
  const wasEnrolled = ['ENROLLED', 'COMPLETED'].includes(previousApplicationStatus);
  const hasSeat = wasEnrolled || cohort.enrolledCount < cohort.capacity;
  if (invoice.paidZAR >= Math.min(1000, invoice.amountZAR)) application.status = hasSeat ? 'ENROLLED' : 'WAITLISTED';
  cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
  const fullyPaid = invoice.balanceZAR === 0;
  const waitlisted = application.status === 'WAITLISTED';
  const paymentTemplate = !waitlisted ? renderStoredTemplate(db, 'tpl-payment-verified', { studentName: escapeHtml(`${application.firstName} ${application.lastName}`), amount: confirmedAmount.toLocaleString('en-ZA'), cohortName: escapeHtml(cohort.name), courseStartDate: escapeHtml(cohort.startDate) }) : null;
  const subject = waitlisted ? `Payment confirmed - cohort waitlist - ${invoice.invoiceNumber}` : fullyPaid ? `Full payment confirmed - ${invoice.invoiceNumber}` : paymentTemplate?.subject || (payment.type === 'DEPOSIT' ? 'Your TechLabs seat is secured' : 'Your TechLabs payment was verified');
  addAudit(db, req, 'PAYMENT_VERIFIED', 'payment', payment.id, `${payment.type} payment of R${confirmedAmount.toLocaleString('en-ZA')} verified for ${invoice.invoiceNumber}${waitlisted ? '; cohort full, applicant waitlisted' : ''}`, { confirmedAmountZAR: { before: submittedAmount, after: confirmedAmount }, paidZAR: { before: previousPaid, after: invoice.paidZAR }, balanceZAR: { before: previousBalance, after: invoice.balanceZAR }, applicationStatus: { before: previousApplicationStatus, after: application.status }, cohortEnrolledCount: { before: cohort.enrolledCount - (hasSeat && !wasEnrolled ? 1 : 0), after: cohort.enrolledCount } });
  // Financial state must be durable even when the email provider is slow or unavailable.
  await saveDatabase(db);
  const delivery = await sendEmail({ to: application.email, subject, html: `${paymentTemplate?.html || `<h2>${waitlisted ? 'Payment confirmed - waitlist update' : fullyPaid ? 'Full payment confirmed' : 'Payment verified'}</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>We verified your ${payment.type.toLowerCase()} payment of <strong>R${confirmedAmount.toLocaleString('en-ZA')}</strong>.</p>`}<p><strong>Amount paid:</strong> R${invoice.paidZAR.toLocaleString('en-ZA')}<br><strong>Remaining balance:</strong> R${invoice.balanceZAR.toLocaleString('en-ZA')}</p>${waitlisted ? `<p>The ${escapeHtml(cohort.name)} cohort has reached capacity. Your application is on the waitlist.</p>` : fullyPaid ? '<p>Your tuition is paid in full. No further payment is due.</p>' : payment.type === 'DEPOSIT' ? '<p>Your seat is secured and student access is active.</p>' : ''}<p>Regards,<br>TechLabs Academy</p>` });
  db.emailDeliveries.unshift({ id: makeId('email'), providerId: delivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() });
  await saveDatabase(db);
  res.json({ payment, invoice, application, cohort, waitlisted, emailDelivery: delivery });
});

app.post('/api/admin/payments/:id/reject', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const reason = String(req.body?.reason || '').trim(); if (!requiredText(reason, 1000)) return res.status(400).json({ error: 'Rejection reason is required' });
  const db = await getDatabase(); const payment = db.payments.find(item => item.id === req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' }); if (payment.status !== 'SUBMITTED') return res.status(409).json({ error: 'Payment has already been reviewed' });
  payment.status = 'REJECTED'; payment.rejectionReason = reason; payment.verifiedAt = new Date().toISOString(); payment.verifiedBy = req.session!.email;
  const invoice = db.invoices.find(item => item.id === payment.invoiceId); if (invoice) { invoice.status = invoice.paidZAR ? 'PARTIALLY_PAID' : 'PENDING'; invoice.proofOfPaymentUrl = undefined; }
  const application = db.applications.find(item => item.id === payment.studentId);
  let emailDelivery;
  if (application && invoice) {
    const subject = `Proof of payment needs attention - ${invoice.invoiceNumber}`;
    emailDelivery = await sendEmail({ to: application.email, subject, html: `<h2>Proof of payment needs attention</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>Admissions could not approve the proof of payment you uploaded.</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><h3>What to do now</h3><ol><li>Sign in to the student portal and check the invoice number, required amount, and banking details.</li><li>Upload one clear, bank-generated proof of payment as a PDF, JPG, or PNG using the correct invoice reference.</li><li>Wait for the portal status or an email update before uploading another copy.</li></ol><p>Your balance has not changed. Reply to this email only if the reason above does not explain what needs to be corrected.</p><p>Regards,<br>TechLabs Academy</p>` });
    db.emailDeliveries.unshift({ id: makeId('email'), providerId: emailDelivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: emailDelivery.sent ? 'SENT' : 'FAILED', reason: emailDelivery.reason, createdAt: new Date().toISOString() });
  }
  addAudit(db, req, 'POP_REJECTED', 'payment', payment.id, `POP rejected${invoice ? ` for ${invoice.invoiceNumber}` : ''}: ${reason}`, { status: { before: 'SUBMITTED', after: 'REJECTED' }, rejectionReason: { before: null, after: reason } });
  await saveDatabase(db); res.json({ payment, invoice, emailDelivery });
});

// Application, CRM lead, and invoice are committed together.
app.post('/api/applications', rateLimit('applications', 5, 60 * 60 * 1000), serializeEnrollment, async (req, res) => {
  const data = req.body || {};
  if (!requiredText(data.firstName, 80) || !requiredText(data.lastName, 80) || !validEmail(data.email) || !requiredText(data.whatsapp, 30) || !requiredText(data.cohortId, 100) || data.acceptedTerms !== true || data.acceptedPrivacy !== true) return res.status(400).json({ error: 'Valid contact details, cohort and required consent are required' });
  const db = await getDatabase();
  if (db.academySettings.applicationsEnabled === false) return res.status(403).json({ error: 'Applications are temporarily closed. Please contact admissions for the next intake.' });
  const normalizedEmail = data.email.trim().toLowerCase();
  const normalizedCohortId = data.cohortId.trim();
  const selectedCohort = db.cohorts.find(item => item.id === normalizedCohortId);
  if (!selectedCohort || !['Open', 'Filling Fast'].includes(selectedCohort.status)) return res.status(409).json({ error: 'The selected cohort is no longer accepting applications. Please choose an open cohort.' });
  const selectedTier = String(data.selectedTier || ''); const paymentOption = String(data.paymentOption || '');
  const tuition = calculateTuitionBreakdown(selectedTier, db.academySettings);
  const tuitionAmount = tuition.amountZAR;
  if (!tuitionAmount || !['DEPOSIT', 'FULL'].includes(paymentOption)) return res.status(400).json({ error: 'A valid course tier and payment option are required' });
  if (db.applications.some(item => item.email.trim().toLowerCase() === normalizedEmail && item.cohortId.trim() === normalizedCohortId)) {
    return res.status(409).json({ error: 'This email address already has an application for the selected cohort. Sign in to the student portal or choose a different cohort.' });
  }
  const referenceNumber = `TLS-${new Date().getFullYear()}-${String(db.applications.length + 1).padStart(4, '0')}`;
  const { amountZAR: _ignoredClientAmount, ...safeApplicationData } = data;
  const application = { ...safeApplicationData, selectedTier, paymentOption, id: makeId('app'), referenceNumber, email: normalizedEmail, cohortId: normalizedCohortId, submissionDate: new Date().toISOString().slice(0, 10), status: 'NEW' };
  const deposit = paymentOption === 'FULL' ? tuitionAmount : Math.min(1000, tuitionAmount);
  const lead = { id: makeId('lead'), name: `${data.firstName} ${data.lastName}`, email: application.email, whatsapp: data.whatsapp, source: 'Website', courseInterest: `Bootcamp (${data.selectedTier})`, status: 'APPLICATION_SUBMITTED', notes: [`Application submitted with ref ${referenceNumber}`], followUpDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10), createdAt: new Date().toISOString().slice(0, 10) };
  const invoice = { id: makeId('inv'), invoiceNumber: `INV-${referenceNumber}`, invoiceDate: new Date().toISOString().slice(0, 10), studentName: lead.name, studentEmail: application.email, courseTier: selectedTier, amountZAR: tuitionAmount, listPriceZAR: tuition.listPriceZAR, discountZAR: tuition.discountZAR, discountPercent: tuition.discountPercent, paidZAR: 0, depositZAR: deposit, balanceZAR: tuitionAmount, paymentOption, status: 'PENDING', dueDate: new Date(Date.now() + 432000000).toISOString().slice(0, 10), paymentMethod: 'EFT' };
  db.applications = [application, ...db.applications] as any; db.leads = [lead, ...db.leads] as any; db.invoices = [invoice, ...db.invoices] as any;
  await saveDatabase(db);
  const submittedTemplate = renderStoredTemplate(db, 'tpl-app-submitted', { studentName: escapeHtml(`${application.firstName} ${application.lastName}`), cohortName: escapeHtml(selectedCohort.name), referenceNumber: escapeHtml(referenceNumber) });
  const submittedSubject = submittedTemplate?.subject || `Application received — ${referenceNumber}`;
  const emailDelivery = await sendEmail({ to: application.email, subject: submittedSubject, html: submittedTemplate?.html || `<h2>Thank you, ${escapeHtml(application.firstName)}!</h2><p>We received your application.</p><p><strong>Reference:</strong> ${escapeHtml(referenceNumber)}</p><p>Regards,<br>TechLabs Academy</p>` });
  db.emailDeliveries = [{ id: makeId('email'), providerId: emailDelivery.id, recipient: application.email, subject: submittedSubject, category: 'APPLICATION_SUBMITTED', status: emailDelivery.sent ? 'SENT' : 'FAILED', reason: emailDelivery.reason, createdAt: new Date().toISOString() }, ...db.emailDeliveries];
  db.emailDeliveries.unshift(await notifyAdmissions(application, selectedCohort.name));
  await saveDatabase(db);
  res.status(201).json({ application, invoice, emailDelivery });
});

app.post('/api/leads', rateLimit('leads', 10, 60 * 60 * 1000), async (req, res) => {
  const data = req.body || {};
  if (!requiredText(data.name, 160) || !validEmail(data.email) || !requiredText(data.whatsapp, 30)) return res.status(400).json({ error: 'Valid name, email and WhatsApp number are required' });
  const db = await getDatabase();
  const lead = { ...data, id: makeId('lead'), email: data.email.trim().toLowerCase(), status: 'NEW_LEAD', notes: [`Inquiry received from ${data.source || 'Website'}`], createdAt: new Date().toISOString().slice(0, 10) };
  db.leads = [lead, ...db.leads] as any; await saveDatabase(db); res.status(201).json(lead);
});

app.put('/api/admin/leads/:id', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const lead = db.leads.find(item => item.id === req.params.id);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const allowedStatuses = ['NEW_LEAD','CONTACTED','INTERESTED','APPLICATION_STARTED','APPLICATION_SUBMITTED','APPROVED','PAYMENT_PENDING','ENROLLED','ACTIVE_STUDENT','GRADUATED','ALUMNI'];
  const before = { ...lead }; const updates: Record<string, unknown> = {};
  if (req.body?.status !== undefined) {
    if (!allowedStatuses.includes(String(req.body.status))) return res.status(400).json({ error: 'Invalid recruitment status' });
    updates.status = String(req.body.status);
  }
  if (req.body?.followUpDate !== undefined) {
    const followUpDate = String(req.body.followUpDate);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(followUpDate)) return res.status(400).json({ error: 'A valid follow-up date is required' });
    updates.followUpDate = followUpDate;
  }
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No supported lead changes supplied' });
  Object.assign(lead, updates); const changes = auditChanges(before, lead, Object.keys(updates));
  addAudit(db, req, 'LEAD_UPDATED', 'leads', lead.id, `Recruitment lead updated for ${lead.email}: ${Object.keys(changes).join(', ')}`, changes);
  await saveDatabase(db); res.json(lead);
});

app.post('/api/admin/leads/:id/notes', authenticate, requireAnyRole('ADMIN', 'INSTRUCTOR'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const lead = db.leads.find(item => item.id === req.params.id); const note = String(req.body?.note || '').trim();
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  if (note.length < 2 || note.length > 1000) return res.status(400).json({ error: 'A note between 2 and 1,000 characters is required' });
  lead.notes = [...(lead.notes || []), `${new Date().toISOString().slice(0, 10)} · ${req.session!.email}: ${note}`];
  addAudit(db, req, 'LEAD_NOTE_ADDED', 'leads', lead.id, `Recruitment note added for ${lead.email}`);
  await saveDatabase(db); res.json(lead);
});

app.post('/api/admin/course-modules', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const input = req.body || {};
  const title = String(input.title || '').trim(); const duration = String(input.duration || '').trim(); const summary = String(input.summary || '').trim();
  if (!title || title.length > 200 || !duration || duration.length > 200 || !summary || summary.length > 2000) return res.status(400).json({ error: 'Title, duration and summary are required and must be within the allowed lengths' });
  const readList = (field: string) => Array.isArray(input[field]) ? input[field].map((value: unknown) => String(value).trim()).filter(Boolean) : null;
  const learningOutcomes = readList('learningOutcomes'); const practicalLabs = readList('practicalLabs'); const exampleTickets = readList('exampleTickets'); const technologies = readList('technologies');
  const lists = [learningOutcomes, practicalLabs, exampleTickets, technologies];
  if (lists.some(list => list === null)) return res.status(400).json({ error: 'Curriculum list fields must be arrays' });
  if (lists.some(list => list!.length > 50 || list!.some(value => value.length > 500))) return res.status(400).json({ error: 'A curriculum list contains too many or overly long entries' });
  const moduleNumber = Math.max(0, ...db.courseModules.map(module => module.number)) + 1;
  if (moduleNumber > 100) return res.status(409).json({ error: 'The curriculum cannot contain more than 100 numbered modules' });
  const module = { number: moduleNumber, title, duration, summary, learningOutcomes: learningOutcomes!, practicalLabs: practicalLabs!, exampleTickets: exampleTickets!, technologies: technologies!, published: input.published !== false };
  db.courseModules.push(module);
  addAudit(db, req, 'CURRICULUM_MODULE_CREATED', 'courseModules', String(moduleNumber), `Module ${moduleNumber} created: ${title}`);
  await saveDatabase(db); res.status(201).json(module);
});

app.put('/api/admin/course-modules/:number', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const moduleNumber = Number(req.params.number); const db = await getDatabase();
  if (!Number.isInteger(moduleNumber) || moduleNumber < 1 || moduleNumber > 100) return res.status(400).json({ error: 'Invalid module number' });
  const existing = db.courseModules.find(module => module.number === moduleNumber);
  if (!existing) return res.status(404).json({ error: 'Curriculum module not found' });
  const input = req.body || {}; const textFields = ['title', 'duration', 'summary'] as const; const arrayFields = ['learningOutcomes', 'practicalLabs', 'exampleTickets', 'technologies'] as const;
  const updates: Record<string, unknown> = {};
  for (const field of textFields) {
    if (input[field] === undefined) continue;
    const value = String(input[field]).trim();
    if (!value || value.length > (field === 'summary' ? 2000 : 200)) return res.status(400).json({ error: `${field} is required and is too long` });
    updates[field] = value;
  }
  for (const field of arrayFields) {
    if (input[field] === undefined) continue;
    if (!Array.isArray(input[field])) return res.status(400).json({ error: `${field} must be a list` });
    const values = input[field].map((value: unknown) => String(value).trim()).filter(Boolean);
    if (values.length > 50 || values.some((value: string) => value.length > 500)) return res.status(400).json({ error: `${field} contains too many or overly long entries` });
    updates[field] = values;
  }
  if (input.published !== undefined) updates.published = Boolean(input.published);
  if (!Object.keys(updates).length) return res.status(400).json({ error: 'No supported curriculum changes supplied' });
  const before = { ...existing }; Object.assign(existing, updates);
  const changes = auditChanges(before, existing, Object.keys(updates));
  addAudit(db, req, 'CURRICULUM_MODULE_UPDATED', 'courseModules', String(moduleNumber), `Module ${moduleNumber} updated: ${Object.keys(changes).join(', ')}`, changes);
  await saveDatabase(db); res.json(existing);
});

app.put('/api/admin/applications/:id/record', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const before = { ...application }; const input = req.body || {};
  const textFields = ['firstName','lastName','whatsapp','city','province','laptopBrand','cpu','storageType','os'] as const;
  for (const key of textFields) if (input[key] !== undefined) { const value = String(input[key]).trim(); if (!requiredText(value, 160)) return res.status(400).json({ error: `${key} is required and must be under 160 characters` }); (application as any)[key] = value; }
  if (input.email !== undefined) { const email = String(input.email).trim().toLowerCase(); if (!validEmail(email)) return res.status(400).json({ error: 'A valid email address is required' }); if (db.applications.some(item => item.id !== application.id && item.email.toLowerCase() === email)) return res.status(409).json({ error: 'Another student record already uses this email address' }); application.email = email; }
  if (input.ramGB !== undefined) { const value = Number(input.ramGB); if (![8,16,32,64,128].includes(value)) return res.status(400).json({ error: 'Select a valid RAM capacity' }); application.ramGB = value; }
  if (input.freeStorageGB !== undefined) { const value = Number(input.freeStorageGB); if (!Number.isFinite(value) || value < 0 || value > 100000) return res.status(400).json({ error: 'Enter a valid free-storage amount' }); application.freeStorageGB = value; }
  if (input.hasVirtualizationEnabled !== undefined) application.hasVirtualizationEnabled = Boolean(input.hasVirtualizationEnabled);
  if (input.selectedTier !== undefined) { if (!['STARTER','PROFESSIONAL','CAREER_ACCELERATOR'].includes(input.selectedTier)) return res.status(400).json({ error: 'Select a valid course tier' }); application.selectedTier = input.selectedTier; }
  application.isLaptopCompliant = application.ramGB >= 16 && application.freeStorageGB >= 100 && application.hasVirtualizationEnabled;
  const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === before.email.toLowerCase()); if (invoice) { invoice.studentName = `${application.firstName} ${application.lastName}`; invoice.studentEmail = application.email; invoice.courseTier = application.selectedTier; }
  for (const credential of db.studentCredentials.filter(item => item.applicationId === application.id)) { credential.email = application.email; credential.updatedAt = new Date().toISOString(); }
  for (const lead of db.leads.filter(item => item.email.toLowerCase() === before.email.toLowerCase())) { lead.name = `${application.firstName} ${application.lastName}`; lead.email = application.email; lead.whatsapp = application.whatsapp; }
  const changedKeys = ['firstName','lastName','email','whatsapp','city','province','laptopBrand','cpu','ramGB','storageType','freeStorageGB','os','hasVirtualizationEnabled','isLaptopCompliant','selectedTier'].filter(key => (before as any)[key] !== (application as any)[key]); const changes = auditChanges(before, application, changedKeys);
  if (changedKeys.length) addAudit(db, req, 'STUDENT_RECORD_UPDATED', 'application', application.id, `Student record corrected: ${changedKeys.join(', ')}`, changes);
  await saveDatabase(db); res.json({ application, invoice });
});

app.post('/api/admin/applications/:id/decision', authenticate, requireRole('ADMIN'), serializeEnrollment, async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const status = String(req.body?.status || '') as 'REJECTED' | 'WAITLISTED' | 'WITHDRAWN'; const reason = String(req.body?.reason || '').trim();
  if (!['REJECTED', 'WAITLISTED', 'WITHDRAWN'].includes(status)) return res.status(400).json({ error: 'Unsupported application decision' });
  if (reason.length < 10 || reason.length > 1000) return res.status(400).json({ error: 'A clear decision reason between 10 and 1,000 characters is required' });
  if (status === 'WITHDRAWN' && !['ENROLLED', 'COMPLETED', 'APPROVED', 'PAYMENT_REQUIRED', 'WAITLISTED'].includes(application.status)) return res.status(409).json({ error: 'This application cannot be withdrawn from its current status' });
  const previousStatus = application.status; const cohort = db.cohorts.find(item => item.id === application.cohortId); application.status = status; application.adminNotes = `${application.adminNotes ? `${application.adminNotes} | ` : ''}${status}: ${reason}`;
  if (cohort) cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
  const headings = { REJECTED: 'Application decision', WAITLISTED: 'Waitlist update', WITHDRAWN: previousStatus === 'ENROLLED' ? 'Enrollment cancellation' : 'Application withdrawal' };
  const introductions = { REJECTED: 'After reviewing your application, we are unable to offer you a place in this intake.', WAITLISTED: 'Your application has been placed on the waitlist for this intake.', WITHDRAWN: previousStatus === 'ENROLLED' ? 'Your enrollment has been cancelled by admissions.' : 'Your application has been withdrawn from this intake.' };
  addAudit(db, req, `APPLICATION_${status}`, 'application', application.id, `${status.toLowerCase()} decision recorded for ${application.referenceNumber}: ${reason}`, { status: { before: previousStatus, after: status }, decisionReason: { before: null, after: reason } });
  await saveDatabase(db);
  const subject = `${headings[status]} - ${application.referenceNumber}`;
  const delivery = await sendEmail({ to: application.email, subject, html: `<h2>${escapeHtml(headings[status])}</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>${escapeHtml(introductions[status])}</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p>${status === 'WAITLISTED' ? '<p>Admissions will contact you if a suitable seat becomes available.</p>' : '<p>If you need clarification, reply to this email and include your application reference.</p>'}<p><strong>Reference:</strong> ${escapeHtml(application.referenceNumber)}</p><p>Regards,<br>TechLabs Academy</p>` });
  db.emailDeliveries.unshift({ id: makeId('email'), providerId: delivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() }); await saveDatabase(db);
  res.json({ application, cohort, emailDelivery: delivery });
});

app.post('/api/admin/applications/:id/transfer', authenticate, requireRole('ADMIN'), serializeEnrollment, async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  const targetCohortId = String(req.body?.cohortId || ''); const reason = String(req.body?.reason || '').trim();
  const sourceCohort = db.cohorts.find(item => item.id === application.cohortId); const targetCohort = db.cohorts.find(item => item.id === targetCohortId);
  if (!targetCohort) return res.status(404).json({ error: 'Target cohort not found' });
  if (targetCohort.id === application.cohortId) return res.status(400).json({ error: 'Select a different cohort' });
  if (['Closed', 'Completed'].includes(targetCohort.status)) return res.status(409).json({ error: 'Students cannot be transferred into a closed or completed cohort' });
  if (application.status === 'COMPLETED') return res.status(409).json({ error: 'Completed student records cannot be transferred' });
  if (reason.length < 10 || reason.length > 1000) return res.status(400).json({ error: 'A transfer reason between 10 and 1,000 characters is required' });
  const occupiesSeat = application.status === 'ENROLLED';
  const targetOccupied = db.applications.filter(item => item.id !== application.id && item.cohortId === targetCohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
  if (occupiesSeat && targetOccupied >= targetCohort.capacity) return res.status(409).json({ error: `${targetCohort.name} is full. Increase capacity or release a seat before transferring this student.` });
  const previousCohortId = application.cohortId; application.cohortId = targetCohort.id; application.adminNotes = `${application.adminNotes ? `${application.adminNotes} | ` : ''}Transferred from ${sourceCohort?.name || previousCohortId} to ${targetCohort.name}: ${reason}`;
  for (const cohort of db.cohorts) cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
  addAudit(db, req, 'COHORT_TRANSFERRED', 'application', application.id, `${application.referenceNumber} transferred from ${sourceCohort?.name || previousCohortId} to ${targetCohort.name}: ${reason}`, { cohortId: { before: previousCohortId, after: targetCohort.id }, transferReason: { before: null, after: reason } });
  await saveDatabase(db);
  const subject = `Cohort transfer confirmed - ${application.referenceNumber}`;
  const delivery = await sendEmail({ to: application.email, subject, html: `<h2>Cohort transfer confirmed</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>Your TechLabs application has been transferred to a different cohort.</p><p><strong>Previous cohort:</strong> ${escapeHtml(sourceCohort?.name || previousCohortId)}<br><strong>New cohort:</strong> ${escapeHtml(targetCohort.name)}<br><strong>Course dates:</strong> ${escapeHtml(targetCohort.startDate)} to ${escapeHtml(targetCohort.endDate)}</p><p><strong>Reason:</strong> ${escapeHtml(reason)}</p><p>Your existing payments, invoice, documents and portal history remain linked to your application.</p><p>Regards,<br>TechLabs Academy</p>` });
  db.emailDeliveries.unshift({ id: makeId('email'), providerId: delivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() }); await saveDatabase(db);
  res.json({ application, sourceCohort, targetCohort, emailDelivery: delivery });
});

app.delete('/api/admin/applications/:id', authenticate, requireRole('ADMIN'), serializeEnrollment, async (req: AuthedRequest, res) => {
  const db = await getDatabase();
  const application = db.applications.find(item => item.id === req.params.id);
  if (!application) return res.status(404).json({ error: 'Student record not found' });
  if (['ENROLLED', 'COMPLETED'].includes(application.status)) return res.status(409).json({ error: 'Enrolled students must be withdrawn instead of deleted' });

  const invoiceIds = new Set(db.invoices.filter(item => item.studentEmail.toLowerCase() === application.email.toLowerCase()).map(item => item.id));
  if (db.payments.some(item => item.studentId === application.id || invoiceIds.has(item.invoiceId))) return res.status(409).json({ error: 'Students with payment history cannot be deleted; withdraw the application to preserve financial records' });
  if (db.attendance.some(item => item.studentId === application.id)
    || db.assessments.some(item => item.studentId === application.id)
    || db.certificates.some(item => item.studentId === application.id)
    || db.tickets.some(item => item.assignedStudentId === application.id)) return res.status(409).json({ error: 'Students with academic or support history cannot be deleted; withdraw the application instead' });

  const cohort = db.cohorts.find(item => item.id === application.cohortId);
  addAudit(db, req, 'STUDENT_RECORD_DELETED', 'application', application.id, `Unused student record deleted for ${application.referenceNumber}`, { email: { before: application.email, after: null }, status: { before: application.status, after: null } });
  db.applications = db.applications.filter(item => item.id !== application.id);
  db.invoices = db.invoices.filter(item => !invoiceIds.has(item.id));
  db.paymentInstallments = db.paymentInstallments.filter(item => !invoiceIds.has(item.invoiceId));
  db.studentCredentials = db.studentCredentials.filter(item => item.applicationId !== application.id);
  db.authTokens = db.authTokens.filter(item => item.applicationId !== application.id);
  db.sessions = db.sessions.filter(item => item.userId !== application.id);
  db.paymentReminders = db.paymentReminders.filter(item => item.applicationId !== application.id);
  db.admissionNotes = db.admissionNotes.filter(item => item.applicationId !== application.id);
  db.admissionTasks = db.admissionTasks.filter(item => item.applicationId !== application.id);
  if (cohort) cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
  await saveDatabase(db);
  res.status(204).send();
});

const adminCollections = ['leads','applications','cohorts','tickets','labs','invoices','assessments','certificates','attendance','courseModules'] as const;
for (const collection of adminCollections) {
  app.put(`/api/${collection}/:id`, authenticate, requireRole('ADMIN'), serializeEnrollment, async (req: AuthedRequest, res) => {
    const db = await getDatabase(); const list = db[collection] as any[];
    const index = list.findIndex(item => item.id === req.params.id || (collection === 'courseModules' && String(item.number) === req.params.id));
    if (index < 0) return res.status(404).json({ error: 'Record not found' });
    const before = { ...list[index] };
    const updates = { ...(req.body || {}) };
    if (collection === 'applications' && ['REJECTED', 'WAITLISTED', 'WITHDRAWN'].includes(String(updates.status || ''))) return res.status(400).json({ error: 'A decision reason is required. Use the application decision workflow.' });
    if (collection === 'applications' && updates.cohortId && updates.cohortId !== before.cohortId) return res.status(400).json({ error: 'Use the cohort transfer workflow to preserve capacity and history.' });
    if (collection === 'cohorts') {
      const enrolled = db.applications.filter(item => item.cohortId === req.params.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
      if (updates.capacity !== undefined && (!Number.isInteger(Number(updates.capacity)) || Number(updates.capacity) < enrolled)) return res.status(409).json({ error: `Capacity cannot be lower than the ${enrolled} currently enrolled students` });
      const nextStart = String(updates.startDate || before.startDate); const nextEnd = String(updates.endDate || before.endDate);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(nextStart) || !/^\d{4}-\d{2}-\d{2}$/.test(nextEnd) || nextEnd < nextStart) return res.status(400).json({ error: 'Cohort end date must be on or after its valid start date' });
      updates.enrolledCount = enrolled;
    }
    if (collection === 'applications' && updates.status === 'ENROLLED' && !['ENROLLED', 'COMPLETED'].includes(before.status)) {
      const targetCohortId = updates.cohortId || before.cohortId; const cohort = db.cohorts.find(item => item.id === targetCohortId);
      if (!cohort) return res.status(409).json({ error: 'Linked cohort is missing' });
      const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === before.email.toLowerCase());
      const verifiedPaid = invoice ? db.payments.filter(item => item.invoiceId === invoice.id && item.status === 'VERIFIED').reduce((total, item) => total + item.amountZAR, 0) : 0;
      if (!invoice || verifiedPaid < Math.min(1000, invoice.amountZAR)) return res.status(409).json({ error: 'Verify the required seat deposit before enrolling this student' });
      const occupiedSeats = db.applications.filter(item => item.id !== before.id && item.cohortId === targetCohortId && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
      if (occupiedSeats >= cohort.capacity) updates.status = 'WAITLISTED';
    }
    list[index] = { ...list[index], ...updates, ...(list[index].id ? { id: list[index].id } : {}) };
    if (collection === 'applications') for (const cohort of db.cohorts) cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
    const changedKeys = Object.keys(req.body || {}).filter(key => key !== 'id');
    const changes = auditChanges(before, list[index], changedKeys);
    if (Object.keys(changes).length) {
      const action = collection === 'applications' && 'status' in changes ? `APPLICATION_${String(list[index].status)}` : collection === 'applications' ? 'STUDENT_RECORD_UPDATED' : `${collection.toUpperCase()}_UPDATED`;
      addAudit(db, req, action, collection, req.params.id, `${collection === 'applications' ? 'Student application' : collection} updated: ${Object.keys(changes).join(', ')}`, changes);
    }
    await saveDatabase(db); res.json(collection === 'applications' ? { application: list[index], cohort: db.cohorts.find(item => item.id === list[index].cohortId), waitlisted: updates.status === 'WAITLISTED' && req.body?.status === 'ENROLLED' } : list[index]);
  });
  app.delete(`/api/${collection}/:id`, authenticate, requireRole('ADMIN'), async (req, res) => {
    const db = await getDatabase(); const list = db[collection] as any[]; const next = list.filter(item => item.id !== req.params.id);
    if (next.length === list.length) return res.status(404).json({ error: 'Record not found' });
    (db[collection] as any) = next;
    if (collection === 'applications') for (const cohort of db.cohorts) cohort.enrolledCount = db.applications.filter(item => item.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(item.status)).length;
    await saveDatabase(db); res.status(204).send();
  });
}

for (const collection of ['cohorts','tickets','labs','invoices','assessments','certificates','attendance'] as const) {
  app.post(`/api/${collection}`, authenticate, requireRole('ADMIN'), async (req, res) => {
    const db = await getDatabase();
    const record = { ...req.body, id: req.body?.id || makeId(collection.slice(0, 3)) };
    if (collection === 'certificates') {
      const application = db.applications.find(item => item.id === record.studentId);
      const finalAssessment = db.assessments.find(item => item.studentId === record.studentId && item.moduleNumber === 15);
      if (!application || application.status !== 'COMPLETED') return res.status(409).json({ error: 'Student must be marked COMPLETED before a certificate can be issued' });
      if (!finalAssessment || finalAssessment.status !== 'Graded' || (finalAssessment.studentScore ?? 0) < 80) return res.status(409).json({ error: 'Final assessment must be graded at 80% or higher before a certificate can be issued' });
    }
    (db[collection] as any[]) = [record, ...(db[collection] as any[])];
    await saveDatabase(db);
    res.status(201).json(record);
  });
}

app.post('/api/email/approval', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { email, type, referenceNumber } = req.body || {};
  if (!validEmail(email) || type !== 'APPROVED') return res.status(400).json({ error: 'A valid approved application is required' });
  const db = await getDatabase();
  const application = db.applications.find(item => item.email.toLowerCase() === String(email).toLowerCase() && item.referenceNumber === referenceNumber);
  if (!application) return res.status(404).json({ error: 'Application not found' });
  if (!application.isLaptopCompliant) return res.status(409).json({ error: 'Hardware must be confirmed compliant before approval' });
  const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
  const cohort = db.cohorts.find(item => item.id === application.cohortId);
  if (!invoice || !cohort) return res.status(409).json({ error: 'The linked invoice or cohort is missing' });
  const previousStatus = application.status; application.status = 'APPROVED';
  const now = new Date().toISOString();
  if (!db.studentCredentials.some(item => item.applicationId === application.id)) db.studentCredentials.push({ applicationId: application.id, email: application.email.toLowerCase(), createdAt: now, updatedAt: now });
  const setupToken = createAuthToken(db, application.id, 'SETUP', 60 * 24); const setupLink = portalLink('setup', setupToken);
  const rendered = renderStoredTemplate(db, 'tpl-app-approved', {
    studentName: escapeHtml(`${application.firstName} ${application.lastName}`), cohortName: escapeHtml(cohort.name), cohortStartDate: escapeHtml(cohort.startDate), invoiceAmount: invoice.amountZAR.toLocaleString('en-ZA'), dueDate: escapeHtml(invoice.dueDate),
  });
  const subject = rendered?.subject || 'Your TechLabs Academy application has been approved';
  const accountInstructions = `<h3>Step 1: Create your portal password</h3><p><a href="${escapeHtml(setupLink)}" style="display:inline-block;padding:12px 18px;background:#000;color:#fff;text-decoration:none;border-radius:8px">Create portal password</a></p><p>This private link verifies your email, expires in 24 hours, and can be used once.</p>`;
  const paymentInstructions = `<h3>Steps 2 and 3: Pay and upload your proof</h3><p><strong>Bank:</strong> ${escapeHtml(db.academySettings.bankName)}<br><strong>Account name:</strong> ${escapeHtml(db.academySettings.accountName)}<br><strong>Account number:</strong> ${escapeHtml(db.academySettings.accountNumber)}<br><strong>Branch code:</strong> ${escapeHtml(db.academySettings.branchCode)}<br><strong>EFT reference:</strong> ${escapeHtml(invoice.invoiceNumber)}</p><p>Pay the amount shown on the attached invoice by ${escapeHtml(invoice.dueDate)}. Then sign in to the portal and upload the bank-generated proof of payment as a PDF, JPG, or PNG. Your seat is secured only after admissions verifies the required payment; do not upload the same proof more than once while it is under review.</p>`;
  const pdf = await generateInvoicePDF({ invoiceNumber: invoice.invoiceNumber, invoiceDate: invoice.invoiceDate || application.submissionDate, dueDate: invoice.dueDate, studentName: invoice.studentName, studentEmail: invoice.studentEmail, studentPhone: application.whatsapp, studentCity: application.city, amount: invoice.amountZAR, description: 'TechLabs Academy IT Support Bootcamp tuition', reference: invoice.invoiceNumber, companyName: db.academySettings.companyName || db.academySettings.academyName, academyName: db.academySettings.academyName, companyAddress: db.academySettings.campusAddress || db.academySettings.location, admissionsEmail: db.academySettings.admissionsEmail, courseTier: invoice.courseTier, listPrice: invoice.listPriceZAR, discountAmount: invoice.discountZAR, discountPercent: invoice.discountPercent, paidAmount: invoice.paidZAR ?? 0, balanceAmount: invoice.balanceZAR, bankName: db.academySettings.bankName, accountName: db.academySettings.accountName, accountNumber: db.academySettings.accountNumber, branchCode: db.academySettings.branchCode, paymentTerms: [invoice.paymentOption === 'FULL' ? 'Full tuition is payable by the due date.' : `A seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} is required.`, 'Use the invoice number as the EFT reference.', 'Payments are confirmed only after admissions verification.'], installments: db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence), payments: [] });
  const delivery = await sendEmail({
    to: application.email, subject,
    html: `${rendered?.html || `<h2>Hello ${escapeHtml(application.firstName)},</h2><p>Your application has been approved.</p>`}${accountInstructions}${paymentInstructions}<p>Regards,<br>TechLabs Academy</p>`,
    attachments: [{ filename: `${invoice.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '-')}.pdf`, content: pdf }],
  });
  db.emailDeliveries.unshift({ id: makeId('email'), providerId: delivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: now });
  addAudit(db, req, 'APPLICATION_APPROVED', 'application', application.id, `Application approved and invoice email ${delivery.sent ? 'submitted' : 'failed'} for ${application.referenceNumber}`, { status: { before: previousStatus, after: 'APPROVED' } });
  await saveDatabase(db);
  res.json({ ok: delivery.sent, message: delivery.sent ? 'Approval and invoice email sent' : 'Application approved, but the email failed', application, invoice, emailDelivery: delivery });
});

app.patch('/api/student/tickets/:id', authenticate, requireRole('STUDENT'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const ticket = db.tickets.find(t => t.id === req.params.id && t.assignedStudentId === req.session!.userId);
  if (!ticket) return res.status(404).json({ error: 'Assigned ticket not found' });
  if (!requiredText(req.body?.studentResolutionNotes, 4000)) return res.status(400).json({ error: 'Resolution notes are required' });
  Object.assign(ticket, { status: 'RESOLVED', studentRootCause: String(req.body.studentRootCause || '').slice(0, 2000), studentResolutionNotes: req.body.studentResolutionNotes });
  await saveDatabase(db); res.json(ticket);
});

app.get('/api/certificates/:number', rateLimit('certificate-lookup', 30, 60 * 1000), async (req, res) => {
  const db = await getDatabase(); const certificate = db.certificates.find(c => c.certificateNumber.toUpperCase() === req.params.number.toUpperCase());
  certificate ? res.json(certificate) : res.status(404).json({ error: 'Certificate not found' });
});
app.post('/api/invoices/generate', authenticate, requireRole('ADMIN'), (req, res) => {
  const { studentName, studentEmail, amount, description, invoiceNumber, dueDate, reference } = req.body;
  if (!requiredText(studentName) || !validEmail(studentEmail) || !Number.isFinite(Number(amount)) || !requiredText(description, 500)) return res.status(400).json({ error: 'Valid invoice fields are required' });
  res.type('html').send(generateInvoiceHTML({ invoiceNumber: invoiceNumber || `INV-${Date.now()}`, invoiceDate: new Date().toISOString().slice(0, 10), dueDate: dueDate || new Date(Date.now() + 1209600000).toISOString().slice(0, 10), studentName, studentEmail, amount: Number(amount), description, reference }));
});
app.post('/api/invoices/:id/email', authenticate, requireRole('ADMIN'), async (req, res) => {
  const db = await getDatabase();
  const invoice = db.invoices.find(item => item.id === req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const application = db.applications.find(item => item.email.toLowerCase() === invoice.studentEmail.toLowerCase());
  const paidZAR = invoice.paidZAR ?? Math.max(0, invoice.amountZAR - invoice.balanceZAR);
  const nextInstallment = db.paymentInstallments.filter(item => item.invoiceId === invoice.id && item.status !== 'PAID').sort((a, b) => a.sequence - b.sequence)[0];
  const nextAmount = nextInstallment ? Math.min(invoice.balanceZAR, nextInstallment.amountZAR - (nextInstallment.paidZAR ?? 0)) : paidZAR === 0 && invoice.paymentOption !== 'FULL' ? Math.min(1000, invoice.amountZAR) : invoice.balanceZAR;
  const subject = `TechLabs invoice ${invoice.invoiceNumber}`;
  const invoicePayments = db.payments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const invoiceDate = invoice.invoiceDate || application?.submissionDate || new Date().toISOString().slice(0, 10);
  const pdf = await generateInvoicePDF({
    invoiceNumber: invoice.invoiceNumber,
    invoiceDate,
    dueDate: invoice.dueDate,
    studentName: invoice.studentName,
    studentEmail: invoice.studentEmail,
    studentPhone: application?.whatsapp,
    studentCity: application?.city,
    amount: invoice.amountZAR,
    description: 'TechLabs Academy IT Support Bootcamp tuition',
    reference: invoice.invoiceNumber,
    companyName: db.academySettings.companyName || db.academySettings.academyName || 'TechLabs Academy SA',
    academyName: db.academySettings.academyName || 'TechLabs Academy SA',
    companyAddress: db.academySettings.campusAddress || db.academySettings.location || 'Cape Town, South Africa',
    admissionsEmail: db.academySettings.admissionsEmail,
    courseTier: invoice.courseTier,
    listPrice: invoice.listPriceZAR,
    discountAmount: invoice.discountZAR,
    discountPercent: invoice.discountPercent,
    paidAmount: paidZAR,
    balanceAmount: invoice.balanceZAR,
    bankName: db.academySettings.bankName,
    accountName: db.academySettings.accountName,
    accountNumber: db.academySettings.accountNumber,
    branchCode: db.academySettings.branchCode,
    paymentTerms: [
      invoice.paymentOption === 'FULL' ? 'Full tuition is payable by the invoice due date.' : `A seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} is required to secure enrollment.`,
      'Use the invoice number as the EFT payment reference.',
      'Upload the bank-generated proof of payment in the student portal. Payments remain unconfirmed until verified by admissions.',
      invoice.paymentOption === 'DEPOSIT' ? 'The remaining tuition balance must be settled according to the agreed course payment schedule.' : 'Portal access is subject to payment verification.',
    ],
    installments: db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence),
    payments: invoicePayments.map(payment => ({ date: (payment.verifiedAt || payment.submittedAt).slice(0, 10), type: payment.type, amount: payment.amountZAR, reference: payment.eftReference, status: payment.status })),
  });
  const delivery = await sendEmail({
    to: invoice.studentEmail,
    subject,
    html: `<div style="font-family:Arial,sans-serif;max-width:640px;margin:auto;color:#1a1a1a"><h2>TechLabs Academy Invoice</h2><p>Hello ${escapeHtml(application?.firstName || invoice.studentName)},</p><p>Your formal PDF invoice is attached. A summary and EFT payment information are also below.</p><table style="width:100%;border-collapse:collapse"><tr><td style="padding:8px;border-bottom:1px solid #ddd">Invoice</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><strong>${escapeHtml(invoice.invoiceNumber)}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Course tier</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">${escapeHtml(invoice.courseTier)}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Total tuition</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">R${invoice.amountZAR.toLocaleString('en-ZA')}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Paid to date</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right">R${paidZAR.toLocaleString('en-ZA')}</td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Remaining balance</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><strong>R${invoice.balanceZAR.toLocaleString('en-ZA')}</strong></td></tr><tr><td style="padding:8px;border-bottom:1px solid #ddd">Amount currently required</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right"><strong>R${nextAmount.toLocaleString('en-ZA')}</strong></td></tr><tr><td style="padding:8px">Due date</td><td style="padding:8px;text-align:right">${escapeHtml(invoice.dueDate)}</td></tr></table><h3>EFT banking details</h3><p><strong>Bank:</strong> ${escapeHtml(db.academySettings.bankName)}<br><strong>Account name:</strong> ${escapeHtml(db.academySettings.accountName)}<br><strong>Account number:</strong> ${escapeHtml(db.academySettings.accountNumber)}<br><strong>Branch code:</strong> ${escapeHtml(db.academySettings.branchCode)}<br><strong>Payment reference:</strong> ${escapeHtml(invoice.invoiceNumber)}</p><p>After payment, sign in to your applicant portal and upload the bank-generated proof of payment.</p><p>Regards,<br>TechLabs Academy</p></div>`,
    attachments: [{ filename: `${invoice.invoiceNumber.replace(/[^A-Za-z0-9_-]/g, '-')}.pdf`, content: pdf }],
  });
  db.emailDeliveries = [{ id: makeId('email'), providerId: delivery.id, recipient: invoice.studentEmail, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() }, ...db.emailDeliveries];
  addAudit(db, req, 'INVOICE_EMAILED', 'invoice', invoice.id, `Invoice ${invoice.invoiceNumber} email ${delivery.sent ? 'submitted to provider' : 'failed'} for ${invoice.studentEmail}`, { emailStatus: { before: null, after: delivery.sent ? 'SENT' : 'FAILED' }, balanceZAR: { before: invoice.balanceZAR, after: invoice.balanceZAR } });
  await saveDatabase(db);
  if (!delivery.sent) return res.status(502).json({ error: delivery.reason || 'Invoice email was not sent' });
  res.json({ ok: true, message: `Invoice sent to ${invoice.studentEmail}`, deliveryId: delivery.id });
});
app.get('/api/automation/templates', authenticate, requireRole('ADMIN'), async (_req, res) => res.json((await getDatabase()).emailTemplates));
app.get('/api/automation/workflows', authenticate, requireRole('ADMIN'), (_req, res) => res.json(emailAutomationEngine.getAllWorkflows()));
app.put('/api/automation/templates/:id', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const db = await getDatabase(); const existing = db.emailTemplates.find(item => item.id === req.params.id);
  if (!existing) return res.status(404).json({ error: 'Template not found' });
  const allowed = { name: req.body?.name, subject: req.body?.subject, htmlBody: req.body?.htmlBody, enabled: req.body?.enabled };
  const updates = Object.fromEntries(Object.entries(allowed).filter(([, value]) => value !== undefined));
  if ((updates.name !== undefined && !requiredText(updates.name, 120)) || (updates.subject !== undefined && !requiredText(updates.subject, 200)) || (updates.htmlBody !== undefined && !requiredText(updates.htmlBody, 20_000))) return res.status(400).json({ error: 'Template name, subject, or body is invalid' });
  const before = { ...existing }; Object.assign(existing, updates);
  addAudit(db, req, 'EMAIL_TEMPLATE_UPDATED', 'emailTemplate', existing.id, `Email template updated: ${existing.name}`, auditChanges(before, existing, Object.keys(updates)));
  await saveDatabase(db); res.json(existing);
});
app.post('/api/automation/render', authenticate, requireRole('ADMIN'), async (req, res) => {
  const rendered = renderStoredTemplate(await getDatabase(), req.body?.templateId, req.body?.variables || {});
  rendered ? res.json(rendered) : res.status(404).json({ error: 'Template not found' });
});
app.post('/api/bulk/export', authenticate, requireRole('ADMIN'), async (req, res) => {
  const { targetIds, targetType, format } = req.body;
  if (!Array.isArray(targetIds) || !['applications','leads','invoices'].includes(targetType) || !['csv','json'].includes(format)) return res.status(400).json({ error: 'Invalid export request' });
  const db = await getDatabase(); const records = (db[targetType as 'applications'] as any[]).filter(item => targetIds.includes(item.id));
  const output = format === 'csv' ? bulkOperationsService.generateCSV(records) : bulkOperationsService.generateJSON(records);
  res.type(format === 'csv' ? 'text/csv' : 'application/json').setHeader('Content-Disposition', `attachment; filename="${targetType}-export.${format}"`).send(output);
});
app.post('/api/bulk/approve', authenticate, requireRole('ADMIN'), async (req: AuthedRequest, res) => {
  const ids = req.body?.applicationIds;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 100) return res.status(400).json({ error: 'Select between 1 and 100 applications' });
  const db = await getDatabase();
  let updated = 0;
  db.applications = db.applications.map(item => {
    if (!ids.includes(item.id)) return item;
    updated += 1;
    return { ...item, status: 'APPROVED', adminNotes: req.body?.notes ? `${item.adminNotes ? `${item.adminNotes} | ` : ''}${String(req.body.notes).slice(0, 1000)}` : item.adminNotes };
  });
  addAudit(db, req, 'APPLICATIONS_BULK_APPROVED', 'applications', `${updated}-records`, `${updated} applications approved in bulk`, { status: { before: 'MIXED', after: 'APPROVED' }, applicationIds: { before: [], after: ids.slice(0, 100) } });
  await saveDatabase(db);
  res.json({ updated, emailDelivery: { attempted: false, reason: req.body?.sendEmails ? 'Use bulk email after reviewing recipients' : undefined } });
});
app.post('/api/bulk/send-emails', authenticate, requireRole('ADMIN'), async (req, res) => {
  const ids = req.body?.recipientIds;
  const recipientType = req.body?.recipientType;
  if (!Array.isArray(ids) || ids.length === 0 || ids.length > 50 || !['applications', 'leads'].includes(recipientType)) return res.status(400).json({ error: 'Invalid recipients' });
  const db = await getDatabase(); const template = db.emailTemplates.find(item => item.id === req.body?.templateId);
  if (!template?.enabled) return res.status(400).json({ error: 'Enabled email template required' });
  const source = recipientType === 'applications' ? db.applications : db.leads;
  const recipients = source.filter(item => ids.includes(item.id));
  const results = [];
  for (const recipient of recipients) {
    const name = 'firstName' in recipient ? `${recipient.firstName} ${recipient.lastName}` : recipient.name;
    const rendered = renderStoredTemplate(db, template.id, { studentName: escapeHtml(name), referenceNumber: 'referenceNumber' in recipient ? escapeHtml(recipient.referenceNumber) : '', cohortName: 'cohortId' in recipient ? escapeHtml(recipient.cohortId) : 'TechLabs Academy' });
    const delivery = await sendEmail({ to: recipient.email, subject: rendered?.subject || template.subject, html: rendered?.html || template.htmlBody });
    db.emailDeliveries = [{ id: makeId('email'), providerId: delivery.id, recipient: recipient.email, subject: rendered?.subject || template.subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() }, ...db.emailDeliveries];
    results.push({ recipientId: recipient.id, email: recipient.email, ...delivery });
  }
  await saveDatabase(db);
  res.json({ sent: results.filter(item => item.sent).length, failed: results.filter(item => !item.sent).length, results });
});

app.use('/api', (_req, res) => res.status(404).json({ error: 'API route not found' }));
app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof DatabaseConflict) { res.status(409).json({ error: error.message }); return; }
  if (error instanceof YocoError) { res.status(error.status).json({ error: error.message }); return; }
  console.error(error instanceof Error ? error.message : 'Request failed'); res.status(500).json({ error: 'Internal server error' });
});
let reminderRunActive = false;
const runScheduledPaymentReminders = async () => {
  if (reminderRunActive) return;
  reminderRunActive = true;
  try {
    const db = await getDatabase();
    const result = await runPaymentReminders(db);
    await saveDatabase(db);
    if (result.sent || result.failed) console.log(`Payment reminders: ${result.sent} sent, ${result.failed} failed`);
  } catch (error) {
    console.error('Payment reminder run failed:', error);
  } finally {
    reminderRunActive = false;
  }
};

app.listen(PORT, () => {
  console.log(`TechLabs API listening on http://localhost:${PORT}`);
  setTimeout(() => void runScheduledPaymentReminders(), 60_000).unref();
  setInterval(() => void runScheduledPaymentReminders(), 6 * 60 * 60 * 1000).unref();
});
