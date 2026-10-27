import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { PIN_TYPES } from './pin-types';

const migrationsDir = fileURLToPath(new URL('../../../supabase/migrations', import.meta.url));

/** Parse `('id', 'category', 'geometry', alt|null, halfLife|null)` rows from the pin_types seed. */
function sqlPinTypes() {
  const sql = readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()
    .map((f) => readFileSync(join(migrationsDir, f), 'utf8'))
    .join('\n');
  const block = sql.match(/insert into public\.pin_types[^;]+;/)?.[0];
  if (!block) throw new Error('pin_types seed not found');
  const row = /\(\s*'(\w+)',\s*'(\w+)',\s*'(\w+)',\s*(?:'(\w+)'|null),\s*(\d+|null)\s*\)/g;
  return [...block.matchAll(row)].map((m) => ({
    id: m[1],
    category: m[2],
    geometry: m[3],
    altGeometry: m[4],
    halfLifeDays: m[5] === 'null' ? undefined : Number(m[5]),
  }));
}

describe('pin types stay in sync with the database seed', () => {
  it('matches supabase/migrations', () => {
    const fromTs = PIN_TYPES.map((t) => ({
      id: t.id,
      category: t.category,
      geometry: t.geometry,
      altGeometry: 'altGeometry' in t ? t.altGeometry : undefined,
      halfLifeDays: 'halfLifeDays' in t ? t.halfLifeDays : undefined,
    }));
    expect(sqlPinTypes()).toEqual(fromTs);
  });
});
