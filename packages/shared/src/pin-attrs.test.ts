import { describe, expect, it } from 'vitest';

import { parseAttrs, PIN_TYPES, PIN_TYPES_BY_ID, StandAttrs } from './index';

describe('pin types', () => {
  it('has unique ids', () => {
    const ids = PIN_TYPES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('uses the spec default half-lives', () => {
    expect(PIN_TYPES_BY_ID.tracks.halfLifeDays).toBe(3);
    expect(PIN_TYPES_BY_ID.droppings.halfLifeDays).toBe(3);
    expect(PIN_TYPES_BY_ID.scrape.halfLifeDays).toBe(14);
    expect(PIN_TYPES_BY_ID.bed.halfLifeDays).toBe(14);
    expect(PIN_TYPES_BY_ID.rub.halfLifeDays).toBe(30);
  });
});

describe('attrs schemas', () => {
  it('accepts a valid stand and defaults weapon', () => {
    const r = StandAttrs.parse({
      standType: 'hang_on',
      heightFt: 20,
      idealWindsFrom: [12, 13, 14],
      bestTimes: ['pm'],
      bestPhases: ['pre_rut'],
    });
    expect(r.weapon).toBe('both');
  });

  it('rejects out-of-range compass indices and heights', () => {
    expect(
      parseAttrs('stand', {
        standType: 'ladder',
        idealWindsFrom: [16],
        bestTimes: [],
        bestPhases: [],
      }).success,
    ).toBe(false);
    expect(
      parseAttrs('stand', {
        standType: 'ladder',
        heightFt: 41,
        idealWindsFrom: [],
        bestTimes: [],
        bestPhases: [],
      }).success,
    ).toBe(false);
  });

  it('accepts empty attrs for types without specific fields', () => {
    expect(parseAttrs('tracks', undefined).success).toBe(true);
    expect(parseAttrs('scrape', {}).success).toBe(true);
  });
});
