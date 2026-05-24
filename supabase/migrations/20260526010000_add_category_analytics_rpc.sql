-- Purpose: Add category analytics average RPC and extend owner analytics with category_id (LST-005)

-- a) New RPC: get_category_analytics_average
CREATE OR REPLACE FUNCTION public.get_category_analytics_average(
    p_category_id TEXT,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    avg_views NUMERIC,
    avg_whatsapp_clicks NUMERIC,
    avg_website_clicks NUMERIC,
    avg_map_clicks NUMERIC,
    listing_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(AVG(lt.total_views), 0)::NUMERIC,
        COALESCE(AVG(lt.total_whatsapp_clicks), 0)::NUMERIC,
        COALESCE(AVG(lt.total_website_clicks), 0)::NUMERIC,
        COALESCE(AVG(lt.total_map_clicks), 0)::NUMERIC,
        COUNT(*)::BIGINT
    FROM (
        SELECT
            dl.id,
            COALESCE(SUM(la.views), 0) AS total_views,
            COALESCE(SUM(la.whatsapp_clicks), 0) AS total_whatsapp_clicks,
            COALESCE(SUM(la.website_clicks), 0) AS total_website_clicks,
            COALESCE(SUM(la.map_clicks), 0) AS total_map_clicks
        FROM public.directory_listings dl
        LEFT JOIN public.listing_analytics la
            ON la.listing_id = dl.id AND la.date >= CURRENT_DATE - p_days
        WHERE dl.category_id = p_category_id
        GROUP BY dl.id
    ) lt;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_category_analytics_average(TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_category_analytics_average(TEXT, INT) TO authenticated;

-- b) Update get_directory_analytics_for_owner — add listing_category_id
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
    JOIN public.premium_subscriptions ps ON ps.id = dl.subscription_id
    LEFT JOIN public.listing_analytics la
        ON la.listing_id = dl.id AND la.date >= (CURRENT_DATE - p_days)
    WHERE ps.user_id = p_owner_id
    GROUP BY dl.id, dl.name, dl.category_id
    ORDER BY total_views DESC;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_directory_analytics_for_owner(UUID, INT) TO authenticated;
