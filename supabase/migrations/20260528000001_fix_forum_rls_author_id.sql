-- Purpose: Enforce author_id = auth.uid() on forum INSERT policies
-- Without this, any authenticated user can insert a post or comment with any author_id
-- Supersedes the "author_id forced in API layer" note in forum_system.sql:
-- no forum API service exists yet, so DB-level enforcement is the only protection

DROP POLICY IF EXISTS "forum_posts_insert" ON public.forum_posts;
CREATE POLICY "forum_posts_insert" ON public.forum_posts
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND author_id = (SELECT auth.uid())
    );

DROP POLICY IF EXISTS "forum_comments_insert" ON public.forum_comments;
CREATE POLICY "forum_comments_insert" ON public.forum_comments
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND author_id = (SELECT auth.uid())
    );
