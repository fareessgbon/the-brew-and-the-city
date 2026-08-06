// Applies supabase/migrations/*.sql directly, in order, via a raw Postgres
// connection — a stand-in for `supabase db push`, since the Supabase CLI
// needs Docker for local diffing and wasn't installable in this environment.
//
// Usage: DATABASE_URL=postgresql://postgres:<password>@... node scripts/run-migration.mjs
// The password is read from the environment only — never written to disk.

import { readdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(__dirname, '..', 'supabase', 'migrations');

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('Set DATABASE_URL before running this script.');
  process.exit(1);
}

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith('.sql'))
  .sort();

try {
  await client.connect();
  await client.query(
    `create table if not exists public._migrations (filename text primary key, applied_at timestamptz not null default now())`,
  );
  const { rows: applied } = await client.query('select filename from public._migrations');
  const appliedSet = new Set(applied.map((r) => r.filename));

  const pending = files.filter((f) => !appliedSet.has(f));
  if (pending.length === 0) {
    console.log('Nothing to apply — all migrations already recorded.');
  } else {
    console.log(`Applying ${pending.length} migration(s):`);
    for (const file of pending) {
      const sql = readFileSync(join(migrationsDir, file), 'utf8');
      console.log(`  → ${file}`);
      await client.query('begin');
      try {
        await client.query(sql);
        await client.query('insert into public._migrations (filename) values ($1)', [file]);
        await client.query('commit');
      } catch (err) {
        await client.query('rollback');
        throw err;
      }
    }
    console.log('Done.');
  }
} catch (err) {
  console.error('Migration failed:', err.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
