-- Replace the insecure platform_testimonials admin policy that trusts JWT claims
-- with the canonical is_admin() function used everywhere else in the schema.
DROP POLICY IF EXISTS "Admins have full access to testimonials" ON public.platform_testimonials;

CREATE POLICY "Admins have full access to testimonials" ON public.platform_testimonials
    AS PERMISSIVE FOR ALL
    TO authenticated
    USING ((SELECT public.is_admin()))
    WITH CHECK ((SELECT public.is_admin()));
