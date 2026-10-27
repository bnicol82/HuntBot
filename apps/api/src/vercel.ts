// Vercel entry: a Node (req, res) handler. Bundled by scripts/build.mjs into .vercel/output.
import { getRequestListener } from '@hono/node-server';

import { createServer } from './server';

const app = createServer();

export default getRequestListener(app.fetch);
