-- RLS test: saved_items — a user must never read another user's items.
-- Run with: supabase test db
--
-- Assertion conventions (Supabase RLS testing guide):
--   * missing grant / with-check violation -> throws_ok with SQLSTATE 42501
--   * using-clause filters rows               -> is_empty (not throws_ok)
--   * prove an allowed write via RETURNING, never lives_ok.

begin;
select plan(4);

-- Two users. Inserting directly into auth.users simulates sign-up.
insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

-- Profile rows are required because saved_items.user_id references public.users.
insert into public.users (id, email, display_name, auth_provider)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'Owner', 'email'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com', 'Other', 'email');

-- --- As the owner: create one item ----------------------------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$insert into public.saved_items (user_id, source_url, source_platform, title)
    values ('11111111-1111-1111-1111-111111111111',
            'https://youtube.com/watch?v=abc',
            'youtube', 'Owner item')
    returning title$$,
  array['Owner item'],
  'the owner can insert their own item'
);

select is(
  (select count(*)::int from public.saved_items),
  1,
  'the owner sees exactly their one item'
);

-- --- As the other user: cannot see the owner's item ----------------------
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is_empty(
  $$select * from public.saved_items$$,
  'another user reads no items'
);

select is_empty(
  $$update public.saved_items set title = 'stolen' returning id$$,
  'another user updates no items'
);

select * from finish();
rollback;
