-- Fix directory_listings RLS: add owner UPDATE/DELETE policies, length constraint, cleanup
-- Owners can now edit and withdraw their own pending submissions.
-- WITH CHECK prevents privilege escalation (self-approval, self-featuring, ranking manipulation, etc.).

-- Safety-drop stale policies from early migrations (may persist in some environments)
DROP POLICY IF EXISTS "directory_listings: public read approved" ON public.directory_listings;
DROP POLICY IF EXISTS "directory_listings: admin manage" ON public.directory_listings;

-- Recreate INSERT policy with base_score and tier restrictions
-- (original in 20260526120000 didn't restrict these — allowed ranking/tier bypass via direct API)
DROP POLICY IF EXISTS "directory_listings_insert_authenticated" ON public.directory_listings;
CREATE POLICY "directory_listings_insert_authenticated" ON public.directory_listings
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND owner_user_id = (SELECT auth.uid())
        AND status = 'pending'
        AND is_featured = false
        AND is_verified = false
        AND is_premium = false
        AND base_score = 0
        AND tier = 'explorer'
    );

-- Owners can update their own pending listings (content fields only).
-- WITH CHECK enforces at the DB level that protected fields cannot change,
-- matching the client-side stripping in updateDirectoryListing().
CREATE POLICY "directory_listings_update_owner" ON public.directory_listings
    FOR UPDATE
    USING (
        owner_user_id = (SELECT auth.uid())
        AND status = 'pending'
    )
    WITH CHECK (
        owner_user_id = (SELECT auth.uid())
        AND status = 'pending'
        AND is_featured = false
        AND is_verified = false
        AND is_premium = false
        AND base_score = 0
        AND rejection_reason IS NULL
    );

-- Owners can delete (withdraw) their own pending submissions
CREATE POLICY "directory_listings_delete_owner" ON public.directory_listings
    FOR DELETE USING (
        owner_user_id = (SELECT auth.uid())
        AND status = 'pending'
    );

-- Limit rejection_reason to 1000 characters
ALTER TABLE public.directory_listings
    ADD CONSTRAINT directory_listings_rejection_reason_length
    CHECK (rejection_reason IS NULL OR char_length(rejection_reason) <= 1000);

-- Ensure only authenticated role can call is_admin() (not anon via PUBLIC inheritance)
REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;