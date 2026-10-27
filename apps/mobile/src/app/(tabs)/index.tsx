import { formatDecimal } from '@windfall/geo';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { signOut } from '@/auth/providers';
import { Compass } from '@/components/Compass';
import { supabase } from '@/lib/supabase';
import { useForegroundLocation } from '@/location/useLocation';
import { useTrueHeading } from '@/location/useTrueHeading';
import { HuntMap, mapConfigured } from '@/map/HuntMap';
import { BASE_LAYERS, type BaseLayerId } from '@/map/layers';
import { colors, fontSize, minTouchTarget, radius, spacing } from '@/theme';

export default function MapScreen() {
  const [layer, setLayer] = useState<BaseLayerId>('hybrid');
  const [followUser, setFollowUser] = useState(true);
  const [headingUp, setHeadingUp] = useState(false);
  const { permission, fix } = useForegroundLocation();
  const heading = useTrueHeading(permission === 'granted');

  return (
    <View style={styles.root}>
      {mapConfigured ? (
        <HuntMap
          layer={layer}
          followUser={followUser}
          onUserPan={() => setFollowUser(false)}
          headingUp={headingUp}
        />
      ) : (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Set EXPO_PUBLIC_MAPBOX_TOKEN to show the map.</Text>
        </View>
      )}

      <SafeAreaView style={styles.overlay} edges={['top']} pointerEvents="box-none">
        <View style={styles.row} pointerEvents="box-none">
          <View style={styles.segment}>
            {BASE_LAYERS.map((l) => (
              <Pressable
                key={l.id}
                onPress={() => setLayer(l.id)}
                style={[styles.segmentItem, layer === l.id && styles.segmentActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: layer === l.id }}
              >
                <Text style={[styles.segmentLabel, layer === l.id && styles.segmentLabelActive]}>
                  {l.label}
                </Text>
              </Pressable>
            ))}
          </View>
          {supabase && (
            <Pressable
              onPress={() => void signOut()}
              style={styles.chip}
              accessibilityRole="button"
            >
              <Text style={styles.chipLabel}>Sign out</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.row} pointerEvents="box-none">
          <Compass
            heading={heading}
            headingUp={headingUp}
            onToggle={() => setHeadingUp((v) => !v)}
          />
          {!followUser && (
            <Pressable
              onPress={() => setFollowUser(true)}
              style={styles.chip}
              accessibilityRole="button"
            >
              <Text style={styles.chipLabel}>Center on me</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.coords}>
          <Text style={styles.coordsText}>
            {permission === 'denied'
              ? 'Location off — enable it in Settings to see where you are.'
              : fix
                ? `${formatDecimal([fix.lon, fix.lat], 5)}${fix.accuracyM != null ? `  ±${Math.round(fix.accuracyM)} m` : ''}`
                : 'Finding your location…'}
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  notice: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  noticeText: { color: colors.textMuted, fontSize: fontSize.md, textAlign: 'center' },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    gap: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  segmentItem: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
  },
  segmentActive: { backgroundColor: colors.surfaceRaised },
  segmentLabel: { color: colors.textMuted, fontSize: fontSize.sm, fontWeight: '600' },
  segmentLabelActive: { color: colors.accent },
  chip: {
    minHeight: minTouchTarget,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipLabel: { color: colors.text, fontSize: fontSize.sm, fontWeight: '600' },
  coords: {
    alignSelf: 'flex-start',
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  coordsText: { color: colors.text, fontSize: fontSize.sm, fontVariant: ['tabular-nums'] },
});
