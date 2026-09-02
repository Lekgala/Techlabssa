import 'dotenv/config';
import Database from 'better-sqlite3';
import { Pool } from 'pg';
import path from 'node:path';

const sqlitePath = path.resolve(process.env.TECHLABS_DB_PATH || 'server/data/techlabs.db');
const connectionString = process.env.DATABASE_URL;
const replace = process.argv.includes('--replace');

if (!connectionString) throw new Error('Set DATABASE_URL to the target PostgreSQL connection string.');

const sqlite = new Database(sqlitePath, { readonly: true });
const sourceRows = sqlite.prepare('SELECT key, value FROM collections ORDER BY key').all();
if (!sourceRows.length) throw new Error(`No collections found in ${sqlitePath}.`);

const pool = new Pool({
  connectionString,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
});
const client = await pool.connect();

try {
  await client.query('BEGIN');
  await client.query('CREATE TABLE IF NOT EXISTS collections (key TEXT PRIMARY KEY, value JSONB NOT NULL)');
  const target = await client.query('SELECT COUNT(*)::int AS count FROM collections');
  if (target.rows[0].count > 0 && !replace) {
    throw new Error('PostgreSQL already contains data. Re-run with --replace only after verifying the target database.');
  }
  if (replace) await client.query('DELETE FROM collections');

  for (const row of sourceRows) {
    JSON.parse(row.value);
    await client.query('INSERT INTO collections (key, value) VALUES ($1, $2::jsonb)', [row.key, row.value]);
  }

  const copied = await client.query('SELECT COUNT(*)::int AS count FROM collections');
  if (copied.rows[0].count !== sourceRows.length) {
    throw new Error(`Validation failed: expected ${sourceRows.length} collections, found ${copied.rows[0].count}.`);
  }
  await client.query('COMMIT');
  console.log(`Migrated and validated ${sourceRows.length} collections from ${sqlitePath} to PostgreSQL.`);
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
} finally {
  client.release();
  await pool.end();
  sqlite.close();
}
