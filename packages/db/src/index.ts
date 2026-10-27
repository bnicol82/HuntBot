/**
 * @huntbot/db — Neon Postgres access for the API.
 *
 * Every user-facing query runs through `withUser`, which scopes the transaction to the
 * `app_user` role and the caller's id so Postgres row-level security does the authorization
 * (policies in migrations/0001_core.sql, tested in tests/rls.test.sql). The owner connection is
 * used directly only by the auth handler and migrations.
 */
import pg from 'pg';

export type Db = pg.Pool;
export type Tx = pg.PoolClient;

export function createPool(connectionString: string): Db {
  return new pg.Pool({ connectionString, max: 5 });
}

export async function withUser<T>(db: Db, userId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  const tx = await db.connect();
  try {
    await tx.query('begin');
    // `set local` / is_local=true keep both settings inside this transaction, which is also what
    // makes this safe on Neon's transaction-mode pooler.
    await tx.query("select set_config('app.user_id', $1, true)", [userId]);
    await tx.query('set local role app_user');
    const result = await fn(tx);
    await tx.query('commit');
    return result;
  } catch (e) {
    await tx.query('rollback');
    throw e;
  } finally {
    tx.release();
  }
}

export * from './profiles';
