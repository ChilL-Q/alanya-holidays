-- Migration: 20260621020000_get_related_posts_rpc
-- Purpose: Optimized RPC for related posts lookup (1 RTT)

CREATE OR REPLACE FUNCTION public.get_related_posts(
    p_post_id UUID,
    p_category TEXT,
    p_limit INT DEFAULT 3
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    slug TEXT,
    excerpt TEXT,
    cover_image_url TEXT,
    category TEXT,
    published_at TIMESTAMPTZ,
    author JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH category_posts AS (
        SELECT 
            bp.id,
            bp.title,
            bp.slug,
            bp.excerpt,
            bp.cover_image_url,
            bp.category,
            bp.published_at,
            jsonb_build_object('full_name', pr.full_name, 'avatar_url', pr.avatar_url) AS author
        FROM public.blog_posts bp
        LEFT JOIN public.profiles pr ON bp.author_id = pr.id
        WHERE bp.status = 'published'
          AND p_category IS NOT NULL
          AND p_category <> ''
          AND bp.category = p_category
          AND bp.id <> p_post_id
        ORDER BY bp.published_at DESC
        LIMIT p_limit
    ),
    recent_posts AS (
        SELECT 
            bp.id,
            bp.title,
            bp.slug,
            bp.excerpt,
            bp.cover_image_url,
            bp.category,
            bp.published_at,
            jsonb_build_object('full_name', pr.full_name, 'avatar_url', pr.avatar_url) AS author
        FROM public.blog_posts bp
        LEFT JOIN public.profiles pr ON bp.author_id = pr.id
        WHERE bp.status = 'published'
          AND bp.id <> p_post_id
          AND bp.id NOT IN (SELECT cp.id FROM category_posts cp)
        ORDER BY bp.published_at DESC
        LIMIT p_limit
    )
    SELECT * FROM category_posts
    UNION ALL
    SELECT * FROM recent_posts
    LIMIT p_limit;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_related_posts(UUID, TEXT, INT) TO authenticated;
