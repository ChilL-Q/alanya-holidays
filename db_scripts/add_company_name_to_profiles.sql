-- Add company_name to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS company_name TEXT DEFAULT NULL;

-- Update RLS or permissions if needed?
-- Profiles are generally readable authenticated for basic info.
-- No strict policy change needed as 'SELECT' usually allows all columns if not restricted.
-- However, we should ensure hosts can update their own company_name.

-- Policy for UPDATE already likely exists "Users can update own profile".
-- This column will be covered by it.
