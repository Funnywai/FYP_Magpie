-- SPEC §4.1: every non-done status carries a user-visible reason and next step.
-- Nullable by design: only `needs_media` / `failed` (and optionally `processing`) use it.
alter table public.saved_items
  add column status_reason text;
