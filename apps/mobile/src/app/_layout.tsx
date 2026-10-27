import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { signOut } from '@/auth/providers';
import { Button } from '@/components/Button';
import { backendConfigured } from '@/lib/env';
import { colors, fontSize, spacing } from '@/theme';

void SplashScreen.preventAutoHideAsync();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
    primary: colors.accent,
  },
};

function RootStack() {
  const { signedIn, profile, loading, error, reload } = useAuth();

  useEffect(() => {
    if (!loading) void SplashScreen.hideAsync();
  }, [loading]);

  if (loading) return null;

  // Signed in but the profile didn't load (offline at first launch, API down).
  if (backendConfigured && signedIn && !profile) {
    return (
      <View style={styles.error}>
        <Text style={styles.errorText}>
          Couldn’t load your HuntBot profile{error ? `: ${error}` : '.'}
        </Text>
        <Button label="Try again" onPress={reload} />
        <Button label="Sign out" variant="secondary" onPress={() => void signOut()} />
      </View>
    );
  }

  // Without an API (local UI work) the app runs signed-out but usable.
  const ready = !backendConfigured || (signedIn && Boolean(profile?.age_confirmed_at));
  const needsAge = backendConfigured && signedIn && !profile?.age_confirmed_at;

  return (
    <Stack
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}
    >
      <Stack.Protected guard={ready}>
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>
      <Stack.Protected guard={needsAge}>
        <Stack.Screen name="age-gate" />
      </Stack.Protected>
      <Stack.Protected guard={!ready && !needsAge}>
        <Stack.Screen name="sign-in" />
      </Stack.Protected>
    </Stack>
  );
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  errorText: { color: colors.text, fontSize: fontSize.md },
});

export default function RootLayout() {
  return (
    <ThemeProvider value={navTheme}>
      <StatusBar style="light" />
      <AuthProvider>
        <RootStack />
      </AuthProvider>
    </ThemeProvider>
  );
}
