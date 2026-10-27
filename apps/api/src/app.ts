import { confirmMyAge, getMyProfile, updateMyProfile, withUser, type Db } from '@huntbot/db';
import { AgeGateRequest, ProfileUpdate } from '@huntbot/shared';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';

import type { Auth } from './auth';

type Vars = { Variables: { userId: string } };

export function createApp({ db, auth }: { db: Db; auth: Auth }) {
  const app = new Hono<Vars>();

  app.get('/health', (c) => c.json({ ok: true }));

  app.on(['GET', 'POST'], '/api/auth/*', (c) => auth.handler(c.req.raw));

  const api = new Hono<Vars>();

  api.use('*', async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    if (!session) throw new HTTPException(401, { message: 'Sign in required' });
    c.set('userId', session.user.id);
    await next();
  });

  api.get('/me', async (c) => {
    const profile = await withUser(db, c.get('userId'), getMyProfile);
    if (!profile) throw new HTTPException(404, { message: 'Profile not found' });
    return c.json(profile);
  });

  api.patch('/me', async (c) => {
    const parsed = ProfileUpdate.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success)
      return c.json({ error: 'Invalid profile update', issues: parsed.error.issues }, 400);
    const profile = await withUser(db, c.get('userId'), (tx) => updateMyProfile(tx, parsed.data));
    return c.json(profile);
  });

  api.post('/me/age-gate', async (c) => {
    const parsed = AgeGateRequest.safeParse(await c.req.json().catch(() => null));
    if (!parsed.success) return c.json({ error: 'HuntBot is for ages 13 and up' }, 400);
    const profile = await withUser(db, c.get('userId'), (tx) =>
      confirmMyAge(tx, parsed.data.bracket === 'teen'),
    );
    return c.json(profile);
  });

  app.route('/api', api);

  app.onError((err, c) => {
    if (err instanceof HTTPException) return c.json({ error: err.message }, err.status);
    console.error(err);
    return c.json({ error: 'Internal error' }, 500);
  });

  return app;
}
