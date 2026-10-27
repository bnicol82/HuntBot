import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export type PermissionState = 'unknown' | 'granted' | 'denied';

export interface Fix {
  lon: number;
  lat: number;
  accuracyM: number | null;
  altitudeM: number | null;
  at: number;
}

/** Foreground location only. Background tracking arrives with tracks in M1. */
export function useForegroundLocation() {
  const [permission, setPermission] = useState<PermissionState>('unknown');
  const [fix, setFix] = useState<Fix | null>(null);

  useEffect(() => {
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== Location.PermissionStatus.GRANTED) {
        setPermission('denied');
        return;
      }
      setPermission('granted');
      sub = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.BestForNavigation, distanceInterval: 5 },
        ({ coords, timestamp }) =>
          setFix({
            lon: coords.longitude,
            lat: coords.latitude,
            accuracyM: coords.accuracy,
            altitudeM: coords.altitude,
            at: timestamp,
          }),
      );
      if (cancelled) sub.remove();
    })().catch(() => setPermission('denied'));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, []);

  return { permission, fix };
}
