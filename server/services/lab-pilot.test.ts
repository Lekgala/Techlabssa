import assert from 'node:assert/strict';
import { test } from 'node:test';
import fs from 'node:fs/promises';
import path from 'node:path';
import express from 'express';
import { createLabPilotRouter, pilotConfig, normalizeAgentFaults } from './lab-pilot';

async function fixture() {
  const root = path.resolve('tmp/lab-pilot-tests');
  await fs.mkdir(root, { recursive: true });
  const dir = await fs.mkdtemp(path.join(root, 'case-'));
  const statePath = path.join(dir, 'state.json');
  const env = { LAB_AGENT_URL: 'http://192.168.50.10:8765', LAB_AGENT_KEY: 'unique-test-key', LAB_AGENT_ID: 'agent-1' };
  let faultState = 'Available'; let resolved = false; let fail = false; let mismatch = false; let owner = 'student-1';
  const dispatched: string[] = [];
  const fetcher = (async (url: string, options: RequestInit) => {
    assert.equal(options.redirect, 'error');
    const suffix = url.split('/api/v1/')[1];
    if (suffix === 'health') return Response.json({ agentId: mismatch ? 'wrong-agent' : 'agent-1', hostname: 'VM01', status: 'healthy' });
    if (suffix === 'faults') return Response.json([{ id: 'TEST-001', state: faultState }]);
    dispatched.push(suffix);
    if (fail) throw new Error('network disconnected');
    const action = suffix.split('/').pop();
    faultState = action === 'apply' ? 'Active' : action === 'reset' ? 'Reset' : resolved ? 'Resolved' : 'Active';
    return Response.json({ faultId: 'TEST-001', success: true, resolved, correlationId: (options.headers as Record<string, string>)['X-Correlation-ID'] });
  }) as typeof fetch;
  const deps = { env, statePath, fetcher, getTickets: async () => [{ id: 'ticket-1', assignedStudentId: owner, ticketNumber: 'LAB-1' }] };
  let router = createLabPilotRouter(deps);
  const app = express(); app.use(express.json());
  app.use((req: any, _res, next) => { const actor = req.header('test-actor'); if (actor) req.session = { userId: actor, role: actor === 'staff' ? 'INSTRUCTOR' : 'STUDENT' }; next(); });
  app.use((req, res, next) => router(req, res, next));
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const address = server.address() as { port: number };
  const request = async (route = '/', actor = 'staff', body?: object) => {
    const response = await fetch(`http://127.0.0.1:${address.port}${route}`, { method: body ? 'POST' : 'GET', headers: { 'test-actor': actor, 'Content-Type': 'application/json' }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  };
  const reserve = async () => { const result = await request('/runs', 'staff', { ticketId: 'ticket-1', faultId: 'TEST-001' }); assert.equal(result.status, 201); return result.data.id as string; };
  return { request, reserve, dispatched, statePath, setResolved: () => { resolved = true; }, fail: () => { fail = true; }, mismatch: () => { mismatch = true; }, changeOwner: () => { owner = 'student-2'; }, restart: () => { router = createLabPilotRouter(deps); }, close: async () => {
    server.closeAllConnections(); await new Promise<void>((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
    assert.ok(dir.startsWith(root + path.sep)); await fs.rm(dir, { recursive: true, force: true });
  } };
}

test('agent catalogue supports numeric and named states and rejects unknown values', () => {
  const names = ['Available', 'Applying', 'Active', 'VerificationPending', 'Resolved', 'Resetting', 'Reset', 'Failed'];
  names.forEach((state, index) => {
    assert.equal(normalizeAgentFaults([{ id: 'TEST-001', state: index }])[0].state, state);
    assert.equal(normalizeAgentFaults([{ id: 'TEST-001', state }])[0].state, state);
  });
  for (const state of [-1, 8, 0.5, null, '0', 'Unknown']) assert.throws(() => normalizeAgentFaults([{ id: 'TEST-001', state }]));
});

test('configuration rejects public targets, embedded secrets, redirects paths and unsupported faults', () => {
  for (const url of ['https://example.com', 'http://169.254.169.254', 'http://192.168.1.2/path', 'http://user:secret@192.168.1.2']) assert.throws(() => pilotConfig({ LAB_AGENT_URL: url }));
  assert.throws(() => pilotConfig({ LAB_PILOT_FAULTS: 'AD-001' }));
  assert.deepEqual(pilotConfig({}).enabledFaults, ['TEST-001']);
});
test('student isolation and role checks protect management actions and credentials', async () => {
  const f = await fixture(); try {
    const id = await f.reserve();
    assert.equal((await f.request('/', '')).status, 403);
    assert.equal((await f.request('/health', 'student-1')).status, 403);
    assert.equal((await f.request('/runs', 'student-1', { ticketId: 'ticket-1', faultId: 'TEST-001' })).status, 403);
    for (const action of ['apply', 'reset']) assert.equal((await f.request(`/runs/${id}/${action}`, 'student-1', {})).status, 403);
    assert.equal((await f.request(`/runs/${id}/verify`, 'student-2', { notes: 'repair' })).status, 404);
    assert.deepEqual((await f.request('/', 'student-2')).data.runs, []);
    assert.equal((await f.request('/', 'student-1')).data.setup, undefined);
    assert.deepEqual((await f.request()).data.setup, { addressConfigured: true, keyConfigured: true, identityConfigured: true, localMachine: false });
    assert.ok(!JSON.stringify((await f.request()).data).includes('unique-test-key'));
    assert.equal(f.dispatched.length, 0);
  } finally { await f.close(); }
});
test('apply, failed verification, successful verification and reset form a recorded exercise', async () => {
  const f = await fixture(); try {
    const id = await f.reserve();
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).data.state, 'ACTIVE');
    assert.equal((await f.request('/runs', 'staff', { ticketId: 'ticket-1', faultId: 'TEST-001' })).status, 409);
    assert.equal((await f.request(`/runs/${id}/verify`, 'student-1', {})).status, 400);
    assert.equal((await f.request(`/runs/${id}/verify`, 'student-1', { notes: 'First diagnosis' })).data.state, 'ACTIVE');
    f.setResolved();
    const passed = await f.request(`/runs/${id}/verify`, 'student-1', { notes: 'Removed the lab marker' });
    assert.equal(passed.data.state, 'VERIFIED'); assert.equal(passed.data.attempts[2].notes, 'Removed the lab marker');
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).status, 409);
    assert.equal((await f.request(`/runs/${id}/reset`, 'staff', {})).data.state, 'RESET');
    f.restart(); assert.equal((await f.request()).data.runs[0].state, 'RESET');
    await f.reserve();
  } finally { await f.close(); }
});
test('uncertain apply remains blocked after restart and cannot grant verification credit', async () => {
  const f = await fixture(); try {
    const id = await f.reserve(); f.fail();
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).status, 502);
    f.restart();
    assert.equal((await f.request()).data.runs[0].state, 'UNKNOWN');
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).status, 409);
    assert.equal((await f.request(`/runs/${id}/verify`, 'student-1', { notes: 'fixed' })).status, 409);
    assert.equal(f.dispatched.length, 1);
    // Mock agent stayed Available: staff reconciliation releases the reservation without reapplying.
    assert.equal((await f.request(`/runs/${id}/reset`, 'staff', {})).data.state, 'RESET');
  } finally { await f.close(); }
});
test('changed ownership and mismatched machine identity prevent dispatch', async () => {
  const f = await fixture(); try {
    const id = await f.reserve(); f.changeOwner();
    assert.equal((await f.request(`/runs/${id}/verify`, 'student-1', { notes: 'fixed' })).status, 404);
    f.mismatch();
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).status, 409);
    assert.equal(f.dispatched.length, 0);
  } finally { await f.close(); }
});
test('a persisted pending operation blocks replay and permits staff recovery', async () => {
  const f = await fixture(); try {
    const id = await f.reserve();
    const runs = JSON.parse(await fs.readFile(f.statePath, 'utf8')); runs[0].state = 'APPLYING';
    await fs.writeFile(f.statePath, JSON.stringify(runs)); f.restart();
    assert.equal((await f.request(`/runs/${id}/apply`, 'staff', {})).status, 409);
    assert.equal((await f.request(`/runs/${id}/reset`, 'staff', {})).data.state, 'RESET');
  } finally { await f.close(); }
});

