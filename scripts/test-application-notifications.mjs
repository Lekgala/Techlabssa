import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { config } from 'dotenv';

const local = config({ quiet: true }).parsed || {};
const live = process.argv.includes('--send-email');
const recipient = local.APPLICATION_NOTIFICATION_EMAIL || local.ADMIN_EMAIL;
if (live) assert.ok(recipient && local.RESEND_API_KEY && local.EMAIL_FROM, 'Configure recipient and Resend credentials first');
await mkdir('tmp', { recursive: true });
const directory = await mkdtemp(path.resolve('tmp/application-email-'));
const messages = [];
let rejectEmails = false;
let liveResult;
const provider = createServer(async (req, res) => {
  try {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const message = JSON.parse(raw); messages.push(message);
    res.setHeader('Content-Type', 'application/json');
    if (rejectEmails) { res.writeHead(503); res.end(JSON.stringify({ message: 'Simulated provider failure' })); return; }
    if (live && message.subject.startsWith('New application to review:')) {
      assert.deepEqual(message.to, [recipient]);
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST', signal: AbortSignal.timeout(8000),
        headers: { Authorization: `Bearer ${local.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...message, subject: `[LOCAL TEST] ${message.subject}` }),
      });
      const result = await response.json();
      liveResult = { accepted: response.ok, id: result.id, reason: result.message };
      res.writeHead(response.status); res.end(JSON.stringify(result)); return;
    }
    res.end(JSON.stringify({ id: `mock-${messages.length}` }));
  } catch (error) { res.writeHead(502); res.end(JSON.stringify({ message: error.message })); }
});
provider.listen(0, '127.0.0.1'); await once(provider, 'listening');
const portProbe = createServer(); portProbe.listen(0, '127.0.0.1'); await once(portProbe, 'listening');
const port = portProbe.address().port; await new Promise(resolve => portProbe.close(resolve));
const password = crypto.randomUUID() + 'Aa1!';
const child = spawn(process.execPath, ['--import', 'tsx', 'server/index.ts'], {
  windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
  env: { ...process.env, PORT: String(port), DATABASE_PROVIDER: 'sqlite', DATABASE_URL: '', TECHLABS_DB_PATH: path.join(directory, 'test.db'), PAYMENT_PROOF_STORAGE: 'local', PAYMENT_PROOF_DIR: path.join(directory, 'proofs'), YOCO_ENABLED: 'false', APP_ORIGIN: 'http://localhost:3000', ADMIN_EMAIL: 'local-admin@example.test', ADMIN_PASSWORD: password, APPLICATION_NOTIFICATION_EMAIL: recipient || 'staff@example.test', RESEND_API_KEY: 'mock-key', EMAIL_FROM: local.EMAIL_FROM || 'TechLabs <test@example.test>', RESEND_API_URL: `http://127.0.0.1:${provider.address().port}/emails` },
});
let serverOutput = ''; child.stdout.on('data', b => { serverOutput += b; }); child.stderr.on('data', b => { serverOutput += b; });
const base = `http://127.0.0.1:${port}`;
const post = (route, body) => fetch(base + route, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
try {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (child.exitCode !== null) throw new Error(`Local API exited: ${serverOutput}`);
    try { ready = (await fetch(base + '/api/health')).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 250));
  }
  assert.ok(ready, 'Local API did not start');
  const data = await (await fetch(base + '/api/data')).json();
  const cohort = data.cohorts.find(item => ['Open', 'Filling Fast'].includes(item.status));
  assert.ok(cohort, 'Test database must have an open cohort');
  const application = { firstName: 'LOCAL TEST', lastName: 'Notification Check', email: 'local-notification@example.test', whatsapp: '+27000000000', cohortId: cohort.id, selectedTier: 'STARTER', paymentOption: 'DEPOSIT', acceptedTerms: true, acceptedPrivacy: true };
  const response = await post('/api/applications', application); const submitted = await response.json();
  assert.equal(response.status, 201, JSON.stringify(submitted)); assert.equal(messages.length, 2);
  const staffMessage = messages.find(item => item.subject.startsWith('New application to review:'));
  assert.ok(staffMessage.html.includes(`/admin?application=${submitted.application.id}`));
  assert.ok(staffMessage.html.includes(submitted.application.referenceNumber));
  console.log('PASS: submission saved; acknowledgement and staff alert generated with matching review link');
  assert.equal((await post('/api/applications', application)).status, 409); assert.equal(messages.length, 2);
  assert.equal((await post('/api/applications', { ...application, acceptedTerms: false })).status, 400); assert.equal(messages.length, 2);
  console.log('PASS: duplicate and invalid submissions do not send alerts');
  rejectEmails = true;
  const failed = await post('/api/applications', { ...application, email: 'local-failure@example.test' });
  assert.equal(failed.status, 201); const failedBody = await failed.json(); assert.equal(failedBody.emailDelivery.sent, false);
  const login = await post('/api/auth/admin', { email: 'local-admin@example.test', password });
  assert.equal(login.status, 200); const session = await login.json();
  const admin = await (await fetch(base + '/api/admin/data', { headers: { Authorization: `Bearer ${session.token}` } })).json();
  assert.ok(admin.applications.some(item => item.id === failedBody.application.id));
  const deliveries = admin.emailDeliveries;
  assert.ok(deliveries.some(item => item.subject.includes(failedBody.application.referenceNumber) && item.recipient === (recipient || 'staff@example.test') && item.status === 'FAILED'));
  console.log('PASS: provider failure preserves application and records failed staff notification');
  const report = { testedAt: new Date().toISOString(), reference: submitted.application.referenceNumber, applicationId: submitted.application.id, liveEmail: liveResult || 'not requested', checks: ['submission', 'review link', 'duplicate rejection', 'validation rejection', 'provider failure', 'durable application', 'delivery log'] };
  await writeFile(path.join(directory, 'result.json'), JSON.stringify(report, null, 2));
  console.log(`Results: ${path.join(directory, 'result.json')}`);
  if (live) { console.log(`Live email: ${JSON.stringify(liveResult)}`); assert.equal(liveResult?.accepted, true, 'Resend did not accept the staff email'); }
} finally {
  child.kill();
  if (child.exitCode === null) await once(child, 'exit');
  await new Promise(resolve => provider.close(resolve));
}
