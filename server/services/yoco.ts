import { createHmac, timingSafeEqual } from 'node:crypto';

/** Server-only adapter. Routes and transactional ledger wiring are deliberately separate. */
export function yocoConfig(env: NodeJS.ProcessEnv = process.env) {
  if (env.YOCO_ENABLED !== 'true') return null;
  const mode = env.YOCO_MODE || 'test';
  if (mode !== 'test' && mode !== 'live') throw new Error('YOCO_MODE must be test or live');
  const secretKey = env.YOCO_SECRET_KEY?.trim() || '';
  const webhookSecret = env.YOCO_WEBHOOK_SECRET?.trim() || '';
  if (!secretKey.startsWith(`sk_${mode}_`)) throw new Error('Yoco secret key must match YOCO_MODE');
  if (!/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(webhookSecret)) throw new Error('Yoco webhook signing secret is required');
  const origin = new URL(env.APP_ORIGIN || '');
  if (origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash
    || (origin.protocol !== 'https:' && !(mode === 'test' && origin.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(origin.hostname)))) {
    throw new Error('APP_ORIGIN must be an HTTPS origin (localhost HTTP allowed in test mode)');
  }
  return { mode: mode as 'test' | 'live', secretKey, webhookSecret, origin: origin.origin };
}

export type YocoConfig = NonNullable<ReturnType<typeof yocoConfig>>;
export type CheckoutIntent = { id: string; invoiceId: string; amountCents: number };

export async function createYocoCheckout(config: YocoConfig, intent: CheckoutIntent, request: typeof fetch = fetch) {
  if (!intent.id || !intent.invoiceId || !Number.isSafeInteger(intent.amountCents) || intent.amountCents <= 0) {
    throw new Error('A persisted intent, invoice and positive amount in cents are required');
  }
  // Persist the intent before calling; retries MUST reuse this ID and identical body.
  let response: Response;
  try {
    response = await request('https://payments.yoco.com/api/checkouts', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.secretKey}`, 'Content-Type': 'application/json', 'Idempotency-Key': intent.id },
      body: JSON.stringify({ amount: intent.amountCents, currency: 'ZAR',
        metadata: { invoiceId: intent.invoiceId, intentId: intent.id },
        successUrl: `${config.origin}/student?yoco=returned`, cancelUrl: `${config.origin}/student?yoco=cancelled`, failureUrl: `${config.origin}/student?yoco=failed` }),
      signal: AbortSignal.timeout(15_000),
    });
  } catch { throw new Error('Yoco checkout outcome is unknown; retry using the same payment intent'); }
  // Never include provider response bodies or credentials in public errors.
  if (!response.ok) throw new Error(`Yoco checkout request failed (${response.status})`);
  const result = await response.json();
  const url = new URL(result.redirectUrl);
  if (!result.id || result.amount !== intent.amountCents || result.currency !== 'ZAR' || result.processingMode !== config.mode
    || url.protocol !== 'https:' || url.username || url.password || url.port || !(url.hostname === 'yoco.com' || url.hostname.endsWith('.yoco.com'))) {
    throw new Error('Unexpected Yoco checkout response');
  }
  return { checkoutId: String(result.id), redirectUrl: url.href };
}

export function verifyYocoSignature(raw: Buffer, headers: Record<string, string | string[] | undefined>, secret: string, now = Date.now()) {
  const id = headers['webhook-id'];
  const timestamp = headers['webhook-timestamp'];
  const signatures = headers['webhook-signature'];
  if (typeof id !== 'string' || !id || typeof timestamp !== 'string' || !/^\d+$/.test(timestamp)
    || typeof signatures !== 'string' || Math.abs(now / 1000 - Number(timestamp)) > 180
    || !/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(secret)) return false;
  const expected = createHmac('sha256', Buffer.from(secret.slice(6), 'base64'))
    .update(`${id}.${timestamp}.`).update(raw).digest();
  return signatures.split(' ').some(signature => {
    const [version, value] = signature.split(',');
    if (version !== 'v1' || !value) return false;
    const actual = Buffer.from(value, 'base64');
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  });
}

/** Call only after signature verification, against the persisted checkout intent.
 * The caller must still deduplicate event/payment IDs and credit the ledger atomically.
 */
export function matchYocoPayment(event: unknown, expected: { checkoutId: string; amountCents: number; mode: 'test' | 'live' }) {
  const value = event as any;
  const payment = value?.payload;
  if (value?.type !== 'payment.succeeded') return null;
  if (typeof value.id !== 'string' || !value.id || typeof payment?.id !== 'string' || !payment.id
    || payment.status !== 'succeeded' || payment.type !== 'payment' || payment.currency !== 'ZAR'
    || payment.mode !== expected.mode || !Number.isSafeInteger(payment.amount) || payment.amount <= 0
    || payment.amount !== expected.amountCents || payment.metadata?.checkoutId !== expected.checkoutId) {
    throw new Error('Yoco payment does not match the stored checkout');
  }
  return { eventId: value.id as string, paymentId: payment.id as string, amountCents: payment.amount as number };
}
