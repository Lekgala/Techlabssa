import crypto from 'node:crypto';
import type { EmailDeliveryRecord } from '../../src/types';
import { escapeHtml, sendEmail } from './email-service.ts';

type Submission = { id: string; referenceNumber: string; firstName: string; lastName: string; selectedTier: string };
type LeadSubmission = { id: string; name: string; email: string; whatsapp: string; courseInterest?: string; source?: string };

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

export async function notifyAdmissionsOfLead(lead: LeadSubmission, env = process.env, send = sendEmail): Promise<EmailDeliveryRecord> {
  const recipient = (env.APPLICATION_NOTIFICATION_EMAIL || env.ADMIN_EMAIL || '').trim();
  const subject = `New course guide request: ${lead.name}`;
  let delivery;
  if (!recipient || !env.APP_ORIGIN) {
    delivery = { sent: false, reason: 'Lead notifications require APPLICATION_NOTIFICATION_EMAIL (or ADMIN_EMAIL) and APP_ORIGIN' };
  } else {
    try {
      const link = new URL('/admin', env.APP_ORIGIN);
      delivery = await send({
        to: recipient,
        replyTo: lead.email,
        subject,
        html: `<h2>New course guide request</h2><p>A prospective student requested information before completing the full application.</p><p><strong>Name:</strong> ${escapeHtml(lead.name)}<br><strong>Email:</strong> <a href="mailto:${escapeHtml(lead.email)}">${escapeHtml(lead.email)}</a><br><strong>WhatsApp:</strong> ${escapeHtml(lead.whatsapp)}<br><strong>Interest:</strong> ${escapeHtml(lead.courseInterest || 'IT Support & Enterprise Administration Bootcamp')}<br><strong>Source:</strong> ${escapeHtml(lead.source || 'Website')}</p><p>You can reply directly to this email to respond to the student, or contact them on WhatsApp.</p><p><a href="${escapeHtml(link.href)}" style="display:inline-block;padding:12px 18px;background:#111827;color:#ffffff;text-decoration:none;border-radius:8px">Open admissions dashboard</a></p>`,
      });
    } catch {
      delivery = { sent: false, reason: 'Lead notification could not be sent; check email and APP_ORIGIN configuration' };
    }
  }
  return { id: `email-${crypto.randomUUID()}`, providerId: delivery.id, recipient, subject, category: 'LEAD_NOTIFICATION', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() };
}

export async function sendCourseGuideToLead(lead: LeadSubmission, env = process.env, send = sendEmail): Promise<EmailDeliveryRecord> {
  const recipient = lead.email.trim().toLowerCase();
  const subject = 'Your TechLabs IT Support Bootcamp course guide';
  let delivery;
  if (!recipient || !env.APP_ORIGIN) {
    delivery = { sent: false, reason: 'Course guide delivery requires a lead email and APP_ORIGIN' };
  } else {
    try {
      const origin = new URL(env.APP_ORIGIN);
      const courseUrl = new URL('/courses/it-support', origin).href;
      const curriculumUrl = new URL('/courses/it-support/curriculum', origin).href;
      const pricingUrl = new URL('/pricing', origin).href;
      const applyUrl = new URL('/apply', origin).href;
      const firstName = lead.name.trim().split(/\s+/)[0] || 'there';
      delivery = await send({
        to: recipient,
        replyTo: (env.APPLICATION_NOTIFICATION_EMAIL || env.ADMIN_EMAIL || env.EMAIL_REPLY_TO || '').trim() || undefined,
        subject,
        html: `<h2>Your practical IT training guide</h2><p>Hello ${escapeHtml(firstName)},</p><p>Thank you for your interest in the <strong>TechLabs IT Support &amp; Enterprise Administration Bootcamp</strong>. Here is a concise guide to help you decide whether the programme fits your goals.</p><h3>What you will learn</h3><ul><li>VMware Workstation and enterprise virtual lab setup</li><li>Windows Server 2022, Active Directory, Group Policy, DNS and DHCP</li><li>Microsoft 365, Entra ID, Intune and Defender administration</li><li>PowerShell automation, helpdesk ticket handling and troubleshooting</li><li>Practical assessments and a verifiable TechLabs completion certificate</li></ul><h3>Training format</h3><p>The Professional track runs over approximately 8 to 12 weeks with live evening instruction and weekend practical lab sessions. Current cohort dates and delivery options are published on the website.</p><h3>Laptop requirements</h3><p>You should have a 64-bit Windows laptop with at least 16 GB RAM, SSD storage with at least 100 GB free, and hardware virtualization support enabled. The full application checks these details before admission.</p><p><a href="${escapeHtml(courseUrl)}" style="display:inline-block;padding:12px 18px;background:#111111;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">View course details</a></p><p><a href="${escapeHtml(curriculumUrl)}">Review the full curriculum</a> &nbsp;·&nbsp; <a href="${escapeHtml(pricingUrl)}">Compare tuition options</a></p><h3>Ready to take the next step?</h3><p>The application helps Admissions confirm your learning goals, laptop readiness and preferred cohort.</p><p><a href="${escapeHtml(applyUrl)}" style="display:inline-block;padding:12px 18px;background:#111111;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:700">Start your application</a></p><p>Reply to this email if you would like help choosing a tier or checking your laptop specifications.</p><p>Regards,<br>TechLabs Academy SA</p>`,
      });
    } catch {
      delivery = { sent: false, reason: 'Course guide email could not be sent; check email and APP_ORIGIN configuration' };
    }
  }
  return { id: `email-${crypto.randomUUID()}`, providerId: delivery.id, recipient, subject, category: 'COURSE_GUIDE', status: delivery.sent ? 'SENT' : 'FAILED', reason: delivery.reason, createdAt: new Date().toISOString() };
}
