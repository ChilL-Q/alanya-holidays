-- Purpose: Revoke anon EXECUTE on trigger/helper functions missed by migrations 90002 and 90007.
-- Trigger functions are called only by PostgreSQL internally; anon direct-call access is never intentional.
-- get_category_analytics_average had REVOKE FROM PUBLIC in its creating migration but Supabase
-- also issues an explicit anon grant; REVOKE FROM PUBLIC alone does not remove it.

REVOKE EXECUTE ON FUNCTION public.check_lawyer_contact_rate_limit() FROM anon;
REVOKE EXECUTE ON FUNCTION public.forum_sync_comment_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.forum_sync_comment_like_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.forum_sync_post_like_count() FROM anon;
REVOKE EXECUTE ON FUNCTION public.sync_listing_review_stats() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_chat_message() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_category_analytics_average(text, integer) FROM anon;
