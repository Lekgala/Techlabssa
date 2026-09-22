import crypto from 'node:crypto';
import type { EmailDeliveryRecord } from '../../src/types';
import { escapeHtml, sendEmail } from './email-service.ts';

type Submission = { id: string; referenceNumber: string; firstName: string; lastName: string; selectedTier: string };

export async function notifyAdmissions(application: Submission, cohortName: string, env = process.env, send = sendEmail): Promise<EmailDeliveryRecord> {
  const recipient = (env.APPLICATION_NOTIFICATION_EMAIL || env.ADMIN_EMAIL || '').trim();
  const subject = `New application to review: ${application.referenceNumber}`;
  let delivery;
  if (!recipient || !env.APP_ORIGIN) {
    delivery = { sent: false, reason: 'Application notifications require APPLICATION_NOTIFICATION_EMAIL (or ADMIN_EMAIL) and APP_ORIGIN' };
  } else {
    try {
      const link = new URL('/admin', env.APP_ORIGIN);
      link.searchParams.set('application', application.id);
      delivery = await send({ to: recipient, subject, html: `<h2>New application to review</h2><p>A new application is ready for admissions review.</p><p><strong>Applicant:</strong> ${escapeHtml(application.firstName)} ${escapeHtml(application.lastName)}<br><strong>Reference:</strong> ${escapeHtml(application.referenceNumber)}<br><strong>Cohort:</strong> ${escapeHtml(cohortName)}<br><strong>Course tier:</strong> ${escapeHtml(application.selectedTier)}</p><p>Review the application and confirm the applicant's hardware readiness in the admin console.</p><p><a href="${escapeHtml(link.href)}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">Review application</a></p><p>Sign in with your staff account to open the record.</p>` });
    } catch {
      delivery = { sent: false, reason: 'Application notification could not be sent; check email and APP_ORIGIN configuration' };
    }
  }
  return { id: `email-${crypto.randomUUID()}`, providerId: delivery.id, recipient, subject, category: 'APPLICATION_SUBMITTED', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() };
}
