import Mapbox from '@rnmapbox/maps';

/**
 * Base layers (spec §5.1). M0 ships satellite, hybrid and topo; hillshade and the
 * P1 data layers arrive in M1+. All map-SDK specifics stay in src/map/ so a swap to
 * MapLibre touches one folder (spec §9).
 */
export const BASE_LAYERS = [
  { id: 'satellite', label: 'Satellite', styleURL: Mapbox.StyleURL.Satellite },
  { id: 'hybrid', label: 'Hybrid', styleURL: Mapbox.StyleURL.SatelliteStreet },
  { id: 'topo', label: 'Topo', styleURL: Mapbox.StyleURL.Outdoors },
] as const;

export type BaseLayerId = (typeof BASE_LAYERS)[number]['id'];
