import React, { useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';

type Entry = { id: string; invoiceId?: string; paymentId?: string; status: string; mode: string; amountCents: number; createdAt: string };
type Status = { enabled: boolean; mode?: string; reason: string; amountCents: number; history: Entry[] };
export function YocoPayments({ invoiceId, admin = false }: { invoiceId?: string; admin?: boolean }) {
  const [status, setStatus] = useState<Status>();
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [repeatTest, setRepeatTest] = useState(false);
  const latestPayment = status?.history
    .filter(entry => !status.mode || entry.mode === status.mode)
    .reduce<Entry | undefined>((latest, entry) => !latest || entry.createdAt > latest.createdAt ? entry : latest, undefined);
  const testConfirmed = latestPayment?.status === 'TEST_PAID';
  const path = `/student/invoices/${encodeURIComponent(invoiceId || '')}/yoco`;
  const refresh = async () => {
    try {
      setError('');
      if (admin) {
        const result = await apiRequest<{ checkouts: Entry[] }>('/admin/yoco/payments');
        setStatus({ enabled: false, reason: '', amountCents: 0, history: result.checkouts });
      } else setStatus(await apiRequest<Status>(path));
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not load card payments'); }
  };
  useEffect(() => { setStatus(undefined); setRepeatTest(false); void refresh(); }, [invoiceId, admin]);
  const pay = async () => {
    setBusy(true); setError('');
    try {
      const result = await apiRequest<{ redirectUrl: string }>(path, { method: 'POST' });
      const url = new URL(result.redirectUrl);
      if (url.protocol !== 'https:' || !(url.hostname === 'yoco.com' || url.hostname.endsWith('.yoco.com'))) throw new Error('Invalid payment link');
      window.location.assign(url.href);
    } catch (error) { setError(error instanceof Error ? error.message : 'Could not start checkout'); setBusy(false); }
  };
  return <section className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
    <div className="flex justify-between items-center gap-4"><h4 className="font-bold">{admin ? 'Yoco payment activity' : 'Pay with Yoco'}</h4><button type="button" className="underline text-sm" onClick={() => void refresh()}>Refresh payments</button></div>
    {error && <p role="alert" className="text-red-700 text-sm">{error}</p>}
    {!admin && status && <>
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
      <button type="button" disabled={busy || !status.enabled || status.amountCents <= 0 || status.history.some(i => i.status === 'REVIEW')}
        onClick={() => void pay()} className="rounded-lg bg-black px-4 py-3 font-bold text-white disabled:opacity-40">
        {busy ? 'Opening checkout…' : `${status.mode === 'test' ? 'Test payment' : 'Pay'} R${(status.amountCents / 100).toLocaleString('en-ZA', { minimumFractionDigits: 2 })}`}
      </button>}
      <p className="text-xs text-neutral-600">Payment is confirmed only after Yoco notifies the server. Returning from checkout does not confirm payment. Refresh the page after confirmation to update your invoice.</p>
      </>}
    </>}
    {status?.history.length ? <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead><tr>{['Date', ...(admin ? ['Invoice'] : []), 'Amount', 'Mode', 'Status'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{status.history.map(entry => <tr key={entry.id} className="border-t"><td className="p-2">{new Date(entry.createdAt).toLocaleString('en-ZA')}</td>{admin && <td className="p-2">{entry.invoiceId}<small className="block">{entry.paymentId || entry.id}</small></td>}<td className="p-2">R{(entry.amountCents / 100).toLocaleString('en-ZA')}</td><td className="p-2">{entry.mode}</td><td className="p-2">{({ PENDING: 'Awaiting confirmation', TEST_PAID: 'Test confirmed', PAID: 'Paid', REVIEW: 'Contact admissions: reconciliation required' } as Record<string,string>)[entry.status] || entry.status}</td></tr>)}</tbody></table></div> : status && <p className="text-sm text-neutral-600">No card payments yet.</p>}
  </section>;
}
