-- Migration: 20260825000001_create_blog_comments
-- Purpose: Create blog_comments table with threading, likes, moderation, and comment_count sync

-- ============================================================
-- 1. blog_comments table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    body TEXT NOT NULL CHECK (char_length(body) > 0 AND char_length(body) <= 5000),
    parent_id UUID REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    like_count INT NOT NULL DEFAULT 0,
    is_removed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blog_comments_post_id ON public.blog_comments (post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_blog_comments_parent_id ON public.blog_comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blog_comments_user_id ON public.blog_comments (user_id);

-- ============================================================
-- 2. comment_count on blog_posts
-- ============================================================
ALTER TABLE public.blog_posts ADD COLUMN IF NOT EXISTS comment_count INT NOT NULL DEFAULT 0;

-- ============================================================
-- 3. updated_at trigger for blog_comments
-- ============================================================
CREATE OR REPLACE FUNCTION public.blog_comments_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_comments_updated_at ON public.blog_comments;
CREATE TRIGGER trg_blog_comments_updated_at
    BEFORE UPDATE ON public.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.blog_comments_updated_at();

-- ============================================================
-- 4. comment_count sync trigger on blog_posts
-- ============================================================
CREATE OR REPLACE FUNCTION public.blog_sync_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.blog_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.blog_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_comment_count ON public.blog_comments;
CREATE TRIGGER trg_blog_comment_count
    AFTER INSERT OR DELETE ON public.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.blog_sync_comment_count();

-- ============================================================
-- 5. blog_comment_likes table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_comment_likes (
    comment_id UUID NOT NULL REFERENCES public.blog_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_blog_comment_likes_user ON public.blog_comment_likes (user_id);

-- ============================================================
-- 6. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.blog_comments ENABLE ROW LEVEL SECURITY;

-- SELECT: published post comments, own comments (even removed), admin all
CREATE POLICY "blog_comments_select" ON public.blog_comments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.blog_posts
            WHERE id = post_id AND status = 'published'
        )
        OR user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- INSERT: authenticated users only, must own the comment
CREATE POLICY "blog_comments_insert" ON public.blog_comments
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND user_id = (SELECT auth.uid())
    );

-- UPDATE: own or admin
CREATE POLICY "blog_comments_update" ON public.blog_comments
    FOR UPDATE USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- DELETE: own or admin
CREATE POLICY "blog_comments_delete" ON public.blog_comments
    FOR DELETE USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ============================================================
-- 7. blog_comment_likes RLS
-- ============================================================
ALTER TABLE public.blog_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blog_comment_likes_select" ON public.blog_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "blog_comment_likes_insert" ON public.blog_comment_likes
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND user_id = (SELECT auth.uid())
    );

CREATE POLICY "blog_comment_likes_delete" ON public.blog_comment_likes
    FOR DELETE USING (
        user_id = (SELECT auth.uid())
    );
