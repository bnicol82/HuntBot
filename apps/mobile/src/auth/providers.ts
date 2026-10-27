import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';

import { authClient } from '@/lib/auth-client';
import { env, googleSignInConfigured } from '@/lib/env';

/** Result is `null` on success or user cancel; a message string on failure. */
type AuthResult = string | null;

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

export async function signInWithEmail(email: string, password: string): Promise<AuthResult> {
  const { error } = await authClient.signIn.email({ email, password });
  return error?.message ?? null;
}

export async function signUpWithEmail(email: string, password: string): Promise<AuthResult> {
  const name = email.split('@')[0] ?? '';
  const { error } = await authClient.signUp.email({ email, password, name });
  return error?.message ?? null;
}

/** Native Apple sheet → ID token → HuntBot API (no browser redirect). */
export async function signInWithApple(): Promise<AuthResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) return 'Apple did not return an identity token.';
    const { error } = await authClient.signIn.social({
      provider: 'apple',
      idToken: {
        token: credential.identityToken,
        // Apple only sends the name on the very first sign-in.
        user: {
          name: {
            firstName: credential.fullName?.givenName ?? undefined,
            lastName: credential.fullName?.familyName ?? undefined,
          },
        },
      },
    });
    return error?.message ?? null;
  } catch (e) {
    if (e && typeof e === 'object' && 'code' in e && e.code === 'ERR_REQUEST_CANCELED') return null;
    return messageOf(e);
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
    const { error } = await authClient.signIn.social({
      provider: 'google',
      idToken: { token: idToken },
    });
    return error?.message ?? null;
  } catch (e) {
    if (isErrorWithCode(e) && e.code === statusCodes.IN_PROGRESS) return null;
    return messageOf(e);
  }
}

export async function signOut(): Promise<void> {
  await authClient.signOut();
}
