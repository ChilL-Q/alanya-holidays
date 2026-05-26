-- Purpose: Fix get_directory_analytics_for_owner to include Explorer-tier listings
-- The INNER JOIN on premium_subscriptions excluded listings without a subscription_id.
-- Now uses owner_user_id for ownership check so all owned listings appear regardless of tier.

CREATE OR REPLACE FUNCTION public.get_directory_analytics_for_owner(
    p_owner_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    listing_id UUID,
    listing_name TEXT,
    listing_category_id TEXT,
    total_views BIGINT,
    total_whatsapp_clicks BIGINT,
    total_website_clicks BIGINT,
    total_map_clicks BIGINT,
    daily_data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        dl.id AS listing_id,
        dl.name AS listing_name,
        dl.category_id AS listing_category_id,
        COALESCE(SUM(la.views), 0)::BIGINT AS total_views,
        COALESCE(SUM(la.whatsapp_clicks), 0)::BIGINT AS total_whatsapp_clicks,
        COALESCE(SUM(la.website_clicks), 0)::BIGINT AS total_website_clicks,
        COALESCE(SUM(la.map_clicks), 0)::BIGINT AS total_map_clicks,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'date', la.date,
                    'views', la.views,
                    'whatsapp_clicks', la.whatsapp_clicks,
                    'website_clicks', la.website_clicks,
                    'map_clicks', la.map_clicks
                ) ORDER BY la.date
            ) FILTER (WHERE la.date IS NOT NULL),
            '[]'::jsonb
        ) AS daily_data
    FROM public.directory_listings dl
    LEFT JOIN public.listing_analytics la
        ON la.listing_id = dl.id AND la.date >= (CURRENT_DATE - p_days)
    WHERE dl.owner_user_id = p_owner_id
    GROUP BY dl.id, dl.name, dl.category_id
    ORDER BY total_views DESC;
END;
$$;