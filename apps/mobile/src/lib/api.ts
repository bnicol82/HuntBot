import { Profile, type AgeGateRequest, type ProfileUpdate } from '@huntbot/shared';

import { authClient } from './auth-client';
import { env } from './env';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Calls the HuntBot API with the session cookie; responses are validated with Zod. */
async function request(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!env.apiUrl) throw new ApiError(0, 'The HuntBot API is not configured for this build.');
  const res = await fetch(`${env.apiUrl}${path}`, {
    ...init,
    headers: {
      'content-type': 'application/json',
      cookie: await authClient.getCookie(),
      ...init.headers,
    },
    // The cookie header above is the credential; don't let the platform add its own.
    credentials: 'omit',
  });
  const body: unknown = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body ? String(body.error) : res.statusText;
    throw new ApiError(res.status, message);
  }
  return body;
}

export const api = {
  getMe: async () => Profile.parse(await request('/api/me')),
  updateMe: async (update: ProfileUpdate) =>
    Profile.parse(await request('/api/me', { method: 'PATCH', body: JSON.stringify(update) })),
  confirmAge: async (bracket: AgeGateRequest['bracket']) =>
    Profile.parse(
      await request('/api/me/age-gate', { method: 'POST', body: JSON.stringify({ bracket }) }),
    ),
};
