/**
 * Applies `packages/db/migrations/*.sql` in filename order, once each, recording them in
 * `public.schema_migrations`. Each file runs in its own transaction under an advisory lock.
 *
 *   DATABASE_URL=postgres://… pnpm --filter @huntbot/db migrate
 *
 * On Neon use the direct (unpooled) connection string: DATABASE_URL_UNPOOLED is preferred if set.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import pg from 'pg';

const MIGRATIONS_DIR = fileURLToPath(new URL('../migrations', import.meta.url));
const LOCK_KEY = 4_820_051; // arbitrary, constant per app

export async function migrate(connectionString: string, log: (msg: string) => void = console.log) {
  const client = new pg.Client({ connectionString });
  await client.connect();
  try {
    await client.query('select pg_advisory_lock($1)', [LOCK_KEY]);
    await client.query(`create table if not exists public.schema_migrations (
      name text primary key,
      applied_at timestamptz not null default now()
    )`);
    const done = new Set(
      (await client.query<{ name: string }>('select name from public.schema_migrations')).rows.map(
        (r) => r.name,
      ),
    );
    const files = readdirSync(MIGRATIONS_DIR)
      .filter((f) => f.endsWith('.sql'))
      .sort();
    for (const file of files) {
      if (done.has(file)) continue;
      log(`applying ${file}`);
      await client.query('begin');
      try {
        await client.query(readFileSync(join(MIGRATIONS_DIR, file), 'utf8'));
        await client.query('insert into public.schema_migrations (name) values ($1)', [file]);
        await client.query('commit');
      } catch (e) {
        await client.query('rollback');
        throw new Error(`migration ${file} failed: ${(e as Error).message}`, { cause: e });
      }
    }
    log('migrations up to date');
  } finally {
    await client.query('select pg_advisory_unlock($1)', [LOCK_KEY]).catch(() => {});
    await client.end();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    console.error('Set DATABASE_URL (or DATABASE_URL_UNPOOLED).');
    process.exit(1);
  }
  migrate(url).catch((e: Error) => {
    console.error(e.message);
    process.exit(1);
  });
}
