import type { AgeGateRequest } from '@huntbot/shared';
import * as SecureStore from 'expo-secure-store';

/**
 * The age answer is given before sign-in (so under-13s never create an account), held on the
 * device until there's a session, then sent once to the API. Only the bracket is kept — never a
 * birth date (spec §13.5).
 */
const KEY = 'huntbot.pending_age_bracket';

type Bracket = AgeGateRequest['bracket'];

export async function setPendingAgeBracket(bracket: Bracket) {
  await SecureStore.setItemAsync(KEY, bracket);
}

export async function takePendingAgeBracket(): Promise<Bracket | null> {
  const v = await SecureStore.getItemAsync(KEY);
  return v === 'teen' || v === 'adult' ? v : null;
}

export async function clearPendingAgeBracket() {
  await SecureStore.deleteItemAsync(KEY);
}
