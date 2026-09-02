import crypto from 'node:crypto';
import type { TechlabsDatabase } from '../data/store';
import type { PaymentReminderType } from '../../src/types';
import { escapeHtml, sendEmail } from './email-service';

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
      message = `${nextInstallment.label} has R${(nextInstallment.amountZAR - nextInstallment.paidZAR).toLocaleString('en-ZA')} outstanding and was due on ${nextInstallment.dueDate}. Use ${invoice.invoiceNumber} as the EFT reference and upload your POP.`;
    } else if (nextInstallment && today >= dateValue(nextInstallment.dueDate) - (3 * DAY)) {
      type = 'INSTALLMENT_DUE_SOON'; installmentId = nextInstallment.id; subject = `Installment due soon - ${invoice.invoiceNumber}`;
      message = `${nextInstallment.label} of R${(nextInstallment.amountZAR - nextInstallment.paidZAR).toLocaleString('en-ZA')} is due on ${nextInstallment.dueDate}. Use ${invoice.invoiceNumber} as the EFT reference and upload your POP.`;
    } else if (paid === 0 && invoice.paymentOption !== 'FULL' && today > due) {
      type = 'DEPOSIT_OVERDUE'; subject = `Deposit overdue - ${invoice.invoiceNumber}`;
      message = `Your required seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} was due on ${invoice.dueDate}. Please pay using invoice reference ${invoice.invoiceNumber} and upload your bank-generated POP in the portal.`;
    } else if (paid === 0 && invoice.paymentOption !== 'FULL' && today >= due - (3 * DAY) && today <= due) {
      type = 'DEPOSIT_DUE_SOON'; subject = `Deposit due soon - ${invoice.invoiceNumber}`;
      message = `Your seat deposit of R${invoice.depositZAR.toLocaleString('en-ZA')} is due on ${invoice.dueDate}. Use ${invoice.invoiceNumber} as the EFT reference and upload your POP in the portal after paying.`;
    } else if (paid > 0 && invoice.balanceZAR > 0 && today >= weekFourReminderDate) {
      type = 'BALANCE_BEFORE_WEEK_4'; subject = `Tuition balance reminder - ${invoice.invoiceNumber}`;
      message = `Your remaining tuition balance is R${invoice.balanceZAR.toLocaleString('en-ZA')}. Please settle it before Week 4 using ${invoice.invoiceNumber} as the EFT reference, then upload your POP in the portal.`;
    }

    if (!type || db.paymentReminders.some(item => item.invoiceId === invoice.id && item.type === type && item.installmentId === installmentId)) continue;
    const portalUrl = `${process.env.APP_ORIGIN || 'http://localhost:3000'}/student`;
    const delivery = await sendEmail({
      to: application.email,
      subject,
      html: `<h2>${escapeHtml(subject)}</h2><p>Hello ${escapeHtml(application.firstName)},</p><p>${escapeHtml(message)}</p><h3>What to do now</h3><ol><li>Open <a href="${escapeHtml(portalUrl)}">your student portal</a> and review your invoice or installment schedule.</li><li>Pay using the invoice number as the EFT reference.</li><li>Upload one bank-generated proof of payment as a PDF, JPG, or PNG.</li></ol><p>If you have already uploaded a proof, do not upload it again while it is under review. Wait for the portal status or email update. Reply only if the payment plan or amount shown in the portal is incorrect.</p><p>Regards,<br>TechLabs Academy</p>`,
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
