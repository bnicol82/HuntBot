// Local dev server: `pnpm --filter @huntbot/api dev` (reads apps/api/.env).
import { serve } from '@hono/node-server';

import { createServer } from './server';

process.loadEnvFile?.('.env');
const port = Number(process.env.PORT ?? 8787);
serve({ fetch: createServer().fetch, port }, () => console.log(`HuntBot API on :${port}`));
