import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { calculateTuitionBreakdown } from '../../src/lib/pricing.ts';

test('shared tuition retains cents and respects targeted discounts', () => {
  const settings: any = { flashSale: { enabled: true, discountPercent: 10, targetTiers: ['STARTER'] } };
  assert.equal(calculateTuitionBreakdown('STARTER', settings).amountZAR, 1799.1);
  assert.equal(calculateTuitionBreakdown('PROFESSIONAL', settings).amountZAR, 3499);
  assert.equal(calculateTuitionBreakdown('__proto__', settings).amountZAR, 0);
});

test('staging approval and proxy regressions with isolated storage and mock email', async t => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'techlabs-staging-test-'));
  const messages: any[] = [];
  let rejectEmail = false;
  const mail = http.createServer(async (req, res) => {
    let body = ''; for await (const chunk of req) body += chunk;
    messages.push(JSON.parse(body));
    res.writeHead(rejectEmail ? 503 : 200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(rejectEmail ? { message: 'Mock provider unavailable' } : { id: 'mock-' + messages.length }));
  }).listen(0, '127.0.0.1');
  await new Promise<void>(resolve => mail.once('listening', resolve));
  t.after(() => new Promise<void>(resolve => mail.close(() => resolve())));
  const portFinder = http.createServer().listen(0, '127.0.0.1');
  await new Promise<void>(resolve => portFinder.once('listening', resolve));
  const port = (portFinder.address() as any).port;
  await new Promise<void>(resolve => portFinder.close(() => resolve()));
  const child = spawn(process.execPath, ['--require', './scripts/windows-tsx-preload.cjs', '--import', 'tsx', 'server/index.ts'], {
    env: { ...process.env, PORT: String(port), DATABASE_PROVIDER: 'sqlite', DATABASE_URL: '', TECHLABS_DB_PATH: path.join(dir, 'test.db'), PAYMENT_PROOF_STORAGE: 'local', PAYMENT_PROOF_DIR: path.join(dir, 'proofs'), YOCO_ENABLED: 'false', ADMIN_EMAIL: 'audit@example.test', ADMIN_PASSWORD: 'AuditTestPassword123', APP_ORIGIN: 'http://localhost:3000', RENDER: 'true', TRUST_PROXY: '1', RESEND_API_KEY: 'mock-only', EMAIL_FROM: 'audit@example.test', RESEND_API_URL: 'http://127.0.0.1:' + (mail.address() as any).port + '/emails' },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  let output = ''; child.stdout.on('data', chunk => output += chunk); child.stderr.on('data', chunk => output += chunk);
  t.after(async () => { if (child.exitCode === null) { child.kill(); await new Promise(resolve => child.once('exit', resolve)); } });
  const base = 'http://127.0.0.1:' + port + '/api';
  for (let attempt = 0; attempt < 150; attempt++) {
    try { if ((await fetch(base + '/health')).ok) break; } catch {}
    if (child.exitCode !== null || attempt === 149) throw new Error('API failed to start: ' + output);
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  const call = async (route: string, body?: any, token?: string, ip = '198.51.100.1') => {
    const response = await fetch(base + route, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip, ...(token ? { Authorization: 'Bearer ' + token } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    return { status: response.status, body: await response.json() };
  };
  await t.test('separate forwarded clients do not share the login quota', async () => {
    for (let i = 0; i < 5; i++) assert.equal((await call('/auth/admin', {}, undefined, '198.51.100.20')).status, 401);
    assert.equal((await call('/auth/admin', {}, undefined, '198.51.100.20')).status, 429);
    assert.equal((await call('/auth/admin', {}, undefined, '198.51.100.21')).status, 401);
  });
  const login = await call('/auth/admin', { email: 'audit@example.test', password: 'AuditTestPassword123' });
  assert.equal(login.status, 200); const token = login.body.token;
  const catalog = (await call('/data')).body;
  const cohort = catalog.cohorts.find((item: any) => ['Open', 'Filling Fast'].includes(item.status));
  const create = async (suffix: string) => {
    const result = await call('/applications', { firstName: 'Audit', lastName: suffix, email: suffix + '@example.test', whatsapp: '+27820000000', cohortId: cohort.id, selectedTier: 'STARTER', paymentOption: 'DEPOSIT', acceptedTerms: true, acceptedPrivacy: true, isLaptopCompliant: true, ramGB: 16, freeStorageGB: 150, hasVirtualizationEnabled: true, cpu: 'Intel Core i5', os: 'Windows 11', storageType: 'SSD' });
    assert.equal(result.status, 201, JSON.stringify(result.body)); return result.body.application;
  };
  const eligible = await create('eligible'); const completed = await create('completed');
  const changed = await fetch(base + '/applications/' + completed.id, { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + token }, body: JSON.stringify({ status: 'COMPLETED' }) });
  assert.equal(changed.status, 200);
  await t.test('bulk email approves eligible records, sends setup link and invoice, protects completed records', async () => {
    const result = await call('/bulk/approve', { applicationIds: [eligible.id, completed.id], sendEmails: true }, token);
    assert.equal(result.status, 200); assert.equal(result.body.updated, 1);
    assert.equal(result.body.results.find((item: any) => item.id === completed.id).approved, false);
    assert.equal(result.body.results.find((item: any) => item.id === eligible.id).emailSent, true);
    const sent = messages.find(item => item.to.includes(eligible.email) && item.attachments?.length);
    assert.ok(sent); assert.match(sent.html, /action=setup/); assert.match(sent.attachments[0].filename, /\.pdf$/);
    const stored = (await call('/admin/data', undefined, token)).body;
    assert.equal(stored.applications.find((item: any) => item.id === completed.id).status, 'COMPLETED');
  });
  await t.test('email failures are reported while approval stays committed', async () => {
    rejectEmail = true;
    const result = await call('/bulk/approve', { applicationIds: [eligible.id], sendEmails: true }, token);
    assert.equal(result.body.results[0].approved, true); assert.equal(result.body.results[0].emailSent, false);
    assert.match(result.body.results[0].error, /Mock provider/);
  });
  await t.test('bulk approval without email does not send and still rejects completed records', async () => {
    const count = messages.length;
    const result = await call('/bulk/approve', { applicationIds: [eligible.id, completed.id], sendEmails: false }, token);
    assert.equal(result.body.updated, 1); assert.equal(messages.length, count);
  });
});
