# Windfall (HuntBot)

An AI hunting partner that reads the wind, the terrain and the season — and teaches you _why_.
First species: whitetail deer. Working title _Windfall_.

**Status:** M0 — Foundations. See [the milestone list](#milestones).

## Layout

```
apps/mobile/          Expo (React Native) app — Expo Router, EAS dev builds
packages/hunt-engine/ Deterministic wind/scent/sun math. Pure TS, no I/O.
packages/geo/         Coordinate formats; KML/GPX/GeoJSON import/export (M1)
packages/shared/      Zod schemas, pin types, shared constants
packages/ui/          Design tokens (field-dark, red-night)
supabase/             Postgres + PostGIS migrations, RLS, pgTAP tests, Edge Functions
content/              Hunting knowledge as data (YAML/Markdown) — founders review
docs/DECISIONS.md     Choices made where the spec was silent
```

## Getting started

Requirements: Node 22.12+, pnpm 12 (`corepack enable`), and for native builds an
[EAS](https://expo.dev/eas) account or Xcode / Android Studio. For the database: the
[Supabase CLI](https://supabase.com/docs/guides/cli) and Docker.

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm test
```

### Mobile app

The app uses native modules (Mapbox, location, Apple/Google sign-in), so it runs in a
**development build**, not Expo Go.

```sh
cp apps/mobile/.env.example apps/mobile/.env   # fill in Supabase + Mapbox values
cd apps/mobile
npx eas-cli@latest build --profile development --platform ios      # or android
pnpm start                                                         # Metro for the dev build
```

Local native builds work too: `pnpm ios` / `pnpm android` (needs Xcode / Android Studio).

### Database

```sh
supabase start          # local stack (Docker)
supabase test db        # pgTAP RLS tests
supabase db push        # apply migrations to the linked project
```

## Milestones

|     | Scope                                                                  | Status      |
| --- | ---------------------------------------------------------------------- | ----------- |
| M0  | Monorepo, Expo app, Supabase + RLS, auth, map + location + compass, CI | in progress |
| M1  | Map, pins, tracks, import/export, offline, sync                        | —           |
| M2  | Wind & scent v1                                                        | —           |
| M3  | Hunt Mode, safety, journal, season                                     | —           |
| M4+ | Terrain, thermals, AI coach, corridors, trail cams, groups             | —           |
