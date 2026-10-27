import * as Location from 'expo-location';
import { useEffect, useState } from 'react';

export interface Heading {
  /** Degrees true, [0, 360). */
  deg: number;
  /** 0 (uncalibrated) … 3 (high). */
  accuracy: number;
}

/**
 * True heading via `watchHeadingAsync` (spec §9). `trueHeading` is -1 until a location fix
 * lets the OS correct for declination; we report null rather than fall back to magnetic,
 * because a 10°+ declination error would mislead wind and back-to-truck bearings.
 */
export function useTrueHeading(enabled: boolean) {
  const [heading, setHeading] = useState<Heading | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let sub: Location.LocationSubscription | undefined;
    let cancelled = false;
    Location.watchHeadingAsync(({ trueHeading, accuracy }) => {
      setHeading(trueHeading >= 0 ? { deg: trueHeading % 360, accuracy } : null);
    })
      .then((s) => {
        if (cancelled) s.remove();
        else sub = s;
      })
      .catch(() => setHeading(null));
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [enabled]);

  return heading;
}
