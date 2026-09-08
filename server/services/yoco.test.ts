import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { yocoConfig, createYocoCheckout, verifyYocoSignature, matchYocoPayment } from './yoco';

const secret = `whsec_${Buffer.from('unit-test-signing-secret').toString('base64')}`;
const env = { YOCO_ENABLED: 'true', YOCO_MODE: 'test', YOCO_SECRET_KEY: 'sk_test_example', YOCO_WEBHOOK_SECRET: secret, APP_ORIGIN: 'http://localhost:3001' };
test('disabled by default; rejects wrong mode credentials and insecure live origin', () => {
  assert.equal(yocoConfig({}), null);
  assert.throws(() => yocoConfig({ ...env, YOCO_MODE: 'live' }));
  assert.throws(() => yocoConfig({ ...env, YOCO_MODE: 'live', YOCO_SECRET_KEY: 'sk_live_example' }));
  assert.equal(yocoConfig(env)?.mode, 'test');
});
test('checkout sends cents, invoice metadata and stable idempotency key', async () => {
  let calls = 0;
  const request = (async (url, options) => {
    calls++;
    assert.equal(url, 'https://payments.yoco.com/api/checkouts');
    assert.equal((options.headers as any)['Idempotency-Key'], 'intent-1');
    const body = JSON.parse(options.body as string);
    assert.equal(body.amount, 100000);
    assert.equal(body.metadata.invoiceId, 'invoice-1');
    return Response.json({ id: 'checkout-1', amount: 100000, currency: 'ZAR', processingMode: 'test', redirectUrl: 'https://c.yoco.com/checkout/1' });
  }) as typeof fetch;
  const intent = { id: 'intent-1', invoiceId: 'invoice-1', amountCents: 100000 };
  await createYocoCheckout(yocoConfig(env)!, intent, request);
  await createYocoCheckout(yocoConfig(env)!, intent, request);
  assert.equal(calls, 2);
  await assert.rejects(createYocoCheckout(yocoConfig(env)!, { ...intent, amountCents: 1.5 }, request));
});
test('checkout rejects unexpected redirects and suppresses provider error details', async () => {
  const intent = { id: 'i', invoiceId: 'inv', amountCents: 100 };
  await assert.rejects(createYocoCheckout(yocoConfig(env)!, intent, (async () => Response.json({ id: 'c', amount: 100, currency: 'ZAR', processingMode: 'test', redirectUrl: 'https://yoco.com.evil.example' })) as typeof fetch));
  await assert.rejects(createYocoCheckout(yocoConfig(env)!, intent, (async () => new Response('sensitive provider detail', { status: 403 })) as typeof fetch), /^Error: Yoco checkout request failed \(403\)$/);
});
test('signature verifies exact raw bytes; rejects tampering, stale/future timestamps and malformed signatures', () => {
  const raw = Buffer.from('{ "type": "payment.succeeded" }');
  const now = 1800000000000;
  const timestamp = String(now / 1000);
  const signature = createHmac('sha256', Buffer.from(secret.slice(6), 'base64')).update(`evt.${timestamp}.`).update(raw).digest('base64');
  const headers = { 'webhook-id': 'evt', 'webhook-timestamp': timestamp, 'webhook-signature': `v1,bad v1,${signature}` };
  assert.equal(verifyYocoSignature(raw, headers, secret, now), true);
  assert.equal(verifyYocoSignature(Buffer.from('{}'), headers, secret, now), false);
  assert.equal(verifyYocoSignature(raw, headers, secret, now + 181000), false);
  assert.equal(verifyYocoSignature(raw, headers, secret, now - 181000), false);
  assert.equal(verifyYocoSignature(raw, { ...headers, 'webhook-signature': 'garbage' }, secret, now), false);
});
test('payment matching rejects wrong checkout, amount, currency or mode', () => {
  const expected = { checkoutId: 'checkout-1', amountCents: 100000, mode: 'test' as const };
  const event = { id: 'event-1', type: 'payment.succeeded', payload: { id: 'payment-1', type: 'payment', status: 'succeeded', amount: 100000, currency: 'ZAR', mode: 'test', metadata: { checkoutId: 'checkout-1' } } };
  assert.equal(matchYocoPayment(event, expected)?.paymentId, 'payment-1');
  for (const patch of [{ amount: 10 }, { currency: 'USD' }, { mode: 'live' }, { metadata: { checkoutId: 'other' } }]) {
    assert.throws(() => matchYocoPayment({ ...event, payload: { ...event.payload, ...patch } }, expected));
  }
  assert.equal(matchYocoPayment({ type: 'payment.failed' }, expected), null);
});
