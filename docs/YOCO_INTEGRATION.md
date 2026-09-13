# Yoco payments

Implemented: student checkout, signed webhook receiver, persistent intents,
invoice/installment/enrollment updates, receipts, and admin payment activity.
Activation is pending: the API is local only, without a public HTTPS webhook
address or signing secret. Keep YOCO_ENABLED=false.

## Configuration

```dotenv
YOCO_ENABLED=false
YOCO_MODE=test
YOCO_SECRET_KEY=
YOCO_WEBHOOK_SECRET=
APP_ORIGIN=http://localhost:3001
```

Keep credentials on the API server, without VITE_ prefixes. The test key starts
with sk_test_. The separate webhook secret is returned when registering a receiver.

## Test activation

1. For local testing, run `node scripts/yoco-webhook-proxy.mjs` from the project
   directory, then run `cloudflared tunnel --url http://127.0.0.1:4012` in a second
   terminal. This proxy accepts only JSON POST requests to the webhook path and
   forwards them to the API on port 4001. Keep both processes running. Tunnel
   port 4012, not the full API or Windows Lab Agent. The receiver path is
   POST /api/webhooks/yoco. Localhost alone cannot receive Yoco notifications.
2. Register the full public URL with POST https://payments.yoco.com/api/webhooks,
   Bearer authentication using your test key, and JSON:
   { "name": "TechLabs test payments", "url": "https://YOUR-API/api/webhooks/yoco" }.
   Register once. Save the returned secret privately as YOCO_WEBHOOK_SECRET;
   do not paste the response into logs or chat.
3. Set YOCO_ENABLED=true, keep YOCO_MODE=test, and restart the API. Stop all older
   API processes connected to the same database: they lack the new concurrent
   write checks and must not run alongside this version.
4. Sign in as an approved student and open Payments. Use Yoco test card details.
   The server determines the deposit, installment or balance from the invoice.
5. After returning, select Refresh payments. Test confirmed means the signed event
   arrived. Test payments NEVER reduce tuition or enroll students. Admin → Invoices
   shows the same payment activity. Reload the page after live confirmation to
   refresh invoice balances.

## Payment behavior

- Intents persist before checkout creation. Idempotency keys and saved checkout
  links are reused. Unknown outcomes, cancellations and failed attempts keep the
  intent pending; another payable checkout is never created automatically.
  Pending checkouts that cannot resume require operator reconciliation in Yoco.
- Webhooks verify exact raw bytes, signature and a three-minute timestamp window.
  A browser redirect never confirms a payment.
- The collections store uses conflict detection, SQLite immediate transactions
  and a PostgreSQL transaction advisory lock. Webhook conflicts retry with fresh
  data. Intent, payment ID, invoice, installments and enrollment commit together;
  repeated event/payment IDs do not credit twice.
- Live payments generate verified payment records and downloadable receipts.
  Available seats enroll eligible students; full cohorts waitlist them. Existing
  completed status is preserved. Card records have no uploaded proof file.
- Overpayments, EFT review conflicts or invalid admission links are marked REVIEW
  without changing balances. Admin payment activity retains the provider IDs for
  operator reconciliation. No automated review resolution, cancellation or refund
  button is implemented. Academy email receipts are not automatically sent.
- EFT and R2 proofs remain supported. Pending live card payments block new EFT
  uploads. Disabling checkout still permits signed notifications for payments
  already in flight; retain the configured signing secret.

## Before live use

Verify your domain with Yoco and use HTTPS APP_ORIGIN and live credentials.
Test on an isolated database/Neon branch before enabling real charges. Do not
switch credentials, mode or origin with unresolved intents; reconcile them first.
Validation here used mocked Yoco and isolated SQLite, not the current Neon database
or real Yoco transactions. PostgreSQL deployment validation and end-to-end Yoco
webhook delivery remain required before production.

## Offline checks

```powershell
node --require ./scripts/windows-tsx-preload.cjs --import tsx --test server/services/yoco.test.ts server/services/yoco-integration.test.ts
npm.cmd run lint
npm.cmd run build
```

Tests use fake credentials and a temporary database; no money or real student
records are changed.

## Official references

- [Account setup](https://support.yoco.help/en/articles/739322-yoco-checkout-api)
- [Create checkout](https://developer.yoco.com/api-reference/checkout-api/checkout/create-checkout)
- [Register webhook](https://developer.yoco.com/api-reference/checkout-api/webhooks/register-webhook)
- [Signature verification](https://developer.yoco.com/guides/online-payments/webhooks/verifying-the-events)
