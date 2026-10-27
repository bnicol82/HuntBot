import { COMPASS_16, type CompassIndex, type CompassPoint } from '@huntbot/shared';

/** Normalize any angle to [0, 360). */
export function normalizeDeg(deg: number): number {
  const d = deg % 360;
  if (d === 0) return 0; // also folds -0
  const n = d < 0 ? d + 360 : d;
  // A tiny negative input (e.g. -1e-15) rounds to exactly 360 in floating point.
  return n >= 360 ? 0 : n;
}

/** Signed smallest difference b − a in (−180, 180]. */
export function angleDiff(a: number, b: number): number {
  const d = normalizeDeg(b - a);
  return d > 180 ? d - 360 : d;
}

/**
 * Wind direction is where the wind comes FROM (meteorological, degrees true).
 * Scent travels the opposite way (spec §7.1).
 */
export function scentAxisDeg(windFromDeg: number): number {
  return normalizeDeg(windFromDeg + 180);
}

export function compassIndex(deg: number): CompassIndex {
  return Math.round(normalizeDeg(deg) / 22.5) % 16;
}

export function compassIndexToDeg(index: CompassIndex): number {
  return index * 22.5;
}

export function compassPoint(deg: number): CompassPoint {
  return COMPASS_16[compassIndex(deg)]!;
}

/** "NW wind → your scent drifts SE." (spec §5.5 Wind HUD). */
export function describeWind(windFromDeg: number): string {
  return `${compassPoint(windFromDeg)} wind → your scent drifts ${compassPoint(scentAxisDeg(windFromDeg))}.`;
}
