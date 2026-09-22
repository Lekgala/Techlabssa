import express, { type RequestHandler } from 'express';
import { randomUUID } from 'node:crypto';
import { getDatabase, mutateDatabase } from '../data/store.ts';
import { escapeHtml, sendEmail } from './email-service.ts';
import { createYocoCheckout, verifyYocoSignature, yocoConfig, yocoCheckoutHidden } from './yoco.ts';
import { amountDue, ownedInvoice, settleYoco, YocoError, type YocoIntent } from './yoco-ledger.ts';

async function sendYocoConfirmationEmail(intentId: string): Promise<void> {
  const db = await getDatabase();
  const intent = (db.yocoCheckouts ?? []).find(item => item.id === intentId);
  if (!intent || !['PAID', 'TEST_PAID'].includes(intent.status)) return;
  if (db.auditLogs.some(item => item.id === `yoco-email-${intent.id}`)) return;
  const invoice = db.invoices.find(item => item.id === intent.invoiceId);
  const student = db.applications.find(item => item.id === intent.studentId);
  if (!invoice || !student) return;
  const subject = `${intent.mode === 'test' ? 'Test payment' : 'Payment'} confirmed - ${invoice.invoiceNumber}`;
  const delivery = await sendEmail({
    to: student.email,
    subject,
    html: `<h2>Payment confirmed</h2><p>Hello ${escapeHtml(student.firstName)},</p><p>We received your ${intent.mode === 'test' ? 'test ' : ''}Yoco payment of <strong>R${(intent.amountCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}</strong>.</p><p><strong>Invoice:</strong> ${escapeHtml(invoice.invoiceNumber)}<br><strong>Reference:</strong> ${escapeHtml(intent.paymentId || intent.id)}</p><p>Your student portal has been updated with the payment status.</p>`,
  });
  await mutateDatabase(nextDb => {
    nextDb.emailDeliveries.unshift({ id: `email-${randomUUID()}`, providerId: delivery.id, recipient: student.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() });
    if (delivery.sent) nextDb.auditLogs.unshift({ id: `yoco-email-${intent.id}`, action: 'YOCO_PAYMENT_EMAIL_SENT', actorEmail: 'yoco-webhook', entityType: 'invoice', entityId: invoice.id, summary: `${intent.mode === 'test' ? 'Test payment' : 'Payment'} confirmation emailed for ${invoice.invoiceNumber}`, createdAt: new Date().toISOString() });
  });
}

export function yocoWebhook(): RequestHandler[] {
  return [express.raw({ type: 'application/json', limit: '64kb' }), async (req, res, next) => {
    try {
      // Checkout disable switch does not discard payments already in flight.
      const config = yocoConfig({ ...process.env, YOCO_ENABLED: 'true' });
      if (!Buffer.isBuffer(req.body) || !verifyYocoSignature(req.body, req.headers, config!.webhookSecret)) {
        res.status(401).json({ error: 'Invalid webhook signature' }); return;
      }
      let event: unknown;
      try { event = JSON.parse(req.body.toString('utf8')); } catch { res.status(400).json({ error: 'Invalid event' }); return; }
      const result = await mutateDatabase(db => settleYoco(db, event));
      if (result === 'paid' || result === 'test') {
        const db = await getDatabase();
        const checkoutId = (event as any)?.payload?.metadata?.checkoutId;
        const intent = (db.yocoCheckouts ?? []).find(item => item.checkoutId === checkoutId);
        if (intent) await sendYocoConfirmationEmail(intent.id);
      }
      res.json({ received: true, result });
    } catch (error) { next(error); }
  }];
}

