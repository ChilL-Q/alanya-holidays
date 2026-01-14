-- FORCE ADMIN SCRIPT
-- Этот скрипт принудительно создает профиль (если его нет) и делает его админом.
-- This script forcibly creates a profile (if missing) and makes it an admin.

-- 1. Fix RLS (Allow reading) / Чиним доступ на чтени
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Upsert Profile (Insert or Update) / Создаем или обновляем профиль
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

-- 3. Verify / Проверка
SELECT id, email, role FROM profiles WHERE email = 'salikhovchingiz@gmail.com';
