-- Initial schema — all 12 tables from docs/SPEC.md §3, with Row-Level Security.
--
-- Conventions (SPEC §3):
--   * every table has id (uuid pk), created_at, updated_at
--   * every user-owned table is protected by RLS
--
-- pgvector gotcha: migrations run with an empty search_path, so the vector
-- type must be schema-qualified as extensions.vector(n). Do not pin an
-- extension version (breaks db pull/push when versions differ).

create extension if not exists vector with schema extensions;

-- Reusable updated_at trigger.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3.1 User — mirrors auth.users (profile data only; auth lives in Supabase Auth)
-- ---------------------------------------------------------------------------
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  display_name text not null,
  avatar_url text,
  auth_provider text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

alter table public.users enable row level security;

create policy "users read own row"
  on public.users for select
  using (auth.uid() = id);

create policy "users update own row"
  on public.users for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ---------------------------------------------------------------------------
-- 3.2 PreferenceProfile
-- ---------------------------------------------------------------------------
create table public.preference_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  preferred_categories text[] not null default '{}',
  preferred_tags text[] not null default '{}',
  language_preference text[] not null default '{}',
  ranking_weights jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger preference_profiles_set_updated_at
  before update on public.preference_profiles
  for each row execute function public.set_updated_at();

alter table public.preference_profiles enable row level security;

create policy "preference_profiles owner access"
  on public.preference_profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3.3 SavedItem
