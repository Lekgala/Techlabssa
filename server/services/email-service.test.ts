import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatEmailHtml, sendEmail } from './email-service.ts';

test('transactional email fragments receive the branded layout and keep their action link', async () => {
  const previousFetch = globalThis.fetch;
  const previousKey = process.env.RESEND_API_KEY;
  const previousFrom = process.env.EMAIL_FROM;
  let payload: Record<string, unknown> | undefined;
  process.env.RESEND_API_KEY = 'test-key';
  process.env.EMAIL_FROM = 'TechLabs <test@example.invalid>';
  globalThis.fetch = async (_url, init) => {
    payload = JSON.parse(String(init?.body));
    return new Response(JSON.stringify({ id: 'email-test' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  };

  try {
    const result = await sendEmail({ to: 'student@example.invalid', subject: 'Set up your account', html: '<h2>Welcome</h2><p><a href="https://example.invalid/setup">Create password</a></p>' });
    assert.equal(result.sent, true);
    assert.match(String(payload?.html), /<html lang="en">/);
    assert.match(String(payload?.html), /techlabs<span[^>]*>\.<\/span>/);
    assert.match(String(payload?.html), /href="https:\/\/example\.invalid\/setup"/);
  } finally {
    globalThis.fetch = previousFetch;
    if (previousKey === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = previousKey;
    if (previousFrom === undefined) delete process.env.EMAIL_FROM; else process.env.EMAIL_FROM = previousFrom;
  }
});

test('complete admin-authored HTML documents keep their own layout', () => {
  const document = '<!doctype html><html><body><p>Custom message</p></body></html>';
  assert.equal(formatEmailHtml(document), document);
});
