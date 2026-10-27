/**
 * Design tokens (spec §14). Field-dark is the default; red-night preserves night vision
 * in the stand (automatic in Hunt Mode before sunrise / after sunset). No white anywhere.
 */

export interface ThemeTokens {
  name: 'field-dark' | 'red-night';
  background: string;
  surface: string;
  surfaceRaised: string;
  border: string;
  text: string;
  textMuted: string;
  accent: string;
  good: string;
  marginal: string;
  bad: string;
  /** Scent cone risk bands, high → low. */
  scentHigh: string;
  scentMedium: string;
  scentLow: string;
}

export const fieldDark: ThemeTokens = {
  name: 'field-dark',
  background: '#0E110D',
  surface: '#171B15',
  surfaceRaised: '#21271E',
  border: '#323A2C',
  text: '#E6E9DF',
  textMuted: '#9AA390',
  accent: '#E0892B',
  good: '#4CAF6A',
  marginal: '#E2B33B',
  bad: '#E0533D',
  scentHigh: 'rgba(224, 83, 61, 0.55)',
  scentMedium: 'rgba(226, 179, 59, 0.40)',
  scentLow: 'rgba(226, 179, 59, 0.18)',
};

export const redNight: ThemeTokens = {
  name: 'red-night',
  background: '#000000',
  surface: '#0D0000',
  surfaceRaised: '#1A0202',
  border: '#330505',
  text: '#C21818',
  textMuted: '#7A0E0E',
  accent: '#E01E1E',
  // Status colors collapse to brightness steps of red; pair them with icons/labels, never color alone.
  good: '#8C1010',
  marginal: '#B31515',
  bad: '#E01E1E',
  scentHigh: 'rgba(224, 30, 30, 0.45)',
  scentMedium: 'rgba(179, 21, 21, 0.30)',
  scentLow: 'rgba(140, 16, 16, 0.18)',
};

export const themes = { 'field-dark': fieldDark, 'red-night': redNight } as const;

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32 } as const;

/** Glove-friendly minimum touch target (pt/dp). */
export const minTouchTarget = 56;

export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;

export const fontSize = { sm: 14, md: 17, lg: 22, xl: 32, hero: 56 } as const;
