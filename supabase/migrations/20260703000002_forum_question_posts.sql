-- Migration: 20260703000002_forum_question_posts
-- Purpose: Add post_type column to forum_posts for Q&A capability (questions vs discussions)

-- ============================================================
-- 1. Add post_type column to forum_posts
-- ============================================================
ALTER TABLE public.forum_posts
ADD COLUMN IF NOT EXISTS post_type TEXT NOT NULL DEFAULT 'discussion' CHECK (post_type IN ('discussion', 'question'));

-- Create index for efficient filtering by post_type
CREATE INDEX IF NOT EXISTS idx_forum_posts_post_type ON public.forum_posts (post_type) WHERE is_removed = false;

-- ============================================================
-- 2. RPC: create_question_post
-- ============================================================
DROP FUNCTION IF EXISTS public.create_question_post(text, text, uuid, uuid);
CREATE OR REPLACE FUNCTION public.create_question_post(
    title_input text,
    body_input text,
    category_id_input uuid,
    user_id_input uuid
)
RETURNS TABLE (
    id uuid,
    title text,
    slug text,
    body text,
    category_id uuid,
    author_id uuid,
    post_type text,
    like_count integer,
    comment_count integer,
    view_count integer,
    is_pinned boolean,
    is_removed boolean,
    created_at timestamptz,
    updated_at timestamptz
) AS $$
DECLARE
    v_slug text;
    v_count integer;
BEGIN
    -- Generate unique slug from title
    v_slug := lower(regexp_replace(title_input, '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(v_slug, '-');

    -- Make slug unique by appending count if needed
    SELECT COUNT(*) INTO v_count FROM public.forum_posts
    WHERE slug = v_slug OR slug LIKE v_slug || '-%';

    IF v_count > 0 THEN
        v_slug := v_slug || '-' || (v_count + 1);
    END IF;

    -- Insert question post
    INSERT INTO public.forum_posts (
        title,
        slug,
        body,
        category_id,
        author_id,
        post_type
    ) VALUES (
        title_input,
        v_slug,
        body_input,
        category_id_input,
        user_id_input,
        'question'
    )
    RETURNING
        public.forum_posts.id,
        public.forum_posts.title,
        public.forum_posts.slug,
        public.forum_posts.body,
        public.forum_posts.category_id,
        public.forum_posts.author_id,
        public.forum_posts.post_type,
        public.forum_posts.like_count,
        public.forum_posts.comment_count,
        public.forum_posts.view_count,
        public.forum_posts.is_pinned,
        public.forum_posts.is_removed,
        public.forum_posts.created_at,
        public.forum_posts.updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
