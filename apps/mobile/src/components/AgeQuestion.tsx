import type { AgeBracket } from '@huntbot/shared';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, spacing } from '@/theme';

import { Button } from './Button';

/** "How old are you?" — HuntBot is 13+ (spec §13.5). */
export function AgeQuestion({
  onAnswer,
  disabled,
}: {
  onAnswer: (bracket: AgeBracket) => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.root}>
      <Text style={styles.question}>How old are you?</Text>
      <Button label="18 or older" disabled={disabled} onPress={() => onAnswer('adult')} />
      <Button label="13 to 17" disabled={disabled} onPress={() => onAnswer('teen')} />
      <Button
        label="Under 13"
        variant="secondary"
        disabled={disabled}
        onPress={() => onAnswer('under_13')}
      />
      <Text style={styles.note}>We only keep whether you’re under 18 — never your birthday.</Text>
    </View>
  );
}

export function UnderThirteen() {
  return (
    <View style={styles.root}>
      <Text style={styles.question}>HuntBot is for ages 13 and up</Text>
      <Text style={styles.note}>
        Hunting with a parent or mentor? They can use HuntBot on their phone and take you along.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  question: { color: colors.text, fontSize: fontSize.lg, fontWeight: '700' },
  note: { color: colors.textMuted, fontSize: fontSize.sm, lineHeight: 20 },
});
