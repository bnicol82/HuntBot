import fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import {
  angleDiff,
  compassIndex,
  compassPoint,
  describeWind,
  normalizeDeg,
  scentAxisDeg,
} from './angles';
import { DEFAULT_ENGINE_CONFIG, withOverrides } from './config';

const anyAngle = fc.double({ min: -1e4, max: 1e4, noNaN: true });

describe('angles', () => {
  it('normalizes into [0, 360)', () => {
    fc.assert(
      fc.property(anyAngle, (a) => {
        const n = normalizeDeg(a);
        return n >= 0 && n < 360;
      }),
    );
    expect(normalizeDeg(-90)).toBe(270);
    expect(normalizeDeg(720)).toBe(0);
  });

  it('angleDiff is in (-180, 180] and antisymmetric', () => {
    fc.assert(
      fc.property(anyAngle, anyAngle, (a, b) => {
        const d = angleDiff(a, b);
        expect(d).toBeGreaterThan(-180);
        expect(d).toBeLessThanOrEqual(180);
        if (Math.abs(d) < 180 - 1e-6) expect(angleDiff(b, a)).toBeCloseTo(-d, 6);
      }),
    );
    expect(angleDiff(350, 10)).toBe(20);
    expect(angleDiff(10, 350)).toBe(-20);
  });

  it('scent axis is wind-from + 180', () => {
    expect(scentAxisDeg(0)).toBe(180);
    expect(scentAxisDeg(315)).toBe(135);
    // Floating-point rounding can leave the difference a hair off 180°.
    fc.assert(
      fc.property(anyAngle, (a) => Math.abs(Math.abs(angleDiff(a, scentAxisDeg(a))) - 180) < 1e-9),
    );
  });

  it('maps degrees to 16-point compass', () => {
    expect(compassIndex(0)).toBe(0);
    expect(compassIndex(359)).toBe(0);
    expect(compassIndex(90)).toBe(4);
    expect(compassPoint(315)).toBe('NW');
    expect(compassPoint(11.2)).toBe('N');
    expect(compassPoint(11.3)).toBe('NNE');
  });

  it('describes wind in plain words', () => {
    expect(describeWind(315)).toBe('NW wind → your scent drifts SE.');
  });
});

describe('config', () => {
  it('merges overrides per section', () => {
    const cfg = withOverrides({ verdict: { shiftDeg: 60 } });
    expect(cfg.verdict.shiftDeg).toBe(60);
    expect(cfg.verdict.badBustedFraction).toBe(DEFAULT_ENGINE_CONFIG.verdict.badBustedFraction);
    expect(cfg.cone).toEqual(DEFAULT_ENGINE_CONFIG.cone);
  });
});
