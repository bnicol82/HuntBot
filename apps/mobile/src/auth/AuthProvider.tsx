import type { Profile } from '@huntbot/shared';
import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';

import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { backendConfigured } from '@/lib/env';

import { clearPendingAgeBracket, takePendingAgeBracket } from './age';

interface AuthState {
  signedIn: boolean;
  profile: Profile | null;
  loading: boolean;
  error: string | null;
  setProfile: (p: Profile) => void;
  reload: () => void;
}

type Loaded = { key: string; profile: Profile | null; error: string | null };

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = authClient.useSession();
  const userId = session?.user.id ?? null;
  const [attempt, setAttempt] = useState(0);
  // Results are tagged with the user + attempt they belong to, so a stale result never shows.
  const key = userId ? `${userId}:${attempt}` : null;
  const [loaded, setLoaded] = useState<Loaded | null>(null);

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    (async () => {
      let p = await api.getMe();
      // Answer given on the sign-in screen before the account existed.
      if (!p.age_confirmed_at) {
        const pending = await takePendingAgeBracket();
        if (pending) p = await api.confirmAge(pending);
      }
      if (p.age_confirmed_at) await clearPendingAgeBracket();
      return p;
    })().then(
      (p) => !cancelled && setLoaded({ key, profile: p, error: null }),
      (e: Error) => !cancelled && setLoaded({ key, profile: null, error: e.message }),
    );
    return () => {
      cancelled = true;
    };
  }, [key]);

  const current = key && loaded?.key === key ? loaded : null;
  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const setProfile = useCallback(
    (p: Profile) => key && setLoaded({ key, profile: p, error: null }),
    [key],
  );

  const value: AuthState = {
    signedIn: Boolean(userId),
    profile: current?.profile ?? null,
    loading: backendConfigured && (isPending || (Boolean(key) && !current)),
    error: current?.error ?? null,
    setProfile,
    reload,
  };

  return <AuthContext value={value}>{children}</AuthContext>;
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
