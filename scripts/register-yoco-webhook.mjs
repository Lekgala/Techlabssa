import fs from 'node:fs/promises';
import dotenv from 'dotenv';

// Explicitly test-only. Never print provider responses or secrets.
const endpoint = new URL(process.argv[2]);
if (endpoint.protocol !== 'https:' || endpoint.pathname !== '/api/webhooks/yoco' || endpoint.search || endpoint.hash || endpoint.username || endpoint.password) throw new Error('An HTTPS Yoco webhook URL is required');
const envPath = '.env';
let source = await fs.readFile(envPath, 'utf8');
const env = dotenv.parse(source);
if (env.YOCO_MODE !== 'test' || !env.YOCO_SECRET_KEY?.startsWith('sk_test_')) throw new Error('Test mode and a test secret key are required');
const headers = { Authorization: `Bearer ${env.YOCO_SECRET_KEY}`, 'Content-Type': 'application/json' };
const list = await fetch('https://payments.yoco.com/api/webhooks', { headers, signal: AbortSignal.timeout(15000) });
if (!list.ok) throw new Error(`Webhook listing failed: HTTP ${list.status}`);
const result = await list.json();
const items = Array.isArray(result) ? result : result.subscriptions ?? result.webhooks ?? result.data;
if (!Array.isArray(items)) throw new Error('Unexpected webhook list format; no registration made');
if (items.some(item => item.url === endpoint.href)) throw new Error('This URL is already registered. Preserve its existing signing secret; no duplicate created');
if (!process.argv.includes('--apply')) { console.log('Test webhook registration is ready. Run with --apply to register and save the secret.'); process.exit(0); }
const response = await fetch('https://payments.yoco.com/api/webhooks', { method: 'POST', headers,
  body: JSON.stringify({ name: 'TechLabs local test payments', url: endpoint.href }), signal: AbortSignal.timeout(20000) });
if (!response.ok) throw new Error(`Webhook registration failed: HTTP ${response.status}`);
const registered = await response.json();
if (registered.mode !== 'test' || !/^whsec_[A-Za-z0-9+/]+={0,2}$/.test(registered.secret || '')) throw new Error('Unexpected registration response; checkout not enabled');
// Save immediately: Yoco provides the signing secret only once.
source = await fs.readFile(envPath, 'utf8');
for (const [key, value] of Object.entries({ YOCO_WEBHOOK_SECRET: registered.secret, YOCO_WEBHOOK_ID: registered.id, YOCO_WEBHOOK_URL: endpoint.href, YOCO_ENABLED: 'true' })) {
  const pattern = new RegExp(`^${key}=.*$`, 'm');
  source = pattern.test(source) ? source.replace(pattern, () => `${key}=${value}`) : `${source}\n${key}=${value}\n`;
}
await fs.writeFile(envPath, source);
console.log('Test webhook registered. Signing secret saved privately to .env; test checkout enabled. Restart the API.');
