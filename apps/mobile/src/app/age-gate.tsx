import type { AgeBracket } from '@huntbot/shared';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { signOut } from '@/auth/providers';
import { AgeQuestion, UnderThirteen } from '@/components/AgeQuestion';
import { Button } from '@/components/Button';
import { api } from '@/lib/api';
import { authClient } from '@/lib/auth-client';
import { colors, fontSize, spacing } from '@/theme';

/** Shown to a signed-in account that hasn't answered the age question yet (e.g. a new device). */
export default function AgeGate() {
  const { setProfile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function answer(bracket: AgeBracket) {
    if (bracket === 'under_13') {
      // Don't keep an under-13's account (spec §13.5): delete it, which also signs out.
      setBlocked(true);
      const { error } = await authClient.deleteUser();
      if (error) setMessage(`We couldn't remove this account: ${error.message ?? 'unknown error'}`);
      return;
    }
    setBusy(true);
    setMessage(null);
    try {
      setProfile(await api.confirmAge(bracket));
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        {blocked ? (
          <>
            <UnderThirteen />
            <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
          </>
        ) : (
          <AgeQuestion disabled={busy} onAnswer={(b) => void answer(b)} />
        )}
        {message && <Text style={styles.message}>{message}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  message: { color: colors.marginal, fontSize: fontSize.sm, textAlign: 'center' },
});
