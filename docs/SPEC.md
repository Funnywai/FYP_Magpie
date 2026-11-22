# SPEC — Short-Form Content Retrieval App

Implementation specification for the AI/content-retrieval mobile app.
Background and academic rationale live in [`docs/Proposal.md`](./Proposal.md) — this file is the source of truth for **what to build and how it must behave**.

> Read this before implementing any feature. When this file and `Proposal.md` disagree, this file wins for implementation decisions.

---

## 1. What We Are Building

A mobile app that captures short-form social media content (Instagram Reels, YouTube Shorts, Threads, others) and makes it searchable by meaning.

**Core user flow:**

```
User shares a public URL to the app
  → system fetches caption + audio transcript + on-screen text (OCR)
  → fuses them into one item representation
  → generates content_type + semantic labels + key highlights + embedding
  → stores item and indexes it
  → user finds it later via natural-language search, filters, or map
  → (optionally) turns saved places into a weather-aware itinerary
```

**Primary scope:** a single user's own saved content, captured from public URLs they explicitly share.

---

## 2. Tech Stack & Conventions

| Layer | Choice |
| --- | --- |
| Mobile | React Native + Expo (dev-client required for share extension) |
| Backend | Node.js + TypeScript, Hono (REST) |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| AI / Multimodal | Google Gemini (caption, vision/OCR, structured output, embeddings) |
| Speech-to-text | Deepgram (Cantonese / mixed language) |
| External | Google Maps/Places, HKO Open Data + Open-Meteo, TMDB/AniList/trace.moe (optional) |

**Repository layout:** monorepo — `apps/mobile`, `apps/backend`, `packages/shared`, `docs`, `infra`.

**Conventions:**
- TypeScript strict mode. No `any`, no `@ts-ignore`.
- Shared request/response and domain types live in `packages/shared` — define once, import on both sides.
- AI model calls go through a provider abstraction (`apps/backend/src/ai/providers`) so providers are swappable.
- All external HTTP calls go through one wrapper (timeouts, retry/backoff, logging). A request's per-attempt timeout and caller abort stay active while the response body is read, not only until headers arrive.
- All model output is validated against a schema before use.

---

## 3. Data Model

All tables have `id` (UUID PK), `created_at`, `updated_at`. Every user-owned table is protected by Supabase Row-Level Security.

### 3.1 User
| Field | Type | Notes |
| --- | --- | --- |
| `email` | text | from Supabase Auth |
| `display_name` | text | |
| `avatar_url` | text | nullable |
| `auth_provider` | text | e.g. email, google |

### 3.2 PreferenceProfile
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid FK → User | |
| `preferred_content_types` | text[] | subset of recipe \| place \| media \| generic |
| `preferred_labels` | text[] | preferred semantic labels (matches SavedItem.labels) |
| `language_preference` | text[] | e.g. yue, zh, en |
| `ranking_weights` | jsonb | learned weights for the ranking module |

### 3.3 SavedItem
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid FK → User | |
| `source_url` | text | original shared URL |
| `source_platform` | text | instagram \| youtube \| threads \| other |
| `content_type` | text | recipe \| place \| media \| generic |
| `title` | text | nullable |
| `caption` | text | nullable |
| `author` | text | nullable; source author handle/display name when the platform exposes it — planned field, not in the current migrated schema |
| `highlights` | jsonb | generated key points |
| `labels` | text[] | semantic labels (topic, intent, location, entities) |
| `status` | text | queued \| processing \| done \| needs_media \| failed |
| `transcript_status` | text | pending \| processed \| not_applicable \| skipped |
| `status_reason` | text | nullable; user-visible reason and next step for terminal non-done statuses (`needs_media`, `failed`); optional for `processing` |
| `capture_state` | jsonb | completed capture steps + failure reason; enables resuming from the last completed step. The only record of intermediate capture completion — `status` keeps its five public values |

### 3.4 MediaAsset
| Field | Type | Notes |
| --- | --- | --- |
| `item_id` | uuid FK → SavedItem | |
| `asset_type` | text | thumbnail \| frame \| audio (user-provided only) |
| `storage_path` | text | object storage path |
| `timestamp_seconds` | numeric | nullable; for frames |
| `ocr_text` | text | nullable |

