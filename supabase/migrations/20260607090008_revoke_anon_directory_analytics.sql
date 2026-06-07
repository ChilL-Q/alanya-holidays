-- Revoke anon access to get_directory_analytics_for_owner
-- This function was missed in migrations 90002 and 90007.
-- It returns private analytics data (views, clicks, revenue) for a listing owner
-- and should never be callable by unauthenticated users.
REVOKE EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INTEGER) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INTEGER) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INTEGER) TO authenticated;
