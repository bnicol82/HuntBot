# Decisions

Choices made where the spec was silent or ambiguous (spec §0.8). Newest at the bottom.
Each entry: what, why, and how to revisit.

## D-001 · Repo name vs product name (M0)

The GitHub repo is `HuntBot`; the spec's working title is _Windfall_. Package scopes (`@windfall/*`),
the app name, slug, URL scheme (`windfall://`) and Supabase `project_id` use "windfall". Native
bundle IDs default to the placeholder `com.windfall.app` and can be overridden with `APP_BUNDLE_ID`
at build time. **Founders:** pick the final name and bundle ID before the first store build (§20.5) —
bundle IDs can't change after release.

## D-002 · pnpm with a hoisted `node_modules`

`nodeLinker: hoisted` in `pnpm-workspace.yaml`. React Native autolinking, Metro and several native
config plugins still assume a flat `node_modules`; the hoisted layout avoids a class of
"module not found" build failures for little cost. Revisit when Expo documents isolated installs as
fully supported for native builds.

## D-003 · TypeScript 6.0, ESLint 9

`typescript@7` is out, but `typescript-eslint` supports `<6.1`, and Expo SDK 58 ships with
`~6.0.3`. ESLint 10 is out, but `eslint-plugin-react` (pulled in by `eslint-config-expo`) crashes on
it. Pinned to TS `~6.0.3` and ESLint `^9.39`. Revisit when both plugins support the newer majors.

## D-004 · Mapbox SDK download token not needed

The spec lists `MAPBOX_DOWNLOADS_TOKEN` as "only if the SDK version still requires it". With
`@rnmapbox/maps` 10.3, prebuild output marks the Maven credential optional (Mapbox removed the
requirement), so no secret token is configured. Only the public `EXPO_PUBLIC_MAPBOX_TOKEN` is needed.

## D-005 · M0 map layers

M0 ships Mapbox's Satellite, Satellite-Streets ("Hybrid") and Outdoors ("Topo", has contours) styles.
Hillshade and the P1 data layers come with M1. All map code lives in `apps/mobile/src/map/`.

## D-006 · True heading only

The compass shows `trueHeading` from `expo-location` and shows "—" until it's available, never
falling back to magnetic heading. Declination in the US is up to ~15°, which would silently skew
wind and back-to-truck bearings.

## D-007 · Email sign-in uses password, not magic links

Magic links need deep-link handling and a configured redirect domain; password sign-in works in a
dev build with no extra setup. Apple sign-in uses the native sheet + `signInWithIdToken`. Google
uses `@react-native-google-signin/google-signin` + `signInWithIdToken`, and its button only appears
when Google client IDs are configured (the config plugin hard-fails without them).

## D-008 · Youth fields are server-controlled

`profiles.is_youth` and `profiles.mentor_id` exist (spec §10.2) but the client can't write them
(column-level grants). Nothing in M0 collects age or sets these fields — spec §0.5 says to ask
before storing anything about minors. The mentor-linking flow (M3) needs a founder decision on the
age gate (§13.5, §20.4) before it's built.

## D-009 · Small schema additions

- `pin_types.alt_geometry_kind` — food and water pins can be points _or_ polygons (§5.2). A trigger
  rejects geometry that doesn't match the type.
- `profiles.updated_at` — consistency with the other tables.
- `owner_id` / `user_id` default to `auth.uid()`; owners can't be reassigned (trigger), so an admin
  moderating a shared pin can't take it over.
- The area creator is inserted into `area_members` as `owner` by trigger, so RLS needs only one
  membership check. Nobody can grant the `owner` role through the API.
- Expired members (`expires_at` in the past) lose all access to the area, not just write access.

## D-010 · RLS tests run against the real Supabase stack in CI

`supabase/tests/database/*.test.sql` are pgTAP tests run by `supabase test db` in GitHub Actions.
