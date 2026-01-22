-- FINAL ADMIN FIX V2 (The "Nuclear Option")
-- Этот скрипт чинит ВСЁ: RLS, отсутствие профиля и метаданные.
-- This script fixes EVERYTHING: RLS, missing profile, and metadata.

-- 1. Fix RLS Recursion (Safe Policies) / Чиним рекурсию
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop all old policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Re-create safe policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR ALL USING (public.is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. FORCE UPSERT PROFILE (Ensures row exists) / Создаем профиль принудительно
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'full_name', 'Admin User'),
    'admin' -- <== FORCE ROLE
FROM auth.users
WHERE email = 'salikhovchingiz@gmail.com'
ON CONFLICT (id) DO UPDATE
SET role = 'admin'; -- <== FORCE UPDATE IF EXISTS

-- 3. UPDATE AUTH METADATA (Fail-safe) / Обновляем метаданные в auth.users
UPDATE auth.users
SET raw_user_meta_data = 
  COALESCE(raw_user_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
WHERE email = 'salikhovchingiz@gmail.com';

-- 4. VERIFY / Проверка
SELECT id, email, role FROM profiles WHERE email = 'salikhovchingiz@gmail.com';
