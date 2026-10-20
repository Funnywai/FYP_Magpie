# Magpie — Tech Stack

A snapshot of what Magpie is actually built with, as of Step 1 (project skeleton).
Versions reflect the installed, verified state.

> For behaviour and data model, see [`SPEC.md`](./SPEC.md). This file describes the *tooling*.

---

## In one sentence

A **pnpm monorepo**: React Native (Expo) mobile app + Hono (Node/TypeScript) backend +
Supabase (Postgres) database, with a single set of shared TypeScript types.

---

## Core stack

| Layer | Technology | Version | Role |
| --- | --- | --- | --- |
| **Mobile** | React Native + Expo | Expo `57.0.26` / RN `0.86.3` | iOS / Android app |
| | React | `19.2.3` | UI framework |
| **Backend** | Node.js + TypeScript | Node `>= 22.13` / TS `~6.0.3` | Server runtime + language |
| | Hono | `4.13.12` | REST API framework |
| | @hono/node-server | `2.1.3` | Runs Hono on Node |
| **Media processing** | ffmpeg | `7` | Audio extraction + scene-based frame sampling |
| **Database** | PostgreSQL (Supabase) | PG `17` | Primary datastore |
| | pgvector | built-in | Vector similarity search (semantic search) |
| | Supabase RLS | — | Row-Level Security (per-user isolation) |
| **Shared** | zod | `4.6.5` | Runtime schema validation |
| **Language** | TypeScript | `~6.0.3` (strict, no `any`) | Whole project |

---

## Tooling

| Tool | Version | Purpose |
| --- | --- | --- |
| **pnpm** | `11.3.0` | Package manager + workspace |
| Node | `22 LTS` (`.nvmrc`) | Runtime (pnpm 11 requires `>= 22.13`) |
| ESLint | `9.39.5` | Linting (flat config) |
| Prettier | `3.9.9` | Formatting |
| Vitest | `3.2.7` | Unit tests |
| pgTAP | bundled with Supabase | RLS policy tests |
| Supabase CLI | `2.119.0` | Local database + migrations |
| Docker | — | Runs the local Supabase stack |
| GitHub Actions | — | CI (typecheck, lint, test, RLS tests) |

---

## Planned but NOT yet integrated

Step 1 is structure only. The following are specified in `SPEC.md` but **not wired up yet**:

| Category | Technology | Step |
| --- | --- | --- |
| Multimodal AI | **Google Gemini** (caption / OCR / structured output / embeddings) | 4+ |
| Speech-to-text | **Deepgram** (Cantonese / mixed language) | 4 |
| Maps | Google Maps / Places API | 9 |
| Weather | HKO Open Data + Open-Meteo | 11 |
| Media ID (optional) | TMDB / AniList / trace.moe | 12 |
| Monitoring (optional) | Sentry, PostHog | later |

> The backend currently makes **no AI calls** — only `GET /api/health` and a stub `GET /api/items`.

---

## Why these choices

| Choice | Rationale |
| --- | --- |
| **Expo** | One codebase for iOS + Android; dev-client supports the native share extension (the core capture entry point). |
| **Hono** | TypeScript-native and type-safe; lighter and better typed than Express. |
| **Supabase** | Postgres + pgvector + Auth + RLS in one; RLS enforces "users see only their own data" at the database layer, not by convention. |
| **pgvector** | The foundation of semantic search — stores caption/transcript/OCR embeddings for similarity retrieval. |
| **pnpm** | Clean internal linking for the monorepo; strict dependencies (no phantom packages); faster and more disk-efficient than npm. |
| **zod** | TypeScript types vanish at runtime; zod validates AI-returned JSON at runtime. |
| **No Turborepo** | Only 3 packages — caching benefit is ~zero. Can be added later with no restructuring. |

---

## Repository structure

```
FYP_Magpie/
├── apps/
│   ├── mobile/          # Expo app (mobile)
│   └── backend/         # Hono API (backend)
├── packages/
│   └── shared/          # shared types + zod schemas (imported by both sides)
├── infra/
│   └── supabase/        # database: migrations, RLS, pgTAP tests
├── docs/                # SPEC, Proposal, Team, walkthrough
└── .github/workflows/   # CI
```

---

## Getting started

```bash
nvm use            # switch to Node 22 (reads .nvmrc) — do this first
pnpm install
pnpm db:start      # start local Supabase (Docker)
pnpm db:reset      # apply migrations + seed
```

Common commands:

| Command | Purpose |
| --- | --- |
| `pnpm typecheck` | Build shared, then typecheck all packages |
| `pnpm -r lint` | Lint all packages |
| `pnpm -r test` | Run unit tests |
| `pnpm db:lint` | Lint the database schema |
| `pnpm db:test` | Run pgTAP RLS tests |
| `pnpm format` | Format with Prettier |

---

## Database state

- **12 tables** created (SPEC §3): `User`, `PreferenceProfile`, `SavedItem`, `MediaAsset`,
  `TranscriptSegment`, `ExtractedField`, `EmbeddingChunk`, `Collection`, `CollectionItem`,
  `Interaction`, `ItineraryPlan`, `ItineraryStop`.
- **RLS enabled on every user-owned table**, with pgTAP tests proving user A cannot read
  user B's rows.
- **`embedding_chunks.embedding`** uses `extensions.vector(1536)` with an HNSW index for
  cosine similarity search.

---

## One-line summary for a teammate

> Magpie is a pnpm monorepo: mobile is React Native (Expo 57), backend is Hono on Node 22,
> database is Supabase Postgres 17 + pgvector, all TypeScript strict with shared types in
> `packages/shared`. The skeleton and database (12 tables + RLS + CI) are done; AI
> (Gemini/Deepgram) and features come in later steps.
