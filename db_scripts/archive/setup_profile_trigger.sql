-- FUNCTION: Handle New User
-- This function runs automatically whenever a new user is created in auth.users
-- It creates a corresponding public profile.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, role, avatar_url)
  values (
    new.id,
    -- Get data from metadata sent during signUp, or fallback to email parts
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    -- Default to 'guest' if role is not specified
    coalesce(new.raw_user_meta_data ->> 'role', 'guest'),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

-- TRIGGER: Connect the function to the auth.users table
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
