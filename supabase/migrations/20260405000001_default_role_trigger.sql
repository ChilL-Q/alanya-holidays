-- Security: set default 'guest' role on new user registration.
-- Prevents self-elevation to admin via client-side user_metadata.

create extension if not exists pgcrypto;

create or replace function public.handle_new_user_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
    insert into public.profiles (id, full_name, email, role, company_name, avatar_url)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.email, ''),
        'guest',
        new.raw_user_meta_data->>'company_name',
        new.raw_user_meta_data->>'avatar_url'
    )
    on conflict (id) do update
    set role = 'guest';

    return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
    after insert on auth.users
    for each row
    execute function public.handle_new_user_role();
