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
      delivery = await send({ to: recipient, subject, html: `<h2>New application received</h2><p><strong>Applicant:</strong> ${escapeHtml(application.firstName)} ${escapeHtml(application.lastName)}<br><strong>Reference:</strong> ${escapeHtml(application.referenceNumber)}<br><strong>Cohort:</strong> ${escapeHtml(cohortName)}<br><strong>Course tier:</strong> ${escapeHtml(application.selectedTier)}</p><p>Please review the application and hardware readiness on the site.</p><p><a href="${escapeHtml(link.href)}">Review application</a></p><p>Sign in with your staff account to view the application.</p>` });
    } catch {
      delivery = { sent: false, reason: 'Application notification could not be sent; check email and APP_ORIGIN configuration' };
    }
  }
  return { id: `email-${crypto.randomUUID()}`, providerId: delivery.id, recipient, subject, category: 'APPLICATION_SUBMITTED', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() };
}
