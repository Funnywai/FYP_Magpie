-- SPEC §3.3/§4.1: every non-done status carries a user-visible reason and next step.
-- Nullable by design: only `needs_media` / `failed` (and optionally `processing`) use status_reason.
-- capture_state stores completed steps + failure reason so capture can resume.
alter table public.saved_items
  add column status_reason text,
  add column capture_state jsonb;