`frame` assets are downscaled stills (480 px wide, JPEG q70) retained as OCR evidence. They will be stored in a private bucket, owner-readable only, deleted with the item, never publicly addressable — but only once that bucket is enabled.

`audio` assets are only for audio the user supplies. Audio extracted from platform media is transient and never stored.

Bucket provisioning (private bucket + owner-read RLS) is planned within Step 4. Media persistence stays gated until the bucket is enabled; until then no media is persisted.

### 3.5 TranscriptSegment
| Field | Type | Notes |
| --- | --- | --- |
| `item_id` | uuid FK → SavedItem | |
| `start_seconds` / `end_seconds` | numeric | |
| `text` | text | |
| `language` | text | yue \| zh \| en |

### 3.6 ExtractedField
| Field | Type | Notes |
| --- | --- | --- |
| `item_id` | uuid FK → SavedItem | |
| `field_name` | text | e.g. ingredient, address, opening_hours |
| `field_value` | text | nullable — null means "not found", never guess |
| `confidence` | numeric | 0–1 |
| `evidence_source` | text | asr \| ocr \| caption \| visual |
| `evidence_ref` | text | timestamp or frame reference |
| `verified` | boolean | passed validation |
| `user_corrected` | boolean | user edited this field |

### 3.7 EmbeddingChunk
| Field | Type | Notes |
| --- | --- | --- |
| `item_id` | uuid FK → SavedItem | |
| `chunk_type` | text | structured_card \| transcript \| ocr |
| `chunk_text` | text | |
| `embedding` | vector | pgvector |
| `token_count` | int | |

### 3.8 Collection
| Field | Type | Notes |
| --- | --- | --- |
| `owner_id` | uuid FK → User | |
| `name` | text | |
| `description` | text | nullable |
| `is_shared` | boolean | default false; compatibility metadata only |
| `parent_id` | uuid FK → Collection | nullable; enables nesting |

`is_shared` is legacy compatibility metadata. It never grants access and never implies membership. Owner access comes from `owner_id`; non-owner access comes only from explicit `CollectionMember` rows (§3.13, §4.9).

### 3.9 CollectionItem
| Field | Type | Notes |
| --- | --- | --- |
| `collection_id` | uuid FK → Collection | |
| `item_id` | uuid FK → SavedItem | |
| `added_by` | uuid FK → User | the member who linked the item |
| `order_index` | int | |

`added_by` carries attribution: it records which member created the link. Unlinking deletes the `CollectionItem` row only. The `SavedItem`, its derived data, and its other collection links are untouched, and ownership of the item never transfers.

### 3.10 Interaction
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid FK → User | |
| `item_id` | uuid FK → SavedItem | |
| `interaction_type` | text | like \| dislike \| view \| save |
| `timestamp` | timestamptz | |

### 3.11 ItineraryPlan
| Field | Type | Notes |
| --- | --- | --- |
| `user_id` | uuid FK → User | |
| `start_point` | text | user-defined |
| `end_point` | text | user-defined |
| `start_date` / `end_date` | date | |
| `status` | text | draft \| active \| completed |

### 3.12 ItineraryStop
| Field | Type | Notes |
| --- | --- | --- |
| `plan_id` | uuid FK → ItineraryPlan | |
| `day_number` | int | |
| `item_id` | uuid FK → SavedItem | the saved place |
| `place_id` | text | resolved place identifier |
| `start_time` / `end_time` | time | scheduled window |
| `indoor_outdoor` | text | indoor \| outdoor \| mixed |
| `order_index` | int | |

### 3.13 CollectionMember
| Field | Type | Notes |
| --- | --- | --- |
| `collection_id` | uuid FK → Collection | |
| `user_id` | uuid FK → User | |
| `role` | text | viewer \| editor |

`(collection_id, user_id)` is unique. The owner is `Collection.owner_id` and is not stored as a member row. Member roles grant scoped access only; they never transfer ownership of the collection or of any member's items.

---

## 4. Feature Behaviour

Each feature below is a contract. "Done" is defined in §6.

### 4.1 Capture & Extraction

**Input:** a shared URL (and optionally a shared file or screen recording).
**Output:** a `SavedItem` that ends in `done` only when every applicable capture output for the source exists — caption, ASR transcript, and OCR text (applicability follows the `transcript_status` and media rules below and in §4.1.1). Once Step 5 is enabled, `done` additionally requires the applicable representation, validated extracted fields, and embeddings. Otherwise the item ends in `needs_media` or `failed` with a user-visible reason and next step.

