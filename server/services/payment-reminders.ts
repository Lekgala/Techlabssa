import crypto from 'node:crypto';
import type { TechlabsDatabase } from '../data/store';
import type { PaymentReminderType } from '../../src/types';
import { escapeHtml, sendEmail } from './email-service.ts';

const DAY = 86_400_000;
const dateValue = (value: string) => new Date(`${value}T00:00:00Z`).getTime();

export async function runPaymentReminders(db: TechlabsDatabase, now = new Date()): Promise<{ sent: number; failed: number; skippedPaused: number }> {
  const today = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  let sent = 0; let failed = 0; let skippedPaused = 0;

  for (const application of db.applications) {
    if (!['APPROVED', 'PAYMENT_REQUIRED', 'ENROLLED'].includes(application.status)) continue;
    if (application.paymentRemindersPaused) { skippedPaused += 1; continue; }
    const invoice = db.invoices.find(item => item.studentEmail.toLowerCase() === application.email.toLowerCase());
    if (!invoice || invoice.balanceZAR <= 0) continue;
    if (db.payments.some(item => item.invoiceId === invoice.id && item.status === 'SUBMITTED')) continue;
    if (db.yocoCheckouts?.some(item => item.invoiceId === invoice.id && item.mode === 'live' && ['PENDING', 'REVIEW'].includes(item.status))) continue;

    const paid = invoice.paidZAR ?? 0;
    const due = dateValue(invoice.dueDate);
    const cohort = db.cohorts.find(item => item.id === application.cohortId);
    const weekFourReminderDate = cohort ? dateValue(cohort.startDate) + (18 * DAY) : Number.POSITIVE_INFINITY;
    let type: PaymentReminderType | undefined;
    let installmentId: string | undefined;
    let subject = '';
    let message = '';

    const installments = db.paymentInstallments.filter(item => item.invoiceId === invoice.id).sort((a, b) => a.sequence - b.sequence);
    let allocated = paid;
    for (const installment of installments) { installment.paidZAR = Math.min(installment.amountZAR, Math.max(0, allocated)); allocated -= installment.paidZAR; installment.status = installment.paidZAR >= installment.amountZAR ? 'PAID' : installment.paidZAR > 0 ? 'PARTIALLY_PAID' : dateValue(installment.dueDate) < today ? 'OVERDUE' : 'PENDING'; }
    const nextInstallment = installments.find(item => item.status !== 'PAID');
    if (nextInstallment && today > dateValue(nextInstallment.dueDate)) {
      type = 'INSTALLMENT_OVERDUE'; installmentId = nextInstallment.id; subject = `Installment overdue - ${invoice.invoiceNumber}`;
      message = `${nextInstallment.label} has R${(nextInstallment.amountZAR - nextInstallment.paidZAR).toLocaleString('en-ZA')} outstanding and was due on ${nextInstallment.dueDate}. Review your payment options in the student portal.`;
    } else if (nextInstallment && today >= dateValue(nextInstallment.dueDate) - (3 * DAY)) {
      type = 'INSTALLMENT_DUE_SOON'; installmentId = nextInstallment.id; subject = `Installment due soon - ${invoice.invoiceNumber}`;
      message = `${nextInstallment.label} of R${(nextInstallment.amountZAR - nextInstallment.paidZAR).toLocaleString('en-ZA')} is due on ${nextInstallment.dueDate}. Review your payment options in the student portal.`;
    } else if (paid === 0 && invoice.paymentOption !== 'FULL' && today > due) {
      type = 'DEPOSIT_OVERDUE'; subject = `Deposit overdue - ${invoice.invoiceNumber}`;
      message = `Your seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} was due on ${invoice.dueDate}. Please review your invoice and payment options in the student portal.`;
    } else if (paid === 0 && invoice.paymentOption !== 'FULL' && today >= due - (3 * DAY) && today <= due) {
      type = 'DEPOSIT_DUE_SOON'; subject = `Deposit due soon - ${invoice.invoiceNumber}`;
      message = `Your seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} is due on ${invoice.dueDate}. Please review your invoice and payment options in the student portal.`;
    } else if (paid > 0 && invoice.balanceZAR > 0 && today >= weekFourReminderDate) {
      type = 'BALANCE_BEFORE_WEEK_4'; subject = `Tuition balance reminder - ${invoice.invoiceNumber}`;
      message = `Your remaining tuition balance is R${invoice.balanceZAR.toLocaleString('en-ZA')}. Please review your payment schedule and settle the amount due through the student portal.`;
    }

    if (!type || db.paymentReminders.some(item => item.invoiceId === invoice.id && item.type === type && item.installmentId === installmentId)) continue;
    const portalUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/student/payments`;
    const delivery = await sendEmail({
      to: application.email,
      subject,
      html: `<h2>${escapeHtml(subject)}</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>${escapeHtml(message)}</p><p><a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:13px 20px;background:#111111;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">View payments</a></p><p>You can pay by card or EFT in the portal. Card payments are confirmed automatically; EFT requires a bank-generated proof of payment. Use <strong>${escapeHtml(invoice.invoiceNumber)}</strong> as your EFT reference.</p><p>If you have already paid, please check your portal status before trying again. Reply to this email if the amount or payment schedule looks incorrect.</p><p>Regards,<br>TechLabs Academy</p>`,
    });
    const createdAt = new Date().toISOString();
    db.emailDeliveries.unshift({ id: `email-${crypto.randomUUID()}`, providerId: delivery.id, recipient: application.email, subject, category: 'APPLICATION_STATUS', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt });
    if (delivery.sent) {
      db.paymentReminders.push({ id: `reminder-${crypto.randomUUID()}`, applicationId: application.id, invoiceId: invoice.id, type, installmentId, sentAt: createdAt, providerId: delivery.id });
      sent += 1;
    } else failed += 1;
  }
  return { sent, failed, skippedPaused };
}
