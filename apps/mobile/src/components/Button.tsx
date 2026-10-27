import { Pressable, StyleSheet, Text, type PressableProps } from 'react-native';

import { colors, fontSize, minTouchTarget, radius, spacing } from '@/theme';

interface Props extends Omit<PressableProps, 'children'> {
  label: string;
  variant?: 'primary' | 'secondary';
}

/** Glove-sized button (spec §3.1, §14). */
export function Button({ label, variant = 'primary', disabled, style, ...rest }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      style={(state) => [
        styles.base,
        variant === 'primary' ? styles.primary : styles.secondary,
        (disabled || state.pressed) && styles.dim,
        typeof style === 'function' ? style(state) : style,
      ]}
      {...rest}
    >
      <Text style={[styles.label, variant === 'primary' && styles.primaryLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: minTouchTarget,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  primary: { backgroundColor: colors.accent },
  secondary: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border },
  dim: { opacity: 0.6 },
  label: { color: colors.text, fontSize: fontSize.md, fontWeight: '700' },
  primaryLabel: { color: colors.background },
});