export function yocoRouter(authenticate: RequestHandler, studentOnly: RequestHandler, adminOnly: RequestHandler, limit: RequestHandler, checkoutRequest = createYocoCheckout) {
  const router = express.Router();
  router.get('/admin/yoco/payments', authenticate, adminOnly, async (_req, res, next) => {
    if (yocoCheckoutHidden()) return res.json({ hidden: true, checkouts: [] });
    try { res.json({ checkouts: (await getDatabase()).yocoCheckouts ?? [] }); } catch (error) { next(error); }
  });
  router.get('/student/invoices/:id/yoco', authenticate, studentOnly, async (req: any, res, next) => {
    if (yocoCheckoutHidden()) return res.json({ hidden: true, enabled: false, reason: '', amountCents: 0, history: [] });
    try {
      const db = await getDatabase(); ownedInvoice(db, req.params.id, req.session.userId);
      if (db.academySettings.onlinePaymentsEnabled === false) return res.json({ enabled: false, reason: 'Online payments are temporarily unavailable.', amountCents: 0, history: [] });
      let config = null;
      try { config = yocoConfig(); } catch { /* unconfigured checkout stays unavailable */ }
      let amountCents = 0; let reason = 'Online payment is not configured yet.';
      if (config) { try { amountCents = amountDue(db, req.params.id, req.session.userId); reason = ''; } catch (error) { reason = (error as Error).message; } }
      const history = (db.yocoCheckouts ?? []).filter(i => i.invoiceId === req.params.id && i.studentId === req.session.userId);
      res.json({ enabled: Boolean(config), mode: config?.mode, amountCents, reason, history: history.map(({ id, status, mode, amountCents, createdAt }) => ({ id, status, mode, amountCents, createdAt })) });
    } catch (error) { next(error); }
  });
  router.post('/student/invoices/:id/yoco', authenticate, studentOnly, limit, async (req: any, res, next) => {
    try {
      if (yocoCheckoutHidden()) throw new YocoError(503, 'Card payments are temporarily unavailable. Please use EFT.');
      if ((await getDatabase()).academySettings.onlinePaymentsEnabled === false) throw new YocoError(503, 'Online payments are temporarily unavailable');
      const config = yocoConfig();
      if (!config) throw new YocoError(503, 'Online payments are disabled');
      const { intent, invoiceNumber } = await mutateDatabase(db => {
        const { invoice } = ownedInvoice(db, req.params.id, req.session.userId);
        const records = db.yocoCheckouts ??= [];
        if (records.some(i => i.invoiceId === req.params.id && i.status === 'REVIEW')) throw new YocoError(409, 'A payment needs admissions review');
        const pending = records.find(i => i.invoiceId === req.params.id && i.status === 'PENDING');
        const due = amountDue(db, req.params.id, req.session.userId);
        if (pending) {
          if (pending.mode !== config.mode || pending.origin !== config.origin) throw new YocoError(409, 'An earlier checkout needs reconciliation before changing payment settings');
          if (pending.amountCents !== due) throw new YocoError(409, 'Invoice changed since checkout. Contact admissions before paying.');
          return { intent: pending, invoiceNumber: invoice.invoiceNumber };
        }
        const item: YocoIntent = { id: randomUUID(), invoiceId: req.params.id as string, studentId: req.session.userId as string,
          amountCents: due, mode: config.mode, origin: config.origin,
          createdAt: new Date().toISOString(), status: 'PENDING' as const };
        records.unshift(item); return { intent: item, invoiceNumber: invoice.invoiceNumber };
      });
      const checkout = intent.checkoutId && intent.redirectUrl ? { checkoutId: intent.checkoutId, redirectUrl: intent.redirectUrl } : await checkoutRequest(config, { ...intent, invoiceNumber });
      await mutateDatabase(db => {
        const saved = db.yocoCheckouts!.find(i => i.id === intent.id)!;
        if (saved.checkoutId && saved.checkoutId !== checkout.checkoutId) throw new YocoError(409, 'Checkout identity mismatch');
        Object.assign(saved, checkout);
      });
      res.json({ redirectUrl: checkout.redirectUrl });
    } catch (error) { next(error); }
  });
  return router;
}
