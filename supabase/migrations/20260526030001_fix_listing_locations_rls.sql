-- Purpose: Allow listing owners to manage their own listing_locations rows
-- Enables LST-003 self-service submissions where non-admin owners need write access
-- Adds index on owner_user_id — used by every RLS EXISTS check on this table

-- CONCURRENTLY is not used here because Supabase runs migrations inside a transaction,
-- which is incompatible with CONCURRENTLY. Table lock is brief on this small table.
CREATE INDEX IF NOT EXISTS idx_directory_listings_owner_user_id
    ON public.directory_listings (owner_user_id);

DROP POLICY IF EXISTS "listing_locations_insert_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_insert_owner" ON public.listing_locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "listing_locations_delete_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_delete_owner" ON public.listing_locations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "listing_locations_update_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_update_owner" ON public.listing_locations
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    ) WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    );
