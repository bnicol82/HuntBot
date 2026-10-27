import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fontSize, spacing } from '@/theme';

/** Stand-in for tabs whose features land in later milestones. */
export function Placeholder({
  title,
  milestone,
  body,
}: {
  title: string;
  milestone: string;
  body: string;
}) {
  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.inner}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.milestone}>Coming in {milestone}</Text>
        <Text style={styles.body}>{body}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  inner: { padding: spacing.lg, gap: spacing.sm },
  title: { color: colors.text, fontSize: fontSize.xl, fontWeight: '700' },
  milestone: { color: colors.accent, fontSize: fontSize.sm, fontWeight: '700' },
  body: { color: colors.textMuted, fontSize: fontSize.md, lineHeight: 24 },
});
