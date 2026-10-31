# FYP Team Responsibilities

## 1. Roles

| Role | Member | Core responsibility |
|---|---|---|
| **Member A — Mobile & UX Lead** | Tam Yuk Hei | Mobile app, UI/UX, frontend integration, user testing |
| **Member B — Backend, AI Pipeline & Infra Lead** | Xu Ka Wai | Backend API, AI pipeline, database, deployment |

## 2. Responsibilities by Area

| Area | Tam Yuk Hei (A) | Xu Ka Wai (B) | Shared |
|---|---|---|---|
| Monorepo / CI/CD setup | | ✅ | |
| DB schema, RLS, migrations | | ✅ | Agree schema together |
| Authentication (Supabase Auth) | ✅ frontend flow | ✅ backend setup | Yes |
| Share extension / intake | ✅ | | |
| Mobile screens / navigation | ✅ | | |
| State management, data fetching | ✅ | ✅ API contract | Yes |
| Capture pipeline (URL resolve, ffmpeg, media) | | ✅ | |
| ASR (Deepgram, Cantonese) | | ✅ | |
| OCR / visual understanding (Gemini) | | ✅ | |
| Representation, semantic labels, highlights | | ✅ | |
| Embedding + pgvector index | | ✅ | |
| Semantic search API | | ✅ | Agree contract together |
| Search / retrieval UI | ✅ | | |
| Personalised ranking logic | | ✅ | |
| Field correction (UI + API) | ✅ UI | ✅ API | Yes |
| Map visualisation | ✅ | ✅ place grounding | Yes |
| Itinerary scheduling algorithm + weather | | ✅ | |
| Itinerary UI | ✅ | | |
| Collections (UI) | ✅ | ✅ API | Yes |
| Testing (unit / integration / E2E) | ✅ frontend | ✅ backend | Yes |
| Deployment / monitoring | | ✅ | |
| Documentation / report / demo | ✅ | ✅ | Yes |

## 3. Responsibilities by Phase (Sep 2026 – Apr 2027)

> **Revised 31 Oct 2026.** The Phase 2 capture prototype was not completed by the end of October and is carried into Phase 3. Phase 3 now spans November–December 2026; Phase 4–6 dates are unchanged.

| Phase | Tam Yuk Hei (A) | Xu Ka Wai (B) |
|---|---|---|
| **1. Planning (Sep)** | Requirements, UX sketches, feature list | System architecture, data model, technical validation |
| **2. Foundation (Oct) — completed** | App shell, share intake, saved-list UI (mock data) | Monorepo, CI, DB schema + RLS, shared types. Capture pipeline deferred to Phase 3. |
| **3. Capture + Retrieval (Nov–Dec)** | Search UI, filters, item-detail integration; capture UI states | Auth E2E; capture pipeline (caption/ASR/OCR) for one platform; representation, categorisation, highlights, embeddings, vector index, search API |
| **4. Features (Jan–Feb)** | Map, collections UI, itinerary UI, correction UI | Personalised ranking, itinerary algorithm, weather integration, collections API |
| **5. Testing (Mar)** | UI polish, running user testing | Performance optimisation, integration testing, bug fixes |
| **6. Report (Apr)** | Demo app, poster | Data analysis, experimental results, technical report chapters |

## 4. Shared Responsibilities

| Item | Description |
|---|---|
| **System architecture** | High-level design decisions made together |
| **API contracts** | `packages/shared` types maintained jointly |
| **Code review** | Every PR reviewed by the other member |
| **Testing & QA** | Integration and acceptance testing done together |
| **User study** | Designed and conducted together |
| **Documentation / report** | Written together |

## 5. Working Principles

1. **Split by module, not by file** — minimises merge conflicts and lets both work in parallel.
2. **Contracts first** — agree on `packages/shared` types before either side implements an API.
3. **One owner per layer** — A owns frontend, B owns backend; avoid both editing the same layer at once.
4. **Bottleneck is Member B** — the capture + AI pipeline is the heaviest, most critical path; if it falls behind, A should absorb parts of the backend work (e.g. collections API).
