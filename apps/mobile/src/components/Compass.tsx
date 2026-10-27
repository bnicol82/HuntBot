import { compassPoint } from '@huntbot/hunt-engine';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Heading } from '@/location/useTrueHeading';
import { colors, fontSize, minTouchTarget, radius, spacing } from '@/theme';

interface Props {
  heading: Heading | null;
  headingUp: boolean;
  onToggle: () => void;
}

/** True-heading readout; tap toggles north-up / heading-up. */
export function Compass({ heading, headingUp, onToggle }: Props) {
  const label = heading ? `${Math.round(heading.deg)}° ${compassPoint(heading.deg)}` : '—';
  const lowAccuracy = heading !== null && heading.accuracy < 2;

  return (
    <Pressable
      onPress={onToggle}
      style={styles.box}
      accessibilityRole="button"
      accessibilityLabel={`Heading ${label}, true north. ${headingUp ? 'Heading up' : 'North up'}. Tap to switch.`}
    >
      <View style={[styles.needle, { transform: [{ rotate: `${-(heading?.deg ?? 0)}deg` }] }]}>
        <Text style={styles.north}>N</Text>
      </View>
      <View>
        <Text style={styles.value}>{label}</Text>
        <Text style={styles.caption}>
          {headingUp ? 'Heading up' : 'North up'} · true{lowAccuracy ? ' · calibrate' : ''}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    minHeight: minTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  needle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: colors.textMuted,
    alignItems: 'center',
  },
  north: { color: colors.accent, fontWeight: '800', fontSize: 12 },
  value: {
    color: colors.text,
    fontSize: fontSize.md,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  caption: { color: colors.textMuted, fontSize: 12 },
});
