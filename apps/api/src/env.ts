import { z } from 'zod';

const csv = z
  .string()
  .optional()
  .transform((v) =>
    (v ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(32, 'BETTER_AUTH_SECRET must be at least 32 characters'),
  BETTER_AUTH_URL: z.url(),
  APPLE_BUNDLE_ID: z.string().min(1).optional(),
  GOOGLE_CLIENT_IDS: csv,
});

export type Env = z.infer<typeof Env>;

export function readEnv(source: Record<string, string | undefined> = process.env): Env {
  const blankToUndefined = Object.fromEntries(
    Object.entries(source).map(([k, v]) => [k, v === '' ? undefined : v]),
  );
  return Env.parse(blankToUndefined);
}
