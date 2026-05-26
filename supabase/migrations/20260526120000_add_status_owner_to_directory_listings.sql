-- Add moderation status and ownership to directory_listings
-- Enables self-service listing submissions with admin review workflow

ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected')),
    ADD COLUMN IF NOT EXISTS owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- All existing admin-created listings are already live
UPDATE public.directory_listings SET status = 'approved' WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_directory_listings_status ON public.directory_listings (status);

-- Public sees approved listings; owners see their own submissions; admins see all
DROP POLICY IF EXISTS "directory_listings_select" ON public.directory_listings;
CREATE POLICY "directory_listings_select" ON public.directory_listings
    FOR SELECT USING (
        status = 'approved'
        OR owner_user_id = (SELECT auth.uid())
        OR public.is_admin()
    );

-- Any authenticated user can submit a listing (pending, not featured/verified/premium)
CREATE POLICY "directory_listings_insert_authenticated" ON public.directory_listings
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND owner_user_id = (SELECT auth.uid())
        AND status = 'pending'
        AND is_featured = false
        AND is_verified = false
        AND is_premium = false
    );
