# Magpie — Tech Stack

A snapshot of what Magpie is actually built with, as of 22 November 2026 (mid-term).
Versions reflect the installed, verified state unless marked planned.

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
| **Media processing** | ffmpeg | `7` (required for Phase 3 capture, not installed) | Audio extraction + scene-based frame sampling |
| **Database** | PostgreSQL (Supabase) | PG `17` | Primary datastore |
| | pgvector | built-in | Vector similarity search (semantic search) |
| | Supabase RLS | — | Row-Level Security (per-user isolation; scoped collection roles) |
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

## Current state (22 Nov 2026)

- Foundation: monorepo, CI, shared types, 13-table Supabase schema + RLS, pgTAP tests.
- Collections: membership roles (`viewer` | `editor`) and their RLS policies are in place; no collections API or UI yet.
- Mobile: Expo UI shell + email/password auth; Home reads the real saved-item API; remaining screens still use mock data.
- Backend: `GET /api/health` and a protected `GET /api/items` (JWKS auth + RLS); no AI calls yet.
- Next: capture pipeline (Phase 3, Nov–Dec 2026).

## Implementation notes (22 Nov 2026)

| Area | Current behaviour |
| --- | --- |
| Outbound HTTP | One wrapper (`apps/backend/src/http.ts`): a default 10 s timeout per attempt and up to 2 retries with exponential backoff for eligible `GET`/`HEAD` failures. The timeout and caller abort stay active while the response body is read, so a stalled body still fails. |
| Auth failures | A missing, malformed, invalid, or expired token returns `401 UNAUTHENTICATED`. A JWKS timeout, connection failure, or non-200 response returns `503 INTERNAL` with "Authentication temporarily unavailable". Missing auth config fails the process at boot. |
| Mobile session | On `401` the app tries to refresh once. If refresh succeeds but the retried request still returns `401`, the app signs out locally if the same user is still signed in. A `503` neither triggers a session refresh nor clears the session. |
| Saved-item list | `GET /api/items` returns up to 20 items, newest first, plus `hasMore`, decided by a 21st probe row; `nextCursor` stays `null`. Cursor pagination and the search/filter API are not shipped. |
| Home list states | Skeletons while the first result is pending; a first-load failure shows an error with retry; empty appears only after a known empty result. A failed refresh keeps the last successful rows and shows a stale-data banner. The UI notes when older items are not loaded. |
| Item status copy | `failed` and `needs_media` cards render the stored `status_reason` (localized fallback when absent) plus a next step. This is display only; the capture pipeline is not shipped. |

## Planned but NOT yet integrated

The following are specified in `SPEC.md` but **not wired up yet** (Phase 3 onward):

| Category | Technology | Step |
| --- | --- | --- |
| Multimodal AI | **Google Gemini** (caption / OCR / structured output / embeddings) | 4+ |
| Speech-to-text | **Deepgram** (Cantonese / mixed language) | 4 |
| Maps | Google Maps / Places API | 9 |
| Weather | HKO Open Data + Open-Meteo | 11 |
| Media ID (optional) | TMDB / AniList / trace.moe | 12 |
| Monitoring (optional) | Sentry, PostHog | later |

> The backend currently makes **no AI calls** — only `GET /api/health` and the protected `GET /api/items`. Capture and AI land in Phase 3.

---

## Why these choices

| Choice | Rationale |
| --- | --- |
| **Expo** | One codebase for iOS + Android; dev-client supports the native share extension (the core capture entry point). |
| **Hono** | TypeScript-native and type-safe; lighter and better typed than Express. |
| **Supabase** | Postgres + pgvector + Auth + RLS in one; RLS enforces private saved-item isolation and scoped collection roles at the database layer, not by convention. |
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
├── docs/                # SPEC, Proposal, Team, legal, tech-stack
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

- **13 tables** created (SPEC §3): `User`, `PreferenceProfile`, `SavedItem`, `MediaAsset`,
  `TranscriptSegment`, `ExtractedField`, `EmbeddingChunk`, `Collection`, `CollectionItem`,
  `Interaction`, `ItineraryPlan`, `ItineraryStop`, `CollectionMember`.
- **RLS enabled on every user-owned table**. pgTAP covers private saved-item isolation
  and role-based access to collections and item links.
- **Collection access is scoped by role**: ownership comes from `collections.owner_id`;
  non-owners get access only through explicit `collection_members` rows (`viewer` | `editor`).
  Roles are enforced in the database/RLS only, never inherit through nesting, and never expose
  another member's `SavedItem` or its derived data.
- **`embedding_chunks.embedding`** uses `extensions.vector(1536)` with an HNSW index for
  cosine similarity search.

---

## One-line summary for a teammate

> Magpie is a pnpm monorepo: mobile is React Native (Expo 57), backend is Hono on Node 22,
> database is Supabase Postgres 17 + pgvector, all TypeScript strict with shared types in
> `packages/shared`. The skeleton, database (13 tables + RLS + CI) and mobile UI shell are
> done; backend and mobile auth are in place; capture and AI (Gemini/Deepgram) land in Phase 3 (Nov–Dec 2026).
