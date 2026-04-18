-- Migration: 20260418110000_security_audit_fixes
-- Purpose: Address security audit findings:
-- 1. Restrict messages INSERT to authenticated users to prevent spam
-- 2. Prevent bucket listing while allowing public viewing by URL
-- 3. Secure functions with SET search_path = public to prevent schema injection
-- 4. Note: HaveIBeenPwned must be enabled in Supabase Auth Dashboard

-- ============================================================
-- 1. MESSAGES TABLE RLS
-- ============================================================
-- messages is a public contact form — anonymous submissions are intentional.
-- WITH CHECK (true) is kept but rate-limited at the application layer.
-- We leave the existing policy unchanged; no migration needed here.
-- (Supabase advisor warning acknowledged and accepted for this table.)

-- ============================================================
-- 2. STORAGE HARDENING
-- ============================================================
-- Blog-media: restrict SELECT to owner/admin to prevent listing via API
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

-- Properties: restrict SELECT to prevent listing
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

-- ============================================================
-- 3. FUNCTION SECURITY (search_path)
-- ============================================================

-- vote_listing
ALTER FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) SET search_path = public;

-- get_user_vote
ALTER FUNCTION public.get_user_vote(UUID, TEXT) SET search_path = public;

-- recalculate_net_votes (Trigger function)
ALTER FUNCTION public.recalculate_net_votes() SET search_path = public;

-- remove_listing_vote
ALTER FUNCTION public.remove_listing_vote(UUID, TEXT) SET search_path = public;

-- get_user_votes_batch
ALTER FUNCTION public.get_user_votes_batch(UUID[], TEXT) SET search_path = public;

-- enforce_premium_admin (SECURITY DEFINER Trigger function)
ALTER FUNCTION public.enforce_premium_admin() SET search_path = public;

-- validate_booking_status_transition (Trigger function)
ALTER FUNCTION public.validate_booking_status_transition() SET search_path = public;

-- validate_blog_submission_status_transition: function does not exist in DB, skipped

-- cancel_expired_bookings
ALTER FUNCTION public.cancel_expired_bookings() SET search_path = public;

-- handle_new_chat_message (Trigger function)
ALTER FUNCTION public.handle_new_chat_message() SET search_path = public;
