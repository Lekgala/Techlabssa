import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Router, type Request } from 'express';
import type { LabRun, LabAttempt } from '../../src/types/labPilot';

type Actor = { userId: string; role: string };
type PilotRequest = Request & { session?: Actor };
type Ticket = { id: string; assignedStudentId?: string; ticketNumber?: string; issueTitle?: string };
type Dependencies = { getTickets: () => Promise<Ticket[]>; statePath?: string; env?: NodeJS.ProcessEnv; fetcher?: typeof fetch };
class PilotError extends Error { constructor(public status: number, message: string) { super(message); } }
const faultChoices = ['TEST-001', 'WIN-001', 'DNS-001'];
const agentFaultStates = ['Available', 'Applying', 'Active', 'VerificationPending', 'Resolved', 'Resetting', 'Reset', 'Failed'];
export function normalizeAgentFaults(value: unknown) {
  if (!Array.isArray(value)) throw new Error('Invalid agent catalogue');
  return value.map(fault => {
    if (!fault || typeof fault.id !== 'string') throw new Error('Invalid agent fault');
    const state = typeof fault.state === 'number' && Number.isInteger(fault.state) ? agentFaultStates[fault.state] : fault.state;
    if (typeof state !== 'string' || !agentFaultStates.includes(state)) throw new Error('Unknown agent fault state');
    return { ...fault, state };
  });
}