test('instructor test needs no ticket and supports the complete marker lifecycle', async () => {
  const f = await fixture(); try {
    const result = await f.request('/runs', 'staff', { mode: 'INSTRUCTOR_TEST', faultId: 'TEST-001' });
    assert.equal(result.status, 201);
    const run = result.data;
    assert.equal(run.mode, 'INSTRUCTOR_TEST');
    assert.equal(run.ticketId, undefined); assert.equal(run.studentId, undefined);
    assert.deepEqual((await f.request('/', 'student-1')).data.runs, []);
    assert.equal((await f.request(`/runs/${run.id}/verify`, 'student-1', {})).status, 404);
    assert.equal((await f.request(`/runs/${run.id}/apply`, 'staff', {})).data.state, 'ACTIVE');
    assert.equal((await f.request(`/runs/${run.id}/verify`, 'staff', {})).data.state, 'ACTIVE');
    f.setResolved();
    assert.equal((await f.request(`/runs/${run.id}/verify`, 'staff', {})).data.state, 'VERIFIED');
    assert.equal((await f.request(`/runs/${run.id}/reset`, 'staff', {})).data.state, 'RESET');
  } finally { await f.close(); }
});

test('test mode cannot bypass staff access, fault restrictions or assignment requirements', async () => {
  const f = await fixture(); try {
    assert.equal((await f.request('/runs', 'student-1', { mode: 'INSTRUCTOR_TEST', faultId: 'TEST-001' })).status, 403);
    assert.equal((await f.request('/runs', 'staff', { mode: 'INSTRUCTOR_TEST', faultId: 'WIN-001' })).status, 400);
    assert.equal((await f.request('/runs', 'staff', { mode: 'INVALID', faultId: 'TEST-001' })).status, 400);
    assert.equal((await f.request('/runs', 'staff', { mode: 'STUDENT_ASSIGNMENT', faultId: 'TEST-001' })).status, 400);
    assert.equal(f.dispatched.length, 0);
  } finally { await f.close(); }
});
