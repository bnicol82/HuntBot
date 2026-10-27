import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Public, bundle-safe config only (spec §10.4). Secrets never get an EXPO_PUBLIC_ prefix.
 * `process.env.EXPO_PUBLIC_*` must be referenced literally so Metro can inline it.
 */
const Env = z.object({
  apiUrl: z.url().optional(),
  mapboxToken: z.string().startsWith('pk.').optional(),
  googleWebClientId: z.string().min(1).optional(),
  googleIosClientId: z.string().min(1).optional(),
});

const blankToUndefined = (v: string | undefined) => (v ? v : undefined);

export const env = Env.parse({
  apiUrl: blankToUndefined(process.env.EXPO_PUBLIC_API_URL),
  mapboxToken: blankToUndefined(process.env.EXPO_PUBLIC_MAPBOX_TOKEN),
  googleWebClientId: blankToUndefined(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  googleIosClientId: blankToUndefined(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
});

/** Without an API URL (local UI work) the app runs signed-out but usable. */
export const backendConfigured = Boolean(env.apiUrl);

export const googleSignInConfigured =
  Boolean(Constants.expoConfig?.extra?.googleSignInConfigured) && Boolean(env.googleWebClientId);
