-- Migration: 20260418130000_harden_rls_batch_3
-- Purpose: Address A3-C1 and A3-C3 critical security issues [Batch 3]
-- Security Notes:
-- - A3-C1: Restrict blog_posts INSERT to admins only. Regular users must use blog_submissions.
-- - A3-C3: Restrict directory_listings INSERT/UPDATE/DELETE to admins only.
-- - A3-C2: Skipped (documented accepted risk) to maintain anonymous contact form functionality.

-- ============================================================================
-- 1. blog_posts Hardening (A3-C1)
-- ============================================================================
-- Current policy allows any authenticated user to insert.
-- We restrict this to admins only.

DROP POLICY IF EXISTS "blog_posts_insert" ON public.blog_posts;

CREATE POLICY "blog_posts_insert_admin" ON public.blog_posts
    FOR INSERT
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 2. directory_listings Hardening (A3-C3)
-- ============================================================================
-- Current policies allow any authenticated user to insert, update, or delete.
-- Since these are managed only via admin pages, we restrict to admins only.

DROP POLICY IF EXISTS "directory_listings_insert" ON public.directory_listings;
DROP POLICY IF EXISTS "directory_listings_update" ON public.directory_listings;
DROP POLICY IF EXISTS "directory_listings_delete" ON public.directory_listings;

CREATE POLICY "directory_listings_insert_admin" ON public.directory_listings
    FOR INSERT
    WITH CHECK (public.is_admin());

CREATE POLICY "directory_listings_update_admin" ON public.directory_listings
    FOR UPDATE
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "directory_listings_delete_admin" ON public.directory_listings
    FOR DELETE
    USING (public.is_admin());
