-- RLS test: users — a user can only read/update their own profile row.
-- Run with: supabase test db

begin;
select plan(3);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

insert into public.users (id, email, display_name, auth_provider)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com', 'Owner', 'email'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com', 'Other', 'email');

set local role authenticated;

-- Owner reads exactly one row.
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';
select is(
  (select count(*)::int from public.users),
  1,
  'the owner sees only their own profile'
);

-- Another user reads exactly one row (theirs).
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';
select is(
  (select count(*)::int from public.users),
  1,
  'another user sees only their own profile'
);

-- Updating someone else's row affects nothing.
select is_empty(
  $$update public.users set display_name = 'hacked'
    where id = '11111111-1111-1111-1111-111111111111'
    returning id$$,
  'a user cannot update another user''s profile'
);

select * from finish();
rollback;
