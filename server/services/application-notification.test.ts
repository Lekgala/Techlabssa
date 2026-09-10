import { test } from 'node:test';
import assert from 'node:assert/strict';
import { notifyAdmissions } from './application-notification.ts';

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
