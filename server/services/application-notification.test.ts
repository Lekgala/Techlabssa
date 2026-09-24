import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyAdmissions, notifyAdmissionsOfLead, sendCourseGuideToLead } from './application-notification.ts';

const application = { id: 'app-123', referenceNumber: 'TLS-2026-0001', firstName: '<script>', lastName: 'Applicant', selectedTier: 'STARTER' };
const env = { APP_ORIGIN: 'https://techlabssa.vercel.app', ADMIN_EMAIL: 'admin@example.test', APPLICATION_NOTIFICATION_EMAIL: 'admissions@example.test' };

test('staff alert uses configured inbox, escapes applicant data, and links to the application', async () => {
  const result = await notifyAdmissions(application, 'October & November', env, async input => {
    assert.equal(input.to, env.APPLICATION_NOTIFICATION_EMAIL);
    assert.match(input.subject, /TLS-2026-0001/);
    assert.match(input.html, /https:\/\/techlabssa.vercel.app\/admin\?application=app-123/);
    assert.match(input.html, /&lt;script&gt;/);
    assert.match(input.html, /October &amp; November/);
    assert.ok(!input.html.includes('<script>'));
    return { sent: true, id: 'provider-1' };
  });
  assert.equal(result.status, 'SENT');
  assert.equal(result.providerId, 'provider-1');
});

test('uses admin inbox as fallback and records provider rejection', async () => {
  const result = await notifyAdmissions(application, 'October', { APP_ORIGIN: env.APP_ORIGIN, ADMIN_EMAIL: env.ADMIN_EMAIL }, async input => {
    assert.equal(input.to, env.ADMIN_EMAIL);
    return { sent: false, reason: 'Provider unavailable' };
  });
  assert.equal(result.status, 'FAILED');
  assert.equal(result.reason, 'Provider unavailable');
});

test('missing configuration and thrown delivery errors produce failure records', async () => {
  const missing = await notifyAdmissions(application, 'October', {}, async () => { throw new Error('Must not send'); });
  assert.equal(missing.status, 'FAILED');
  assert.match(missing.reason!, /require/);
  const failure = await notifyAdmissions(application, 'October', env, async () => { throw new Error('Network failed'); });
  assert.equal(failure.status, 'FAILED');
});

test('course guide lead alert goes to admissions and replies to the student', async () => {
  const lead = { id: 'lead-123', name: '<b>Student</b>', email: 'student@example.test', whatsapp: '+27 82 123 4567', courseInterest: 'Professional course guide', source: 'Website' };
  const result = await notifyAdmissionsOfLead(lead, env, async input => {
    assert.equal(input.to, env.APPLICATION_NOTIFICATION_EMAIL);
    assert.equal(input.replyTo, lead.email);
    assert.match(input.subject, /Student/);
    assert.match(input.html, /https:\/\/techlabssa\.vercel\.app\/admin/);
    assert.match(input.html, /&lt;b&gt;Student&lt;\/b&gt;/);
    assert.ok(!input.html.includes('<b>Student</b>'));
    return { sent: true, id: 'provider-lead-1' };
  });
  assert.equal(result.category, 'LEAD_NOTIFICATION');
  assert.equal(result.status, 'SENT');
  assert.equal(result.providerId, 'provider-lead-1');
});

test('course guide is sent to the prospect with production-safe links and admissions reply-to', async () => {
  const lead = { id: 'lead-456', name: 'Lerato Student', email: 'LERATO@example.test', whatsapp: '+27 82 555 0101' };
  const result = await sendCourseGuideToLead(lead, env, async input => {
    assert.equal(input.to, 'lerato@example.test');
    assert.equal(input.replyTo, env.APPLICATION_NOTIFICATION_EMAIL);
    assert.match(input.subject, /course guide/i);
    assert.match(input.html, /https:\/\/techlabssa\.vercel\.app\/courses\/it-support/);
    assert.match(input.html, /https:\/\/techlabssa\.vercel\.app\/pricing/);
    assert.match(input.html, /https:\/\/techlabssa\.vercel\.app\/apply/);
    return { sent: true, id: 'provider-guide-1' };
  });
  assert.equal(result.category, 'COURSE_GUIDE');
  assert.equal(result.status, 'SENT');
  assert.equal(result.providerId, 'provider-guide-1');
});
