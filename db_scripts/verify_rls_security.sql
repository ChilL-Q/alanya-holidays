-- ============================================================================
-- RLS Verification Script
-- ============================================================================
-- Run this AFTER applying the migration to verify RLS is working correctly
-- ============================================================================

-- ============================================================================
-- 1. VERIFY RLS IS ENABLED ON ALL TABLES
-- ============================================================================
SELECT 
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
ORDER BY tablename;

-- Expected: All should show rowsecurity = true

-- ============================================================================
-- 2. VERIFY ALL POLICIES EXIST
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles
FROM pg_policies 
WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
ORDER BY tablename, policyname;

-- Expected: 
-- profiles: 4 policies (insert, select, update, delete)
-- bookings: 4 policies (insert, select, update, delete)
-- favorites: 4-5 policies (insert, select, update, delete + host delete)
-- reviews: 4 policies (insert, select, update, delete)
-- property_availability: 4 policies (insert, select, update, delete)
-- property_ical_feeds: 4 policies (insert, select, update, delete)
-- notifications: 3 policies (insert, select, update)
-- audit_logs: 2 policies (insert, select)

-- ============================================================================
-- 3. VERIFY is_admin() FUNCTION EXISTS AND IS SECURE
-- ============================================================================
SELECT 
  routine_name,
  security_type,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public' 
  AND routine_name = 'is_admin';

-- Expected: security_type = 'DEFINER', routine_definition should show it checks profiles.role

-- ============================================================================
-- 4. VERIFY FUNCTION HAS PROPER SEARCH_PATH
-- ============================================================================
SELECT 
  proname as function_name,
  proconfig as search_path_config
FROM pg_proc
WHERE proname = 'is_admin';

-- Expected: proconfig should include 'search_path=public'

-- ============================================================================
-- 5. VERIFY INDEXES EXIST FOR RLS POLICY PERFORMANCE
-- ============================================================================
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('bookings', 'favorites', 'profiles', 'reviews', 'property_availability', 'property_ical_feeds')
  AND (indexname LIKE '%user_id%' OR indexname LIKE '%host_id%' OR indexname LIKE '%provider_id%' OR indexname LIKE '%property_id%')
ORDER BY tablename, indexname;

-- Expected: Should see indexes on user_id, host_id, provider_id, property_id columns

-- ============================================================================
-- 6. TEST: COUNT POLICIES PER TABLE
-- ============================================================================
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
GROUP BY tablename
ORDER BY tablename;

-- Expected: Each table should have 3-5 policies

-- ============================================================================
-- 7. VERIFY NO DUPLICATE POLICIES
-- ============================================================================
SELECT 
  tablename,
  policyname,
  COUNT(*) as duplicates
FROM pg_policies 
WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
GROUP BY tablename, policyname
HAVING COUNT(*) > 1;

-- Expected: 0 rows (no duplicates)

-- ============================================================================
-- 8. VERIFY ALL THREE TABLES HAVE RLS ENABLED
-- ============================================================================
DO $$
DECLARE
  missing_rls text[];
BEGIN
  SELECT array_agg(tablename)
  INTO missing_rls
  FROM pg_tables
  WHERE schemaname = 'public'
    AND tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
    AND rowsecurity = false;
  
  IF missing_rls IS NOT NULL AND array_length(missing_rls, 1) > 0 THEN
    RAISE EXCEPTION 'RLS not enabled on tables: %', missing_rls;
  ELSE
    RAISE NOTICE '✓ RLS is enabled on all critical tables';
  END IF;
END $$;

-- ============================================================================
-- 9. VERIFY POLICY COVERAGE
-- ============================================================================
DO $$
DECLARE
  rec record;
  expected_ops text[];
  actual_ops text[];
BEGIN
  FOR rec IN 
    SELECT DISTINCT tablename 
    FROM pg_policies 
    WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
    ORDER BY tablename
  LOOP
    -- Determine expected operations based on table
    IF rec.tablename = 'audit_logs' THEN
      expected_ops := ARRAY['SELECT', 'INSERT'];
    ELSIF rec.tablename = 'notifications' THEN
      expected_ops := ARRAY['SELECT', 'INSERT', 'UPDATE'];
    ELSE
      expected_ops := ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'];
    END IF;
    
    SELECT array_agg(DISTINCT cmd)
    INTO actual_ops
    FROM pg_policies
    WHERE tablename = rec.tablename;
    
    IF actual_ops @> expected_ops THEN
      RAISE NOTICE '✓ % has all required operations: %', rec.tablename, actual_ops;
    ELSE
      RAISE WARNING '% missing operations. Has: %, Expected: %', 
        rec.tablename, actual_ops, expected_ops;
    END IF;
  END LOOP;
END $$;

-- ============================================================================
-- 10. VERIFY LISTING CLAIMS CANNOT BYPASS THE BACKEND
-- ============================================================================
DO $$
BEGIN
  IF has_table_privilege('anon', 'public.listing_claims', 'INSERT')
     OR has_table_privilege('authenticated', 'public.listing_claims', 'INSERT') THEN
    RAISE EXCEPTION 'Direct listing_claims INSERT remains granted to a public API role';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'listing_claims'
      AND cmd = 'INSERT'
      AND (
        roles @> ARRAY['anon']::name[]
        OR roles @> ARRAY['authenticated']::name[]
        OR roles @> ARRAY['public']::name[]
      )
  ) THEN
    RAISE EXCEPTION 'Direct listing_claims INSERT policy remains available to a public API role';
  END IF;

  IF NOT has_table_privilege('service_role', 'public.listing_claims', 'INSERT') THEN
    RAISE EXCEPTION 'Backend service_role lost listing_claims INSERT access';
  END IF;

  RAISE NOTICE '✓ Listing claims can only be inserted through the backend service role';
END $$;

-- ============================================================================
-- 11. FINAL SUMMARY
-- ============================================================================
SELECT 
  'RLS Security Verification' as check_name,
  CASE 
    WHEN (
      SELECT COUNT(*)
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
        AND rowsecurity = true
    ) = 8
    AND (
      SELECT COUNT(*)
      FROM pg_policies
      WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications', 'audit_logs')
    ) >= 30
    THEN '✓ PASSED - All 8 tables have RLS enabled with 30+ total policies'
    ELSE '✗ FAILED - RLS configuration incomplete'
  END as result;
