import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createProofStorage } from '../server/services/proof-storage';

const apply = process.argv.includes('--apply');
const storage = createProofStorage({ ...process.env, PAYMENT_PROOF_STORAGE: 'r2' });
const directory = path.resolve(process.env.PAYMENT_PROOF_DIR || 'server/data/payment-proofs');
let failures = 0;
for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
  if (!entry.isFile() || !/^[A-Za-z0-9_-]+\.(pdf|png|jpg)$/.test(entry.name)) continue;
  try { console.log(`${entry.name}: ${await storage.migrate(entry.name, apply)}`); }
  catch { failures++; console.error(`${entry.name}: failed; no local file deleted. Check credentials, network and object conflicts.`); }
}
console.log(`${apply ? 'Copy and verification' : 'Dry run'} finished. Failures: ${failures}. Local files and database records were not changed.`);
process.exitCode = failures ? 1 : 0;
