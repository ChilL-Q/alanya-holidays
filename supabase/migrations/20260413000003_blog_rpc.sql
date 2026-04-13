-- Migration: 20260413000003_blog_rpc
-- Purpose: RPC functions for blog system
-- Task: [87] Блог — БД схема + API

-- ============================================================
-- 1. increment_blog_views — atomic view counter
-- ============================================================
CREATE OR REPLACE FUNCTION public.increment_blog_views(p_post_id UUID)
RETURNS TABLE (views INT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF p_post_id IS NULL THEN
        RAISE EXCEPTION 'post_id is required';
    END IF;

    UPDATE public.blog_posts
    SET views = views + 1
    WHERE id = p_post_id
    RETURNING blog_posts.views INTO views;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Blog post not found: %', p_post_id;
    END IF;

    RETURN NEXT;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_blog_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(UUID) TO authenticated;
