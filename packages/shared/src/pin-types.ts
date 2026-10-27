import { z } from 'zod';

export const PinCategory = z.enum([
  'sign',
  'habitat',
  'setup',
  'access',
  'property',
  'event',
  'custom',
]);
export type PinCategory = z.infer<typeof PinCategory>;

export const GeometryKind = z.enum(['point', 'line', 'polygon', 'any']);
export type GeometryKind = z.infer<typeof GeometryKind>;

export interface PinTypeDef {
  id: string;
  category: PinCategory;
  /** Primary geometry. `food` and `water` also allow polygons — see `altGeometry`. */
  geometry: GeometryKind;
  altGeometry?: GeometryKind;
  /** Freshness half-life in days for sign pins; undefined = no decay. */
  halfLifeDays?: number;
  label: string;
}

/**
 * Pin type catalogue (spec §5.2). Mirrors the `pin_types` lookup table seeded in
 * `packages/db/migrations`; a test keeps the two in sync.
 */
export const PIN_TYPES = [
  // Sign
  { id: 'rub', category: 'sign', geometry: 'point', halfLifeDays: 30, label: 'Rub' },
  { id: 'rub_line', category: 'sign', geometry: 'line', halfLifeDays: 30, label: 'Rub line' },
  { id: 'scrape', category: 'sign', geometry: 'point', halfLifeDays: 14, label: 'Scrape' },
  { id: 'tracks', category: 'sign', geometry: 'point', halfLifeDays: 3, label: 'Tracks' },
  { id: 'droppings', category: 'sign', geometry: 'point', halfLifeDays: 3, label: 'Droppings' },
  { id: 'bed', category: 'sign', geometry: 'point', halfLifeDays: 14, label: 'Bed' },
  { id: 'trail', category: 'sign', geometry: 'line', label: 'Trail' },
  { id: 'crossing', category: 'sign', geometry: 'point', label: 'Crossing' },
  { id: 'shed', category: 'sign', geometry: 'point', label: 'Shed' },
  // Habitat
  {
    id: 'food_source',
    category: 'habitat',
    geometry: 'point',
    altGeometry: 'polygon',
    label: 'Food source',
  },
  { id: 'water', category: 'habitat', geometry: 'point', altGeometry: 'polygon', label: 'Water' },
  { id: 'bedding_area', category: 'habitat', geometry: 'polygon', label: 'Bedding area' },
  { id: 'thick_cover', category: 'habitat', geometry: 'polygon', label: 'Thick cover' },
  { id: 'sanctuary', category: 'habitat', geometry: 'polygon', label: 'Sanctuary — never enter' },
  // Setup
  { id: 'stand', category: 'setup', geometry: 'point', label: 'Stand' },
  { id: 'blind', category: 'setup', geometry: 'point', label: 'Blind' },
  { id: 'trail_camera', category: 'setup', geometry: 'point', label: 'Trail camera' },
  { id: 'feeder_mineral', category: 'setup', geometry: 'point', label: 'Feeder / mineral' },
  { id: 'glassing_point', category: 'setup', geometry: 'point', label: 'Glassing point' },
  // Access
  { id: 'parking', category: 'access', geometry: 'point', label: 'Parking' },
  { id: 'access_point', category: 'access', geometry: 'point', label: 'Access point / gate' },
  { id: 'entry_route', category: 'access', geometry: 'line', label: 'Entry route' },
  { id: 'exit_route', category: 'access', geometry: 'line', label: 'Exit route' },
  // Property
  { id: 'boundary', category: 'property', geometry: 'polygon', label: 'Boundary' },
  { id: 'corner', category: 'property', geometry: 'point', label: 'Corner' },
  { id: 'neighbor_stand', category: 'property', geometry: 'point', label: 'Neighbor stand' },
  { id: 'no_hunt_zone', category: 'property', geometry: 'polygon', label: 'No-hunt / safety zone' },
  { id: 'hazard', category: 'property', geometry: 'point', label: 'Hazard' },
  // Events
  { id: 'sighting', category: 'event', geometry: 'point', label: 'Sighting' },
  { id: 'harvest', category: 'event', geometry: 'point', label: 'Harvest' },
  { id: 'hit_site', category: 'event', geometry: 'point', label: 'Hit site' },
  { id: 'blood', category: 'event', geometry: 'point', label: 'Blood' },
  { id: 'last_blood', category: 'event', geometry: 'point', label: 'Last blood' },
  { id: 'recovery', category: 'event', geometry: 'point', label: 'Recovery' },
  // Other
  { id: 'custom', category: 'custom', geometry: 'any', label: 'Custom' },
] as const satisfies readonly PinTypeDef[];

export type PinTypeId = (typeof PIN_TYPES)[number]['id'];

export const PinTypeId = z.enum(PIN_TYPES.map((t) => t.id) as [PinTypeId, ...PinTypeId[]]);

export const PIN_TYPES_BY_ID: Readonly<Record<PinTypeId, PinTypeDef>> = Object.fromEntries(
  PIN_TYPES.map((t) => [t.id, t]),
) as Record<PinTypeId, PinTypeDef>;
