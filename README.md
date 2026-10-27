# HuntBot

An AI hunting partner that reads the wind, the terrain and the season — and teaches you _why_.
First species: whitetail deer. Ages 13+. All 50 states.

**Status:** M0 — Foundations. See [the milestone list](#milestones).

## Layout

```
apps/mobile/          Expo (React Native) app — Expo Router, EAS dev builds
apps/api/             Hono API on Vercel — Better Auth, profile endpoints (more each milestone)
packages/db/          Neon Postgres: SQL migrations, migration runner, RLS helper, pgTAP tests
packages/hunt-engine/ Deterministic wind/scent/sun math. Pure TS, no I/O.
packages/geo/         Coordinate formats; KML/GPX/GeoJSON import/export (M1)
packages/shared/      Zod schemas, pin types, US states, shared constants
packages/ui/          Design tokens (field-dark, red-night)
content/              Hunting knowledge as data (YAML/Markdown) — founders review
docs/DECISIONS.md     Choices made where the spec was silent, and founder decisions
```

## Getting started

Requirements: Node 22.18+, pnpm 12 (`corepack enable`). For native builds, an
[EAS](https://expo.dev/eas) account or Xcode / Android Studio. For the database, Postgres 16+ with
PostGIS (and pgTAP for tests), or a Neon branch.

```sh
pnpm install
pnpm typecheck && pnpm lint && pnpm test
```

### Database (Neon)

```sh
export DATABASE_URL=postgres://…          # Neon: use the unpooled URL for migrations
pnpm --filter @huntbot/db migrate         # applies packages/db/migrations/*.sql once each
pnpm --filter @huntbot/db test:sql        # pgTAP RLS tests (local/CI database with pgTAP)
```

### API (Vercel)

```sh
cp apps/api/.env.example apps/api/.env    # DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL
pnpm --filter @huntbot/api dev            # http://localhost:8787
TEST_DATABASE_URL=$DATABASE_URL pnpm --filter @huntbot/api test   # integration tests
```

Deploy: create a Vercel project with **Root Directory `apps/api`**, add Neon from the Vercel
Marketplace (it sets `DATABASE_URL` / `DATABASE_URL_UNPOOLED`), set `BETTER_AUTH_SECRET`,
`BETTER_AUTH_URL`, `APPLE_BUNDLE_ID` and `GOOGLE_CLIENT_IDS`, and run the migrations against Neon
once.

### Mobile app

The app uses native modules (Mapbox, location, Apple/Google sign-in, secure storage), so it runs in
a **development build**, not Expo Go.

```sh
cp apps/mobile/.env.example apps/mobile/.env   # EXPO_PUBLIC_API_URL, Mapbox token, …
cd apps/mobile
npx eas-cli@latest build --profile development --platform ios      # or android
pnpm start
```

## Milestones

|     | Scope                                                                    | Status      |
| --- | ------------------------------------------------------------------------ | ----------- |
| M0  | Monorepo, Expo app, API + Neon + RLS, auth + age gate, map + compass, CI | in progress |
| M1  | Map, pins, tracks, import/export, offline, sync                          | —           |
| M2  | Wind & scent v1, regulations dataset (all states, sourced)               | —           |
| M3  | Hunt Mode, safety, journal, season                                       | —           |
| M4+ | Terrain, thermals, AI coach, corridors, trail cams, groups               | —           |
