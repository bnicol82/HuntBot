import * as AppleAuthentication from 'expo-apple-authentication';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

import { env, googleSignInConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';

/** Result is `null` on success or user cancel; a message string on failure. */
type AuthResult = string | null;

function requireClient() {
  if (!supabase) throw new Error('Supabase is not configured for this build.');
  return supabase;
}

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await requireClient().auth.signInWithPassword({ email, password });
  return error?.message ?? null;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await requireClient().auth.signUp({ email, password });
  return error?.message ?? null;
}

export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return 'Apple did not return an identity token.';
    const { error } = await requireClient().auth.signInWithIdToken({
      provider: 'apple',
      token: credential.identityToken,
    });
    return error?.message ?? null;
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') return null;
    return e instanceof Error ? e.message : String(e);
  }
}

let googleConfigured = false;

export async function signInWithGoogle(): Promise<AuthResult> {
  if (!googleSignInConfigured) return 'Google sign-in is not configured for this build.';
  try {
    if (!googleConfigured) {
      GoogleSignin.configure({
        webClientId: env.googleWebClientId,
        iosClientId: env.googleIosClientId,
      });
      googleConfigured = true;
    }
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) return null; // cancelled
    const idToken = response.data.idToken;
    if (!idToken) return 'Google did not return an ID token.';
    const { error } = await requireClient().auth.signInWithIdToken({
      provider: 'google',
      token: idToken,
    });
    return error?.message ?? null;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    return e instanceof Error ? e.message : String(e);
  }
}

export async function signOut(): Promise<void> {
  await supabase?.auth.signOut();
}
