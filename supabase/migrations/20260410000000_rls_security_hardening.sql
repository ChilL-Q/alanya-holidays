-- ============================================================================
-- [76] RLS Security Hardening: bookings, favorites, profiles
-- ============================================================================
-- Purpose: Ensure Row Level Security is enabled and properly configured
-- on all critical tables to prevent direct database access bypassing
-- application-level checks.
--
-- Security Notes:
-- - RLS is enforced at the database level, bypassing it is impossible
--   even with direct Supabase JS SDK access
-- - All policies use (SELECT auth.uid()) to avoid RLS recursion issues
-- - Admin checks query the profiles.role table (database-authoritative)
--   instead of trusting client-side user_metadata
-- ============================================================================

-- ============================================================================
-- 0. Ensure is_admin() function exists and is secure
-- ============================================================================
-- This function is SECURITY DEFINER, meaning it bypasses RLS to read the
-- profiles table directly. This prevents infinite recursion when policies
-- need to check admin status.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$;

-- Grant execute permission to authenticated users
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ============================================================================
-- 1. PROFILES TABLE - User profile and role data
-- ============================================================================
-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "profiles_select" ON profiles;
DROP POLICY IF EXISTS "profiles: read own and others basic info" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "profiles: update own" ON profiles;
DROP POLICY IF EXISTS "profiles: admin can do everything" ON profiles;

-- SELECT: Users can view their own profile
-- Admins can view all profiles
-- Others can view basic info (non-sensitive fields)
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT
  USING (
    -- Own profile: full access
    (SELECT auth.uid()) = id
    -- Admin: all profiles
    OR (SELECT is_admin())
  );

-- INSERT: Users can only create their own profile
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = id
  );

-- UPDATE: Users can update their own profile, admins can update any
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = id
    OR (SELECT is_admin())
  )
  WITH CHECK (
    (SELECT auth.uid()) = id
    OR (SELECT is_admin())
  );

-- DELETE: Only admins can delete profiles
CREATE POLICY "profiles_delete" ON profiles
  FOR DELETE
  USING (
    (SELECT is_admin())
  );

-- ============================================================================
-- 2. BOOKINGS TABLE - Booking records
-- ============================================================================
-- Ensure RLS is enabled
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "bookings_select" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update" ON bookings;
DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
DROP POLICY IF EXISTS "bookings_select_host" ON bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON bookings;
DROP POLICY IF EXISTS "bookings_insert_own" ON bookings;
DROP POLICY IF EXISTS "bookings_update_user_cancel" ON bookings;
DROP POLICY IF EXISTS "bookings_update_host" ON bookings;
DROP POLICY IF EXISTS "bookings_update_admin" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can cancel own bookings" ON bookings;
DROP POLICY IF EXISTS "Hosts can view bookings of own properties" ON bookings;
DROP POLICY IF EXISTS "Hosts can update bookings of own properties" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can update all bookings" ON bookings;

-- SELECT: Booking owner, property host, service provider, or admin
CREATE POLICY "bookings_select" ON bookings
  FOR SELECT
  USING (
    -- Booking owner
    (SELECT auth.uid()) = user_id
    -- Property host
    OR (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties
      WHERE id = bookings.item_id
      AND host_id = (SELECT auth.uid())
    ))
    -- Service provider
    OR (item_type = 'service' AND EXISTS (
      SELECT 1 FROM services
      WHERE id = bookings.item_id
      AND provider_id = (SELECT auth.uid())
    ))
    -- Admin
    OR (SELECT is_admin())
  );

-- INSERT: Authenticated users can create bookings for themselves
CREATE POLICY "bookings_insert" ON bookings
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
    AND (SELECT auth.role()) = 'authenticated'
  );

-- UPDATE: 
-- - Users can only cancel their own bookings
-- - Hosts/providers can update status of bookings for their items
-- - Admins can update any booking
CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE
  USING (
    -- Booking owner can cancel
    (SELECT auth.uid()) = user_id
    -- Property host
    OR (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties
      WHERE id = bookings.item_id
      AND host_id = (SELECT auth.uid())
    ))
    -- Service provider
    OR (item_type = 'service' AND EXISTS (
      SELECT 1 FROM services
      WHERE id = bookings.item_id
      AND provider_id = (SELECT auth.uid())
    ))
    -- Admin
    OR (SELECT is_admin())
  )
  WITH CHECK (
    -- Users can only set status = 'cancelled' on their own bookings
    (
      (SELECT auth.uid()) = user_id
      AND status = 'cancelled'
    )
    -- Hosts/providers have full update on their item bookings
    OR (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties
      WHERE id = bookings.item_id
      AND host_id = (SELECT auth.uid())
    ))
    OR (item_type = 'service' AND EXISTS (
      SELECT 1 FROM services
      WHERE id = bookings.item_id
      AND provider_id = (SELECT auth.uid())
    ))
    -- Admins have full update
    OR (SELECT is_admin())
  );

-- DELETE: Only admins can delete bookings (prevent accidental/malicious deletion)
CREATE POLICY "bookings_delete" ON bookings
  FOR DELETE
  USING (
    (SELECT is_admin())
  );

