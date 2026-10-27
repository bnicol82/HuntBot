import type { AgeBracket } from '@huntbot/shared';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  signInWithApple,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from '@/auth/providers';
import { setPendingAgeBracket } from '@/auth/age';
import { AgeQuestion, UnderThirteen } from '@/components/AgeQuestion';
import { Button } from '@/components/Button';
import { googleSignInConfigured } from '@/lib/env';
import { colors, fontSize, minTouchTarget, radius, spacing } from '@/theme';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [appleAvailable, setAppleAvailable] = useState(false);
  // Age is asked before any account exists, so under-13s never sign up (spec §13.5).
  const [age, setAge] = useState<AgeBracket | null>(null);

  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAvailable, () => setAppleAvailable(false));
  }, []);

  async function run(fn: () => Promise<string | null>) {
    setBusy(true);
    setMessage(null);
    const error = await fn();
    setBusy(false);
    setMessage(error);
  }

  const emailReady = email.includes('@') && password.length >= 8;

  async function answerAge(bracket: AgeBracket) {
    if (bracket !== 'under_13') await setPendingAgeBracket(bracket);
    setAge(bracket);
  }

  const header = (
    <View style={styles.header}>
      <Text style={styles.title}>HuntBot</Text>
      <Text style={styles.subtitle}>Read the wind. Learn your ground.</Text>
    </View>
  );

  if (age === null || age === 'under_13') {
    return (
      <SafeAreaView style={styles.root}>
        <View style={styles.inner}>
          {header}
          {age === 'under_13' ? (
            <>
              <UnderThirteen />
              <Button label="Back" variant="secondary" onPress={() => setAge(null)} />
            </>
          ) : (
            <AgeQuestion onAnswer={(b) => void answerAge(b)} />
          )}
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.inner}
      >
        {header}

        {appleAvailable && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
            cornerRadius={radius.md}
            style={styles.apple}
            onPress={() => run(signInWithApple)}
          />
        )}
        {googleSignInConfigured && (
          <Button
            label="Continue with Google"
            variant="secondary"
            disabled={busy}
            onPress={() => run(signInWithGoogle)}
          />
        )}

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            style={styles.input}
            placeholder="Password (8+ characters)"
            placeholderTextColor={colors.textMuted}
            secureTextEntry
            autoComplete="password"
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />
          <Button
            label="Sign in"
            disabled={busy || !emailReady}
            onPress={() => run(() => signInWithEmail(email, password))}
          />
          <Button
            label="Create account"
            variant="secondary"
            disabled={busy || !emailReady}
            onPress={() => run(() => signUpWithEmail(email, password))}
          />
        </View>

        {message && <Text style={styles.message}>{message}</Text>}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { flex: 1, padding: spacing.lg, gap: spacing.md, justifyContent: 'center' },
  header: { marginBottom: spacing.lg },
  title: { color: colors.text, fontSize: fontSize.hero, fontWeight: '800' },
  subtitle: { color: colors.textMuted, fontSize: fontSize.md },
  apple: { height: minTouchTarget },
  form: { gap: spacing.sm, marginTop: spacing.md },
  input: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    color: colors.text,
    paddingHorizontal: spacing.md,
    fontSize: fontSize.md,
  },
  message: { color: colors.marginal, fontSize: fontSize.sm, textAlign: 'center' },
});
