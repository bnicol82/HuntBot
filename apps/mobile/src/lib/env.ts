import Constants from 'expo-constants';
import { z } from 'zod';

/**
 * Public, bundle-safe config only (spec §10.4). Secrets never get an EXPO_PUBLIC_ prefix.
 * `process.env.EXPO_PUBLIC_*` must be referenced literally so Metro can inline it.
 */
const Env = z.object({
  supabaseUrl: z.url().optional(),
  supabaseKey: z.string().min(1).optional(),
  mapboxToken: z.string().startsWith('pk.').optional(),
  googleWebClientId: z.string().min(1).optional(),
  googleIosClientId: z.string().min(1).optional(),
});

const blankToUndefined = (v: string | undefined) => (v ? v : undefined);

export const env = Env.parse({
  supabaseUrl: blankToUndefined(process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabaseKey: blankToUndefined(process.env.EXPO_PUBLIC_SUPABASE_KEY),
  mapboxToken: blankToUndefined(process.env.EXPO_PUBLIC_MAPBOX_TOKEN),
  googleWebClientId: blankToUndefined(process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID),
  googleIosClientId: blankToUndefined(process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID),
});

export const googleSignInConfigured =
  Boolean(Constants.expoConfig?.extra?.googleSignInConfigured) && Boolean(env.googleWebClientId);
