# A Multimodal Semantic Retrieval and Personalised Recommendation System for Short-Form Social Media Content — FYP Proposal

**Final Year Project Proposal**

*Department of Computer Science and Engineering*

*The Chinese University of Hong Kong (CUHK)*

---

## 1. Project Overview

### 1.1 Project Name

**A Multimodal Semantic Retrieval and Personalised Recommendation System for Short-Form Social Media Content**

### 1.2 Description

This project proposes the design and implementation of a mobile application that turns short-form social media content — Instagram Reels, YouTube Shorts, Threads posts, and similar videos and posts across platforms — into a personally searchable, semantically organised library. The system addresses a concrete, everyday problem: people save large amounts of content but can rarely retrieve it again when they need it, because native save features are built for storage rather than retrieval and index caption text only.

When a user shares a public post or video URL, the system extracts and fuses **three modalities**: the caption text, the spoken audio (speech-to-text), and the on-screen text recovered from selected video frames (OCR). From this combined representation it generates **semantic labels** and **text embeddings**, automatically categorises each item, and highlights its key points. The content is stored in a database and a vector index, and retrieved through **natural-language semantic search** and **personalised ranking**.

The core technical contribution lies in the **multimodal content representation and the retrieval layer**: how caption, speech, and on-screen text can be fused into a single meaningful representation, indexed, and ranked for an individual user beyond keyword matching. The project also provides a **verifiable extraction** mechanism (each extracted field carries supporting evidence and a confidence indicator) and a **weather-aware itinerary planner** that converts saved places into an executable day-by-day plan.

This project serves both as a **practical engineering endeavour** — delivering a functional, user-facing mobile application — and as a **focused investigation** into multimodal representation, semantic retrieval, and personalised ranking for short-form social content.

### 1.3 Team Size

**2 members** (Final Year Project team)

### 1.4 Tech Stack

| **Layer** | **Technology** |
| --- | --- |
| Mobile Frontend | React Native with Expo (dev-client for share extension) |
| Backend | Node.js with TypeScript (Hono) |
| Database | PostgreSQL via Supabase, with pgvector for embeddings |
| Authentication | Supabase Auth |
| AI / Multimodal | Google Gemini for caption and visual understanding, OCR, structured output, and embeddings |
| Speech-to-Text | Deepgram (Cantonese / mixed-language) |
| External APIs | Google Maps / Places, Hong Kong Observatory Open Data + Open-Meteo, TMDB / AniList / trace.moe (optional) |
| Version Control | GitHub (monorepo) |

### 1.5 Deployment

