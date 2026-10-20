-- SPEC §3.3/§4.1: terminal non-done statuses carry a user-visible reason and next step.
-- Nullable by design: set for terminal non-done statuses (needs_media, failed); optional for processing.
-- capture_state stores completed steps + failure reason so capture can resume.
alter table public.saved_items
  add column status_reason text,
  add column capture_state jsonb;
