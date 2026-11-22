-- Harden the collection tables after Supabase's default ALL grants.
--
-- RLS still decides row access, but anon/authenticated inherited TRUNCATE,
-- TRIGGER, REFERENCES, and table-wide UPDATE from the default table grant.
-- Client roles only need table-level CRUD, with column-only UPDATE on the
-- two link/member tables. service_role is deliberately left untouched.

revoke all on table public.collections,
                    public.collection_items,
                    public.collection_members
  from public, anon, authenticated;

-- Column privileges live outside the table-level ACL, so revoke them too.
revoke all (id, owner_id, name, description, is_shared, parent_id, created_at, updated_at)
  on table public.collections
  from public, anon, authenticated;
revoke all (id, collection_id, item_id, added_by, order_index, created_at, updated_at)
  on table public.collection_items
  from public, anon, authenticated;
revoke all (id, collection_id, user_id, role, created_at, updated_at)
  on table public.collection_members
  from public, anon, authenticated;

grant select, insert, update, delete
  on table public.collections
  to authenticated;

grant select, insert, delete
  on table public.collection_items
  to authenticated;
grant update (order_index)
  on table public.collection_items
  to authenticated;

grant select, insert, delete
  on table public.collection_members
  to authenticated;
grant update ("role")
  on table public.collection_members
  to authenticated;

-- The helper is evaluated only for authenticated RLS checks.
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

revoke all on function private.collection_role(uuid) from public, anon;
grant execute on function private.collection_role(uuid) to authenticated, service_role;

-- Ownership comes from collections.owner_id; the owner must not create a
-- member row for themselves. The column grant above also prevents clients
-- from reparenting a membership row.
alter policy "collection_members owner insert"
  on public.collection_members
  with check (
    private.collection_role(collection_id) = 'owner'
    and user_id <> (select auth.uid())
  );

alter policy "collection_members owner update"
  on public.collection_members
  with check (
    private.collection_role(collection_id) = 'owner'
    and user_id <> (select auth.uid())
  );
