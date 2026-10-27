import Mapbox from '@rnmapbox/maps';
import { StyleSheet } from 'react-native';

import { env } from '@/lib/env';

import { BASE_LAYERS, type BaseLayerId } from './layers';

if (env.mapboxToken) void Mapbox.setAccessToken(env.mapboxToken);

export const mapConfigured = Boolean(env.mapboxToken);

interface Props {
  layer: BaseLayerId;
  /** Keep the camera on the user. Turned off when the user pans. */
  followUser: boolean;
  onUserPan: () => void;
  headingUp: boolean;
}

export function HuntMap({ layer, followUser, onUserPan, headingUp }: Props) {
  const styleURL = BASE_LAYERS.find((l) => l.id === layer)!.styleURL;

  return (
    <Mapbox.MapView
      style={StyleSheet.absoluteFill}
      styleURL={styleURL}
      scaleBarEnabled
      compassEnabled={false}
      logoPosition={{ bottom: 8, left: 8 }}
      attributionPosition={{ bottom: 8, right: 8 }}
      onCameraChanged={(state) => {
        if (state.gestures.isGestureActive && followUser) onUserPan();
      }}
    >
      <Mapbox.Camera
        followUserLocation={followUser}
        followUserMode={
          headingUp ? Mapbox.UserTrackingMode.FollowWithHeading : Mapbox.UserTrackingMode.Follow
        }
        followZoomLevel={15}
        defaultSettings={{ zoomLevel: 3, centerCoordinate: [-96, 39] }}
      />
      <Mapbox.LocationPuck puckBearing="heading" puckBearingEnabled pulsing={{ isEnabled: true }} />
    </Mapbox.MapView>
  );
}
