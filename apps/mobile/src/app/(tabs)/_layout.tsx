import { NativeTabs } from 'expo-router/native-tabs';

import { colors } from '@/theme';

/** Tabs: Map · Hunt · Scout · Cams · Journal (spec §14). */
export default function TabsLayout() {
  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={colors.surfaceRaised}
      iconColor={{ default: colors.textMuted, selected: colors.accent }}
      labelStyle={{ default: { color: colors.textMuted }, selected: { color: colors.accent } }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Map</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="hunt">
        <NativeTabs.Trigger.Label>Hunt</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="scope" md="my_location" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="scout">
        <NativeTabs.Trigger.Label>Scout</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="binoculars" md="explore" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="cams">
        <NativeTabs.Trigger.Label>Cams</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="camera" md="photo_camera" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="journal">
        <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="book" md="menu_book" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
