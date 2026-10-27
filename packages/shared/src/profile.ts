import { z } from 'zod';

export const Experience = z.enum(['beginner', 'intermediate', 'experienced']);
export type Experience = z.infer<typeof Experience>;

export const Units = z.enum(['imperial', 'metric']);
export type Units = z.infer<typeof Units>;

/** Row shape of `public.profiles` as the app reads it. */
export const Profile = z.object({
  id: z.uuid(),
  display_name: z.string().nullable(),
  experience: Experience,
  home_state: z
    .string()
    .regex(/^[A-Z]{2}$/)
    .nullable(),
  units: Units,
  is_youth: z.boolean(),
  mentor_id: z.uuid().nullable(),
  created_at: z.string(),
});
export type Profile = z.infer<typeof Profile>;
