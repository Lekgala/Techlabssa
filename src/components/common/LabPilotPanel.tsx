import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import type { LabPilotView, LabRun } from '../../types/labPilot';

export function LabPilotPanel({ staff = false }: { staff?: boolean }) {
  const [mode, setMode] = useState<'INSTRUCTOR_TEST' | 'STUDENT_ASSIGNMENT'>('INSTRUCTOR_TEST');
  const [view, setView] = useState<LabPilotView>();
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [connection, setConnection] = useState<{ hostname: string; agentId: string; identityMatches: boolean; faults: { id: string; state: string }[] }>();
  const [ticketId, setTicketId] = useState('');
  const [faultId, setFaultId] = useState('TEST-001');
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);
  const [studentId, setStudentId] = useState('');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [accountChanged, setAccountChanged] = useState(false);
  const refresh = async () => {
    const data = await apiRequest<LabPilotView>('/lab-pilot');
    if (staff && !data.setup) {
      setView(undefined); setConnection(undefined); setAccountChanged(true);
      throw new Error('This session does not have staff access. Reload and sign in with your administrator or instructor account.');
    }
    setAccountChanged(false); setView(data);
  };
  useEffect(() => { void refresh().catch(e => setError(e.message)); }, []);
  useEffect(() => { if (staff && mode === 'STUDENT_ASSIGNMENT') void apiRequest<{ id: string; name: string }[]>('/admin/lab-pilot-students').then(result => { setStudents(result); setStudentsLoaded(true); }).catch(e => setError(e.message)); }, [staff, mode]);
  useEffect(() => { if (view?.enabledFaults.length && !view.enabledFaults.includes(faultId)) setFaultId(view.enabledFaults[0]); }, [view?.enabledFaults, faultId]);
  const perform = async (work: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await work(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Lab request failed'); }
    finally { try { await refresh(); } catch { setError(current => current || 'Could not refresh lab status.'); } setBusy(false); }
  };
  const act = (run: LabRun, action: string) => void perform(async () => {
    const result = await apiRequest<LabRun>(`/lab-pilot/runs/${run.id}/${action}`, { method: 'POST', body: JSON.stringify({ notes: notes[run.id] || '' }) });
    setNotice(action === 'verify' ? result.state === 'VERIFIED' ? run.mode === 'INSTRUCTOR_TEST' ? 'Test passed. Reset the exercise to finish.' : 'Machine check passed. Your instructor will review your explanation separately.' : 'The fault is still present. Continue investigating and try again.' : action === 'reset' ? 'Exercise reset. The VM is available for the next assignment.' : run.mode === 'INSTRUCTOR_TEST' ? 'Marker created. Remove the marker file, then select Verify fix.' : 'Fault applied. The student can now investigate the VM.');
  });
  const button = 'min-h-10 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed';
  const field = 'min-w-0 w-full font-sans rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm';
  const reserved = view?.runs.some(r => r.state !== 'RESET');
  return <section className="font-sans space-y-5 rounded-xl border border-neutral-200 bg-white p-5">
    <div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-semibold">{staff ? 'Lab Machines' : 'Practical lab verification'}</h3><p className="mt-1 text-sm text-neutral-600">{staff ? 'Connect a machine, assign an exercise, then guide the student through repair and verification.' : 'Repair your assigned VM, document your work, then request a machine check.'}</p></div><button className={button} disabled={busy} onClick={() => void perform(async () => { setConnection(undefined); await refresh(); if (staff && mode === 'STUDENT_ASSIGNMENT') setStudents(await apiRequest<{ id: string; name: string }[]>('/admin/lab-pilot-students')); })}>Refresh</button></div>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{error}</p>}
    {accountChanged && <button className={button} onClick={() => window.location.reload()}>Reload sign-in</button>}
    {notice && <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">{notice}</p>}
    {!view && !error && <p role="status">Loading labs…</p>}
    {view && <>
      {staff && <div className="space-y-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Lab mode">{(['INSTRUCTOR_TEST', 'STUDENT_ASSIGNMENT'] as const).map(value => <button key={value} className={button + (mode === value ? ' bg-black text-white' : '')} aria-pressed={mode === value} disabled={busy} onClick={() => { setMode(value); setError(''); setNotice(''); }}>{value === 'INSTRUCTOR_TEST' ? 'Instructor test mode' : 'Student assignment mode'}</button>)}</div>
        <div className="space-y-4 rounded-xl border border-neutral-200 bg-neutral-50 p-5">
        <div className="flex flex-wrap justify-between gap-2"><h4 className="font-semibold">1. Connect the machine</h4><span className="rounded-full border bg-white px-3 py-1 text-xs">{!view.configured ? 'Setup incomplete' : connection?.identityMatches ? 'Connection checked' : 'Connection needs checking'}</span></div>
        <p className="text-sm text-neutral-600">{view.machineName} · {view.setup?.localMachine ? 'Testing on this computer' : 'Lab machine'}</p>
        <div className="grid gap-2 sm:grid-cols-3">{([['Machine address', view.setup?.addressConfigured], ['Agent key', view.setup?.keyConfigured], ['Machine identity', view.setup?.identityConfigured]] as const).map(([label, ready]) => <div key={label} className="rounded-lg bg-white p-3 text-sm"><span className="block font-medium">{label}</span><span className={ready ? 'text-green-700' : 'text-amber-800'}>{view.setup ? ready ? 'Configured' : 'Missing' : 'Restart API to load status'}</span></div>)}</div>
        {!view.configured && <p className="text-sm text-neutral-600">{view.setup?.addressConfigured && !view.setup.keyConfigured ? 'The machine address is saved. Add the agent key before checking the connection.' : 'Complete the missing settings before reserving the machine.'}</p>}
        <details className="text-sm"><summary className="cursor-pointer font-semibold">How to complete connection setup</summary><div className="mt-3 space-y-2 text-neutral-600"><p>On the Academy API computer, set LAB_AGENT_URL, LAB_AGENT_KEY and LAB_AGENT_ID in .env. For testing on this computer, use http://127.0.0.1:8765 as the address.</p><p>Use the unique key configured in the agent. Keep the key on the server. Restart the Academy API after saving, then select Refresh here. Refresh alone does not reload .env.</p><p>With the address and key configured, Check connection shows the agent ID. Confirm it belongs to the intended machine, save it as LAB_AGENT_ID, and restart the API.</p></div></details>
        <button className={button} disabled={busy || !view.setup?.addressConfigured || !view.setup?.keyConfigured} onClick={() => void perform(async () => {
          setConnection(undefined);
          const health = await apiRequest<{ agentId: string; hostname: string; identityMatches: boolean; faults: { id: string; state: string }[] }>('/lab-pilot/health');
          setConnection(health);
        })}>{busy ? 'Working…' : 'Check connection'}</button>
        {connection && <div role="status" className={`rounded-lg p-3 text-sm ${connection.identityMatches ? 'bg-green-50 text-green-900' : 'bg-amber-50 text-amber-900'}`}><p className="font-semibold">{connection.hostname} · {connection.identityMatches ? 'Identity confirmed' : 'Identity needs confirmation'}</p><p className="break-all">Agent ID: {connection.agentId}</p><p>{connection.faults.map(f => `${f.id}: ${f.state}`).join(' · ') || 'No enabled packages installed'}</p></div>}
        </div>
        {mode === 'INSTRUCTOR_TEST' ? <div className="space-y-3 rounded-xl border border-neutral-200 p-5">
          <h4 className="font-semibold">2. Test the marker-file exercise</h4>
          <p className="text-sm text-neutral-600">No student or ticket needed. Start a test, apply TEST-001, remove the marker file, then verify and reset.</p>
          <button className={button + ' bg-black text-white'} disabled={busy || reserved || !view.configured || !connection?.identityMatches || !view.enabledFaults.includes('TEST-001') || !connection?.faults.some(f => f.id === 'TEST-001')} onClick={() => void perform(async () => {
            await apiRequest('/lab-pilot/runs', { method: 'POST', body: JSON.stringify({ mode: 'INSTRUCTOR_TEST', faultId: 'TEST-001' }) }); setNotice('Test ready below. Select Apply TEST-001 to create the marker file.');
          })}>Start TEST-001 test</button>
          <p className="text-sm text-neutral-600">{reserved ? 'Finish and reset the current exercise before starting another test. It remains visible below in either mode.' : !view.configured || !connection?.identityMatches ? 'Complete setup and check the connection above to enable testing.' : !view.enabledFaults.includes('TEST-001') || !connection.faults.some(f => f.id === 'TEST-001') ? 'TEST-001 must be enabled and installed on the agent.' : 'Ready. Starting a test holds the machine; applying the fault is a separate action.'}</p>
        </div> : <>
        <div className="space-y-4 rounded-xl border border-neutral-200 p-5">
        <h4 className="font-semibold">2. Prepare the student assignment</h4><p className="text-sm text-neutral-600">A ticket describes the problem the student will investigate. You can prepare a ticket while connection setup is in progress.</p>
        <label className="block space-y-1 text-sm font-medium">Exercise<select className={field} disabled={busy} value={faultId} onChange={e => { setFaultId(e.target.value); setTicketId(''); }}>{view.enabledFaults.map(id => <option key={id} value={id}>{id === 'TEST-001' ? 'TEST-001 · Marker file practice' : id === 'WIN-001' ? 'WIN-001 · Print Spooler' : 'DNS-001 · DNS configuration'}</option>)}</select></label>
        <p className="rounded-lg bg-neutral-50 p-3 text-sm text-neutral-600">{faultId === 'TEST-001' ? 'Local practice: creates a marker file in the agent sandbox. The student removes the file and submits repair notes. Verification checks that the file is gone.' : 'This exercise changes Windows settings. Use a disposable lab VM with a known baseline.'}</p>
        <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]"><label className="space-y-1 text-sm font-medium">Enrolled student<select className={field} disabled={busy} value={studentId} onChange={e => { setStudentId(e.target.value); setTicketId(''); }}><option value="">Choose student</option>{students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label><button className={button} disabled={busy || !studentId || Boolean(ticketId)} onClick={() => void perform(async () => {
          const ticket = await apiRequest<{ id: string }>('/admin/lab-pilot-tickets', { method: 'POST', body: JSON.stringify({ studentId, faultId }) }); setTicketId(ticket.id); setNotice('Ticket created and selected. Continue to step 3 to reserve the machine.');
        })}>{ticketId ? 'Ticket selected' : 'Create assignment ticket'}</button></div>
        <p className="text-sm text-neutral-600">{!studentsLoaded && !students.length ? 'Loading students. If the list does not appear, select Refresh to try again.' : !students.length ? 'No enrolled students loaded. Complete enrollment in Admissions, then refresh this screen.' : !studentId ? 'Select a student to enable ticket creation.' : 'The ticket appears in this student’s Support tab.'}</p>
        <details className="text-sm"><summary className="cursor-pointer font-semibold">Use an existing assigned ticket instead</summary><label className="mt-3 block space-y-1">Assigned ticket<select className={field} disabled={busy} value={ticketId} onChange={e => setTicketId(e.target.value)}><option value="">Choose a student ticket</option>{view.tickets?.map(t => <option key={t.id} value={t.id}>{t.label} · {students.find(s => s.id === t.studentId)?.name || 'Assigned student'}</option>)}</select></label><p className="mt-2 text-xs text-neutral-600">Choose a ticket whose scenario matches the selected exercise.</p></details>
        </div>
        <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-5"><h4 className="font-semibold">3. Reserve and start</h4><p className="text-sm text-neutral-600">Reservation holds the machine for this assignment. It does not apply a fault. After reserving, review the exercise below and select Apply fault.</p>
        {ticketId && <p className="break-words text-sm font-medium">Selected: {view.tickets?.find(t => t.id === ticketId)?.label || 'New student ticket'} · {faultId}</p>}
        <button className={`${button} bg-black text-white`} disabled={busy || !view.configured || !connection?.identityMatches || reserved || !ticketId || !connection.faults.some(f => f.id === faultId)} onClick={() => void perform(async () => {
          await apiRequest('/lab-pilot/runs', { method: 'POST', body: JSON.stringify({ ticketId, faultId }) }); setNotice('Machine reserved. Review the exercise below, then apply the fault.');
        })}>Reserve machine</button>
        <p className="text-sm text-neutral-600">{reserved ? 'Reset or release the current exercise before making another reservation.' : !view.configured ? 'Complete connection setup in step 1 to continue.' : !connection?.identityMatches ? 'Check and confirm the connection in step 1 to continue.' : !connection.faults.some(f => f.id === faultId) ? 'The selected exercise is not installed on the agent.' : !ticketId ? 'Create or select a ticket in step 2 to continue.' : 'Ready to reserve. The server will check for outstanding faults.'}</p></div></>}
      </div>}
      {!view.runs.length && <p className="text-sm text-neutral-600">{staff ? 'No lab exercises have been assigned.' : 'Your instructor has not assigned you a practical VM exercise yet.'}</p>}
      {view.runs.map(run => <article key={run.id} className="space-y-3 rounded-lg border border-neutral-200 p-4">
        <div className="flex flex-wrap justify-between gap-2"><strong className="text-sm">{run.mode === 'INSTRUCTOR_TEST' ? 'Instructor test ? TEST-001' : view.tickets?.find(t => t.id === run.ticketId)?.label || `Ticket ${run.ticketId}`}</strong><span className="text-xs font-mono">{run.state === 'VERIFIED' ? 'MACHINE CHECK PASSED' : run.state}</span></div>
        <p className="text-xs text-neutral-600">{view.machineName} · {staff ? `${run.faultId} · Student ${run.studentId} · ` : ''}{new Date(run.createdAt).toLocaleString()}</p>
        {['UNKNOWN', 'APPLYING', 'VERIFYING', 'RESETTING'].includes(run.state) && <p className="text-sm text-amber-800">{busy ? 'Operation in progress. This can take up to 150 seconds.' : staff ? 'If no request is still running, inspect the VM and use Reset to reconcile this exercise. Do not reapply the fault.' : 'Waiting for your instructor to check the VM. Refresh for updates.'}</p>}
        {run.state === 'READY' && <p className="text-sm text-neutral-600">Waiting for the instructor to apply the fault.</p>}
        {run.mode === 'INSTRUCTOR_TEST' && run.state === 'ACTIVE' && <p className="rounded-lg bg-neutral-50 p-3 text-sm break-words">On the agent computer, remove only <code>C:\ProgramData\TechLabs\LabAgent\Sandbox\broken.txt</code>, then select Verify fix. Reset cleans up the exercise without awarding verification credit.</p>}
        {run.state === 'ACTIVE' && run.mode !== 'INSTRUCTOR_TEST' && <label className="block space-y-1 text-sm">Diagnosis and repair notes<textarea className={field} maxLength={4000} rows={3} value={notes[run.id] || ''} onChange={e => setNotes(current => ({ ...current, [run.id]: e.target.value }))} placeholder="What was wrong, how did you diagnose it, and what did you change?" /></label>}
        <div className="flex flex-wrap gap-2">
          {staff && run.state === 'READY' && <button className={button} disabled={busy} onClick={() => act(run, 'apply')}>{run.mode === 'INSTRUCTOR_TEST' ? 'Apply TEST-001' : 'Apply fault to VM'}</button>}
          {run.state === 'ACTIVE' && <button className={`${button} bg-black text-white`} disabled={busy || (!staff && !notes[run.id]?.trim())} onClick={() => act(run, 'verify')}>Verify fix</button>}
          {staff && run.state !== 'RESET' && <button className={button} disabled={busy} onClick={() => act(run, 'reset')}>{run.state === 'READY' ? 'Release reservation' : 'Reset exercise'}</button>}
        </div>
        {run.attempts.length > 0 && <details><summary className="cursor-pointer text-xs">Attempt history ({run.attempts.length})</summary><ol className="mt-2 space-y-2 text-xs">{run.attempts.map(a => <li key={a.id} className="rounded bg-neutral-50 p-2"><p>{a.action} · {a.outcome} · {new Date(a.startedAt).toLocaleString()}</p>{a.notes && <p className="mt-1 whitespace-pre-wrap break-words">{a.notes}</p>}</li>)}</ol></details>}
      </article>)}
    </>}
  </section>;
}
