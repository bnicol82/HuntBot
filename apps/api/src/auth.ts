import { expo } from '@better-auth/expo';
import type { Db } from '@huntbot/db';
import { betterAuth } from 'better-auth';

import type { Env } from './env';

/**
 * Better Auth on our own Neon database (tables in migrations/0001_core.sql).
 * Native Apple/Google sign-in posts the provider's ID token to `/api/auth/sign-in/social`;
 * no OAuth redirect or client secret is involved.
 */
export function createAuth(db: Db, env: Env) {
  return betterAuth({
    database: db,
    baseURL: env.BETTER_AUTH_URL,
    basePath: '/api/auth',
    secret: env.BETTER_AUTH_SECRET,
    emailAndPassword: { enabled: true, minPasswordLength: 8 },
    // In-app account deletion (spec §13.4); also used when someone says they're under 13.
    user: { deleteUser: { enabled: true } },
    socialProviders: {
      ...(env.APPLE_BUNDLE_ID && {
        apple: { clientId: env.APPLE_BUNDLE_ID, appBundleIdentifier: env.APPLE_BUNDLE_ID },
      }),
      ...(env.GOOGLE_CLIENT_IDS.length > 0 && {
        google: { clientId: env.GOOGLE_CLIENT_IDS },
      }),
    },
    plugins: [expo()],
    trustedOrigins: ['huntbot://'],
    advanced: { database: { generateId: 'uuid' } },
  });
}

export type Auth = ReturnType<typeof createAuth>;
