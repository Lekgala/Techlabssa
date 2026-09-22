import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

type Entry = { id: string; invoiceId?: string; paymentId?: string; status: string; mode: string; amountCents: number; createdAt: string };
type Status = { hidden?: boolean; enabled: boolean; mode?: string; reason: string; amountCents: number; history: Entry[] };
export function YocoPayments({ invoiceId, admin = false, onPendingChange, onAvailabilityChange }: { invoiceId?: string; admin?: boolean; onPendingChange?: (pending: boolean) => void; onAvailabilityChange?: (available: boolean | undefined) => void }) {
  return <YocoPaymentPanel invoiceId={invoiceId} admin={admin} onPendingChange={onPendingChange} onAvailabilityChange={onAvailabilityChange} />;
}
function YocoPaymentPanel({ invoiceId, admin = false, onPendingChange, onAvailabilityChange }: { invoiceId?: string; admin?: boolean; onPendingChange?: (pending: boolean) => void; onAvailabilityChange?: (available: boolean | undefined) => void }) {
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [repeatTest, setRepeatTest] = useState(false);
  const latestPayment = status?.history
    .filter(entry => !status.mode || entry.mode === status.mode)
    .reduce<Entry | undefined>((latest, entry) => !latest || entry.createdAt > latest.createdAt ? entry : latest, undefined);
  const testConfirmed = latestPayment?.status === 'TEST_PAID';
  const latestLive = status?.history.filter(entry => entry.mode === 'live')
    .reduce<Entry | undefined>((latest, entry) => !latest || entry.createdAt > latest.createdAt ? entry : latest, undefined);
  useEffect(() => { if (status && !admin) onPendingChange?.(status.mode === 'live' && ['PENDING', 'REVIEW'].includes(latestLive?.status || '')); }, [status, latestLive?.status, admin, onPendingChange]);
  const path = `/student/invoices/${encodeURIComponent(invoiceId || '')}/yoco`;
  const refresh = async (reloadConfirmed = false) => {
    try {
      setError('');
      if (admin) {
        const result = await apiRequest<{ hidden?: boolean; checkouts: Entry[] }>('/admin/yoco/payments');
        setStatus({ hidden: result.hidden, enabled: false, reason: '', amountCents: 0, history: result.checkouts });
      } else {
        const result = await apiRequest<Status>(path);
        setStatus(result);
        onAvailabilityChange?.(!result.hidden && result.enabled);
        if (reloadConfirmed && result.history.some(entry => entry.mode === 'live' && entry.status === 'PAID')) window.location.reload();
      }
    } catch (error) { onAvailabilityChange?.(false); setError(error instanceof Error ? error.message : 'Could not load card payments'); }
  };
  useEffect(() => { setStatus(undefined); setRepeatTest(false); onAvailabilityChange?.(undefined); void refresh(); }, [invoiceId, admin]);
  const pay = async () => {
    setBusy(true); setError('');
    try {
      const result = await apiRequest<{ redirectUrl: string }>(path, { method: 'POST' });
      const url = new URL(result.redirectUrl);
      if (url.protocol !== 'https:' || !(url.hostname === 'yoco.com' || url.hostname.endsWith('.yoco.com'))) throw new Error('Invalid payment link');
      window.location.assign(url.href);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not start checkout'); setBusy(false); }
  };
  if (status?.hidden || (!status && !error)) return null;
  return <section className="rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 space-y-4 font-sans">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div><span className="text-[11px] font-bold uppercase tracking-[0.16em] text-neutral-500">{admin ? 'Card activity' : 'Pay online'}</span><h4 className="mt-1 text-lg font-semibold text-neutral-950">{admin ? 'Yoco payment activity' : 'Pay securely by card'}</h4>{!admin && <p className="mt-1 text-sm text-neutral-600">Pay through Yoco. Your invoice updates after Yoco confirms the payment.</p>}</div>
      <button type="button" className="self-start rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-800 hover:bg-neutral-50" onClick={() => void refresh(true)}>Check payment status</button>
    </div>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    {!admin && status && <>
      {status.mode === 'live' && latestLive?.status === 'PENDING' && <div role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong className="block font-semibold">Card payment not confirmed yet</strong><p className="mt-1">Left before paying? Select <strong>Return to checkout</strong> to reopen the same payment link. If you completed payment, select <strong>Check payment status</strong> instead. If the link no longer works or the status stays pending, contact admissions with your invoice number.</p></div>}
      {status.mode === 'live' && latestLive?.status === 'REVIEW' && <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"><strong className="block font-semibold">Payment needs review</strong><p className="mt-1">Please contact admissions before making another payment.</p></div>}
      {status.mode === 'live' && latestLive?.status === 'PAID' && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong className="block font-semibold">Card payment confirmed</strong><p className="mt-1">Your payment is recorded. Your updated invoice and receipt are available in your portal.</p></div>}
      {testConfirmed && <div role="status" className="rounded-lg border border-green-200 bg-green-50 p-4 text-green-900 space-y-1">
        <p className="font-bold">Test payment successful</p>
        <p className="text-sm">Yoco confirmed your R{(latestPayment.amountCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })} test payment. No further payment is needed for this test.</p>
        <p className="text-sm">Your test payment has been applied to the tuition balance and enrollment has been updated for this test environment.</p>
      </div>}
      {testConfirmed && !repeatTest && status.enabled && status.mode === 'test' && status.amountCents > 0 && <button type="button" className="underline text-sm text-neutral-600" onClick={() => setRepeatTest(true)}>Run another test</button>}
      {(!testConfirmed || repeatTest) && <>
      {status.mode === 'test' && <p className="text-amber-800 text-sm">Test checkout: use Yoco test card details. The test payment updates the tuition balance and business income in this test environment.</p>}
      {status.reason && <p className="text-sm text-neutral-600">{status.reason}</p>}
      {status.enabled && status.amountCents > 0 &&
      <button type="button" disabled={busy || status.history.some(i => i.status === 'REVIEW')}
        onClick={() => void pay()} className="w-full rounded-xl bg-black px-5 py-3.5 text-sm font-bold text-white hover:bg-neutral-800 disabled:opacity-40 sm:w-auto">
        {busy ? 'Opening checkout…' : latestLive?.status === 'PENDING' ? 'Return to checkout' : `${status.mode === 'test' ? 'Test payment' : 'Pay by card'} · R${(status.amountCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
      </button>}
      <p className="text-xs text-neutral-500">Card payments are confirmed automatically. No proof of payment is needed.</p>
      </>}
    </>}
    {admin && (status?.history.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Date', 'Invoice', 'Amount', 'Mode', 'Status'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{status.history.map(entry => <tr key={entry.id} className="border-t"><td className="p-2">{new Date(entry.createdAt).toLocaleString('en-ZA')}</td><td className="p-2">{entry.invoiceId}<small className="block">{entry.paymentId || entry.id}</small></td><td className="p-2">R{(entry.amountCents / 100).toLocaleString('en-ZA')}</td><td className="p-2">{entry.mode}</td><td className="p-2">{({ PENDING: 'Awaiting confirmation', TEST_PAID: 'Test confirmed', PAID: 'Paid', REVIEW: 'Reconciliation required' } as Record<string,string>)[entry.status] || entry.status}</td></tr>)}</tbody></table></div> : status && <p className="text-sm text-neutral-600">No card payments yet.</p>)}
  </section>;
}
