-- Fix mutable search_path in functions
-- enforce_premium_admin_only() is SECURITY DEFINER and vulnerable to search_path
-- injection — this is a critical fix.
-- update_updated_at_column() and validate_blog_submission_status_transition()
-- are SECURITY INVOKER, so SET search_path is a defense-in-depth measure
-- (not strictly required but consistent with the security hardening approach).
-- See: DB_FIXES.md Fix #2

ALTER FUNCTION public.update_updated_at_column()
  SET search_path = public;

ALTER FUNCTION public.enforce_premium_admin_only()
  SET search_path = public;

ALTER FUNCTION public.validate_blog_submission_status_transition()
  SET search_path = public;