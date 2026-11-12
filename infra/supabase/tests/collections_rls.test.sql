-- RLS test: collections — owner-only access, plus read access to shared ones.
-- Run with: supabase test db

begin;
select plan(4);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'other@example.com');

-- --- Owner creates a private and a shared collection ---------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$insert into public.collections (owner_id, name, is_shared)
    values ('11111111-1111-1111-1111-111111111111', 'Private', false)
    returning name$$,
  array['Private'],
  'the owner can create a private collection'
);

insert into public.collections (owner_id, name, is_shared)
values ('11111111-1111-1111-1111-111111111111', 'Shared', true);

-- --- Another user: sees only the shared collection -----------------------
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

select is_empty(
  $$select * from public.collections where name = 'Private'$$,
  'another user cannot read the private collection'
);

select results_eq(
  $$select name from public.collections where name = 'Shared'$$,
  array['Shared'],
  'another user can read the shared collection'
);

select is_empty(
  $$update public.collections set name = 'hijacked' where name = 'Shared' returning id$$,
  'another user cannot modify a shared collection'
);

select * from finish();
rollback;
