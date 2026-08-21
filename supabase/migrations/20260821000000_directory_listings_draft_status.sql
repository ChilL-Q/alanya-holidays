-- Migration: Add 'draft' status to directory_listings and update RLS policies
-- Date: 2026-08-21
-- Author: Alanya Holidays Platform

-- 1. Update check constraint on status column to include 'draft'
ALTER TABLE public.directory_listings
    DROP CONSTRAINT IF EXISTS directory_listings_status_check;

ALTER TABLE public.directory_listings
    ADD CONSTRAINT directory_listings_status_check
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected'));

-- 2. Update INSERT policy to allow authenticated owners to insert both 'draft' and 'pending' listings
DROP POLICY IF EXISTS "directory_listings_insert_authenticated" ON public.directory_listings;
CREATE POLICY "directory_listings_insert_authenticated" ON public.directory_listings
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND owner_user_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending')
        AND is_featured = false
        AND is_verified = false
        AND is_premium = false
        AND base_score = 0
        AND tier IN ('explorer', 'voyager', 'signature', 'partner')
    );

-- 3. Update UPDATE policy to allow owners to update drafts, pending, and rejected listings,
-- and allow transitioning from 'draft' -> 'pending' or updating 'draft' listings
DROP POLICY IF EXISTS "directory_listings_update_owner" ON public.directory_listings;
CREATE POLICY "directory_listings_update_owner" ON public.directory_listings
    FOR UPDATE
    USING (
        owner_user_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending', 'rejected')
    )
    WITH CHECK (
        owner_user_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending')
        AND is_featured = false
        AND is_verified = false
        AND is_premium = false
        AND base_score = 0
        AND rejection_reason IS NULL
    );

-- 4. Update DELETE policy to allow owners to delete their drafts or pending listings
DROP POLICY IF EXISTS "directory_listings_delete_owner" ON public.directory_listings;
CREATE POLICY "directory_listings_delete_owner" ON public.directory_listings
    FOR DELETE USING (
        owner_user_id = (SELECT auth.uid())
        AND status IN ('draft', 'pending')
    );
