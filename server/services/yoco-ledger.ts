import type { TechlabsDatabase } from '../data/store';
import { matchYocoPayment } from './yoco.ts';

export type YocoIntent = {
  id: string; invoiceId: string; studentId: string; amountCents: number;
  mode: 'test' | 'live'; origin: string; createdAt: string;
  status: 'PENDING' | 'PAID' | 'TEST_PAID' | 'REVIEW';
  checkoutId?: string; redirectUrl?: string; paymentId?: string; eventId?: string;
};
export class YocoError extends Error { constructor(public status: number, message: string) { super(message); } }
export function ownedInvoice(db: TechlabsDatabase, invoiceId: string, studentId: string) {
  const student = db.applications.find(a => a.id === studentId);
  const invoice = db.invoices.find(i => i.id === invoiceId && i.studentEmail.toLowerCase() === student?.email.toLowerCase());
  if (!invoice || !student) throw new YocoError(404, 'Invoice not found');
  return { invoice, student };
}
export function amountDue(db: TechlabsDatabase, invoiceId: string, studentId: string) {
  const { invoice, student } = ownedInvoice(db, invoiceId, studentId);
  if (!['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(student.status)) throw new YocoError(409, 'Admissions approval is required before payment');
  if (db.payments.some(p => p.invoiceId === invoiceId && p.status === 'SUBMITTED')) throw new YocoError(409, 'An EFT payment is awaiting review');
  const balance = Math.round((invoice.amountZAR - (invoice.paidZAR ?? 0)) * 100);
  const installment = db.paymentInstallments.filter(p => p.invoiceId === invoiceId && p.status !== 'PAID').sort((a, b) => a.sequence - b.sequence)[0];
  const due = installment ? Math.min(balance, Math.round((installment.amountZAR - (installment.paidZAR ?? 0)) * 100))
    : !(invoice.paidZAR ?? 0) && invoice.paymentOption !== 'FULL' ? Math.min(100000, balance) : balance;
  if (!Number.isSafeInteger(due) || due <= 0) throw new YocoError(409, 'No payment is due');
  return due;
}

/** Runs within mutateDatabase: checkout status, payment, invoice and enrollment commit together. */
export function settleYoco(db: TechlabsDatabase, event: any) {
  if (event?.type !== 'payment.succeeded') return 'ignored';
  const intents = db.yocoCheckouts ?? [];
  const intent = intents.find(i => i.checkoutId === event.payload?.metadata?.checkoutId && i.checkoutId);
  if (!intent) throw new YocoError(409, 'Checkout not recorded yet'); // provider retries after checkout persistence
  const match = matchYocoPayment(event, { checkoutId: intent.checkoutId!, amountCents: intent.amountCents, mode: intent.mode });
  if (!match) return 'ignored';
  const seen = intents.find(i => i.paymentId === match.paymentId || i.eventId === match.eventId);
  if (seen) {
    if (seen.id !== intent.id || seen.paymentId !== match.paymentId) throw new YocoError(409, 'Payment identity conflict');
    return 'duplicate';
  }
  if (intent.status !== 'PENDING') throw new YocoError(409, 'Checkout already settled');
  intent.paymentId = match.paymentId; intent.eventId = match.eventId;
  const invoice = db.invoices.find(i => i.id === intent.invoiceId);
  const student = db.applications.find(a => a.id === intent.studentId);
  const cohort = db.cohorts.find(c => c.id === student?.cohortId);
  if (!invoice || !student || !cohort || ['REJECTED', 'WITHDRAWN', 'NEW', 'UNDER_REVIEW'].includes(student.status)
    || Math.round((invoice.amountZAR - (invoice.paidZAR ?? 0)) * 100) < intent.amountCents
    || db.payments.some(p => p.invoiceId === intent.invoiceId && p.status === 'SUBMITTED')) {
    intent.status = 'REVIEW';
    db.auditLogs.unshift({ id: `yoco-review-${intent.id}`, action: 'YOCO_REVIEW_REQUIRED', actorEmail: 'yoco-webhook', entityType: 'invoice', entityId: intent.invoiceId, summary: 'Yoco payment received; manual reconciliation required', createdAt: new Date().toISOString() });
    return 'review';
  }
  const now = new Date().toISOString();
  db.payments.unshift({ id: `yoco-${match.paymentId}`, provider: 'YOCO', mode: intent.mode, invoiceId: invoice.id, studentId: student.id,
    amountZAR: intent.amountCents / 100, type: !(invoice.paidZAR ?? 0) && invoice.paymentOption !== 'FULL' ? 'DEPOSIT' : 'BALANCE',
    status: 'VERIFIED', eftReference: match.paymentId, submittedAt: now, verifiedAt: now, verifiedBy: 'yoco-webhook' });
  invoice.paidZAR = (Math.round((invoice.paidZAR ?? 0) * 100) + intent.amountCents) / 100;
  invoice.balanceZAR = Math.round((invoice.amountZAR - invoice.paidZAR) * 100) / 100;
  invoice.paidAt = now.slice(0, 10); invoice.paymentMethod = 'Yoco';
  invoice.status = invoice.balanceZAR === 0 ? 'VERIFIED' : 'PARTIALLY_PAID';
  let remaining = invoice.paidZAR;
  for (const installment of db.paymentInstallments.filter(i => i.invoiceId === invoice.id).sort((a,b) => a.sequence - b.sequence)) {
    installment.paidZAR = Math.min(installment.amountZAR, Math.max(0, remaining)); remaining -= installment.paidZAR;
    installment.status = installment.paidZAR >= installment.amountZAR ? 'PAID' : installment.paidZAR > 0 ? 'PARTIALLY_PAID' : installment.dueDate < now.slice(0,10) ? 'OVERDUE' : 'PENDING';
    if (installment.status === 'PAID') installment.paidAt ||= now.slice(0,10);
  }
  const enrolled = db.applications.filter(a => a.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(a.status)).length;
  if (!['ENROLLED', 'COMPLETED'].includes(student.status) && invoice.paidZAR >= Math.min(1000, invoice.amountZAR)) student.status = enrolled < cohort.capacity ? 'ENROLLED' : 'WAITLISTED';
  cohort.enrolledCount = db.applications.filter(a => a.cohortId === cohort.id && ['ENROLLED', 'COMPLETED'].includes(a.status)).length;
  intent.status = intent.mode === 'test' ? 'TEST_PAID' : 'PAID';
  db.auditLogs.unshift({ id: `yoco-paid-${intent.id}`, action: intent.mode === 'test' ? 'YOCO_TEST_PAYMENT_VERIFIED' : 'YOCO_PAYMENT_VERIFIED', actorEmail: 'yoco-webhook', entityType: 'invoice', entityId: invoice.id, summary: `${intent.mode === 'test' ? 'Yoco test payment' : 'Yoco payment'} of R${intent.amountCents / 100} confirmed`, createdAt: now });
  return intent.mode === 'test' ? 'test' : 'paid';
}
