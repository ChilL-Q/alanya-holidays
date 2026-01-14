-- FIX INFINITE RECURSION IN RLS (Repair Script)

-- 1. Create a secure function to check admin status
-- This function runs as "Security Definer" (Superuser), bypassing RLS
-- creating a "bypass lane" to check roles without triggering the loop.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; -- <== Critical: Bypasses RLS

-- 2. Drop potential problem policies (clean slate for 'profiles')
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;


-- 3. Re-create policies SAFELY

-- Policy A: View Own Profile (Simple, no recursion)
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Policy B: Admins can view ALL profiles (Uses the bypass function)
CREATE POLICY "Admins can view all profiles" ON profiles
    FOR ALL
    USING (public.is_admin());

-- Policy C: Update Own Profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy D: Insert Own Profile (for registration)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT
    WITH CHECK (auth.uid() = id);


-- 4. Final Verification: Ensure user is Admin
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'), -- Fallback name
    'admin'
FROM auth.users
WHERE email = 'salikhovchingiz@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin';
