\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  v_user_id UUID := '11000000-0000-4000-8000-000000000001';
  v_post_id UUID := '21000000-0000-4000-8000-000000000001';
  v_comment_id UUID := '31000000-0000-4000-8000-000000000001';
  v_liked BOOLEAN;
  v_like_rows INTEGER;
  v_like_count INTEGER;
  v_function_config TEXT[];
BEGIN
  INSERT INTO auth.users (id, email)
  VALUES (v_user_id, 'atomic-blog-like@example.test');

  INSERT INTO public.profiles (id, email)
  VALUES (v_user_id, 'atomic-blog-like@example.test')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.blog_posts (id, title, slug, author_id, status)
  VALUES (
    v_post_id,
    'Atomic blog like verification',
    'atomic-blog-like-verification',
    v_user_id,
    'published'
  );

  INSERT INTO public.blog_comments (id, post_id, user_id, body)
  VALUES (v_comment_id, v_post_id, v_user_id, 'Atomic like test comment');

  v_liked := public.toggle_blog_comment_like(v_comment_id, v_user_id);
  IF v_liked IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'First toggle returned %, expected true', v_liked;
  END IF;

  SELECT count(*) INTO v_like_rows
  FROM public.blog_comment_likes
  WHERE comment_id = v_comment_id AND user_id = v_user_id;

  SELECT like_count INTO v_like_count
  FROM public.blog_comments
  WHERE id = v_comment_id;

  IF v_like_rows <> 1 OR v_like_count <> 1 THEN
    RAISE EXCEPTION 'Liked state mismatch: rows=%, count=%', v_like_rows, v_like_count;
  END IF;

  v_liked := public.toggle_blog_comment_like(v_comment_id, v_user_id);
  IF v_liked IS DISTINCT FROM false THEN
    RAISE EXCEPTION 'Second toggle returned %, expected false', v_liked;
  END IF;

  SELECT count(*) INTO v_like_rows
  FROM public.blog_comment_likes
  WHERE comment_id = v_comment_id AND user_id = v_user_id;

  SELECT like_count INTO v_like_count
  FROM public.blog_comments
  WHERE id = v_comment_id;

  IF v_like_rows <> 0 OR v_like_count <> 0 THEN
    RAISE EXCEPTION 'Unliked state mismatch: rows=%, count=%', v_like_rows, v_like_count;
  END IF;

  SELECT proconfig INTO v_function_config
  FROM pg_catalog.pg_proc
  WHERE oid = 'public.toggle_blog_comment_like(uuid,uuid)'::regprocedure;

  IF NOT ('search_path=pg_catalog, public' = ANY(v_function_config)) THEN
    RAISE EXCEPTION 'Function search_path is not hardened: %', v_function_config;
  END IF;

  IF has_function_privilege('anon', 'public.toggle_blog_comment_like(uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('authenticated', 'public.toggle_blog_comment_like(uuid,uuid)', 'EXECUTE')
    OR NOT has_function_privilege('service_role', 'public.toggle_blog_comment_like(uuid,uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected toggle_blog_comment_like execute privileges';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'Atomic blog comment likes verification passed' AS result;
