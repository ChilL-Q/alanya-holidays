-- Storage hardening: restrict SELECT on storage.objects to prevent bucket listing
-- (public URL access via /storage/v1/object/public/ bypasses RLS and still works)

-- Blog-media: owner or admin only for listing API
DROP POLICY IF EXISTS "blog_media_select" ON storage.objects;
CREATE POLICY "blog_media_select" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'blog-media'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = (SELECT auth.uid())
                AND role = 'admin'
            )
        )
    );

-- Properties: owner or admin only for listing API
DROP POLICY IF EXISTS "properties_select_public" ON storage.objects;
DROP POLICY IF EXISTS "properties_select" ON storage.objects;
CREATE POLICY "properties_select" ON storage.objects
    FOR SELECT
    USING (
        bucket_id = 'properties'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = (SELECT auth.uid())
                AND role = 'admin'
            )
        )
    );

-- Function search_path hardening
ALTER FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) SET search_path = public;
ALTER FUNCTION public.get_user_vote(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.recalculate_net_votes() SET search_path = public;
ALTER FUNCTION public.remove_listing_vote(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.get_user_votes_batch(UUID[], TEXT) SET search_path = public;
ALTER FUNCTION public.enforce_premium_admin() SET search_path = public;
ALTER FUNCTION public.validate_booking_status_transition() SET search_path = public;;