-- ============================================================================
-- 3. FAVORITES TABLE - User favorites/saved items
-- ============================================================================
-- Ensure RLS is enabled
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "favorites_select" ON favorites;
DROP POLICY IF EXISTS "favorites_insert" ON favorites;
DROP POLICY IF EXISTS "favorites_delete" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "favorites: user own" ON favorites;
DROP POLICY IF EXISTS "favorites: user manage own" ON favorites;
DROP POLICY IF EXISTS "favorites: user delete own" ON favorites;

-- SELECT: Users can only view their own favorites
CREATE POLICY "favorites_select" ON favorites
  FOR SELECT
  USING (
    (SELECT auth.uid()) = user_id
  );

-- INSERT: Users can only add favorites for themselves
CREATE POLICY "favorites_insert" ON favorites
  FOR INSERT
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- UPDATE: Not typically needed for favorites, but restrict to owner just in case
CREATE POLICY "favorites_update" ON favorites
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
  )
  WITH CHECK (
    (SELECT auth.uid()) = user_id
  );

-- DELETE: Users can only delete their own favorites
CREATE POLICY "favorites_delete" ON favorites
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
  );

-- ============================================================================
-- 4. ADDITIONAL TABLES - Support cascade deletes from property deletion
-- ============================================================================
-- These tables need special policies to allow cascade deletes when a property
-- is deleted. The policies allow property hosts/admins to delete related records.

-- REVIEWS: Allow property hosts and admins to delete reviews for their properties
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "reviews_select" ON reviews;
DROP POLICY IF EXISTS "reviews_insert" ON reviews;
DROP POLICY IF EXISTS "reviews_update" ON reviews;
DROP POLICY IF EXISTS "reviews_delete" ON reviews;

CREATE POLICY "reviews_select" ON reviews
  FOR SELECT
  USING (true); -- Reviews are public

CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT is_admin())
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE id = reviews.property_id
      AND host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "reviews_delete" ON reviews
  FOR DELETE
  USING (
    (SELECT auth.uid()) = user_id
    OR (SELECT is_admin())
    OR EXISTS (
      SELECT 1 FROM properties
      WHERE id = reviews.property_id
      AND host_id = (SELECT auth.uid())
    )
  );

-- PROPERTY_AVAILABILITY: Allow property hosts and admins to manage availability
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_availability_select" ON property_availability;
DROP POLICY IF EXISTS "property_availability_insert" ON property_availability;
DROP POLICY IF EXISTS "property_availability_update" ON property_availability;
DROP POLICY IF EXISTS "property_availability_delete" ON property_availability;

CREATE POLICY "property_availability_select" ON property_availability
  FOR SELECT
  USING (true); -- Public read

CREATE POLICY "property_availability_insert" ON property_availability
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_availability.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

CREATE POLICY "property_availability_update" ON property_availability
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_availability.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_availability.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

CREATE POLICY "property_availability_delete" ON property_availability
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_availability.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

-- PROPERTY_ICAL_FEEDS: Allow property hosts and admins to manage iCal feeds
ALTER TABLE public.property_ical_feeds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "property_ical_feeds_select" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_insert" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_update" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds_delete" ON property_ical_feeds;

CREATE POLICY "property_ical_feeds_select" ON property_ical_feeds
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_ical_feeds.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

CREATE POLICY "property_ical_feeds_insert" ON property_ical_feeds
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_ical_feeds.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

CREATE POLICY "property_ical_feeds_update" ON property_ical_feeds
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_ical_feeds.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_ical_feeds.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

CREATE POLICY "property_ical_feeds_delete" ON property_ical_feeds
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE id = property_ical_feeds.property_id
      AND host_id = (SELECT auth.uid())
    )
    OR (SELECT is_admin())
  );

-- FAVORITES: Allow deletion by item_id for property hosts/admins (for cleanup)
-- This is in addition to the user-scoped policies above
DROP POLICY IF EXISTS "favorites_delete_by_host" ON favorites;

CREATE POLICY "favorites_delete_by_host" ON favorites
  FOR DELETE
  USING (
    -- User can delete their own favorites
    (SELECT auth.uid()) = user_id
    -- OR property host cleaning up after deletion
    OR (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties
      WHERE id = favorites.item_id
      AND host_id = (SELECT auth.uid())
    ))
    -- OR admin
    OR (SELECT is_admin())
  );

-- ============================================================================
-- 5. NOTIFICATIONS TABLE - Allow service-level notification creation
-- ============================================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;

-- Users can view their own notifications, admins can view all
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT
  USING (
    user_id = (SELECT auth.uid())
    OR (SELECT is_admin())
  );

-- Authenticated users and service role can create notifications for any user
-- This is intentional - the system creates notifications on behalf of users
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT
  WITH CHECK (
    (SELECT auth.role()) = 'authenticated'
  );

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE
  USING (
    user_id = (SELECT auth.uid())
  )
  WITH CHECK (
    user_id = (SELECT auth.uid())
  );

-- ============================================================================
-- 6. Verification queries (for manual testing)
-- ============================================================================
-- Run these to verify RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications');
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check FROM pg_policies WHERE tablename IN ('profiles', 'bookings', 'favorites', 'reviews', 'property_availability', 'property_ical_feeds', 'notifications') ORDER BY tablename, policyname;