**Behavior:**
1. Create a `SavedItem` with status `queued` and `transcript_status` `pending`; return `{ itemId, status: 'queued' }` before any media fetch, download, temp-directory cleanup, or model work begins. All capture work runs in the background and never blocks or extends the request.
2. Resolve the platform from the URL host.
3. Capture strategy, in order:
   - YouTube URL → pass directly to the model provider (public video).
   - Other platforms → fetch page metadata (title, description, thumbnail).
   - If no usable media and the platform blocks access → set status `needs_media`, store the reason, and prompt the user to share a video file / screen recording.
4. From usable media: extract audio and select frames (scene detection, capped count).
5. Transcribe audio (Cantonese-aware) and OCR frames. Set `transcript_status` to `processed` when ASR completes, `not_applicable` when the source has no audio track, or `skipped` when a video is processed caption-only; keep `pending` until then.
6. Set status `processing → done` by running the enabled pipeline steps in order (capture, plus representation once Step 5 is enabled); `done` requires the completion conditions for those steps (§4.1 output, §7). Persist only allowed intermediate artefacts — never disallowed media or raw embed HTML — so retries resume from the last completed step. Track intermediate capture completion in `capture_state`; do not add new public `status` values — `status` remains `queued | processing | done | needs_media | failed`.
7. Run cleanup in a `finally` block before the attempt ends, on success or failure: delete the original media and the whole temp directory. Persist only allowed derivatives — caption, author (when available), transcript segments, extracted fields, embeddings, the re-hosted thumbnail, and OCR frames; never the original video/audio or the raw embed HTML. Media persistence (thumbnail/frames in a private bucket) stays gated until the private bucket and owner-read RLS in §3.4 are enabled; until then, keep only non-media derivatives.

`transcript_status` semantics:

- `pending` — ASR has not produced a transcript (regardless of item status).
- `processed` — ASR completed; it may return zero segments if no speech was detected.
- `not_applicable` — the source has no audio track (e.g. GraphImage).
- `skipped` — video processed caption-only; ASR was not run.

Only `skipped` triggers the "speech was not processed" UI notice.

**Edge cases:**
- Unreachable/private/expired URL → `failed` with a readable reason.
- Unsupported platform → capture what metadata is available; item proceeds as `generic` if text exists.
- Never fail silently: every terminal non-`done` status (`needs_media`, `failed`) is retained with a user-visible reason and next step, and is never collapsed into `done` or into the other state; `processing` may carry progress.

#### 4.1.1 Instagram Reels (platform-specific)

Instagram publishes no public content API. This branch is bounded to a single public URL the user explicitly shares.

**URL normalization.** Accept `instagram.com/reel/{sc}`, `instagram.com/reels/{sc}`, and `instagram.com/p/{sc}`. Strip tracking parameters such as `rpxt` and `exln`. A URL with no shortcode returns `failed` with `unsupported_url`.

**Embed fetch.** At most one logical embed fetch per explicitly shared URL, budgeted at 3 HTTP requests total across the whole capture job: the initial `GET https://www.instagram.com/reel/{shortcode}/embed/` plus at most 2 retries with backoff. The budget is shared across job attempts and does not reset when an attempt resumes or retries. Each embed HTTP request has an 8 s timeout. No cookies, no proxy pool, no headless browser, no account or feed crawling. Once the embed fetch succeeds, never issue a second logical fetch for that capture job; later failures are handled from the fetched data.

**Parsing.** The parser is a pure function: no network, no database. Read the caption at `edge_media_to_caption.edges[0].node.text`. Use three ordered sources: (1) a balanced-brace slice starting at the `"edge_media_to_caption"` key, parsed with `JSON.parse`; (2) the same slice unescaped exactly once, parsed again; (3) `og:description`, `"owner":{"username":...}`, and `"video_url"` as independent fallbacks. Never globally replace `\"` with `"`: captions containing quotes break. The balanced-brace scanner must respect string literals, escapes, and nested braces. Accept `video_url` only after `new URL()` validation. Use `data-media-type` to distinguish `GraphVideo` from `GraphImage`.

**Media policy.** Controlled by `MAGPIE_IG_MEDIA_POLICY`, values `video_first` (default), `never`.

