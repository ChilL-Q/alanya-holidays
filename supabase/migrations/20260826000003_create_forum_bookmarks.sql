-- Migration: 20260826000003_create_forum_bookmarks
-- Purpose: Create forum_bookmarks table with composite primary key (user_id, post_id) and RLS

CREATE TABLE IF NOT EXISTS public.forum_bookmarks (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.forum_posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_user ON public.forum_bookmarks (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_forum_bookmarks_post ON public.forum_bookmarks (post_id);

ALTER TABLE public.forum_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_bookmarks_select" ON public.forum_bookmarks;
CREATE POLICY "forum_bookmarks_select" ON public.forum_bookmarks
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "forum_bookmarks_insert" ON public.forum_bookmarks;
CREATE POLICY "forum_bookmarks_insert" ON public.forum_bookmarks
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND user_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "forum_bookmarks_delete" ON public.forum_bookmarks;
CREATE POLICY "forum_bookmarks_delete" ON public.forum_bookmarks
    FOR DELETE USING (user_id = (SELECT auth.uid()));
