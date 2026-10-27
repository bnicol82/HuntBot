# Working in this repo

The product spec (Windfall — AI hunting companion) is the source of truth. Build one milestone at a
time; when its acceptance criteria pass, stop and report what's done, stubbed, and needs a human.

## Rules from the spec

- **Deterministic engine, AI narrator.** Wind, scent, thermals, sun/legal light, scoring and route
  math live in `packages/hunt-engine`: pure TS, no network/storage, unit + property tested. The LLM
  only explains engine output.
- **Offline-first.** Map, pins, tracks, compass, scent cone, Hunt Mode tips and the emergency card
  must work in airplane mode.
- **Hunting knowledge is data.** Advice, phases, tips, lessons and regulations live in `content/`
  with an `evidence` tag (`research` | `consensus` | `mixed`). Never hardcode advice in components.
  Unsure? Add `# QUESTION:` in the content file.
- **Ask before:** adding a paid service or API key, switching the map SDK, destructive migrations,
  storing anything about minors, anything regulation-sensitive.
- Secrets only in env vars. Never ship the Anthropic key or Supabase service-role key in the app.
- Ambiguous? Pick the simplest option, log it in `docs/DECISIONS.md`, keep going.
- Check current library versions/APIs at install time; don't trust memory. Expo changes every SDK —
  see `apps/mobile/AGENTS.md`.

## Conventions

- TypeScript `strict`; ESLint + Prettier; Zod at every boundary.
- Vitest for packages; Jest + React Native Testing Library for the app; pgTAP for RLS.
- All map-SDK code stays in `apps/mobile/src/map/`.
- Pin types are defined twice — `packages/shared/src/pin-types.ts` and the `pin_types` seed in
  `supabase/migrations` — and a test keeps them in sync.
- Small, focused commits.

## Commands

```sh
pnpm typecheck | pnpm lint | pnpm test | pnpm format
cd apps/mobile && npx expo install <pkg>   # native deps: always via expo install
supabase test db                           # RLS tests (needs Docker)
```
