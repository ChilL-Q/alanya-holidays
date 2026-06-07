-- Purpose: Replace bare auth.uid() with (SELECT auth.uid()) in two admin policies
-- not covered by migration 20260607090004_fix_auth_uid_caching.sql.

-- listing_locations_admin_all: migration 0004 only fixed owner policies
DROP POLICY IF EXISTS "listing_locations_admin_all" ON public.listing_locations;
CREATE POLICY "listing_locations_admin_all" ON public.listing_locations
  FOR ALL
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- platform_testimonials: live DB still holds the original policy from 20260430000000
-- (migration 20260524000002 was not reflected in the live state)
DROP POLICY IF EXISTS "Admins have full access to testimonials" ON public.platform_testimonials;
CREATE POLICY "Admins have full access to testimonials" ON public.platform_testimonials
  AS PERMISSIVE FOR ALL TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));
