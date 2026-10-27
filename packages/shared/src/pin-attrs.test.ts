import { describe, expect, it } from 'vitest';

import {
  AgeGateRequest,
  parseAttrs,
  PIN_TYPES,
  PIN_TYPES_BY_ID,
  Profile,
  ProfileUpdate,
  StandAttrs,
  US_STATES,
} from './index';

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

describe('profile schemas', () => {
  it('normalizes Postgres Dates and JSON strings to ISO timestamps', () => {
    const base = {
      id: '00000000-0000-4000-8000-000000000001',
      display_name: null,
      experience: 'beginner',
      home_state: 'WI',
      units: 'imperial',
      is_youth: false,
      age_confirmed_at: null,
      mentor_id: null,
    };
    const fromDb = Profile.parse({ ...base, created_at: new Date('2026-10-27T12:00:00Z') });
    const fromJson = Profile.parse({ ...base, created_at: '2026-10-27T12:00:00.000Z' });
    expect(fromDb).toEqual(fromJson);
  });

  it('accepts all 50 states and nothing else', () => {
    expect(Object.keys(US_STATES)).toHaveLength(50);
    expect(ProfileUpdate.safeParse({ home_state: 'TX' }).success).toBe(true);
    expect(ProfileUpdate.safeParse({ home_state: 'XX' }).success).toBe(false);
  });

  it('only allows self-editable profile fields', () => {
    expect(ProfileUpdate.safeParse({ is_youth: false }).success).toBe(false);
  });

  it('rejects under-13 at the age gate', () => {
    expect(AgeGateRequest.safeParse({ bracket: 'under_13' }).success).toBe(false);
    expect(AgeGateRequest.safeParse({ bracket: 'teen' }).success).toBe(true);
  });
});
