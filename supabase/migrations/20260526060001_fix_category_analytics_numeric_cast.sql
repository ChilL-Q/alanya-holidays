-- Purpose: Cast NUMERIC averages to FLOAT in get_category_analytics_average
-- Without this, Supabase JS serializes NUMERIC as strings, causing
-- runtime type mismatches with TypeScript `number` fields.

DROP FUNCTION IF EXISTS public.get_category_analytics_average(TEXT, INT);
CREATE OR REPLACE FUNCTION public.get_category_analytics_average(
    p_category_id TEXT,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    avg_views FLOAT,
    avg_whatsapp_clicks FLOAT,
    avg_website_clicks FLOAT,
    avg_map_clicks FLOAT,
    listing_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
-- SECURITY DEFINER: required to bypass RLS on directory_listings for
-- category-wide aggregation (averages span all owners' listings, not just caller's)
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(AVG(lt.total_views), 0)::FLOAT,
        COALESCE(AVG(lt.total_whatsapp_clicks), 0)::FLOAT,
        COALESCE(AVG(lt.total_website_clicks), 0)::FLOAT,
        COALESCE(AVG(lt.total_map_clicks), 0)::FLOAT,
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