import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHmac } from 'node:crypto';
import express from 'express';

test('Yoco routes and atomic ledger with an isolated SQLite database', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'techlabs-yoco-'));
  process.env.DATABASE_PROVIDER = 'sqlite'; process.env.TECHLABS_DB_PATH = path.join(dir, 'test.db');
  const secret = `whsec_${Buffer.from('integration-test-only').toString('base64')}`;
  Object.assign(process.env, { YOCO_ENABLED: 'true', YOCO_MODE: 'test', YOCO_SECRET_KEY: 'sk_test_fake', YOCO_WEBHOOK_SECRET: secret, APP_ORIGIN: 'http://localhost:3001' });
  const { getDatabase, mutateDatabase, saveDatabase, DatabaseConflict } = await import('../data/store');
  const { settleYoco, amountDue } = await import('./yoco-ledger');
  const { yocoRouter, yocoWebhook } = await import('./yoco-routes');
  const { forwardAsyncErrors } = await import('./async-express');
  await mutateDatabase(db => {
    const student = { ...db.applications[0], id: 'student', email: 'test@example.test', status: 'APPROVED', cohortId: 'cohort' } as any;
    db.applications = [student]; db.cohorts = [{ ...db.cohorts[0], id: 'cohort', capacity: 1, enrolledCount: 0 }];
    db.invoices = [{ ...db.invoices[0], id: 'invoice', studentEmail: student.email, amountZAR: 1999, paidZAR: 0, balanceZAR: 1999, paymentOption: 'DEPOSIT', status: 'PENDING' }];
    db.payments = []; db.paymentInstallments = []; db.yocoCheckouts = [];
  });
  await t.test('stale financial saves are rejected, unrelated saves merge', async () => {
    const a = await getDatabase(); const b = await getDatabase();
    a.invoices[0].dueDate = '2030-01-01'; await saveDatabase(a);
    b.invoices[0].dueDate = '2031-01-01'; await assert.rejects(saveDatabase(b), DatabaseConflict);
    const c = await getDatabase(); const d = await getDatabase();
    c.auditLogs = []; await saveDatabase(c); d.sessions = []; await saveDatabase(d);
  });
  let providerCalls = 0;
  const app = express(); forwardAsyncErrors(app); app.post('/api/webhooks/yoco', ...yocoWebhook()); app.use(express.json());
  app.get('/conflict-test', async () => { throw new DatabaseConflict(); });
  const auth: express.RequestHandler = (req: any, res, next) => {
    if (!req.headers.authorization) { res.sendStatus(401); return; }
    req.session = { userId: req.headers.authorization, role: 'STUDENT' }; next();
  };
  const passthrough: express.RequestHandler = (_req, _res, next) => next();
  app.use('/api', yocoRouter(auth, passthrough, passthrough, passthrough, async (_config, intent) => { providerCalls++; return { checkoutId: `checkout-${intent.id}`, redirectUrl: 'https://c.yoco.com/test' }; }));
  app.use((err: any, _req: any, res: any, _next: any) => res.status(err.status || 500).json({ error: err.message }));
  const server = app.listen(0, '127.0.0.1'); await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => server.close(() => resolve())));
  const base = `http://127.0.0.1:${(server.address() as any).port}`;
  await t.test('async route errors reach Express error handler', async () => {
    assert.equal((await fetch(`${base}/conflict-test`)).status, 500);
  });
  const checkout = (user = 'student') => fetch(`${base}/api/student/invoices/invoice/yoco`, { method: 'POST', headers: { Authorization: user } });
  await t.test('auth and ownership gate checkout; pending checkout is reused', async () => {
    assert.equal((await fetch(`${base}/api/student/invoices/invoice/yoco`, { method: 'POST' })).status, 401);
    assert.equal((await checkout('another-student')).status, 404);
    assert.equal((await checkout()).status, 200); assert.equal((await checkout()).status, 200);
    assert.equal(providerCalls, 1);
    assert.equal((await getDatabase()).yocoCheckouts![0].amountCents, 100000);
  });
  const eventFor = (intent: any, suffix: string) => ({ id: `event-${suffix}`, type: 'payment.succeeded', payload: { id: `payment-${suffix}`, type: 'payment', status: 'succeeded', amount: intent.amountCents, currency: 'ZAR', mode: intent.mode, metadata: { checkoutId: intent.checkoutId } } });
  const sendEvent = async (event: any, valid = true) => {
    const raw = JSON.stringify(event); const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`delivery.${timestamp}.${raw}`).digest('base64');
    return fetch(`${base}/api/webhooks/yoco`, { method: 'POST', body: raw, headers: { 'Content-Type': 'application/json', 'webhook-id': 'delivery', 'webhook-timestamp': timestamp, 'webhook-signature': `v1,${valid ? signature : 'invalid'}` } });
  };
  await t.test('raw webhook signature and test mode settlement', async () => {
    const intent = (await getDatabase()).yocoCheckouts![0]; const event = eventFor(intent, 'test');
    assert.equal((await sendEvent(event, false)).status, 401);
    assert.equal((await sendEvent(event)).status, 200);
    const db = await getDatabase(); assert.equal(db.invoices[0].paidZAR, 1000); assert.equal(db.invoices[0].balanceZAR, 999); assert.equal(db.payments.length, 1); assert.equal(db.payments[0].mode, 'test'); assert.equal(db.applications[0].status, 'ENROLLED'); assert.equal(db.yocoCheckouts![0].status, 'TEST_PAID');
  });
  await t.test('concurrent live webhook retries credit once and enroll', async () => {
    await mutateDatabase(db => db.yocoCheckouts!.push({ ...db.yocoCheckouts![0], id: 'live', mode: 'live', status: 'PENDING', checkoutId: 'live-checkout', eventId: undefined, paymentId: undefined }));
    const intent = (await getDatabase()).yocoCheckouts!.find(i => i.id === 'live'); const event = eventFor(intent, 'live');
    await Promise.all([mutateDatabase(db => settleYoco(db, event)), mutateDatabase(db => settleYoco(db, event))]);
    const db = await getDatabase(); assert.equal(db.payments.length, 1); assert.equal(db.invoices[0].paidZAR, 1000); assert.equal(db.invoices[0].balanceZAR, 999); assert.equal(db.applications[0].status, 'ENROLLED');
  });
  await t.test('overpayment is retained for review without changing balance', async () => {
    await mutateDatabase(db => db.yocoCheckouts!.push({ ...db.yocoCheckouts![0], id: 'over', mode: 'live', status: 'PENDING', checkoutId: 'over-checkout', eventId: undefined, paymentId: undefined }));
    const event = eventFor((await getDatabase()).yocoCheckouts!.find(i => i.id === 'over'), 'over');
    assert.equal(await mutateDatabase(db => settleYoco(db, event)), 'review');
    assert.equal((await getDatabase()).invoices[0].paidZAR, 1000);
  });
  await t.test('full cohort waitlists paid student; installments determine amount due', async () => {
    await mutateDatabase(db => {
      db.applications[0].status = 'APPROVED'; db.cohorts[0].capacity = 0;
      db.paymentInstallments = [{ id: 'inst', invoiceId: 'invoice', sequence: 1, label: 'Balance', amountZAR: 999, paidZAR: 0, dueDate: '2030-01-01', status: 'PENDING', createdAt: new Date().toISOString() }];
      assert.equal(amountDue(db, 'invoice', 'student'), 99900);
      db.yocoCheckouts!.push({ ...db.yocoCheckouts![0], id: 'balance', mode: 'live', amountCents: 99900, status: 'PENDING', checkoutId: 'balance-checkout', eventId: undefined, paymentId: undefined });
    });
    const event = eventFor((await getDatabase()).yocoCheckouts!.find(i => i.id === 'balance'), 'balance');
    await mutateDatabase(db => settleYoco(db, event)); const db = await getDatabase();
    assert.equal(db.applications[0].status, 'WAITLISTED'); assert.equal(db.invoices[0].balanceZAR, 0); assert.equal(db.paymentInstallments[0].status, 'PAID');
  });
});
