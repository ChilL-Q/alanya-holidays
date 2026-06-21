-- Fix ambiguous column reference in increment_blog_views.
-- RETURNS TABLE(views integer) created an OUT param named "views" that conflicted
-- with the blog_posts.views column in SET views = views + 1.
-- Return value is unused by callers, so simplified to RETURNS void.

DROP FUNCTION IF EXISTS public.increment_blog_views(UUID);

CREATE FUNCTION public.increment_blog_views(p_post_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    IF p_post_id IS NULL THEN
        RAISE EXCEPTION 'post_id is required';
    END IF;

    UPDATE public.blog_posts
    SET views = views + 1
    WHERE id = p_post_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Blog post not found: %', p_post_id;
    END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_blog_views(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.increment_blog_views(UUID) TO authenticated;
