-- Drop orphaned function enforce_premium_admin()
-- This function was replaced by enforce_premium_admin_only() in
-- migration 20260524140000. The trigger was updated to call the new function,
-- but the old one was never dropped, leaving it accessible via /rest/v1/rpc/.
-- It is SECURITY DEFINER with no EXECUTE restrictions beyond what was added
-- in earlier audit migrations. Safe to remove — no code references it.
DROP FUNCTION IF EXISTS public.enforce_premium_admin();