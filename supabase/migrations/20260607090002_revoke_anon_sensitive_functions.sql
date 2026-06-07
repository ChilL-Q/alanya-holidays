-- Revoke anonymous and unauthorized access to SECURITY DEFINER functions
-- These functions were callable by anyone via /rest/v1/rpc/ which is a security risk.
-- See: DB_FIXES.md Fix #1

-- ============================================================
-- Functions called from frontend (need authenticated access)
-- ============================================================

-- create_booking: used by authenticated users during checkout
-- Only the 9-param overload exists (p_item_type has DEFAULT 'property').
-- REVOKE FROM PUBLIC is required (not just FROM anon) because PostgreSQL
-- grants EXECUTE to PUBLIC by default, which includes anon.
REVOKE EXECUTE ON FUNCTION public.create_booking(UUID, UUID, DATE, DATE, DECIMAL, INTEGER, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_booking(UUID, UUID, DATE, DATE, DECIMAL, INTEGER, TEXT, TEXT, TEXT) TO authenticated;

-- check_booking_conflict: used by authenticated users to check availability
REVOKE EXECUTE ON FUNCTION public.check_booking_conflict(UUID, TEXT, DATE, DATE) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_booking_conflict(UUID, TEXT, DATE, DATE) TO authenticated;

-- unblock_dates_for_booking: used by authenticated users when cancelling bookings
REVOKE EXECUTE ON FUNCTION public.unblock_dates_for_booking(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unblock_dates_for_booking(UUID) TO authenticated;

-- ============================================================
-- Trigger / cron functions (no direct caller access needed)
-- Triggers execute as the table owner, pg_cron runs as superuser.
-- ============================================================

-- cancel_expired_bookings: called only by pg_cron
REVOKE EXECUTE ON FUNCTION public.cancel_expired_bookings() FROM PUBLIC;

-- enforce_premium_admin_only: trigger function on directory_listings
REVOKE EXECUTE ON FUNCTION public.enforce_premium_admin_only() FROM PUBLIC;

-- check_payout_status_update: trigger function on bookings
REVOKE EXECUTE ON FUNCTION public.check_payout_status_update() FROM PUBLIC;

-- auto_slug_directory_listing: trigger function on directory_listings
REVOKE EXECUTE ON FUNCTION public.auto_slug_directory_listing() FROM PUBLIC;

-- ============================================================
-- check_rate_limit: called only by Edge Functions (service_role)
-- service_role bypasses EXECUTE checks, so no GRANT needed.
-- yesim-proxy already uses SUPABASE_SERVICE_ROLE_KEY.
-- ============================================================

REVOKE EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER) FROM PUBLIC;

-- ============================================================
-- Additional SECURITY DEFINER functions missing REVOKE
-- These were callable by anon via /rest/v1/rpc/ despite only
-- being intended for authenticated or internal use.
-- ============================================================

-- get_conversations_info: returns private chat data (conversation IDs,
-- message content, sender IDs). CRITICAL: no auth.uid() check inside
-- the function body — anyone can query any user's conversations.
REVOKE EXECUTE ON FUNCTION public.get_conversations_info(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_conversations_info(UUID) TO authenticated;

-- is_premium: leaks premium subscription status of any user by UUID.
REVOKE EXECUTE ON FUNCTION public.is_premium(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;

-- check_blog_submission_limit: leaks how many blog submissions a user
-- has made in the last 24 hours.
REVOKE EXECUTE ON FUNCTION public.check_blog_submission_limit(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_blog_submission_limit(UUID, INTEGER) TO authenticated;

-- vote_listing, get_user_vote, remove_listing_vote, get_user_votes_batch:
-- listing vote functions — internally check auth.uid() and raise
-- exceptions for unauthenticated users, but should not be callable by anon.
REVOKE EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_vote(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_vote(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.remove_listing_vote(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.remove_listing_vote(UUID, TEXT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], TEXT) TO authenticated;