| Media type | Action |
| --- | --- |
| `GraphImage` | Caption only, no media download. |
| `GraphVideo` | Transient media path (audio + frames). |
| `GraphVideo`, transient path fails | `needs_media` with a user-visible reason and next step. |
| `GraphVideo`, embed succeeded but its media URL expired before any usable media was obtained under `video_first` | `needs_media` with a user-visible reason and next step; do not re-fetch the embed page. |

`video_first` fetches every `GraphVideo` to maximise extraction accuracy. `never` disables the transient path for demos or offline runs; every Instagram item is caption-only. A caption-only `GraphVideo` sets `transcript_status` `skipped` and follows the §4.1 completion conditions, so it is `done` only when they are met; the UI must state that speech was not processed. `GraphImage` items set `transcript_status` `not_applicable` and need no such notice.

Phase 1 removes the 80-character caption heuristic and per-category sufficiency rules. Phase 2 may add a caption-sufficiency classifier as a cost optimisation, measured against a labelled set of real reels.

**Transient path.** Download to `os.tmpdir()/magpie/{itemId}/`, never Supabase Storage, never a CDN, never a public URL. 200 MB cap, `content-type: video/*` validation, overall timeout. Extract audio with `ffmpeg -vn -ac 1 -ar 16000`. Extract frames with `select='gt(scene,0.3)'`, at most 5 frames, downscaled to 480 px wide JPEG q70 before OCR. Delete the whole temp directory in a `finally` block that runs before each background attempt ends, on success and on failure. Sweep stale temp directories at startup to clear cleanup left interrupted by a crash or restart mid-attempt.

**No-persist rule.** Persist only allowed derivatives. Never persist the original video, the extracted audio, or the raw embed HTML. Keep only caption, author (when available), transcript segments, extracted fields, embeddings, the re-hosted thumbnail, and OCR frames. Media storage stays gated on the §3.4 private bucket; once enabled, the thumbnail is a small private-bucket copy; never store the expiring Instagram CDN URL. There is no in-app playback of another party's media: show the thumbnail and link out to the source.

### 4.2 Representation & Semantic Labelling

**Input:** caption + transcript + OCR text.
**Output:** `highlights`, `content_type`, semantic labels, and embedding chunks.

**Behavior:**
1. Fuse the three text sources into one representation.
2. Generate: content_type, semantic labels (topic, intent, location, entities), and key highlights.
3. Produce embedding chunks: `structured_card` (title + content_type + key fields), `transcript` (per ~30–45s segment), `ocr` (merged).
4. Store embeddings in `EmbeddingChunk`.

### 4.3 Automatic Categorisation & Highlights

- Assign exactly one `content_type` from: `recipe`, `place`, `media`, `generic`. Use `generic` when no other type fits; do not invent new content types.
- Classification is Gemini multimodal structured output, not a separate taxonomy.
- Store fine-grained labels in `labels` (e.g. `japanese_restaurant`, `pasta`); do not store a separate category.
- Highlights are short key points (e.g. recipe ingredients/steps; venue address/hours).
- All outputs are user-editable (see 4.6).

### 4.4 Semantic Search & Retrieval

**Input:** a natural-language query, plus optional filters (labels, time range, location, status).
**Output:** ranked list of items with relevance, each traceable to its source.

**Behavior:**
1. Parse the query into structured filters where possible (type, time, geo, status) and a search string.
2. Retrieve candidates using vector similarity (pgvector) over `EmbeddingChunk`.
3. Apply structured filters at the SQL layer.
4. Rank (see 4.5) and return results.
5. Every result is an item the user owns (RLS-enforced).

**Edge cases:**
- No matches → return an empty result set with a clear message, not an error.
- Query with no useful text → fall back to filters only.

### 4.5 Personalised Ranking

- Input features: vector similarity, `Interaction` history (like/dislike/view), recency, `ranking_weights`, `preferred_content_types`, and `preferred_labels`.
- Likes and views increase rank; dislikes decrease it. Content-type and label preferences boost matching items; they do not override vector relevance.
- Ranking must be deterministic for the same inputs + weights.

### 4.6 Verifiable Extraction & Correction

