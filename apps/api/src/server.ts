import { createPool } from '@huntbot/db';

import { createApp } from './app';
import { createAuth } from './auth';
import { readEnv } from './env';

/** Builds the app from process.env once per function instance. */
export function createServer() {
  const env = readEnv();
  const db = createPool(env.DATABASE_URL);
  return createApp({ db, auth: createAuth(db, env) });
}