export function pilotConfig(env: NodeJS.ProcessEnv) {
  const enabledFaults = (env.LAB_PILOT_FAULTS || 'TEST-001').split(',').map(s => s.trim());
  if (enabledFaults.some(id => !faultChoices.includes(id))) throw new Error('Unsupported LAB_PILOT_FAULTS value');
  const base = env.LAB_AGENT_URL;
  if (base) {
    const url = new URL(base);
    const parts = url.hostname.split('.').map(Number);
    const privateIp = parts.length === 4 && parts.every(n => Number.isInteger(n) && n >= 0 && n <= 255) &&
      (parts[0] === 10 || parts[0] === 127 || (parts[0] === 192 && parts[1] === 168) || (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31));
    if (!privateIp || !['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
      throw new Error('LAB_AGENT_URL must be a private IPv4 HTTP(S) origin without credentials or a path');
    }
  }
  return { base, key: env.LAB_AGENT_KEY, agentId: env.LAB_AGENT_ID, machineName: env.LAB_MACHINE_NAME || 'Pilot Windows VM', enabledFaults };
}

// One API process and one VM. Persist intent before dispatch; never retry a mutation automatically.
export function createLabPilotRouter(deps: Dependencies) {
  const router = Router();
  const config = pilotConfig(deps.env || process.env);
  const filename = path.resolve(deps.statePath || process.env.LAB_PILOT_STATE_PATH || 'server/data/lab-pilot/state.json');
  const fetcher = deps.fetcher || fetch;
  let busy = false;
  const read = async (): Promise<LabRun[]> => {
    try { return JSON.parse(await fs.readFile(filename, 'utf8')); }
    catch (error) { if ((error as NodeJS.ErrnoException).code === 'ENOENT') return []; throw error; }
  };
  const write = async (runs: LabRun[]) => {
    await fs.mkdir(path.dirname(filename), { recursive: true });
    const temporary = `${filename}.tmp`;
    await fs.writeFile(temporary, JSON.stringify(runs, null, 2), { mode: 0o600 });
    for (let attempt = 0; ; attempt++) {
      try { await fs.rename(temporary, filename); break; }
      catch (error) {
        // Windows scanners can briefly lock the destination during atomic replacement.
        if (attempt >= 3 || !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code || '')) throw error;
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
      }
    }
  };
  const staff = (actor: Actor) => ['ADMIN', 'INSTRUCTOR'].includes(actor.role);
  const call = async (suffix: string, method = 'GET', correlationId: string = crypto.randomUUID()): Promise<any> => {
    if (!config.base || !config.key || config.key === 'development-only-key') throw new PilotError(503, 'Configure a private agent URL and a unique agent key on the API server.');
    try {
      const response = await fetcher(`${config.base.replace(/\/$/, '')}/api/v1/${suffix}`, {
        method, redirect: 'error', signal: AbortSignal.timeout(method === 'GET' ? 8000 : 150000),
        headers: { 'X-TechLabs-Agent-Key': config.key, 'X-Correlation-ID': correlationId },
      });
      if (!response.ok) throw new Error('Agent rejected operation');
      const body = await response.json();
      return suffix === 'faults' ? normalizeAgentFaults(body) : body;
    } catch { throw new PilotError(502, 'Agent unavailable or request rejected. Check the VM and private connection. Do not repeat an uncertain apply.'); }
  };
  const checkIdentity = async () => {
    const health = await call('health');
    if (!config.agentId || health.agentId !== config.agentId) throw new PilotError(409, 'Agent identity does not match LAB_AGENT_ID. Check the VM registration.');
    return health;
  };
  router.use((req: PilotRequest, res, next) => {
    if (!req.session || !['ADMIN', 'INSTRUCTOR', 'STUDENT'].includes(req.session.role)) return res.status(403).json({ error: 'Forbidden' });
    next();
  });
  router.get('/', async (req: PilotRequest, res, next) => {
    try {
      const actor = req.session!;
      const tickets = await deps.getTickets();
      const runs = await read();
      res.json({ configured: Boolean(config.base && config.key && config.key !== 'development-only-key' && config.agentId), machineName: config.machineName,
        enabledFaults: staff(actor) ? config.enabledFaults : [],
        runs: runs.filter(run => staff(actor) || (run.mode !== 'INSTRUCTOR_TEST' && run.studentId === actor.userId && tickets.some(t => t.id === run.ticketId && t.assignedStudentId === actor.userId))),
        ...(staff(actor) ? { setup: { addressConfigured: Boolean(config.base), keyConfigured: Boolean(config.key && config.key !== 'development-only-key'), identityConfigured: Boolean(config.agentId), localMachine: Boolean(config.base && new URL(config.base).hostname.startsWith('127.')) }, tickets: tickets.filter(t => t.assignedStudentId).map(t => ({ id: t.id, label: `${t.ticketNumber || t.id}: ${t.issueTitle || 'Incident'}`, studentId: t.assignedStudentId })) } : {}),
      });
    } catch (error) { next(error); }
  });
  router.get('/health', async (req: PilotRequest, res, next) => {
    try {
      if (!staff(req.session!)) throw new PilotError(403, 'Staff only');
      const health = await call('health');
      const faults = await call('faults');
      if (!Array.isArray(faults)) throw new PilotError(502, 'Invalid agent catalogue');
      res.json({ agentId: health.agentId, hostname: health.hostname, status: health.status, identityMatches: Boolean(config.agentId && config.agentId === health.agentId), faults: faults.filter(f => config.enabledFaults.includes(f.id)).map(f => ({ id: f.id, state: f.state })) });
    } catch (error) { next(error); }
  });
  router.post('/runs', async (req: PilotRequest, res, next) => {
    if (busy) return res.status(409).json({ error: 'A lab operation is already running.' });
    busy = true;
    try {
      if (!staff(req.session!)) throw new PilotError(403, 'Staff only');
      if (req.body?.mode !== undefined && !['INSTRUCTOR_TEST', 'STUDENT_ASSIGNMENT'].includes(req.body.mode)) throw new PilotError(400, 'Unknown exercise mode.');
      const instructorTest = req.body?.mode === 'INSTRUCTOR_TEST';
      if (instructorTest && req.body?.faultId !== 'TEST-001') throw new PilotError(400, 'Instructor test mode supports TEST-001 only.');
      if (!config.enabledFaults.includes(req.body?.faultId)) throw new PilotError(400, 'Fault is not enabled for this pilot.');
      await checkIdentity();
      const tickets = await deps.getTickets();
      const ticket = tickets.find(t => t.id === req.body?.ticketId && t.assignedStudentId);
      if (!instructorTest && !ticket) throw new PilotError(400, 'Choose a ticket assigned to a student.');
      const runs = await read();
      if (runs.some(run => run.state !== 'RESET')) throw new PilotError(409, 'Reset the current exercise before reserving this VM again.');
      const catalogue = await call('faults');
      if (!Array.isArray(catalogue) || !catalogue.some(f => f.id === req.body.faultId) || catalogue.some(f => !['Available', 'Reset'].includes(f.state))) throw new PilotError(409, 'The VM must have the selected package installed and all faults available or reset. Inspect the agent dashboard.');
      const run: LabRun = { id: crypto.randomUUID(), mode: instructorTest ? 'INSTRUCTOR_TEST' : 'STUDENT_ASSIGNMENT', ...(!instructorTest ? { ticketId: ticket!.id, studentId: ticket!.assignedStudentId! } : {}), faultId: req.body.faultId, agentId: config.agentId!, state: 'READY', createdAt: new Date().toISOString(), attempts: [] };
      runs.unshift(run); await write(runs); res.status(201).json(run);
    } catch (error) { next(error); } finally { busy = false; }
  });
  router.post('/runs/:id/:action', async (req: PilotRequest, res, next) => {
    if (busy) return res.status(409).json({ error: 'A lab operation is already running.' });
    busy = true;
    try {
      const actor = req.session!;
      const action = req.params.action as LabAttempt['action'];
      if (!['apply', 'verify', 'reset'].includes(action)) throw new PilotError(404, 'Unknown lab action');
      if (action !== 'verify' && !staff(actor)) throw new PilotError(403, 'Only staff can apply or reset faults.');
      const runs = await read(); const run = runs.find(r => r.id === req.params.id);
      const tickets = await deps.getTickets();
      if (!run || (!staff(actor) && (run.mode === 'INSTRUCTOR_TEST' || run.studentId !== actor.userId || !tickets.some(t => t.id === run.ticketId && t.assignedStudentId === actor.userId)))) throw new PilotError(404, 'Assigned lab not found');
      if (run.agentId !== config.agentId) throw new PilotError(409, 'This exercise belongs to a different agent. Restore the original configuration.');
      if (action === 'apply' && (run.state !== 'READY' || !config.enabledFaults.includes(run.faultId))) throw new PilotError(409, 'This exercise cannot be applied.');
      if (action === 'verify' && run.state !== 'ACTIVE') throw new PilotError(409, 'Only an active exercise can be verified.');
      if (action === 'reset' && run.state === 'RESET') throw new PilotError(409, 'This exercise is already reset.');
      const notes = req.body?.notes;
      if (action === 'verify' && !staff(actor) && (typeof notes !== 'string' || !notes.trim() || notes.length > 4000)) throw new PilotError(400, 'Enter your diagnosis and repair notes (up to 4,000 characters).');
      await checkIdentity();
      const attempt: LabAttempt = { id: crypto.randomUUID(), action, actorId: actor.userId, startedAt: new Date().toISOString(), outcome: 'PENDING', ...(action === 'verify' && typeof notes === 'string' ? { notes: notes.slice(0, 4000) } : {}) };
      const previousState = run.state;
      run.attempts.push(attempt); run.state = action === 'apply' ? 'APPLYING' : action === 'verify' ? 'VERIFYING' : 'RESETTING';
      await write(runs);
      try {
        // Recover interrupted operations only through staff reset and a live catalogue check.
        const faults = await call('faults');
        if (!Array.isArray(faults)) throw new Error('Invalid catalogue');
        const fault = faults.find(f => f.id === run.faultId);
        if (!fault) throw new Error('Missing package');
        let result: any;
        if (action === 'reset' && ['Available', 'Reset'].includes(fault.state)) result = { success: true };
        else {
          if (action === 'apply' && faults.some(f => !['Available', 'Reset'].includes(f.state))) throw new Error('VM is not clean');
          result = await call(`faults/${encodeURIComponent(run.faultId)}/${action}`, 'POST', attempt.id);
          if (result.faultId !== run.faultId || result.correlationId !== attempt.id) throw new Error('Invalid operation response');
        }
        const ok = action === 'verify' ? result.resolved : result.success;
        if (typeof ok !== 'boolean') throw new Error('Invalid operation result');
        if (action !== 'verify' && !ok) throw new Error('Operation failed; baseline needs inspection');
        attempt.outcome = ok ? 'SUCCESS' : 'NOT_RESOLVED';
        run.state = action === 'apply' ? 'ACTIVE' : action === 'reset' ? 'RESET' : ok ? 'VERIFIED' : 'ACTIVE';
        attempt.finishedAt = new Date().toISOString(); await write(runs); res.json(run);
      } catch {
        run.state = 'UNKNOWN'; attempt.outcome = 'UNKNOWN'; attempt.finishedAt = new Date().toISOString(); await write(runs);
        throw new PilotError(502, `Operation outcome is uncertain (previous state: ${previousState}). Staff must inspect the VM and use Reset to recover. Verification credit was not granted.`);
      }
    } catch (error) { next(error); } finally { busy = false; }
  });
  router.use((error: Error, _req: Request, res: import('express').Response, _next: import('express').NextFunction) => {
    res.status(error instanceof PilotError ? error.status : 500).json({ error: error instanceof PilotError ? error.message : 'Lab state could not be read or saved. Ask staff to inspect the controller.' });
  });
  return router;
}
