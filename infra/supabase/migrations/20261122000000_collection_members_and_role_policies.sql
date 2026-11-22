-- Collection membership and role-based access.
--
-- Ownership is still sourced from public.collections.owner_id; collection_members
-- only stores non-owner viewers/editors. Access is not inherited through
-- parent_id: nesting stays metadata-only, with each collection authorized on
-- its own id.
--
-- The helper runs as its owner (the migration role, which owns these tables)
-- with an empty search_path. It reads the membership tables directly, so the
-- policies on those same tables can call it without recursively evaluating
-- their own RLS policies.

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3.12 CollectionMember
-- ---------------------------------------------------------------------------
create table public.collection_members (
  id uuid primary key default gen_random_uuid(),
  collection_id uuid not null references public.collections (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null default 'viewer' check (role in ('viewer', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (collection_id, user_id)
);

create index collection_members_user_id_idx on public.collection_members (user_id);

create trigger collection_members_set_updated_at
  before update on public.collection_members
  for each row execute function public.set_updated_at();

alter table public.collection_members enable row level security;

revoke all on public.collection_members from anon;
grant select, insert, update, delete on public.collection_members to authenticated;

create or replace function private.collection_role(p_collection_id uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1
      from public.collections c
      where c.id = p_collection_id
        and c.owner_id = (select auth.uid())
    ) then 'owner'
    else (
      select m.role
      from public.collection_members m
      where m.collection_id = p_collection_id
        and m.user_id = (select auth.uid())
    )
  end;
$$;

revoke all on function private.collection_role(uuid) from public;
grant execute on function private.collection_role(uuid) to anon, authenticated, service_role;

-- A member reads their own row; the owner reads and manages every row.
create policy "collection_members read own or owner"
  on public.collection_members for select
  using (
    user_id = (select auth.uid())
    or private.collection_role(collection_id) = 'owner'
  );

create policy "collection_members owner insert"
  on public.collection_members for insert
  with check (private.collection_role(collection_id) = 'owner');

create policy "collection_members owner update"
  on public.collection_members for update
  using (private.collection_role(collection_id) = 'owner')
  with check (private.collection_role(collection_id) = 'owner');

create policy "collection_members owner delete"
  on public.collection_members for delete
  using (private.collection_role(collection_id) = 'owner');

-- ---------------------------------------------------------------------------
-- Collections: owner or member reads; only the owner mutates the collection.
-- is_shared remains metadata only; it grants no access.
-- ---------------------------------------------------------------------------
drop policy if exists "collections owner access" on public.collections;
drop policy if exists "collections read shared" on public.collections;

create policy "collections member read"
  on public.collections for select
  using (
    -- The direct owner check also covers INSERT/UPDATE/DELETE ... RETURNING,
    -- where the new row is not yet visible to the membership helper.
    owner_id = (select auth.uid())
    or private.collection_role(id) is not null
  );

create policy "collections owner insert"
  on public.collections for insert
  with check (owner_id = (select auth.uid()));

create policy "collections owner update"
  on public.collections for update
  using (owner_id = (select auth.uid()))
  with check (owner_id = (select auth.uid()));

create policy "collections owner delete"
  on public.collections for delete
  using (owner_id = (select auth.uid()));

-- ---------------------------------------------------------------------------
-- CollectionItems: members read; owners/editors link their own saved items,
-- reorder, and remove links. The column grant makes order_index the only
-- column an authenticated client can update.
-- ---------------------------------------------------------------------------
drop policy if exists "collection_items access via collection" on public.collection_items;

revoke update on public.collection_items from anon, authenticated;
grant update (order_index) on public.collection_items to authenticated;

create policy "collection_items member read"
  on public.collection_items for select
  using (private.collection_role(collection_id) is not null);

create policy "collection_items editor insert"
  on public.collection_items for insert
  with check (
    private.collection_role(collection_id) in ('owner', 'editor')
    and added_by = (select auth.uid())
    and exists (
      select 1
      from public.saved_items si
      where si.id = item_id
        and si.user_id = (select auth.uid())
    )
  );

create policy "collection_items editor update"
  on public.collection_items for update
  using (private.collection_role(collection_id) in ('owner', 'editor'))
  with check (private.collection_role(collection_id) in ('owner', 'editor'));

create policy "collection_items editor delete"
  on public.collection_items for delete
  using (private.collection_role(collection_id) in ('owner', 'editor'));
