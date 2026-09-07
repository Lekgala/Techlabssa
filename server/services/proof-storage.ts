import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

const MAX_BYTES = 5 * 1024 * 1024;
const digest = (data: Buffer) => crypto.createHash('sha256').update(data).digest('hex');
export const proofNotFound = (error: any) => error?.code === 'ENOENT' || error?.name === 'NoSuchKey' || error?.$metadata?.httpStatusCode === 404;

export function createProofStorage(env: NodeJS.ProcessEnv = process.env, transport?: { send: (command: any, options?: any) => Promise<any> }) {
  const provider = env.PAYMENT_PROOF_STORAGE || 'local';
  if (!['local', 'r2'].includes(provider)) throw new Error('PAYMENT_PROOF_STORAGE must be local or r2');
  const directory = path.resolve(env.PAYMENT_PROOF_DIR || 'server/data/payment-proofs');
  const prefix = env.R2_PROOF_PREFIX || 'payment-proofs/';
  if (!/^[a-zA-Z0-9/_-]+\/$/.test(prefix) || prefix.includes('..') || prefix.startsWith('/')) throw new Error('Invalid R2_PROOF_PREFIX');
  let client: S3Client | undefined;
  const remote = () => {
    if (transport) return transport;
    if (client) return client;
    for (const key of ['R2_ENDPOINT', 'R2_BUCKET', 'R2_ACCESS_KEY_ID', 'R2_SECRET_ACCESS_KEY']) if (!env[key]?.trim()) throw new Error(`Missing ${key}`);
    const endpoint = new URL(env.R2_ENDPOINT!);
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.r2.cloudflarestorage.com') || endpoint.username || endpoint.password || endpoint.search || endpoint.hash || endpoint.pathname !== '/') throw new Error('R2_ENDPOINT must be your HTTPS Cloudflare S3 endpoint');
    client = new S3Client({ region: 'auto', endpoint: endpoint.origin, credentials: { accessKeyId: env.R2_ACCESS_KEY_ID!, secretAccessKey: env.R2_SECRET_ACCESS_KEY! }, maxAttempts: 2, requestChecksumCalculation: 'WHEN_REQUIRED', responseChecksumValidation: 'WHEN_REQUIRED' });
    return client;
  };
  if (provider === 'r2') remote(); // Fail at startup instead of silently storing uploads locally.
  const filename = (key: string) => {
    const name = key.startsWith('r2:') ? key.slice(3) : key;
    if (!/^[A-Za-z0-9_-]+\.(pdf|png|jpg)$/.test(name)) throw new Error('Invalid payment proof storage key');
    return name;
  };
  const getRemote = async (name: string) => {
    const response = await remote().send(new GetObjectCommand({ Bucket: env.R2_BUCKET, Key: prefix + name }), { abortSignal: AbortSignal.timeout(20000) });
    if (!response.Body || (response.ContentLength !== undefined && response.ContentLength > MAX_BYTES)) throw new Error('Invalid payment proof object');
    const chunks: Buffer[] = []; let size = 0;
    for await (const chunk of response.Body) { const part = Buffer.from(chunk); size += part.length; if (size > MAX_BYTES) { response.Body.destroy?.(); throw new Error('Payment proof exceeds size limit'); } chunks.push(part); }
    return Buffer.concat(chunks);
  };
  const putRemote = async (name: string, data: Buffer, mimeType: string) => {
    await remote().send(new PutObjectCommand({ Bucket: env.R2_BUCKET, Key: prefix + name, Body: data, ContentType: mimeType, ContentLength: data.length, CacheControl: 'private, no-store', Metadata: { sha256: digest(data) }, IfNoneMatch: '*' }), { abortSignal: AbortSignal.timeout(20000) });
  };
  return {
    provider,
    async put(key: string, data: Buffer, mimeType: string) {
      const name = filename(key);
      if (!data.length || data.length > MAX_BYTES) throw new Error('Invalid proof size');
      if (provider === 'r2') { await putRemote(name, data, mimeType); return `r2:${name}`; }
      await fs.mkdir(directory, { recursive: true }); await fs.writeFile(path.join(directory, name), data, { flag: 'wx' }); return name;
    },
    async get(key: string, expectedHash?: string) {
      const name = filename(key); let data: Buffer;
      if (key.startsWith('r2:') || provider === 'r2') {
        try { data = await getRemote(name); }
        catch (error) {
          // Only legacy records may fall back, and only when the remote object is absent.
          if (key.startsWith('r2:') || !proofNotFound(error)) throw error;
          data = await fs.readFile(path.join(directory, name));
        }
      } else data = await fs.readFile(path.join(directory, name));
      if (data.length > MAX_BYTES || (expectedHash && digest(data) !== expectedHash)) throw new Error('Payment proof integrity check failed');
      return data;
    },
    async migrate(key: string, apply: boolean) {
      const name = filename(key); const local = await fs.readFile(path.join(directory, name));
      if (!local.length || local.length > MAX_BYTES) throw new Error('Invalid local proof size');
      try {
        const existing = await getRemote(name);
        if (digest(existing) !== digest(local)) throw new Error('Remote object differs from local proof; refusing overwrite');
        return 'already-verified';
      } catch (error) { if (!proofNotFound(error)) throw error; }
      if (!apply) return 'would-copy';
      const mime = name.endsWith('.pdf') ? 'application/pdf' : name.endsWith('.png') ? 'image/png' : 'image/jpeg';
      await putRemote(name, local, mime);
      if (digest(await getRemote(name)) !== digest(local)) throw new Error('Migration verification failed');
      return 'copied-and-verified';
    },
  };
}
