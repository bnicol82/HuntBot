import { Profile, ProfileUpdate } from '@huntbot/shared';

import type { Tx } from './index';

const COLUMNS =
  'id, display_name, experience, home_state, units, is_youth, age_confirmed_at, mentor_id, created_at';

function toProfile(row: unknown): Profile {
  return Profile.parse(row);
}

/** The caller's own profile (RLS limits `profiles` to it). */
export async function getMyProfile(tx: Tx): Promise<Profile | null> {
  const { rows } = await tx.query(`select ${COLUMNS} from public.profiles`);
  return rows[0] ? toProfile(rows[0]) : null;
}

export async function updateMyProfile(tx: Tx, update: ProfileUpdate): Promise<Profile | null> {
  const fields = Object.entries(ProfileUpdate.parse(update)).filter(([, v]) => v !== undefined);
  if (fields.length === 0) return getMyProfile(tx);
  // Column names come from the Zod schema's keys, never from user input.
  const sets = fields.map(([k], i) => `${k} = $${i + 1}`).join(', ');
  const { rows } = await tx.query(
    `update public.profiles set ${sets} where id = app.uid() returning ${COLUMNS}`,
    fields.map(([, v]) => v),
  );
  return rows[0] ? toProfile(rows[0]) : null;
}

/** Records the sign-up age answer. Only the first answer sticks (enforced in SQL). */
export async function confirmMyAge(tx: Tx, isYouth: boolean): Promise<Profile> {
  const { rows } = await tx.query(`select ${COLUMNS} from public.confirm_age($1)`, [isYouth]);
  return toProfile(rows[0]);
}
