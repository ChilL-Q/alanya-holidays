-- EMERGENCY FIX: Disable RLS to stop recursion immediately
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;

-- Verify it worked by selecting (you should see results)
SELECT * FROM profiles LIMIT 5;

