-- Revoke execute on is_admin() from anonymous users to reduce attack surface
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
