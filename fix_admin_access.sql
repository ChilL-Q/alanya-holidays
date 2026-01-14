-- 1. Fix Permissions (RLS) so the app can READ your role
-- Разрешаем приложению читать ваш профиль
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT
    USING (auth.uid() = id);

-- 2. Grant Admin Role again (just in case)
-- Выдаем админку еще раз
UPDATE profiles
SET role = 'admin'
WHERE email = 'salikhovchingiz@gmail.com';

-- 3. Verify the result
-- Проверяем результат
SELECT email, role FROM profiles WHERE email = 'salikhovchingiz@gmail.com';
