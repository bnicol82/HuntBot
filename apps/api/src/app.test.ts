import { createPool, type Db } from '@huntbot/db';
import { Profile } from '@huntbot/shared';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createApp } from './app';
import { createAuth } from './auth';
import { readEnv } from './env';

/**
 * Integration tests against a real, migrated Postgres. Set TEST_DATABASE_URL to run them
 * (CI does); they're skipped otherwise.
 */
const url = process.env.TEST_DATABASE_URL;

describe.skipIf(!url)('API (integration)', () => {
  let db: Db;
  let app: ReturnType<typeof createApp>;
  const base = 'http://localhost:8787';

  beforeAll(() => {
    const env = readEnv({
      DATABASE_URL: url,
      BETTER_AUTH_SECRET: 'test-secret-test-secret-test-secret-123',
      BETTER_AUTH_URL: base,
    });
    db = createPool(env.DATABASE_URL);
    app = createApp({ db, auth: createAuth(db, env) });
  });

  afterAll(async () => {
    await db.end();
  });

  async function signUp(email: string) {
    const res = await app.request(`${base}/api/auth/sign-up/email`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', origin: base },
      body: JSON.stringify({ email, password: 'longenough1', name: 'Tester' }),
    });
    expect(res.status).toBe(200);
    const cookie = res.headers
      .getSetCookie()
      .map((c) => c.split(';')[0])
      .join('; ');
    return (path: string, init: RequestInit = {}) =>
      app.request(`${base}${path}`, {
        ...init,
        headers: { cookie, 'content-type': 'application/json', ...init.headers },
      });
  }

  const unique = () => `${crypto.randomUUID()}@test.dev`;
  const profileOf = async (res: Response | Promise<Response>) =>
    Profile.parse(await (await res).json());

  it('rejects unauthenticated requests', async () => {
    expect((await app.request(`${base}/api/me`)).status).toBe(401);
  });

  it('creates a profile on sign-up and lets the user edit allowed fields', async () => {
    const call = await signUp(unique());
    const me = await profileOf(call('/api/me'));
    expect(me).toMatchObject({ display_name: 'Tester', experience: 'beginner', is_youth: false });

    const updated = await call('/api/me', {
      method: 'PATCH',
      body: JSON.stringify({ home_state: 'MT', experience: 'intermediate' }),
    });
    expect(await profileOf(updated)).toMatchObject({
      home_state: 'MT',
      experience: 'intermediate',
    });

    const sneaky = await call('/api/me', {
      method: 'PATCH',
      body: JSON.stringify({ is_youth: true }),
    });
    expect(sneaky.status).toBe(400);
  });

  it('records the age gate once and refuses under-13', async () => {
    const call = await signUp(unique());
    const gate = (bracket: string) =>
      call('/api/me/age-gate', { method: 'POST', body: JSON.stringify({ bracket }) });

    expect((await gate('under_13')).status).toBe(400);
    const first = await profileOf(gate('teen'));
    expect(first.is_youth).toBe(true);
    expect(first.age_confirmed_at).toBeTruthy();
    const second = await profileOf(gate('adult'));
    expect(second.is_youth).toBe(true);
  });

  it('keeps each user to their own profile', async () => {
    const a = await signUp(unique());
    const b = await signUp(unique());
    const idA = (await profileOf(a('/api/me'))).id;
    const idB = (await profileOf(b('/api/me'))).id;
    expect(idA).not.toBe(idB);
  });
});
