import { z } from 'zod';

import { Bearing, CompassIndex } from './compass';
import { PhaseId } from './phases';
import type { PinTypeId } from './pin-types';

/** Type-specific pin fields stored in `pins.attrs` (spec §5.2). */

export const StandAttrs = z.object({
  standType: z.enum(['hang_on', 'ladder', 'climber', 'saddle', 'box', 'ground_blind']),
  heightFt: z.number().min(0).max(40).optional(),
  facingDeg: Bearing.optional(),
  idealWindsFrom: z.array(CompassIndex),
  suggestedWindsFrom: z.array(CompassIndex).optional(),
  bestTimes: z.array(z.enum(['am', 'midday', 'pm'])),
  bestPhases: z.array(PhaseId),
  weapon: z.enum(['bow', 'gun', 'both']).default('both'),
  maxShotYd: z.number().positive().optional(),
  entryRouteId: z.uuid().optional(),
  exitRouteId: z.uuid().optional(),
});
export type StandAttrs = z.infer<typeof StandAttrs>;

export const ScrapeAttrs = z.object({
  lickingBranch: z.boolean().optional(),
  status: z.enum(['fresh', 'active', 'old', 'dead']).optional(),
  revisits: z
    .array(
      z.object({
        at: z.iso.datetime(),
        fresh: z.boolean(),
        photoPath: z.string().optional(),
      }),
    )
    .default([]),
});
export type ScrapeAttrs = z.infer<typeof ScrapeAttrs>;

export const RubAttrs = z.object({
  treeDiameterIn: z.number().positive().optional(),
  rubHeightIn: z.number().positive().optional(),
  rubbedSideFacingDeg: Bearing.optional(),
});
export type RubAttrs = z.infer<typeof RubAttrs>;

export const FoodSubtype = z.enum([
  'white_oak',
  'red_oak',
  'other_hard_mast',
  'apple',
  'persimmon',
  'other_soft_mast',
  'corn',
  'soybeans',
  'alfalfa',
  'winter_wheat',
  'clover_plot',
  'brassica_plot',
  'cereal_plot',
  'browse_cutover',
]);

export const FoodAttrs = z.object({
  subtype: FoodSubtype.optional(),
  monthsAvailable: z.array(z.number().int().min(1).max(12)).default([]),
  status: z.enum(['dropping', 'available', 'eaten_out']).optional(),
});
export type FoodAttrs = z.infer<typeof FoodAttrs>;

export const WaterAttrs = z.object({
  subtype: z.enum(['creek', 'pond', 'spring', 'tank']).optional(),
  reliability: z.enum(['year_round', 'seasonal', 'unreliable']).optional(),
});
export type WaterAttrs = z.infer<typeof WaterAttrs>;

export const TrailCameraAttrs = z.object({
  brand: z.string().optional(),
  model: z.string().optional(),
  cellular: z.boolean().default(false),
  facingDeg: Bearing.optional(),
  heightFt: z.number().min(0).optional(),
  installedAt: z.iso.date().optional(),
  lastCheckedAt: z.iso.date().optional(),
  batteryPct: z.number().min(0).max(100).optional(),
  sdSwappedAt: z.iso.date().optional(),
});
export type TrailCameraAttrs = z.infer<typeof TrailCameraAttrs>;

/** Types without specific fields accept an empty-ish object; unknown keys are stripped. */
const EmptyAttrs = z.object({});

const ATTRS_BY_TYPE: Partial<Record<PinTypeId, z.ZodType>> = {
  stand: StandAttrs,
  blind: StandAttrs,
  scrape: ScrapeAttrs,
  rub: RubAttrs,
  food_source: FoodAttrs,
  water: WaterAttrs,
  trail_camera: TrailCameraAttrs,
};

export function attrsSchemaFor(type: PinTypeId): z.ZodType {
  return ATTRS_BY_TYPE[type] ?? EmptyAttrs;
}

export function parseAttrs(type: PinTypeId, attrs: unknown) {
  return attrsSchemaFor(type).safeParse(attrs ?? {});
}
