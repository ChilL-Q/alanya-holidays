-- Migration: 20260525120000_forum_system
-- Purpose: Community forum — admin-managed categories, posts, flat comments,
--          likes (upvotes only), and post-hoc moderation (reports + admin removal).

-- ============================================================
-- 1. forum_categories (admin-managed)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    description TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_categories_slug ON public.forum_categories (slug);

-- Seed default categories
INSERT INTO public.forum_categories (name, slug, description, sort_order)
VALUES
    ('General',        'general',         'Anything about life in Alanya',            0),
    ('Living',         'living',          'Day-to-day living, utilities, healthcare',  1),
    ('Real Estate',    'real-estate',     'Buying, renting, and property questions',   2),
    ('Events',         'events',          'Local events, meetups, and happenings',     3),
    ('Recommendations','recommendations', 'Ask for and share recommendations',         4)
ON CONFLICT (slug) DO NOTHING;

-- ============================================================
-- 2. forum_posts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL,
    body TEXT,
    category_id UUID REFERENCES public.forum_categories(id) ON DELETE SET NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    like_count INT NOT NULL DEFAULT 0,
    comment_count INT NOT NULL DEFAULT 0,
    is_pinned BOOLEAN NOT NULL DEFAULT false,
    is_removed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_forum_posts_slug ON public.forum_posts (slug);
CREATE INDEX IF NOT EXISTS idx_forum_posts_category ON public.forum_posts (category_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_author ON public.forum_posts (author_id);
CREATE INDEX IF NOT EXISTS idx_forum_posts_created ON public.forum_posts (created_at DESC) WHERE is_removed = false;
CREATE INDEX IF NOT EXISTS idx_forum_posts_top ON public.forum_posts (like_count DESC, created_at DESC) WHERE is_removed = false;

DROP TRIGGER IF EXISTS trg_forum_posts_updated_at ON public.forum_posts;
CREATE TRIGGER trg_forum_posts_updated_at
    BEFORE UPDATE ON public.forum_posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- 3. forum_comments (flat — no parent_id)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    body TEXT NOT NULL,
    like_count INT NOT NULL DEFAULT 0,
    is_removed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_comments_post ON public.forum_comments (post_id, created_at);

-- ============================================================
-- 4. Likes (upvotes only) — one row per user per target
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_post_likes (
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.forum_comment_likes (
    comment_id UUID NOT NULL REFERENCES public.forum_comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (comment_id, user_id)
);

-- ============================================================
-- 5. forum_reports (post-hoc moderation)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.forum_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    target_type TEXT NOT NULL CHECK (target_type IN ('post', 'comment')),
    target_id UUID NOT NULL,
    reporter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT NOT NULL,
    resolved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_forum_reports_unresolved ON public.forum_reports (created_at DESC) WHERE resolved = false;

-- ============================================================
-- 6. Count-sync triggers
-- ============================================================

-- comment_count on forum_posts
CREATE OR REPLACE FUNCTION public.forum_sync_comment_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.forum_posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.forum_posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_comment_count ON public.forum_comments;
CREATE TRIGGER trg_forum_comment_count
    AFTER INSERT OR DELETE ON public.forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.forum_sync_comment_count();

-- like_count on forum_posts
CREATE OR REPLACE FUNCTION public.forum_sync_post_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.forum_posts SET like_count = like_count + 1 WHERE id = NEW.post_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.forum_posts SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_post_like_count ON public.forum_post_likes;
CREATE TRIGGER trg_forum_post_like_count
    AFTER INSERT OR DELETE ON public.forum_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.forum_sync_post_like_count();

-- like_count on forum_comments
CREATE OR REPLACE FUNCTION public.forum_sync_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.forum_comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.forum_comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_forum_comment_like_count ON public.forum_comment_likes;
CREATE TRIGGER trg_forum_comment_like_count
    AFTER INSERT OR DELETE ON public.forum_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.forum_sync_comment_like_count();

-- ============================================================
-- 7. Helper: is_admin (inline EXISTS used below mirrors blog_system)
-- ============================================================

-- ============================================================
-- 8. RLS — forum_categories
-- ============================================================
ALTER TABLE public.forum_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_categories_select" ON public.forum_categories
    FOR SELECT USING (true);

CREATE POLICY "forum_categories_insert_admin" ON public.forum_categories
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_categories_update_admin" ON public.forum_categories
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_categories_delete_admin" ON public.forum_categories
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- 9. RLS — forum_posts
-- ============================================================
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;

-- Public reads non-removed posts
CREATE POLICY "forum_posts_select_public" ON public.forum_posts
    FOR SELECT USING (is_removed = false);

-- Authors can read their own (even if removed), admins read all
CREATE POLICY "forum_posts_select_own" ON public.forum_posts
    FOR SELECT USING (author_id = (SELECT auth.uid()));

CREATE POLICY "forum_posts_select_admin" ON public.forum_posts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- Authenticated users create posts (author_id forced in API layer)
CREATE POLICY "forum_posts_insert" ON public.forum_posts
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- Authors update own posts; admins update any (pin/remove)
CREATE POLICY "forum_posts_update" ON public.forum_posts
    FOR UPDATE USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- Authors delete own; admins delete any
CREATE POLICY "forum_posts_delete" ON public.forum_posts
    FOR DELETE USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- 10. RLS — forum_comments
-- ============================================================
ALTER TABLE public.forum_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_comments_select_public" ON public.forum_comments
    FOR SELECT USING (is_removed = false);

CREATE POLICY "forum_comments_select_own" ON public.forum_comments
    FOR SELECT USING (author_id = (SELECT auth.uid()));

CREATE POLICY "forum_comments_select_admin" ON public.forum_comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_comments_insert" ON public.forum_comments
    FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

CREATE POLICY "forum_comments_update" ON public.forum_comments
    FOR UPDATE USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_comments_delete" ON public.forum_comments
    FOR DELETE USING (
        author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- 11. RLS — forum_post_likes
-- ============================================================
ALTER TABLE public.forum_post_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_post_likes_select" ON public.forum_post_likes
    FOR SELECT USING (true);

CREATE POLICY "forum_post_likes_insert" ON public.forum_post_likes
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_post_likes_delete" ON public.forum_post_likes
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 12. RLS — forum_comment_likes
-- ============================================================
ALTER TABLE public.forum_comment_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "forum_comment_likes_select" ON public.forum_comment_likes
    FOR SELECT USING (true);

CREATE POLICY "forum_comment_likes_insert" ON public.forum_comment_likes
    FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "forum_comment_likes_delete" ON public.forum_comment_likes
    FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- 13. RLS — forum_reports
-- ============================================================
ALTER TABLE public.forum_reports ENABLE ROW LEVEL SECURITY;

-- Authenticated users file reports
CREATE POLICY "forum_reports_insert" ON public.forum_reports
    FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()));

-- Only admins read/manage reports
CREATE POLICY "forum_reports_select_admin" ON public.forum_reports
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

CREATE POLICY "forum_reports_update_admin" ON public.forum_reports
    FOR UPDATE USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );
