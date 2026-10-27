# Decisions

Choices made where the spec was silent or ambiguous (spec §0.8), plus founder answers to the
spec's open questions (§20). Newest at the bottom. Each entry: what, why, how to revisit.

## D-001 · Name: HuntBot (founder decision)

The app is **HuntBot** (the spec's working title was _Windfall_). Package scopes (`@huntbot/*`),
app name, slug and URL scheme (`huntbot://`) use it. Native bundle IDs default to the placeholder
`com.huntbot.app`, overridable with `APP_BUNDLE_ID` at build time. **Founders:** confirm the bundle
ID (reverse of a domain you own) before the first store build — it can't change after release.

## D-002 · pnpm with a hoisted `node_modules`

`nodeLinker: hoisted` in `pnpm-workspace.yaml`. React Native autolinking, Metro and several native
config plugins still assume a flat `node_modules`. Revisit when Expo documents isolated installs as
fully supported for native builds.

## D-003 · TypeScript 6.0, ESLint 9

`typescript-eslint` supports TS `<6.1` and Expo SDK 58 ships `~6.0.3`; `eslint-plugin-react`
(via `eslint-config-expo`) crashes on ESLint 10. Revisit when both support the newer majors.

## D-004 · Mapbox SDK download token not needed

With `@rnmapbox/maps` 10.3 the Maven credential is optional (Mapbox removed the requirement), so
only the public `EXPO_PUBLIC_MAPBOX_TOKEN` is needed.

## D-005 · M0 map layers

Mapbox Satellite, Satellite-Streets ("Hybrid") and Outdoors ("Topo", has contours). Hillshade and
P1 data layers come with M1. All map code lives in `apps/mobile/src/map/`.

## D-006 · True heading only

The compass shows `trueHeading` and shows "—" until it's available, never falling back to magnetic
heading — US declination reaches ~15°, which would silently skew wind and back-to-truck bearings.

## D-007 · Email sign-in uses password, not magic links

Password sign-in works in a dev build with no email or deep-link setup. Apple and Google use the
native sign-in sheet and send the provider's ID token to the API — no browser redirect, no client
secret. The Google button only appears when Google client IDs are configured.

## D-008 · Ages 13+ (founder decision)

HuntBot launches for **13 and older** (spec §13.5, §20.4). The age question comes **before** any
account is created, so under-13s never sign up. Only two things are stored: `profiles.is_youth`
(13–17) and `profiles.age_confirmed_at`. No birth date. The answer can be given once
(`public.confirm_age()`), and the client can't write either column directly. If an existing account
answers "under 13" (e.g. on a new device), the app deletes the account. Mentor linking (M3) will
use `is_youth` for conservative defaults.

## D-009 · Small schema additions

- `pin_types.alt_geometry_kind` — food and water pins can be points _or_ polygons (§5.2). A trigger
  rejects geometry that doesn't match the type.
- `owner_id` / `user_id` default to the request user; owners can't be reassigned (trigger), so an
  admin moderating a shared pin can't take it over.
- The area creator becomes an `owner` member by trigger; nobody can grant `owner` through the API.
- Expired members lose all access to the area, not just write access.

## D-010 · Backend: Vercel + Neon instead of Supabase (founder decision)

The spec assumed Supabase. The founders chose **Vercel + Neon**. Mapping:

| Spec (Supabase)       | HuntBot                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Postgres + PostGIS    | Neon Postgres + PostGIS (provisioned through the Vercel Marketplace)                                                               |
| Auth                  | Better Auth (open source) running in the API, tables in our Neon DB                                                                |
| Edge Functions        | `apps/api` — one Hono app deployed as a Vercel Function                                                                            |
| RLS with `auth.uid()` | Same policies keyed on `app.uid()`; the API runs each request as role `app_user` with `app.user_id` set (`packages/db` `withUser`) |
| pg_cron               | Vercel Cron Jobs (overdue hunt-plan alerts, M3)                                                                                    |
| Storage               | Vercel Blob (photos, M1)                                                                                                           |
| PowerSync connector   | PowerSync's generic Postgres source on Neon (logical replication) + uploads through `apps/api` (M1)                                |

Why Better Auth rather than a hosted auth vendor: no extra paid service, users live in our own
database next to their profiles, and it supports email/password plus native Apple/Google ID tokens.
Clients never talk to Postgres directly — every request goes through the API — so database roles and
RLS are a second line of defense behind the API's session check.

## D-011 · All 50 states (founder decision)

Regulations, legal hours and rut timing will cover **all 50 states** (spec §20.1).
`packages/shared/src/states.ts` lists them and `home_state` accepts any of them. The regulations
dataset (`content/regulations/<STATE>.yaml`, M2) needs an official source URL and `verified_at` for
every rule (spec §13.1). States are added as each is researched and verified. Until a state is
verified, the app uses the spec's fallback: default legal hours (30 min before sunrise / after
sunset) with a "verify your regulations" banner, and no feature gates assumed. Southern states get
no default rut timing (§7.10). Nothing is filled in from memory.

## D-012 · API deploys via Vercel's Build Output API

`apps/api/scripts/build.mjs` bundles the Hono app (and the TypeScript workspace packages) with
esbuild into `.vercel/output/functions/index.func` and writes the routing config. The deploy then
doesn't depend on Vercel's framework detection compiling TypeScript inside `node_modules`.
Vercel project settings: Root Directory `apps/api`; `apps/api/vercel.json` sets the build command.

## D-013 · Deleting an account deletes its data

`on delete cascade` from `user` → `profiles` → everything the user owns (areas, pins, tracks, sits,
sightings, wind checks), as spec §13.4 requires in-app deletion. Another member's pins in a deleted
area stay theirs (their `area_id` is cleared).

## D-014 · Map SDK: pending founder choice

Still Mapbox (spec default) until the founders decide. Switching later touches only
`apps/mobile/src/map/` and the app config plugin.

## D-015 · Tests run against a real Postgres

pgTAP (`packages/db/tests`) covers RLS, triggers, the age gate and account deletion, and the API
integration tests sign up real users. CI runs both against Postgres 16 + PostGIS with migrations
applied by a **non-superuser** owner role, the same way Neon runs them.
