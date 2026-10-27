// Bundles the API into Vercel's Build Output API format (https://vercel.com/docs/build-output-api):
// one Node function serving every route. Bundling inlines the TypeScript workspace packages, so the
// deploy doesn't depend on Vercel compiling them.
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const root = fileURLToPath(new URL('..', import.meta.url));
const out = `${root}.vercel/output`;
const fn = `${out}/functions/index.func`;

await rm(out, { recursive: true, force: true });
await mkdir(fn, { recursive: true });

await build({
  entryPoints: [`${root}src/vercel.ts`],
  outfile: `${fn}/index.mjs`,
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  sourcemap: true,
  // pg optionally requires the native addon; it's never installed.
  external: ['pg-native'],
  // CommonJS dependencies (pg) call require(); give the ESM bundle one.
  banner: {
    js: "import { createRequire as __cr } from 'node:module'; const require = __cr(import.meta.url);",
  },
  logLevel: 'info',
});

await writeFile(
  `${fn}/.vc-config.json`,
  JSON.stringify(
    {
      runtime: 'nodejs22.x',
      handler: 'index.mjs',
      launcherType: 'Nodejs',
      shouldAddHelpers: false,
      shouldAddSourcemapSupport: true,
      maxDuration: 30,
    },
    null,
    2,
  ),
);

await writeFile(
  `${out}/config.json`,
  JSON.stringify(
    {
      version: 3,
      routes: [{ handle: 'filesystem' }, { src: '/(.*)', dest: '/index' }],
    },
    null,
    2,
  ),
);
