import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Native identifiers are placeholders until the founders pick a name (spec §20.5).
 * See docs/DECISIONS.md.
 */
const BUNDLE_ID = process.env.APP_BUNDLE_ID ?? 'com.huntbot.app';
const GOOGLE_IOS_URL_SCHEME = process.env.GOOGLE_IOS_URL_SCHEME;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'HuntBot',
  slug: 'huntbot',
  version: '0.1.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'huntbot',
  // Field-dark by default (spec §14); never flash white.
  userInterfaceStyle: 'dark',
  backgroundColor: '#0E110D',
  ios: {
    bundleIdentifier: BUNDLE_ID,
    icon: './assets/expo.icon',
    usesAppleSignIn: true,
    supportsTablet: false,
  },
  android: {
    package: BUNDLE_ID,
    adaptiveIcon: {
      backgroundColor: '#0E110D',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    'expo-dev-client',
    [
      'expo-splash-screen',
      {
        backgroundColor: '#0E110D',
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    ],
    // Mapbox no longer requires a secret SDK download token (checked against @rnmapbox/maps 10.3 prebuild output).
    '@rnmapbox/maps',
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          'HuntBot uses your location to show where you are on the map, point you back to the truck, and work out where your scent is drifting.',
      },
    ],
    'expo-apple-authentication',
    // Google Sign-In's plugin fails without a real client scheme, so it's only added once one is configured.
    ...(GOOGLE_IOS_URL_SCHEME
      ? [
          [
            '@react-native-google-signin/google-signin',
            { iosUrlScheme: GOOGLE_IOS_URL_SCHEME },
          ] as [string, unknown],
        ]
      : []),
  ],
  experiments: {
    typedRoutes: true,
    reactCompiler: true,
  },
  extra: {
    googleSignInConfigured: Boolean(GOOGLE_IOS_URL_SCHEME),
    eas: process.env.EAS_PROJECT_ID ? { projectId: process.env.EAS_PROJECT_ID } : undefined,
  },
});
