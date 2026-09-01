-- Make the existing blog comment like toggle atomic per comment/user pair.

CREATE OR REPLACE FUNCTION public.toggle_blog_comment_like(
  p_comment_id UUID,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
BEGIN
  IF p_comment_id IS NULL OR p_user_id IS NULL THEN
    RAISE EXCEPTION 'comment_id and user_id are required'
      USING ERRCODE = '22004';
  END IF;

  -- There may be no like row to lock. A transaction-scoped advisory lock
  -- serializes toggles for exactly this comment/user pair in either state.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      p_comment_id::TEXT || ':' || p_user_id::TEXT,
      0
    )
  );

  DELETE FROM public.blog_comment_likes
  WHERE comment_id = p_comment_id
    AND user_id = p_user_id;

  IF FOUND THEN
    RETURN false;
  END IF;

  INSERT INTO public.blog_comment_likes (comment_id, user_id)
  VALUES (p_comment_id, p_user_id);

  RETURN true;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.toggle_blog_comment_like(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_blog_comment_like(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.toggle_blog_comment_like(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_blog_comment_like(UUID, UUID) TO service_role;
