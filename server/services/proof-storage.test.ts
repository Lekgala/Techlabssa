import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { Readable } from 'node:stream';
import { createProofStorage } from './proof-storage';

const pdf = Buffer.from('%PDF-1.4 test payment');
const hash = crypto.createHash('sha256').update(pdf).digest('hex');
function remote() {
  const objects = new Map<string, Buffer>();
  const commands: any[] = [];
  let offline = false;
  return { objects, commands, fail: () => { offline = true; }, send: async (command: any) => {
    if (offline) throw Object.assign(new Error('Unavailable'), { $metadata: { httpStatusCode: 503 } });
    commands.push(command);
    const input = command.input;
    if (command.constructor.name === 'PutObjectCommand') {
      assert.equal(input.IfNoneMatch, '*');
      assert.equal(input.ACL, undefined);
      if (objects.has(input.Key)) throw Object.assign(new Error('Exists'), { $metadata: { httpStatusCode: 412 } });
      objects.set(input.Key, Buffer.from(input.Body)); return {};
    }
    const data = objects.get(input.Key);
    if (!data) throw Object.assign(new Error('Missing'), { name: 'NoSuchKey' });
    return { ContentLength: data.length, Body: Readable.from([data]) };
  } };
}
async function temp() {
  const root = path.resolve('tmp/proof-storage-tests'); await fs.mkdir(root, { recursive: true });
  const directory = await fs.mkdtemp(path.join(root, 'case-'));
  return { directory, close: async () => { assert.ok(directory.startsWith(root + path.sep)); await fs.rm(directory, { recursive: true, force: true }); } };
}
test('R2 configuration fails closed when credentials or endpoint are invalid', () => {
  assert.throws(() => createProofStorage({ PAYMENT_PROOF_STORAGE: 'r2' }), /Missing/);
  assert.throws(() => createProofStorage({ PAYMENT_PROOF_STORAGE: 'other' }));
  assert.throws(() => createProofStorage({ PAYMENT_PROOF_STORAGE: 'r2', R2_ENDPOINT: 'https://example.com', R2_BUCKET: 'proofs', R2_ACCESS_KEY_ID: 'test', R2_SECRET_ACCESS_KEY: 'test' }), /R2_ENDPOINT/);
});
test('R2 upload uses a private object and prefixed record key, and verifies downloads', async () => {
  const mock = remote(); const store = createProofStorage({ PAYMENT_PROOF_STORAGE: 'r2', R2_BUCKET: 'proofs' }, mock);
  const key = await store.put('pay-1.pdf', pdf, 'application/pdf');
  assert.equal(key, 'r2:pay-1.pdf');
  assert.equal(mock.commands[0].input.CacheControl, 'private, no-store');
  assert.equal(mock.commands[0].input.Metadata.sha256, hash);
  assert.deepEqual(await store.get(key, hash), pdf);
  await assert.rejects(store.get(key, 'wrong'), /integrity/);
  await assert.rejects(store.put('../escape.pdf', pdf, 'application/pdf'), /storage key/);
  await assert.rejects(store.put('large.pdf', Buffer.alloc(5 * 1024 * 1024 + 1), 'application/pdf'), /size/);
});
test('legacy local proofs remain readable but R2 failures never become local writes', async () => {
  const fixture = await temp(); try {
    const mock = remote(); const env = { PAYMENT_PROOF_STORAGE: 'r2', PAYMENT_PROOF_DIR: fixture.directory, R2_BUCKET: 'proofs' };
    await fs.writeFile(path.join(fixture.directory, 'pay-1.pdf'), pdf);
    const store = createProofStorage(env, mock);
    assert.deepEqual(await store.get('pay-1.pdf', hash), pdf);
    await assert.rejects(store.get('r2:pay-1.pdf', hash));
    mock.fail();
    await assert.rejects(store.get('pay-1.pdf', hash));
    await assert.rejects(store.put('pay-2.pdf', pdf, 'application/pdf'));
    await assert.rejects(fs.stat(path.join(fixture.directory, 'pay-2.pdf')));
  } finally { await fixture.close(); }
});
test('migration dry-run, copy and verification retain local files and reject conflicts', async () => {
  const fixture = await temp(); try {
    const mock = remote(); const store = createProofStorage({ PAYMENT_PROOF_STORAGE: 'r2', PAYMENT_PROOF_DIR: fixture.directory, R2_BUCKET: 'proofs' }, mock);
    await fs.writeFile(path.join(fixture.directory, 'pay-1.pdf'), pdf);
    assert.equal(await store.migrate('pay-1.pdf', false), 'would-copy'); assert.equal(mock.objects.size, 0);
    assert.equal(await store.migrate('pay-1.pdf', true), 'copied-and-verified');
    assert.equal(await store.migrate('pay-1.pdf', true), 'already-verified');
    assert.deepEqual(await fs.readFile(path.join(fixture.directory, 'pay-1.pdf')), pdf);
    mock.objects.set('payment-proofs/pay-1.pdf', Buffer.from('different'));
    await assert.rejects(store.migrate('pay-1.pdf', true), /refusing overwrite/);
  } finally { await fixture.close(); }
});
test('local provider remains compatible and does not overwrite existing files', async () => {
  const fixture = await temp(); try {
    const store = createProofStorage({ PAYMENT_PROOF_DIR: fixture.directory });
    assert.equal(await store.put('pay-1.pdf', pdf, 'application/pdf'), 'pay-1.pdf');
    assert.deepEqual(await store.get('pay-1.pdf', hash), pdf);
    await assert.rejects(store.put('pay-1.pdf', pdf, 'application/pdf'));
  } finally { await fixture.close(); }
});
