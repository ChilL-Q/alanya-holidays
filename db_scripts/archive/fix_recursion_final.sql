-- 1. Сначала отключаем RLS чтобы можно было все починить даже если мы заблокированы
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- 2. Удаляем ВСЕ существующие политики, чтобы гарантированно убрать рекурсию
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
-- Add drops for the exact names we are about to create
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;


DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Hosts can insert their own properties" ON properties;
DROP POLICY IF EXISTS "Hosts can update their own properties" ON properties;
DROP POLICY IF EXISTS "Hosts can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Enable read access for all users" ON properties;
DROP POLICY IF EXISTS "Enable insert for hosts" ON properties;
DROP POLICY IF EXISTS "Enable update for hosts" ON properties;
-- Add drops for the exact names we are about to create
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;

-- 3. Создаем ПРОСТЫЕ, НЕРЕКУРСИВНЫЕ политики для PROFILES
-- Чтение разрешено всем. Нет условий = нет рекурсии.
CREATE POLICY "Profiles are viewable by everyone" 
ON profiles FOR SELECT 
USING (true);

-- Вставка разрешена пользователю только для себя (по auth.uid)
CREATE POLICY "Users can insert their own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Обновление разрешено пользователю только для себя
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 4. Создаем ПРОСТЫЕ политики для PROPERTIES
-- Чтение разрешено всем.
CREATE POLICY "Properties are viewable by everyone" 
ON properties FOR SELECT 
USING (true);

-- Вставка: разрешаем любому аутенфицированному пользователю вставлять, 
-- НО проверяем, что host_id совпадает с его ID.
-- НЕ проверяем роль в profiles, чтобы избежать join'а (или делаем это осторожно).
CREATE POLICY "Users can insert their own properties" 
ON properties FOR INSERT 
WITH CHECK (auth.uid() = host_id); 
-- Если нужно проверять 'host' роль, убедитесь, что profile policy не зависит от property!
-- Но сейчас profiles policy простая (true), так что можно даже роль проверить:
-- WITH CHECK (auth.uid() = host_id AND exists (select 1 from profiles where id = auth.uid() and role = 'host'));

-- Обновление: только хозяин может обновлять
CREATE POLICY "Hosts can update their own properties" 
ON properties FOR UPDATE 
USING (auth.uid() = host_id);

-- Удаление: только хозяин
CREATE POLICY "Hosts can delete their own properties" 
ON properties FOR DELETE 
USING (auth.uid() = host_id);


-- 5. Включаем RLS обратно
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

-- 6. На всякий случай выдаем права
GRANT ALL ON TABLE profiles TO authenticated;
GRANT ALL ON TABLE profiles TO service_role;
GRANT ALL ON TABLE properties TO authenticated;
GRANT ALL ON TABLE properties TO service_role;
