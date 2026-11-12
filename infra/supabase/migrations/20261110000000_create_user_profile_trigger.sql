-- Mirror each Supabase Auth user into public.users so user-owned tables have
-- a profile row to reference. Runs as the migration owner (security definer);
-- the table owner bypasses RLS, which is required because public.users has no
-- INSERT policy for clients.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email, display_name, auth_provider)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'user'),
    coalesce(new.raw_app_meta_data->>'provider', 'email')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