- Every non-null `ExtractedField` must carry `evidence_source` and `evidence_ref`.
- Validation: evidence text must actually exist in the transcript/OCR/caption; values failing validation are set to null and marked unverified.
- `confidence` is exposed to the client; low-confidence fields are flagged for review.
- User edits set `user_corrected = true`, update the value, and set `confidence = 1`.
- Corrections update the item (and its embedding) so search reflects the fix.

### 4.7 Map Visualisation

- Items with resolved locations appear as markers.
- Marker → item detail.

### 4.8 Weather-Aware Itinerary Planning

**Input:** a set of saved places, start/end point, date range.
**Output:** an `ItineraryPlan` with `ItineraryStop`s, respecting opening hours and weather.

**Behavior:**
1. Classify each place `indoor` / `outdoor` / `mixed` and estimate visit duration.
2. Group places across days and order each day into a route from start point to end point.
3. Respect opening hours and typical meal windows.
4. Fetch the forecast (HKO for Hong Kong, Open-Meteo elsewhere).
5. If adverse weather is forecast, move outdoor stops to better days and notify the user.

### 4.9 Shared Collections

- Collections can nest via `parent_id`.
- Items can be added to / removed from collections; batches supported.
- Owner access comes from `collections.owner_id`. Non-owner access is granted only by explicit `CollectionMember` rows. `is_shared` is compatibility metadata only; it never authorizes access or implies membership.

**Role matrix:**

| Capability | Owner (`collections.owner_id`) | Editor | Viewer |
| --- | --- | --- | --- |
| Read collection and its item links | yes | yes | yes |
| Manage members (add, change role, remove) | yes | no | no |
| Edit collection metadata, delete collection | yes | no | no |
| Link own saved items (`added_by` = self) | yes | yes | no |
| Reorder or remove item links | yes | yes | no |

- Within a shared collection, viewers can read the collection and its item links but cannot mutate either. This places no restriction on a user editing their own saved items or private collections.
- Only the owner manages members and collection metadata, and only the owner deletes a collection.
- Reading a collection covers the collection row and its item links. Linked `SavedItem` rows and their derived data stay readable only by their owner; membership never exposes another member's item content.
- A user with no member row and no ownership cannot read the collection or its links. Roles do not inherit through nesting: membership of a parent is not membership of its children, and vice versa.
- Current scope is database and RLS only. No API routes or UI for members are delivered yet.

---

## 5. API Surface (initial)

