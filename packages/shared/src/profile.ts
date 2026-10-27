import { z } from 'zod';

import { UsState } from './states';

export const Experience = z.enum(['beginner', 'intermediate', 'experienced']);
export type Experience = z.infer<typeof Experience>;

export const Units = z.enum(['imperial', 'metric']);
export type Units = z.infer<typeof Units>;

/** Postgres hands back Dates; JSON hands back strings. Normalize both to ISO strings. */
const Timestamp = z.union([
  z.date().transform((d) => d.toISOString()),
  z.iso.datetime({ offset: true }),
]);

/** Row shape of `public.profiles` as the app reads it. */
export const Profile = z.object({
  id: z.uuid(),
  display_name: z.string().nullable(),
  experience: Experience,
  home_state: UsState.nullable(),
  units: Units,
  is_youth: z.boolean(),
  age_confirmed_at: Timestamp.nullable(),
  mentor_id: z.uuid().nullable(),
  created_at: Timestamp,
});
export type Profile = z.infer<typeof Profile>;

/** Fields a user may change on their own profile (matches the column grants in SQL). */
export const ProfileUpdate = z
  .object({
    display_name: z.string().trim().max(80).nullable(),
    experience: Experience,
    home_state: UsState.nullable(),
    units: Units,
  })
  .partial()
  .strict();
export type ProfileUpdate = z.infer<typeof ProfileUpdate>;

/**
 * Sign-up age gate (spec §13.5): HuntBot is 13+. `under_13` never reaches the server — the app
 * stops there — but the API rejects it too.
 */
export const AgeBracket = z.enum(['under_13', 'teen', 'adult']);
export type AgeBracket = z.infer<typeof AgeBracket>;

export const AgeGateRequest = z.object({ bracket: AgeBracket.exclude(['under_13']) }).strict();
export type AgeGateRequest = z.infer<typeof AgeGateRequest>;
