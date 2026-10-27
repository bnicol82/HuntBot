import { z } from 'zod';

/** 16-point compass labels, index 0 = N, 4 = E, 8 = S, 12 = W. */
export const COMPASS_16 = [
  'N',
  'NNE',
  'NE',
  'ENE',
  'E',
  'ESE',
  'SE',
  'SSE',
  'S',
  'SSW',
  'SW',
  'WSW',
  'W',
  'WNW',
  'NW',
  'NNW',
] as const;

export type CompassPoint = (typeof COMPASS_16)[number];

export const CompassIndex = z.number().int().min(0).max(15);
export type CompassIndex = z.infer<typeof CompassIndex>;

/** Degrees true in [0, 360). */
export const Bearing = z.number().min(0).lt(360);
export type Bearing = z.infer<typeof Bearing>;
