-- Run this script in your Supabase SQL Editor to become an Admin
-- Это скрипт для выдачи прав администратора пользователю salikhovchingiz@gmail.com

UPDATE profiles
SET role = 'admin'
WHERE email = 'salikhovchingiz@gmail.com';

-- Verify the change
SELECT id, email, role, full_name FROM profiles WHERE email = 'salikhovchingiz@gmail.com';