-- ---------------------------------------------------------------------------
create table public.saved_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  source_url text not null,
  source_platform text not null
    check (source_platform in ('instagram', 'youtube', 'threads', 'other')),
  content_type text not null default 'generic'
    check (content_type in ('recipe', 'place', 'media', 'generic')),
  title text,
  caption text,
  highlights jsonb not null default '[]'::jsonb,
  category text not null default 'uncategorised',
  status text not null default 'queued'
    check (status in ('queued', 'processing', 'done', 'needs_media', 'failed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index saved_items_user_id_created_at_idx
  on public.saved_items (user_id, created_at desc);

create trigger saved_items_set_updated_at
  before update on public.saved_items
  for each row execute function public.set_updated_at();

alter table public.saved_items enable row level security;

create policy "saved_items owner access"
  on public.saved_items for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3.4 MediaAsset
-- ---------------------------------------------------------------------------
create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.saved_items (id) on delete cascade,
  asset_type text not null check (asset_type in ('thumbnail', 'audio', 'frame')),
  storage_path text not null,
  timestamp_seconds numeric,
  ocr_text text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index media_assets_item_id_idx on public.media_assets (item_id);

create trigger media_assets_set_updated_at
  before update on public.media_assets
  for each row execute function public.set_updated_at();

alter table public.media_assets enable row level security;

create policy "media_assets owner access"
  on public.media_assets for all
  using (exists (
    select 1 from public.saved_items si
    where si.id = media_assets.item_id and si.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.saved_items si
    where si.id = media_assets.item_id and si.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 3.5 TranscriptSegment
-- ---------------------------------------------------------------------------
create table public.transcript_segments (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.saved_items (id) on delete cascade,
  start_seconds numeric not null,
  end_seconds numeric not null,
  text text not null,
  language text not null check (language in ('yue', 'zh', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index transcript_segments_item_id_idx on public.transcript_segments (item_id);

create trigger transcript_segments_set_updated_at
  before update on public.transcript_segments
  for each row execute function public.set_updated_at();

alter table public.transcript_segments enable row level security;

create policy "transcript_segments owner access"
  on public.transcript_segments for all
  using (exists (
    select 1 from public.saved_items si
    where si.id = transcript_segments.item_id and si.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.saved_items si
    where si.id = transcript_segments.item_id and si.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 3.6 ExtractedField
-- ---------------------------------------------------------------------------
create table public.extracted_fields (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.saved_items (id) on delete cascade,
  field_name text not null,
  field_value text,
  confidence numeric not null default 0 check (confidence >= 0 and confidence <= 1),
  evidence_source text not null
    check (evidence_source in ('asr', 'ocr', 'caption', 'visual')),
  evidence_ref text not null,
  verified boolean not null default false,
  user_corrected boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index extracted_fields_item_id_idx on public.extracted_fields (item_id);

create trigger extracted_fields_set_updated_at
  before update on public.extracted_fields
  for each row execute function public.set_updated_at();

alter table public.extracted_fields enable row level security;

create policy "extracted_fields owner access"
  on public.extracted_fields for all
  using (exists (
    select 1 from public.saved_items si
    where si.id = extracted_fields.item_id and si.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.saved_items si
    where si.id = extracted_fields.item_id and si.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 3.7 EmbeddingChunk
-- ---------------------------------------------------------------------------
create table public.embedding_chunks (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.saved_items (id) on delete cascade,
  chunk_type text not null check (chunk_type in ('structured_card', 'transcript', 'ocr')),
  chunk_text text not null,
  -- 1536 dims: Gemini embedding default. Schema-qualified: see header note.
  embedding extensions.vector(1536),
  token_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index embedding_chunks_item_id_idx on public.embedding_chunks (item_id);
-- Approximate nearest-neighbour index for cosine similarity (SPEC §4.4).
create index embedding_chunks_embedding_idx
  on public.embedding_chunks using hnsw (embedding extensions.vector_cosine_ops);

create trigger embedding_chunks_set_updated_at
  before update on public.embedding_chunks
  for each row execute function public.set_updated_at();

alter table public.embedding_chunks enable row level security;

create policy "embedding_chunks owner access"
  on public.embedding_chunks for all
  using (exists (
    select 1 from public.saved_items si
    where si.id = embedding_chunks.item_id and si.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.saved_items si
    where si.id = embedding_chunks.item_id and si.user_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 3.8 Collection (nestable; sharing via RLS)
-- ---------------------------------------------------------------------------
create table public.collections (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  description text,
  is_shared boolean not null default false,
  parent_id uuid references public.collections (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index collections_owner_id_idx on public.collections (owner_id);
create index collections_parent_id_idx on public.collections (parent_id);

create trigger collections_set_updated_at
  before update on public.collections
  for each row execute function public.set_updated_at();

alter table public.collections enable row level security;

-- Owner can always access their collection.
create policy "collections owner access"
  on public.collections for all
  using (auth.uid() = owner_id)
  with check (auth.uid() = owner_id);

-- Shared collections are readable by any authenticated user.
-- (Invitation-scoped access is refined when the sharing feature lands; see
-- SPEC §4.9. Step 1 validates the owner/shared split.)
-- `auth.uid() is not null` == "a logged-in user", which is more robust than
-- `auth.role()` (the latter depends on a JWT role claim being present).
create policy "collections read shared"
  on public.collections for select
  using (is_shared = true and auth.uid() is not null);

-- ---------------------------------------------------------------------------
-- 3.9 CollectionItem
-- ---------------------------------------------------------------------------
create table public.collection_items (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  item_id uuid not null references public.saved_items (id) on delete cascade,
  added_by uuid not null references public.users (id) on delete cascade,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, item_id)
);

create index collection_items_collection_id_idx on public.collection_items (collection_id);

create trigger collection_items_set_updated_at
  before update on public.collection_items
  for each row execute function public.set_updated_at();

alter table public.collection_items enable row level security;

-- Access follows the parent collection: owner, or a shared collection.
create policy "collection_items access via collection"
  on public.collection_items for all
  using (exists (
    select 1 from public.collections c
    where c.id = collection_items.collection_id
      and (c.owner_id = auth.uid() or c.is_shared = true)
  ))
  with check (exists (
    select 1 from public.collections c
    where c.id = collection_items.collection_id
      and c.owner_id = auth.uid()
  ));

-- ---------------------------------------------------------------------------
-- 3.10 Interaction
-- ---------------------------------------------------------------------------
create table public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  item_id uuid not null references public.saved_items (id) on delete cascade,
  interaction_type text not null
    check (interaction_type in ('like', 'dislike', 'view', 'save')),
  "timestamp" timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index interactions_user_id_item_id_idx on public.interactions (user_id, item_id);

create trigger interactions_set_updated_at
  before update on public.interactions
  for each row execute function public.set_updated_at();

alter table public.interactions enable row level security;

create policy "interactions owner access"
  on public.interactions for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3.11 ItineraryPlan
-- ---------------------------------------------------------------------------
create table public.itinerary_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  start_point text not null,
  end_point text not null,
  start_date date not null,
  end_date date not null,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index itinerary_plans_user_id_idx on public.itinerary_plans (user_id);

create trigger itinerary_plans_set_updated_at
  before update on public.itinerary_plans
  for each row execute function public.set_updated_at();

alter table public.itinerary_plans enable row level security;

create policy "itinerary_plans owner access"
  on public.itinerary_plans for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3.12 ItineraryStop
-- ---------------------------------------------------------------------------
create table public.itinerary_stops (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.itinerary_plans (id) on delete cascade,
  day_number integer not null,
  item_id uuid not null references public.saved_items (id) on delete cascade,
  place_id text not null,
  start_time time not null,
  end_time time not null,
  indoor_outdoor text not null check (indoor_outdoor in ('indoor', 'outdoor', 'mixed')),
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index itinerary_stops_plan_id_idx on public.itinerary_stops (plan_id);

create trigger itinerary_stops_set_updated_at
  before update on public.itinerary_stops
  for each row execute function public.set_updated_at();

alter table public.itinerary_stops enable row level security;

create policy "itinerary_stops access via plan"
  on public.itinerary_stops for all
  using (exists (
    select 1 from public.itinerary_plans p
    where p.id = itinerary_stops.plan_id and p.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.itinerary_plans p
    where p.id = itinerary_stops.plan_id and p.user_id = auth.uid()
  ));
