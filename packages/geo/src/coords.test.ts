import { describe, expect, it } from 'vitest';

import { formatDecimal, formatDMS } from './coords';

describe('coordinate formats', () => {
  it('formats decimal as lat, lon', () => {
    expect(formatDecimal([-89.4012, 43.0731])).toBe('43.073100, -89.401200');
  });

  it('formats DMS with hemispheres', () => {
    expect(formatDMS([-89.4012, 43.0731])).toBe('43°04′23.2″N 89°24′04.3″W');
    expect(formatDMS([151.2093, -33.8688])).toBe('33°52′07.7″S 151°12′33.5″E');
  });

  it('carries rounded seconds into minutes', () => {
    expect(formatDMS([0, 10.9999999])).toBe('11°00′00.0″N 0°00′00.0″E');
  });
});
