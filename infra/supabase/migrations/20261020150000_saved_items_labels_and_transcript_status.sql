-- SPEC §3.3/§4.3: replace the free-text category with semantic labels.
alter table public.saved_items
  drop column category,
  add column labels text[] not null default '{}',
  add column transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'processed', 'not_applicable', 'skipped'));

create index saved_items_labels_idx
  on public.saved_items using gin (labels);