REST under `/api`. All routes require auth unless noted. All responses are JSON using shared types.

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/capture` | Submit a URL (+ optional file); returns `{ itemId, status }` |
| `GET` | `/items` | First page of the user's items, newest first (up to 20); cursor pagination planned for Step 6 |
| `GET` | `/items/:id` | Item detail incl. extracted fields + evidence |
| `DELETE` | `/items/:id` | Delete an item and all derived data |
| `PATCH` | `/items/:id/fields/:fieldId` | Correct an extracted field |
| `POST` | `/items/:id/recapture` | Re-run extraction (optional hint) |
| `GET` | `/search` | Query + filters → ranked items |
| `POST` | `/interactions` | Record like/dislike/view |
| `GET`/`POST` | `/collections` | List / create collections |
| `POST` | `/collections/:id/items` | Add items to a collection |
| `POST` | `/itineraries` | Generate an itinerary from selected places |
| `GET` | `/itineraries/:id` | Retrieve an itinerary |
| `GET` | `/health` | Liveness (no auth) |

**Contract rules:**
- Capture is always asynchronous: `POST /capture` persists the item as `queued` and returns `{ itemId, status: 'queued' }` before any media fetch, download, temp cleanup, or model work begins; the client polls `GET /items/:id` for status.
- Intermediate capture completion is exposed through `capture_state`, not new `status` values; `status` stays `queued | processing | done | needs_media | failed`, and terminal non-done statuses carry a reason and next step.
- Auth: a missing, malformed, invalid, or expired token returns `401 UNAUTHENTICATED`, and the client may refresh the session once. A temporarily unavailable JWKS returns `503 INTERNAL` with `Authentication temporarily unavailable`; this is not a bad session, so the client keeps it and does not refresh or sign out.
- `GET /items` currently returns one newest-first page of up to 20 items as `{ items, hasMore, nextCursor }`. `hasMore` reports whether older items exist; `nextCursor` is always `null` until cursor pagination ships with search in Step 6. Client-side search and filters cover only this loaded page, and the UI must say more items are not loaded when `hasMore` is true.
- Client list states: loading shows skeletons, a first-load failure shows an error with retry, and the empty state appears only after a successful zero result. A failed refresh after a successful load keeps the last successful rows instead of clearing them, behind a stale-data banner. The item count renders only once a result is known and not during a first-load error.
- Terminal non-done items render their stored `status_reason` verbatim, with a localized fallback when it is absent, plus a localized next step; `done` never renders failure copy.
- Errors use a consistent shape: `{ error: { code, message } }`.
- Never return raw model output; always the validated, typed shape.

---

## 6. Acceptance Criteria

A feature is "done" only when all of these hold:

- [ ] Works end-to-end on a real device/simulator through the app UI (not just via curl).
- [ ] Types are shared between client and server and compile clean (no `any`).
- [ ] Unit tests cover the core logic (extraction validation, ranking, scheduling).
- [ ] Edge cases in §4 return a clear state, never a silent failure.
- [ ] No API key is present in the mobile bundle (all third-party calls go through the backend).
- [ ] `lsp_diagnostics` / typecheck / lint are clean.

---

## 7. Build Order (MVP)

Build in this order; later items are optional until the earlier ones are solid.

1. Monorepo scaffold + CI + Supabase schema (RLS) + local Docker DB. *(pure skeleton — no feature logic)*
2. Auth end-to-end (Supabase Auth): sign-up/in, JWT issuance, one protected route.
3. Mobile shell: share intake, item list, item detail.
4. Capture pipeline for one platform end-to-end (caption → transcript → OCR). A Step-4 item is `done` only when every applicable capture output exists; representation, validated fields, and embeddings are not required yet. Media persistence stays gated until the §3.4 private bucket and owner-read RLS are enabled.
5. Representation, categorisation, highlights, embeddings. Once enabled, `done` additionally requires the applicable representation, validated extracted fields, and embeddings.
6. Vector search + filters + retrieval UI.
7. Field correction + confidence display.
8. Personalised ranking from interactions.
9. Map visualisation.
10. Collections (nested + sharing).
11. Weather-aware itinerary planner.
12. Optional: media/music identification, extra platforms, multi-region itineraries.

---

## 8. Out of Scope

- Unbounded or bulk server-side scraping. Server-side fetching is permitted only through the bounded, per-capture-job pipeline for a single public URL the user explicitly shared: one logical embed fetch (initial attempt plus at most 2 retries, 3 requests total per capture job, never a second fetch after success), no cookies, no proxy pool, no headless browser, no crawling of accounts, feeds, or other users' content.
- Persistent storage or re-hosting of original media. Original video and audio may exist only as transient files outside the storage layer, deleted in a `finally` block before each background attempt ends (success or failure), with interrupted cleanup swept at startup — no public URL, no CDN, no in-app playback of another party's media.
- Redistributing original videos or operating a mirror of any platform's content.
- Music/streaming account integration (identification + search links only, if built).
- Cross-platform price comparison / scraping e-commerce sites.
- Multi-user social feeds beyond shared collections.
- Offline-first sync (initial version assumes connectivity).

---

## 9. Key Constraints

- **Privacy:** original media is deleted when the attempt ends, on success or failure; only allowed derivatives (caption, author when available, transcript, extracted fields, embeddings, thumbnail/OCR frames) are stored — never the original media or raw embed HTML.
- **Legal:** only public content the user explicitly shares is processed.
- **Reliability:** platform access may fail — `needs_media` is a first-class outcome, not an error; `needs_media` and `failed` stay terminal with a reason and next step.
- **Cost:** cache model and external API responses; do not re-process unchanged items.
- **Latency:** capture is async; the app must remain usable while processing.
- **Bounded processing:** server-side fetching is limited to the bounded, per-capture-job pipeline for a single public URL the user explicitly shared: one logical embed fetch (initial attempt plus at most 2 retries, 3 requests total per capture job, never a second fetch after success), no cookies, no proxy pool, no headless browser, no crawling, and transient media deleted in a `finally` block before each attempt ends, with interrupted cleanup swept at startup.
- **Terms and takedown:** user-submitted content is governed by the in-app terms (user warranty, transient-processing licence, rights defects borne by the user), and a monitored takedown channel deletes the item and all derived data — transcript, frames, extracted fields, embeddings — not only the media.
