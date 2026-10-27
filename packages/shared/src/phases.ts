import { z } from 'zod';

/** Whitetail season phases (spec §6.1). Timing lives in content, not here. */
export const PhaseId = z.enum([
  'early_season',
  'october_lull',
  'pre_rut',
  'seeking_chasing',
  'peak_breeding',
  'post_rut',
  'second_rut',
  'late_season',
]);
export type PhaseId = z.infer<typeof PhaseId>;

/** Evidence tag carried by every piece of hunting advice (spec §0.4). */
export const Evidence = z.enum(['research', 'consensus', 'mixed']);
export type Evidence = z.infer<typeof Evidence>;
