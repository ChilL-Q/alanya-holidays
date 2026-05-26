-- Purpose: Junction table for multi-area coverage (LST-005 Signature tier feature)
CREATE TABLE IF NOT EXISTS public.listing_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    location_id UUID NOT NULL REFERENCES public.locations(id) ON DELETE CASCADE,
    display_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(listing_id, location_id)
);

CREATE INDEX IF NOT EXISTS idx_listing_locations_listing
    ON public.listing_locations(listing_id);

ALTER TABLE public.listing_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_locations_select_public"
    ON public.listing_locations FOR SELECT USING (true);

CREATE POLICY "listing_locations_admin_all"
    ON public.listing_locations FOR ALL
    USING (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ))
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    ));
