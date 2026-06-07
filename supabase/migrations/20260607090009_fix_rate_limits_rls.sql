-- Purpose: Add admin SELECT policy to rate_limits to satisfy RLS advisor.
-- Default deny (no other policies) is intentional: only check_rate_limit()
-- SECURITY DEFINER writes to this table; no direct user access is needed.
CREATE POLICY "rate_limits_admin_select" ON public.rate_limits
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );
