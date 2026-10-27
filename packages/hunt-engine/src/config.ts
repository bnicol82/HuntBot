/**
 * Engine constants (spec §7). These are STARTING VALUES to tune with field data.
 * `content/engine.yaml` may override any of them; see `withOverrides`.
 */
const DEFAULTS = {
  cone: {
    baseHalfAngleDeg: 15,
    sigmaDirWeight: 0.8,
    gustHalfAngleDeg: 20,
    minHalfAngleDeg: 12,
    maxHalfAngleDeg: 75,
    calmMph: 3,
    calmRadiusYd: 100,
    /** [maxMphExclusive, lengthYd] — first band whose max exceeds the speed wins. */
    lengthBands: [
      [8, 400],
      [15, 350],
      [Infinity, 300],
    ] as ReadonlyArray<readonly [number, number]>,
  },
  approach: {
    maxOriginDistanceYd: 600,
  },
  verdict: {
    badBustedFraction: 0.4,
    marginalBustedFraction: 0.15,
    shiftDeg: 45,
    shiftWindowMin: 180,
    variableSigmaDeg: 30,
    thermalReliefFt: 40,
  },
  thermals: {
    warmupMin: 60,
    thermalMph: 2,
    overrideMph: 8,
    fullSlopeDeg: 15,
    cloudDampingAtOvercast: 0.3,
    overcastCloudPct: 80,
  },
  legalLight: {
    defaultBeforeSunriseMin: 30,
    defaultAfterSunsetMin: 30,
  },
  glare: {
    azimuthToleranceDeg: 20,
    maxSunAltitudeDeg: 15,
  },
  tips: {
    normalThrottleMin: 20,
  },
} as const;

type Widen<T> = T extends number
  ? number
  : T extends string
    ? string
    : T extends ReadonlyArray<infer U>
      ? ReadonlyArray<Widen<U>>
      : { readonly [K in keyof T]: Widen<T[K]> };

export type EngineConfig = Widen<typeof DEFAULTS>;

export const DEFAULT_ENGINE_CONFIG: EngineConfig = DEFAULTS;

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] };

/** Shallow-per-section merge of overrides (from `content/engine.yaml`) onto the defaults. */
export function withOverrides(overrides: DeepPartial<EngineConfig> = {}): EngineConfig {
  const out: Record<string, unknown> = {};
  for (const key of Object.keys(DEFAULT_ENGINE_CONFIG) as Array<keyof EngineConfig>) {
    out[key] = { ...DEFAULT_ENGINE_CONFIG[key], ...(overrides[key] ?? {}) };
  }
  return out as EngineConfig;
}
