alter table public.saved_items
  add column transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'processed', 'not_applicable', 'skipped'));
