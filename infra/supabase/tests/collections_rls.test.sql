-- RLS test: collections — owner plus viewer/editor membership, no global read.
-- Run with: supabase test db

begin;
select plan(28);

insert into auth.users (id, email)
values
  ('11111111-1111-1111-1111-111111111111', 'owner@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'editor@example.com'),
  ('33333333-3333-3333-3333-333333333333', 'viewer@example.com'),
  ('44444444-4444-4444-4444-444444444444', 'outsider@example.com');

-- --- Owner: create a collection and manage its members -------------------
set local role authenticated;
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$insert into public.collections (id, owner_id, name, is_shared)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '11111111-1111-1111-1111-111111111111', 'Private', false)
    returning name$$,
  array['Private'],
  'the owner can create a private collection'
);

select throws_ok(
  $$insert into public.collection_members (collection_id, user_id, role)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '11111111-1111-1111-1111-111111111111', 'viewer')$$,
  '42501',
  null::text,
  'the owner cannot add themselves as a member'
);

select results_eq(
  $$insert into public.collection_members (collection_id, user_id, role)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '33333333-3333-3333-3333-333333333333', 'viewer')
    returning role$$,
  array['viewer'],
  'the owner can add a viewer'
);

select results_eq(
  $$insert into public.collection_members (collection_id, user_id, role)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '22222222-2222-2222-2222-222222222222', 'editor')
    returning role$$,
  array['editor'],
  'the owner can add an editor'
);

select is(
  (select count(*)::int from public.collection_members),
  2,
  'the owner sees every membership row'
);

insert into public.saved_items (id, user_id, source_url, source_platform, title)
values ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
        '11111111-1111-1111-1111-111111111111',
        'https://youtube.com/watch?v=owner', 'youtube', 'Owner item');

select results_eq(
  $$insert into public.collection_items (collection_id, item_id, added_by, order_index)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
            '11111111-1111-1111-1111-111111111111', 0)
    returning added_by$$,
  array['11111111-1111-1111-1111-111111111111'::uuid],
  'the owner can link their own saved item'
);

-- --- Outsider: no read access, regardless of is_shared -------------------
set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is_empty(
  $$select * from public.collections where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'a non-member cannot read the collection'
);

select is_empty(
  $$select * from public.collection_members$$,
  'a non-member cannot read membership rows'
);

select is_empty(
  $$select * from public.collection_items
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'a non-member cannot read link rows'
);

-- --- Viewer: read-only ---------------------------------------------------
set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select results_eq(
  $$select role from public.collection_members
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  array['viewer'],
  'a viewer sees their own membership'
);

select results_eq(
  $$select name from public.collections where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  array['Private'],
  'a viewer can read the collection'
);

select is(
  (select count(*)::int from public.collection_items
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'),
  1,
  'a viewer can read link rows'
);

insert into public.saved_items (id, user_id, source_url, source_platform, title)
values ('dddddddd-dddd-dddd-dddd-dddddddddddd',
        '33333333-3333-3333-3333-333333333333',
        'https://youtube.com/watch?v=viewer', 'youtube', 'Viewer item');

select throws_ok(
  $$insert into public.collection_items (collection_id, item_id, added_by)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'dddddddd-dddd-dddd-dddd-dddddddddddd',
            '33333333-3333-3333-3333-333333333333')$$,
  '42501',
  null::text,
  'a viewer cannot add a link'
);

-- --- Editor: link own items, reorder, remove; no metadata changes --------
set local request.jwt.claim.sub = '22222222-2222-2222-2222-222222222222';

insert into public.saved_items (id, user_id, source_url, source_platform, title)
values
  ('cccccccc-cccc-cccc-cccc-cccccccccccc',
   '22222222-2222-2222-2222-222222222222',
   'https://youtube.com/watch?v=editor', 'youtube', 'Editor item'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccd',
   '22222222-2222-2222-2222-222222222222',
   'https://youtube.com/watch?v=editor2', 'youtube', 'Editor item 2');

select results_eq(
  $$insert into public.collection_items (collection_id, item_id, added_by)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'cccccccc-cccc-cccc-cccc-cccccccccccc',
            '22222222-2222-2222-2222-222222222222')
    returning added_by$$,
  array['22222222-2222-2222-2222-222222222222'::uuid],
  'an editor can link their own saved item as themselves'
);

select throws_ok(
  $$insert into public.collection_items (collection_id, item_id, added_by)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            'cccccccc-cccc-cccc-cccc-cccccccccccd',
            '11111111-1111-1111-1111-111111111111')$$,
  '42501',
  null::text,
  'an editor cannot link an item as another user'
);

select results_eq(
  $$update public.collection_items set order_index = 5
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and item_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'
    returning order_index$$,
  array[5],
  'an editor can reorder a link'
);

select throws_ok(
  $$update public.collection_items set added_by = '22222222-2222-2222-2222-222222222222'
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and item_id = 'cccccccc-cccc-cccc-cccc-cccccccccccc'$$,
  '42501',
  null::text,
  'an editor cannot update columns other than order_index'
);

select is_empty(
  $$update public.collections set name = 'hijacked'
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning id$$,
  'an editor cannot edit collection metadata'
);

select is_empty(
  $$delete from public.collections where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning id$$,
  'an editor cannot delete the collection'
);

select throws_ok(
  $$insert into public.collection_members (collection_id, user_id, role)
    values ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
            '44444444-4444-4444-4444-444444444444', 'viewer')$$,
  '42501',
  null::text,
  'an editor cannot add a member'
);

select is_empty(
  $$update public.collection_members set role = 'editor'
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '33333333-3333-3333-3333-333333333333'
    returning id$$,
  'an editor cannot change a member role'
);

select results_eq(
  $$delete from public.collection_items
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and item_id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
    returning item_id$$,
  array['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'::uuid],
  'an editor can remove any link in the collection'
);

-- --- Owner: metadata still editable, is_shared grants no access ----------
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$update public.collections set is_shared = true
    where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning is_shared$$,
  array[true],
  'the owner can edit collection metadata'
);

insert into public.collections (id, owner_id, name, parent_id)
values ('ffffffff-ffff-ffff-ffff-ffffffffffff',
        '11111111-1111-1111-1111-111111111111', 'Child',
        'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

set local request.jwt.claim.sub = '44444444-4444-4444-4444-444444444444';

select is_empty(
  $$select * from public.collections where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'$$,
  'a non-member still cannot read the now-shared collection'
);

set local request.jwt.claim.sub = '33333333-3333-3333-3333-333333333333';

select is_empty(
  $$select * from public.collections where id = 'ffffffff-ffff-ffff-ffff-ffffffffffff'$$,
  'membership does not inherit through collection nesting'
);

-- --- Owner: manage the member row and delete the collection --------------
set local request.jwt.claim.sub = '11111111-1111-1111-1111-111111111111';

select results_eq(
  $$update public.collection_members set role = 'editor'
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '33333333-3333-3333-3333-333333333333'
    returning role$$,
  array['editor'],
  'the owner can change a member role'
);

select results_eq(
  $$delete from public.collection_members
    where collection_id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
      and user_id = '33333333-3333-3333-3333-333333333333'
    returning user_id$$,
  array['33333333-3333-3333-3333-333333333333'::uuid],
  'the owner can remove a member'
);

select results_eq(
  $$delete from public.collections where id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'
    returning id$$,
  array['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'::uuid],
  'the owner can delete the collection'
);

select * from finish();
rollback;
