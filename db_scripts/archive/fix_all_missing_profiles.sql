-- Fix ALL missing profiles at once
-- This script matches every user in auth.users who does NOT have a record in public.profiles
-- and creates a default guest profile for them.

INSERT INTO public.profiles (id, full_name, email, role, avatar_url, created_at)
SELECT 
    au.id,
    -- Try to get name from metadata, fallback to email prefix
    COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)),
    au.email,
    -- Default role
    COALESCE(au.raw_user_meta_data->>'role', 'guest'),
    -- Avatar
    COALESCE(au.raw_user_meta_data->>'avatar_url', ''),
    au.created_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.profiles);

-- Also, verify if the trigger exists, if not, printed warning (just comments)
-- RUN THIS SCRIPT TO UNBLOCK YOUR USER
