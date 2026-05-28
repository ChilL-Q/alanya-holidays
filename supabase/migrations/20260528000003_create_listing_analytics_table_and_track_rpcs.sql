-- Purpose: Create listing_analytics table and tracking RPCs (missing from DB).
-- The get_directory_analytics_for_owner and get_category_analytics_average functions
-- already exist via 20260527085959_add_category_analytics_rpc; only the table
-- and track_* helpers are missing.

-- 1. Add video_url to directory_listings (was in original migration, not yet applied)
ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS video_url TEXT;

-- 2. Create listing_analytics table (daily aggregation)
CREATE TABLE IF NOT EXISTS public.listing_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    views INT NOT NULL DEFAULT 0,
    whatsapp_clicks INT NOT NULL DEFAULT 0,
    website_clicks INT NOT NULL DEFAULT 0,
    map_clicks INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(listing_id, date)
);

CREATE INDEX IF NOT EXISTS idx_listing_analytics_listing_date
    ON public.listing_analytics(listing_id, date DESC);

ALTER TABLE public.listing_analytics ENABLE ROW LEVEL SECURITY;

-- Owners can read analytics for their own listings via owner_user_id; admins can read all
CREATE POLICY "listing_analytics: owner read"
    ON public.listing_analytics FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_analytics.listing_id
              AND dl.owner_user_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. RPC: track listing view (atomic upsert)
CREATE OR REPLACE FUNCTION public.track_listing_view(p_listing_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.listing_analytics (listing_id, date, views, whatsapp_clicks, website_clicks, map_clicks)
    VALUES (p_listing_id, CURRENT_DATE, 1, 0, 0, 0)
    ON CONFLICT (listing_id, date) DO UPDATE
    SET views = public.listing_analytics.views + 1;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_listing_view(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_listing_view(UUID) TO anon, authenticated;

-- 4. RPC: track listing click (atomic update)
CREATE OR REPLACE FUNCTION public.track_listing_click(p_listing_id UUID, p_click_type TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_click_type NOT IN ('whatsapp', 'website', 'map') THEN
        RAISE EXCEPTION 'Invalid click type: %', p_click_type;
    END IF;

    INSERT INTO public.listing_analytics (listing_id, date, views, whatsapp_clicks, website_clicks, map_clicks)
    VALUES (p_listing_id, CURRENT_DATE, 0, 0, 0, 0)
    ON CONFLICT (listing_id, date) DO NOTHING;

    UPDATE public.listing_analytics
    SET
        whatsapp_clicks = whatsapp_clicks + CASE WHEN p_click_type = 'whatsapp' THEN 1 ELSE 0 END,
        website_clicks  = website_clicks  + CASE WHEN p_click_type = 'website'  THEN 1 ELSE 0 END,
        map_clicks      = map_clicks      + CASE WHEN p_click_type = 'map'      THEN 1 ELSE 0 END
    WHERE listing_id = p_listing_id AND date = CURRENT_DATE;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.track_listing_click(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.track_listing_click(UUID, TEXT) TO anon, authenticated;

-- 5. Ensure grants on already-existing owner analytics RPCs
REVOKE EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INT) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_category_analytics_average(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_analytics_average(TEXT, INT) TO authenticated;
