# Magpie — AI Content Retrieval App

A mobile app that captures short-form social media content and makes it searchable by meaning.

**Read [`docs/SPEC.md`](docs/SPEC.md) before implementing anything.** It is the source of truth for behaviour, data model, and API contracts. [`docs/Proposal.md`](docs/Proposal.md) is academic background only — SPEC wins on any conflict. [`docs/tech-stack.md`](docs/tech-stack.md) lists the tools and versions in use.

## Status

**Foundation + backend auth.** Monorepo structure, local Supabase schema (12 tables + RLS), pgTAP tests, CI, and shared types are in place. The Expo UI shell is merged and currently runs on mock data. The backend now verifies Supabase JWTs and serves a protected `GET /api/items`; mobile auth screens and the capture pipeline are the next milestones (Phase 3, Nov–Dec 2026).

## Prerequisites

- **Node.js 22 (>= 22.13) — run `nvm use` before anything else.** The required version is in
  [`.nvmrc`](.nvmrc); `pnpm install` will **fail** if you are on an unsupported version.
  (pnpm 11 itself requires Node >= 22.13, so Node 20 will not work.)
- pnpm 11 (`corepack enable`)
- Docker (for the local Supabase stack)

## Setup

```bash
nvm use            # switch to Node 22 (reads .nvmrc) — do this first
pnpm install
pnpm db:start      # start local Supabase (Docker)
pnpm db:reset      # apply migrations + seed
```

## Common commands

| Command | Purpose |
| --- | --- |
| `pnpm typecheck` | Build shared, then typecheck all packages |
| `pnpm -r lint` | Lint all packages |
| `pnpm -r test` | Run unit tests |
| `pnpm db:lint` | Lint the database schema |
| `pnpm db:test` | Run pgTAP RLS tests |
| `pnpm format` | Format with Prettier |

> `apps/backend` resolves `@magpie/shared` to `packages/shared/dist`, so that package must be
> built before typechecking. Use `pnpm typecheck` (which builds it first) rather than
> `pnpm -r typecheck`.

## Structure

```
apps/mobile     Expo app shell
apps/backend    Hono API (JWT auth + protected items; capture next)
packages/shared Shared types + zod schemas
infra/supabase  DB config, migrations, seed, pgTAP tests
```

Shared types live in `packages/shared` — define once, import on both sides.
