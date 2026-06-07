-- Fix: REVOKE explicit anon grants on SECURITY DEFINER functions
-- The previous migration (90002) used REVOKE FROM PUBLIC, but Supabase
-- auto-grants EXECUTE to the anon role explicitly when creating functions.
-- REVOKE FROM PUBLIC only removes the implicit PUBLIC grant, not the
-- explicit anon grant. We must also REVOKE FROM anon to fully block access.
-- See verification: functions still had anon=X in proacl after 90002.

-- Trigger / cron functions (no direct caller access needed)
REVOKE EXECUTE ON FUNCTION public.cancel_expired_bookings() FROM anon;
REVOKE EXECUTE ON FUNCTION public.enforce_premium_admin_only() FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_payout_status_update() FROM anon;
REVOKE EXECUTE ON FUNCTION public.auto_slug_directory_listing() FROM anon;

-- Edge Function only (service_role bypasses EXECUTE checks)
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(UUID, TEXT, INTEGER) FROM anon;

-- Additional SECURITY DEFINER functions missing REVOKE
REVOKE EXECUTE ON FUNCTION public.get_conversations_info(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_premium(UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.check_blog_submission_limit(UUID, INTEGER) FROM anon;
REVOKE EXECUTE ON FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_vote(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.remove_listing_vote(UUID, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_user_votes_batch(UUID[], TEXT) FROM anon;