-- Catalog test: collection table, helper schema, and helper function grants.
-- Run with: supabase test db

begin;
select plan(18);

select table_privs_are(
  'public', 'collections', 'authenticated',
  array['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  'authenticated has only owner-controlled CRUD on collections'
);

select table_privs_are(
  'public', 'collection_items', 'authenticated',
  array['SELECT', 'INSERT', 'DELETE'],
  'authenticated has no table-wide UPDATE on collection_items'
);

select table_privs_are(
  'public', 'collection_members', 'authenticated',
  array['SELECT', 'INSERT', 'DELETE'],
  'authenticated has no table-wide UPDATE on collection_members'
);

select is(
  (select array_agg(a.attname::text order by a.attname)
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'collection_items'
     and a.attnum > 0
     and not a.attisdropped
     and has_column_privilege('authenticated', c.oid, a.attnum, 'UPDATE')),
  array['order_index'],
  'authenticated can update only order_index on collection_items'
);

select is(
  (select array_agg(a.attname::text order by a.attname)
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   where n.nspname = 'public'
     and c.relname = 'collection_members'
     and a.attnum > 0
     and not a.attisdropped
     and has_column_privilege('authenticated', c.oid, a.attnum, 'UPDATE')),
  array['role'],
  'authenticated can update only role on collection_members'
);

select is(
  (select count(*)::int
   from information_schema.role_table_grants
   where table_schema = 'public'
     and table_name in ('collections', 'collection_items', 'collection_members')
     and grantee = 'anon'),
  0,
  'anon has no table privileges on the collection tables'
);

select is(
  (select count(*)::int
   from information_schema.column_privileges
   where table_schema = 'public'
     and table_name in ('collections', 'collection_items', 'collection_members')
     and grantee = 'anon'),
  0,
  'anon has no column privileges on the collection tables'
);

select is(
  (select count(*)::int
   from pg_class c
   join pg_namespace n on n.oid = c.relnamespace
   cross join lateral aclexplode(coalesce(c.relacl, acldefault('r', c.relowner))) x
   where n.nspname = 'public'
     and c.relname in ('collections', 'collection_items', 'collection_members')
     and x.grantee = 0),
  0,
  'PUBLIC has no table privileges on the collection tables'
);

select is(
  (select count(*)::int
   from pg_attribute a
   join pg_class c on c.oid = a.attrelid
   join pg_namespace n on n.oid = c.relnamespace
   cross join lateral aclexplode(coalesce(a.attacl, acldefault('c', c.relowner))) x
   where n.nspname = 'public'
     and c.relname in ('collections', 'collection_items', 'collection_members')
     and a.attnum > 0
     and not a.attisdropped
     and x.grantee = 0),
  0,
  'PUBLIC has no column privileges on the collection tables'
);

select ok(
  has_schema_privilege('authenticated', 'private', 'USAGE'),
  'authenticated can use the private helper schema'
);

select ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon cannot use the private helper schema'
);

select is(
  (select count(*)::int
   from pg_namespace n
   cross join lateral aclexplode(coalesce(n.nspacl, acldefault('n', n.nspowner))) x
   where n.nspname = 'private'
     and x.grantee = 0),
  0,
  'PUBLIC has no USAGE on the private helper schema'
);

select ok(
  has_function_privilege('authenticated', 'private.collection_role(uuid)', 'EXECUTE'),
  'authenticated can execute the collection role helper'
);

select ok(
  not has_function_privilege('anon', 'private.collection_role(uuid)', 'EXECUTE'),
  'anon cannot execute the collection role helper'
);

select is(
  (select count(*)::int
   from pg_proc p
   cross join lateral aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) x
   where p.oid = 'private.collection_role(uuid)'::regprocedure
     and x.grantee = 0),
  0,
  'PUBLIC has no EXECUTE on the collection role helper'
);

select is(
  (select count(*)::int
   from unnest(array['collections', 'collection_items', 'collection_members']) as t(name)
   cross join unnest(array['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER']) as p(priv)
   where has_table_privilege('service_role', format('public.%I', t.name), p.priv)),
  21,
  'service_role keeps the default table privileges on all three tables'
);

select ok(
  has_schema_privilege('service_role', 'private', 'USAGE'),
  'service_role keeps USAGE on the private helper schema'
);

select ok(
  has_function_privilege('service_role', 'private.collection_role(uuid)', 'EXECUTE'),
  'service_role keeps EXECUTE on the collection role helper'
);

select * from finish();
rollback;
