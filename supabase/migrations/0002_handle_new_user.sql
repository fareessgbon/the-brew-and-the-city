-- Auto-creates a public.users profile row whenever someone completes magic-
-- link signup via Supabase Auth. Runs as SECURITY DEFINER so it isn't
-- blocked by the users table's RLS policies (which intentionally only allow
-- a user to select/update their own row, not insert it — the trigger is
-- what's supposed to create it).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.users (id, email, name)
  values (new.id, new.email, new.raw_user_meta_data->>'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
