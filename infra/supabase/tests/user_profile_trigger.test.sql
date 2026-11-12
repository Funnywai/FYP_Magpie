-- The auth.users -> public.users trigger must provision a profile on sign-up.
begin;
select plan(3);

insert into auth.users (id, email, raw_app_meta_data)
values (
  '33333333-3333-3333-3333-333333333333',
  'trigger@example.com',
  '{"provider":"email"}'::jsonb
);

select is(
  (select email from public.users where id = '33333333-3333-3333-3333-333333333333'),
  'trigger@example.com',
  'a profile row is created with the auth email'
);

select is(
  (select display_name from public.users where id = '33333333-3333-3333-3333-333333333333'),
  'trigger',
  'display name defaults to the email local part'
);

select is(
  (select auth_provider from public.users where id = '33333333-3333-3333-3333-333333333333'),
  'email',
  'auth provider comes from raw_app_meta_data'
);

select * from finish();
rollback;
