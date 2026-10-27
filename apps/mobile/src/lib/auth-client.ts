import { expoClient } from '@better-auth/expo/client';
import { createAuthClient } from 'better-auth/react';
import * as SecureStore from 'expo-secure-store';

import { env } from './env';

/**
 * Better Auth client for the HuntBot API (apps/api). The session cookie lives in the
 * device keychain/keystore via SecureStore, never in plain storage.
 */
export const authClient = createAuthClient({
  // A placeholder keeps the client constructible in builds without an API; it's never called then.
  baseURL: env.apiUrl ?? 'http://localhost:8787',
  basePath: '/api/auth',
  plugins: [expoClient({ scheme: 'huntbot', storagePrefix: 'huntbot', storage: SecureStore })],
});
