alter table public.preference_profiles
  rename column preferred_categories to preferred_content_types;

alter table public.preference_profiles
  rename column preferred_tags to preferred_labels;

update public.preference_profiles
  set preferred_content_types = array(
    select value
    from unnest(preferred_content_types) as value
    where value in ('recipe', 'place', 'media', 'generic')
  );

alter table public.preference_profiles
  add constraint preference_profiles_content_types_check
  check (preferred_content_types <@ array['recipe', 'place', 'media', 'generic']::text[]);