- **Mobile:** Expo EAS (Expo Application Services) for build and distribution
- **Backend:** Render, Railway, or [Fly.io](http://Fly.io)
- **Database:** Supabase (managed PostgreSQL)
- **CI/CD:** GitHub Actions

---

## 2. Core Features

### 2.1 Multimodal Content Capture and Extraction

**Explanation:** Users share a public post or video URL to the application. The system extracts the caption, transcribes the spoken audio with attention to Cantonese, and applies OCR to selected video frames to recover on-screen text. When a platform restricts server-side access to the media, the system falls back gracefully — using caption and metadata only, or prompting the user to share a screen recording.

**Importance:** This is the entry point of the entire pipeline. If capture fails, every downstream feature is worthless. A robust, multi-path capture strategy grounded in the media the user already has access to makes the system resilient to platform restrictions.

### 2.2 Multimodal Content Representation and Semantic Labelling

**Explanation:** The caption, transcript, and OCR text are fused into a single content representation. From this the system generates semantic labels (topic, intent, location, entities) and a text embedding, producing a machine-usable representation of each saved item.

**Importance:** Unifying three modalities into one representation is what makes meaningful cross-modal retrieval possible. This is the foundational data-processing step on which search, recommendation, and categorisation all depend.

### 2.3 Automatic Categorisation and Key-Highlight Generation

**Explanation:** Each item is automatically assigned a category and summarised into its key points (for example, a recipe's ingredients and steps, or a venue's address and opening hours). Users can review and correct these results directly.

**Importance:** Automatic categorisation removes the manual filing burden that makes saved collections collapse at scale, while highlights let a user grasp an item's value at a glance without reopening the original content.

### 2.4 Semantic Search and Retrieval

**Explanation:** Content and embeddings are stored in a database and vector index. Users retrieve items using natural-language queries (e.g., "the Japanese restaurant in Kowloon I saved last month"), keywords, labels, and structured filters such as time, location, and status.

**Importance:** This is the project's central capability. It directly resolves the core problem — that saved short-form content is effectively unfindable — by allowing intent-based retrieval rather than exact-keyword matching.

### 2.5 Personalised Recommendation and Ranking

**Explanation:** Search and browse results are ranked using user feedback such as likes, dislikes, and previously viewed content. The ranking adapts to each individual user over time.

**Importance:** Personalisation turns a generic search index into a personal assistant. Two users with the same query and the same saved content should not see identical results; preference-aware ranking improves relevance and long-term satisfaction.

### 2.6 Verifiable Extraction and Correction

**Explanation:** Each extracted field is stored together with supporting evidence from the source content (for example, the video timestamp or frame it came from) and a confidence indicator. Low-confidence fields are highlighted for review, and any field can be corrected directly.

**Importance:** Extraction is inherently imperfect, and silent errors erode trust. Attaching evidence and confidence makes the system's output auditable and correctable, which is essential when the extracted data (recipes, addresses, prices) is meant to be acted upon.

### 2.7 Interactive Map Visualisation

**Explanation:** Saved content that contains location information is displayed on an interactive map, showing the places a user has collected and their spatial relationships.

**Importance:** Map visualisation provides intuitive spatial context that a text list cannot convey, and it lets users identify clusters and gaps in their saved places at a glance.

### 2.8 Weather-Aware Itinerary Planning

**Explanation:** A set of saved places is turned into a day-by-day itinerary that respects opening hours and the user's stated start and end points. When the weather forecast changes, outdoor activities are adjusted automatically and the user is notified.

**Importance:** This converts passive saves into action — the step from "saving a place" to "actually visiting it". It also demonstrates the system reasoning over real-world constraints (time windows, geography, weather) beyond text retrieval.

### 2.9 Shared Collections and Collaborative Management

**Explanation:** Users can group saved items into collections, share those collections, and manage them collaboratively with other users.

**Importance:** Sharing expands the value of a personal library into a collaborative one, supporting use cases such as planning a group trip or curating a shared resource list, and encourages sustained engagement.

---

## 3. Technical Requirements

### 3.1 Framework

- **Frontend:** React Native via the Expo framework for cross-platform mobile development. Expo streamlines build tooling and device capability access; a development client build is used to support a native share extension, which allows the application to receive shared links, files, and text from other apps.
- **Backend:** Node.js with TypeScript, organised as a RESTful API server using the Hono framework. TypeScript ensures type safety across the codebase and aligns with the frontend language ecosystem.
- **AI Layer:** Google Gemini for multimodal understanding (caption, visual, and OCR), structured output generation, and text embeddings. A provider abstraction layer isolates model-specific code so that alternative providers can be substituted with minimal changes.

### 3.2 Database

- **PostgreSQL** hosted on **Supabase**, providing a managed relational database with built-in authentication, real-time subscriptions, and row-level security.
- **pgvector** provides vector storage and similarity search for embeddings, enabling semantic retrieval alongside the relational data.
- The relational model suits the structured nature of saved items, extracted fields, collections, and itineraries, while **JSONB** columns accommodate the semi-structured extracted data.
- Supabase's client libraries and Row-Level Security enable multi-user data isolation with reduced backend boilerplate.

### 3.3 Testing

- **Unit Testing:** Vitest / Jest for backend logic and the core processing modules (extraction, validation, ranking, scheduling).
- **Integration Testing:** Supertest for API endpoint testing; mock external API responses to ensure deterministic test outcomes.
- **End-to-End Testing:** Maestro or Detox for mobile UI testing, covering critical user flows (share and capture, search, item correction, itinerary generation).
- **AI Output Evaluation:** Custom evaluation scripts to assess extraction accuracy, semantic retrieval quality, and ranking performance against baseline approaches.

### 3.4 Version Control

- **GitHub** monorepo with a structured branching strategy (e.g., `main`, `develop`, feature branches).
- Pull request reviews enforced for all merges to `develop` and `main`.
- Conventional commit messages for traceability.

### 3.5 Deployment

- **Mobile builds:** Expo EAS Build for iOS and Android binaries; Expo EAS Update for over-the-air JavaScript updates.
- **Backend:** Deployed on Render, Railway, or [Fly.io](http://Fly.io) with environment-based configuration (development, staging, production).
- **Database:** Supabase managed instance with automated backups.
- **CI/CD:** GitHub Actions for automated linting, testing, and deployment on push to protected branches.

---

## 4. Development Approach

### 4.1 Methodology

The project adopts an **Agile-inspired iterative development methodology**, tailored to the constraints of a two-person academic team. Development proceeds in **two-week sprint cycles**, each concluding with a review of completed work and planning for the next iteration. This approach balances structured progress tracking with the flexibility required for a project whose pipeline design may evolve based on empirical results.

### 4.2 MVP-First Strategy

The team follows a strict **Minimum Viable Product (MVP) first** strategy. The initial development phases focus on delivering a functional end-to-end flow — from sharing a public URL to receiving a categorised, searchable item — with minimal but complete feature coverage. Advanced features are deferred to later phases and treated as optional enhancements.

The MVP scope includes:

- Multimodal capture (caption + speech-to-text + OCR) and content representation
- Automatic categorisation, semantic labels, and key highlights
- Semantic search with natural-language queries and structured filters
- Basic personalised ranking from user feedback
- Interactive map visualisation

### 4.3 Modular Architecture

The system is designed with a **modular, layered architecture** to support independent development and testing:

- **Presentation Layer:** React Native screens and components
- **API Layer:** RESTful endpoints handling client requests (capture, search, collections, itineraries)
- **Service Layer:** Business logic, including extraction orchestration, retrieval, ranking, and itinerary scheduling
- **AI Pipeline Layer:** Multimodal understanding, structured extraction, embedding, and validation
- **Data Layer:** Database models, queries, vector index, and Supabase client configuration

This separation enables both team members to work on different modules concurrently with minimal merge conflicts.

### 4.4 Research-Driven Implementation

Given the academic nature of this project, implementation decisions are informed by a review of relevant literature on:

- Multimodal content representation and cross-modal retrieval
- Semantic search and embedding-based information retrieval
- Speech recognition for Cantonese and code-switched (mixed-language) content
- Personalised ranking and recommendation systems
- Evaluation methodologies for retrieval and extraction quality

Key design choices (for example, the fusion strategy for the three modalities, chunking and retrieval parameters, ranking features, and extraction validation rules) are documented and justified with reference to both technical literature and empirical experimentation conducted during development.

---

## 5. Project Timeline and Milestones

The following timeline assumes a **one-year academic project** (September to April), with two team members working concurrently.

| **Phase** | **Period** | **Key Activities** | **Deliverables** |
| --- | --- | --- | --- |
| **Phase 1: Planning and Design** | Month 1 (Sep 2026) | Topic finalisation, scope definition, requirements gathering, initial UX and system design. | Planning report, project scope and feature list |
| **Phase 2: Foundation and Capture Prototype** | Month 2 (Oct 2026) | Set up monorepo, CI/CD, and database schema. Build mobile app shell (share intake, saved-content list) with backend API. Implement multimodal capture pipeline (caption + speech-to-text + OCR) on a sample. | Working project skeleton, database schema deployed, capture pipeline prototype, mid-term progress report |
| **Phase 3: Representation and Retrieval** | Month 3 (Nov 2026) | Implement multimodal representation, semantic labelling, automatic categorisation, and embeddings. Build the vector index and semantic search (natural-language and keyword/label/filter). Build retrieval UI. | End-to-end retrieval flow over a sample dataset, term-end report |
| **Phase 4: Personalisation and Supporting Features** | Month 4–5 (Jan–Feb 2027) | Implement personalised ranking from feedback. Build map visualisation, shared collections, verifiable extraction, and weather-aware itinerary planning. | Personalised ranking module; map, collections, verifiable extraction, and itinerary features |
| **Phase 5: Refinement and Testing** | Month 6 (Mar 2027) | UI/UX polish. Comprehensive testing (unit, integration, E2E). Performance optimisation. Small-scale user study with real saved content. Bug fixes. | Polished application, full test suite, user study results |
| **Phase 6: Evaluation and Report** | Month 7 (Apr 2027) | Analysis of user study data. Final report writing. Presentation preparation. | Final FYP report, presentation slides, project demonstration |

---

## 6. Team Roles and Responsibilities

### 6.1 Member A — Mobile and User Experience Lead

- Design and implement all mobile UI screens and components
- Implement the share intake flow and native share extension integration
- Integrate map visualisation
- Implement client-side state management and data fetching
- Build the item-detail, correction, and search interfaces
- Lead UI/UX design decisions and user testing sessions
- Write frontend unit and end-to-end tests

### 6.2 Member B — Backend, AI Pipeline, and Infrastructure Lead

- Design and implement the RESTful API layer
- Build and maintain the database schema, vector index, and Supabase configuration
- Develop the multimodal processing pipeline (speech-to-text, OCR, representation, embedding)
- Implement structured extraction, validation, and confidence scoring
- Implement semantic retrieval, personalised ranking, and itinerary scheduling logic
- Manage deployment infrastructure and CI/CD
- Write backend unit and integration tests

### 6.3 Shared Responsibilities

- **System architecture design:** Both members collaborate on high-level architectural decisions
- **Literature review and research:** Both contribute to the literature review and evaluation methodology
- **Code review:** All pull requests require review from the other team member
- **Testing and QA:** Both members participate in integration testing and user acceptance testing
- **Documentation:** Both contribute to technical documentation and the final FYP report
- **Evaluation and user study:** Both members design and conduct the evaluation study

---

## 7. Project Structure

The project is organised as a monorepo with the following directory structure:

```
multimodal-content-retrieval/
├── apps/
│   ├── mobile/                      # React Native (Expo) frontend
│   │   ├── src/
│   │   │   ├── components/          # Reusable UI components
│   │   │   ├── screens/             # Screen-level components
│   │   │   ├── navigation/          # Navigation configuration
│   │   │   ├── hooks/               # Custom React hooks
│   │   │   ├── services/            # API client and external service calls
│   │   │   ├── stores/              # State management (Zustand / Context)
│   │   │   ├── types/               # TypeScript type definitions
│   │   │   └── utils/               # Utility functions
│   │   ├── assets/                  # Images, fonts, icons
│   │   ├── app.json                 # Expo configuration
│   │   └── package.json
│   │
│   └── backend/                     # Node.js + TypeScript backend (Hono)
│       ├── src/
│       │   ├── routes/              # API route handlers
│       │   ├── controllers/         # Request handling logic
│       │   ├── services/            # Business logic layer
│       │   │   ├── capture/         # URL resolution and media extraction
│       │   │   ├── understanding/   # Speech-to-text, OCR, representation
│       │   │   ├── extraction/      # Structured extraction and validation
│       │   │   ├── retrieval/       # Embedding, search, and ranking
│       │   │   └── planner/         # Weather-aware itinerary scheduling
│       │   ├── ai/                  # Model provider abstraction and prompts
│       │   │   ├── providers/       # Gemini / alternate providers
│       │   │   └── schemas/         # Structured output schemas
│       │   ├── models/              # Database models and queries
│       │   ├── middleware/          # Auth, error handling, logging
│       │   ├── types/               # TypeScript type definitions
│       │   └── utils/               # Utility functions
│       ├── tests/                   # Test files
│       │   ├── unit/
│       │   ├── integration/
│       │   └── evaluation/          # AI output evaluation scripts
│       └── package.json
│
├── packages/
│   └── shared/                      # Shared types, constants, utilities
│       ├── src/
│       └── package.json
│
├── docs/                            # Project documentation
│   ├── proposal/                    # Project proposal
│   ├── architecture/                # Architecture diagrams and decisions
│   ├── api/                         # API documentation
│   ├── evaluation/                  # Evaluation methodology and results
│   └── report/                      # Final FYP report
│
├── infra/                           # Infrastructure configuration
│   ├── supabase/                    # Supabase migrations and seed data
│   │   ├── migrations/
│   │   └── seed.sql
│   └── github/                      # GitHub Actions workflows
│       └── workflows/
│
├── .github/
│   └── pull_request_template.md
├── .gitignore
├── README.md
├── package.json                     # Root package.json (workspaces)
└── turbo.json                       # Turborepo configuration (optional)
```

---

## 8. Database Schema Overview

The following presents a high-level overview of the major database entities. All tables include standard `id` (UUID primary key), `created_at`, and `updated_at` timestamp fields.

### 8.1 User

Stores authenticated user account information.

| Field | Description |
| --- | --- |
| `email` | User email address (from Supabase Auth) |
| `display_name` | User display name |
| `avatar_url` | Profile picture URL |
| `auth_provider` | Authentication provider (e.g., email, Google) |

### 8.2 PreferenceProfile

Stores user preferences used to personalise ranking and recommendations.

| Field | Description |
| --- | --- |
| `user_id` | Foreign key to User |
| `preferred_categories` | Array of preferred content categories |
| `preferred_tags` | Array of frequently engaged tags |
| `language_preference` | Preferred content languages (e.g., Cantonese, Chinese, English) |
| `ranking_weights` | Learned weights used by the ranking module (JSON) |

### 8.3 SavedItem

Represents a single captured piece of content.

| Field | Description |
| --- | --- |
| `user_id` | Foreign key to User |
| `source_url` | Original shared URL |
| `source_platform` | Platform (e.g., Instagram, YouTube, Threads, other) |
| `content_type` | Detected type (recipe, place, media, generic) |
| `title` | Item title |
| `caption` | Original caption text |
| `highlights` | Generated key points (JSON) |
| `category` | Assigned category |
| `status` | Processing status (queued, processing, done, needs_media, failed) |
| `status_reason` | User-visible reason when status is not `done` |
| `capture_state` | Completed capture steps and failure reason (JSON), enables resume |

### 8.4 MediaAsset

Stores references to derived media produced during capture.

| Field | Description |
| --- | --- |
| `item_id` | Foreign key to SavedItem |
| `asset_type` | Asset type (thumbnail, user-provided audio, frame) |
| `storage_path` | Object storage path |
| `timestamp_seconds` | Timestamp within the source video (for frames) |
| `ocr_text` | OCR text extracted from a frame (nullable) |

### 8.5 TranscriptSegment

Stores the timestamped speech transcript for an item.

| Field | Description |
| --- | --- |
| `item_id` | Foreign key to SavedItem |
| `start_seconds` / `end_seconds` | Segment time range |
| `text` | Transcribed text |
| `language` | Detected language (e.g., yue, zh, en) |

### 8.6 ExtractedField

Stores each structured field extracted from an item, with evidence and confidence.

| Field | Description |
| --- | --- |
| `item_id` | Foreign key to SavedItem |
| `field_name` | Field name (e.g., ingredient, address, opening_hours) |
| `field_value` | Extracted value |
| `confidence` | Confidence score (0–1) |
| `evidence_source` | Source of evidence (asr, ocr, caption, visual) |
| `evidence_ref` | Evidence location (timestamp or frame reference) |
| `verified` | Whether the value passed validation |
| `user_corrected` | Whether the user has corrected the value |

### 8.7 EmbeddingChunk

Stores embedding vectors for retrieval.

| Field | Description |
| --- | --- |
| `item_id` | Foreign key to SavedItem |
| `chunk_type` | Chunk type (structured_card, transcript, ocr) |
| `chunk_text` | Text that was embedded |
| `embedding` | Vector embedding (pgvector) |
| `token_count` | Chunk token count |

### 8.8 Collection

Represents a user-defined or shared collection of items.

| Field | Description |
| --- | --- |
| `owner_id` | Foreign key to User |
| `name` | Collection name |
| `description` | Optional description |
| `is_shared` | Whether the collection is shared |
| `parent_id` | Foreign key to Collection for nesting (nullable) |

### 8.9 CollectionItem

Join entity linking items to collections.

| Field | Description |
| --- | --- |
| `collection_id` | Foreign key to Collection |
| `item_id` | Foreign key to SavedItem |
| `added_by` | User who added the item |
| `order_index` | Ordering within the collection |

### 8.10 Interaction

Stores user feedback used for personalised ranking.

| Field | Description |
| --- | --- |
| `user_id` | Foreign key to User |
| `item_id` | Foreign key to SavedItem |
| `interaction_type` | Type (like, dislike, view, save) |
| `timestamp` | When the interaction occurred |

### 8.11 ItineraryPlan

Represents a generated itinerary built from saved places.

| Field | Description |
| --- | --- |
| `user_id` | Foreign key to User |
| `start_point` | User-defined starting location |
| `end_point` | User-defined ending location |
| `start_date` / `end_date` | Date range |
| `status` | Plan status (draft, active, completed) |

### 8.12 ItineraryStop

Represents a single stop within an itinerary day.

| Field | Description |
| --- | --- |
| `plan_id` | Foreign key to ItineraryPlan |
| `day_number` | Sequential day number |
| `item_id` | Foreign key to SavedItem (the saved place) |
| `place_id` | Resolved place identifier |
| `start_time` / `end_time` | Scheduled time window |
| `indoor_outdoor` | Classification used by the weather-aware scheduler |
| `order_index` | Ordering within the day |

---

## 9. API Integration Options

### 9.1 MVP-Essential APIs

| **API** | **Role in Project** | **Usage** |
| --- | --- | --- |
| **Google Gemini API** | Core multimodal understanding, structured extraction, and embeddings | Processes caption, audio, and frames; generates semantic labels, categories, highlights, and text embeddings; constrained to structured output for reliable extraction |
| **Speech-to-Text API (Deepgram)** | Cantonese and mixed-language speech recognition | Transcribes spoken content from video audio, with timestamped segments that support evidence linking |
| **Google Maps Platform (Maps SDK, Places API)** | Core geospatial functionality: place resolution, details, and map rendering | Resolves extracted place names to coordinates and opening hours; displays saved places on the map and supplies data to the itinerary scheduler |
| **Weather API (Hong Kong Observatory Open Data / Open-Meteo)** | Weather forecasting for the itinerary planner | Supplies forecasts used to reorder outdoor activities and trigger user notifications |
| **Supabase (PostgreSQL + pgvector)** | Data storage, authentication, and vector retrieval | Persists items, extracted fields, embeddings, collections, and itineraries; performs vector similarity search |

### 9.2 Optional / Phase-2 APIs

| **API** | **Role in Project** | **Usage** |
| --- | --- | --- |
| **TMDB / AniList / trace.moe** | Media identification for film, drama, and animation clips | Identifies a title from visual or textual clues and lists legitimate streaming platforms available in the region |
| **AudD** | Music identification for audio-heavy clips | Identifies a song and links to music streaming search results |
| **Expo Notifications (push)** | Real-time notifications for itinerary and weather changes | Notifies users when the itinerary is adjusted or an upcoming activity requires attention |
| **Sentry** | Error monitoring and performance tracking | Captures runtime errors and performance metrics in both mobile and backend environments |
| **PostHog / Mixpanel** | Product analytics and user behaviour tracking | Tracks feature usage and engagement metrics for evaluation |

---

## 10. Risk Mitigation

### 10.1 Platform Access and Video Capture Difficulty

**Risk:** Social media platforms often restrict server-side access to video files. Login walls, private or expiring links, rate limits, anti-scraping protection, and frequent platform changes may prevent the system from retrieving usable media from a shared URL.

**Mitigation:**

- Adopt a multi-path capture strategy that prioritises user-provided media (shared file or screen recording); allow bounded server-side embed fetch only for a single explicitly shared URL
- Treat caption and metadata extraction as a reliable fallback when full media is unavailable, and inform the user of the next step when a URL cannot be fully processed
- Design provider abstraction around platform-specific handling so that changes in platform behaviour can be isolated and updated
- Cache derived assets only; never persist the original video or extracted audio

### 10.2 Legal Risk and Platform Terms of Service

**Risk:** Downloading or processing platform content may conflict with platform terms of service and copyright law.

**Mitigation:**

- Process only public content that the user explicitly shares
- Store only the data functionally required, and avoid redistributing original videos
- Delete original media after processing, retaining only derived data and thumbnails
- Document data handling practices in accordance with university ethics guidelines
- Restrict server-side fetching to a bounded transient path: one logical embed fetch (initial attempt plus bounded retries) per explicitly shared URL, transient media processing in OS temp storage, deletion within the same request, and no in-app playback or public URLs.
- Publish terms that place the rights warranty on the user and operate a monitored takedown channel that removes derived data, not only the media.

### 10.3 AI Extraction Quality and Hallucination

**Risk:** The model may produce plausible but incorrect extracted information (for example, a missing or invented ingredient), undermining trust.

**Mitigation:**

- Constrain model output with structured schemas (JSON mode), and make all fields nullable with an explicit instruction not to guess
- Require supporting evidence for every non-null field, and validate that the evidence actually exists in the transcript, OCR, or caption
- Cross-check consistency across sources (speech vs. on-screen text vs. caption) and validate numeric ranges and units
- Expose confidence scores and highlight low-confidence fields for user review and correction

### 10.4 Cantonese Speech Recognition and OCR Accuracy

**Risk:** Speech recognition may perform poorly on Cantonese and on mixed Chinese–English speech, and OCR may struggle with stylised on-screen text, degrading the quality of the fused representation.

**Mitigation:**

- Use a speech recognition service with explicit Cantonese support, rather than a general multilingual model
- Select video frames with scene detection, and cross-reference OCR text with the transcript to increase confidence
- Test recognition and OCR accuracy early in development, with clear go/no-go criteria, so that downstream work is built on a validated foundation

### 10.5 API Cost Overruns

**Risk:** External APIs operate on usage-based pricing. Uncontrolled calls during development and testing could incur significant costs.

**Mitigation:**

- Implement aggressive response caching (place details, weather forecasts, model outputs) with appropriate TTLs
- Use API call budgets and rate limiters in the backend
- Use mock responses during development and testing
- Monitor usage with alerts on spending thresholds
- Leverage free-tier quotas strategically

### 10.6 Latency and User Experience

**Risk:** Multimodal processing involving multiple sequential steps (download, transcription, OCR, extraction, embedding) may introduce perceptible latency, degrading user experience.

**Mitigation:**

- Process captures asynchronously and return results progressively, rather than blocking the interface
- Display clear status states and contextual messages (e.g., "Transcribing audio…", "Extracting details…")
- Parallelise independent processing steps within the pipeline
- Cache and reuse derived assets so that retries resume from the last completed step

### 10.7 Scope Creep

**Risk:** The project's broad feature set (capture, representation, retrieval, ranking, maps, collections, verification, itinerary planning) may exceed what a two-person team can deliver in the available time.

**Mitigation:**

- Maintain a strict MVP feature list; all additional features require explicit team agreement
- Use a MoSCoW prioritisation framework (Must have, Should have, Could have, Won't have) for feature decisions
- Conduct regular scope reviews aligned with sprint retrospectives
- Treat advanced features (additional platforms, media/music identification, multi-region itinerary planning) as clearly marked extensions

### 10.8 API Rate Limits and Availability

**Risk:** External APIs may impose rate limits, experience downtime, or change their terms of service, potentially breaking core functionality.

**Mitigation:**

- Implement exponential backoff and retry logic for all external API calls
- Design provider abstraction layers so that alternative APIs can be substituted with minimal code changes
- Cache responses aggressively to reduce dependency on real-time availability
- Maintain fallback behaviour (e.g., display cached data with a staleness indicator)

### 10.9 Evaluation Challenges

**Risk:** Evaluating the quality of multimodal extraction and the effectiveness of semantic retrieval and personalised ranking is inherently difficult to quantify.

**Mitigation:**

- Define clear, measurable evaluation metrics prior to implementation:
    - **Extraction accuracy:** Precision, recall, and F1 of extracted fields against labelled ground truth
    - **Retrieval quality:** Recall@k and mean reciprocal rank of relevant items for natural-language queries
    - **Ranking quality:** Agreement between ranked results and user feedback
    - **Usability:** Task completion time and satisfaction scores from a user study
- Conduct a small-scale user study (target: 10–15 participants) using their own saved content
- Compare against a baseline such as keyword search over caption text alone

### 10.10 Data Privacy and Security

**Risk:** The application handles personal data (saved content, location, preferences) that must be protected.

**Mitigation:**

- Use Supabase Row-Level Security (RLS) to enforce data access policies at the database level
- Transmit all data over HTTPS
- Minimise personal data collection to what is functionally necessary
- Do not send personally identifiable information to the model provider unless strictly required
- Document data handling practices in accordance with university ethics guidelines

---

## References and Further Reading

The following areas of literature will be reviewed during the research phase of this project:

- **Multimodal representation:** Vision-language models, cross-modal fusion, and OCR-based text extraction
- **Semantic retrieval:** Embedding-based retrieval, dense and hybrid search, chunking strategies
- **Personalised ranking:** Learning-to-rank, implicit feedback, and recommendation systems
- **Speech recognition for Cantonese:** Code-switched and low-resource language recognition
- **Evaluation of retrieval systems:** Recall@k, mean reciprocal rank, and user study methodologies

---

*This proposal is submitted as part of the Final Year Project requirements for the Department of Computer Science and Engineering, The Chinese University of Hong Kong.*
