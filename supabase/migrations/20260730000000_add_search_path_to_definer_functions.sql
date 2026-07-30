-- Purpose: harden SECURITY DEFINER functions missing an explicit search_path
-- (prevents search_path injection). Audit 2026-07-30.
--
-- Functions audited:
-- 1. get_user_vote(UUID, TEXT) - called from frontend with user's JWT
-- 2. cancel_expired_pending_bookings() - scheduled via pg_cron
-- 3. expire_listing_addons() - scheduled via pg_cron
--
-- Note: vote_listing, remove_listing_vote, and get_user_votes_batch
-- were already fixed in 20260721181153 with new signatures that include
-- SET search_path = public. enforce_premium_admin_only() was fixed in
-- 20260607090000. enforce_premium_admin() was dropped in 20260607090006.

ALTER FUNCTION public.get_user_vote(UUID, TEXT) SET search_path = public;

ALTER FUNCTION public.cancel_expired_pending_bookings() SET search_path = public;

ALTER FUNCTION public.expire_listing_addons() SET search_path = public;
