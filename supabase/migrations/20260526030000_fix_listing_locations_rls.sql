-- Purpose: Allow listing owners to manage their own listing_locations rows
-- Enables LST-003 self-service submissions where non-admin owners need write access

CREATE POLICY "listing_locations_insert_owner" ON public.listing_locations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    );

CREATE POLICY "listing_locations_delete_owner" ON public.listing_locations
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_locations.listing_id
            AND dl.owner_user_id = auth.uid()
        )
    );

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