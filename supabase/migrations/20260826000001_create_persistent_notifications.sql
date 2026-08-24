-- Migration: 20260826000001_create_persistent_notifications
-- Purpose: Persistent notifications table, RLS, Realtime publication, and 5 PostgreSQL triggers

-- ============================================================
-- 1. Table: notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read);

-- ============================================================
-- 2. Row Level Security
-- ============================================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notifications_select_own" ON public.notifications;
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (
        user_id = (SELECT auth.uid())
        OR actor_id = (SELECT auth.uid())
        OR (SELECT auth.role()) IN ('authenticated', 'service_role')
    );

-- ============================================================
-- 3. Realtime Publication
-- ============================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'public' 
      AND tablename = 'notifications'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
  END IF;
END $$;

-- ============================================================
-- 4. PostgreSQL Triggers with Self-Suppression
-- ============================================================

-- Trigger 1: Forum Comment Notification (Replies & Top-level Comments)
CREATE OR REPLACE FUNCTION public.handle_forum_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post_title TEXT;
    v_post_slug TEXT;
    v_post_author_id UUID;
    v_parent_author_id UUID;
BEGIN
    -- Fetch post information
    SELECT title, slug, author_id
    INTO v_post_title, v_post_slug, v_post_author_id
    FROM public.forum_posts
    WHERE id = NEW.post_id;

    -- If this is a reply to another comment
    IF NEW.parent_id IS NOT NULL THEN
        SELECT author_id
        INTO v_parent_author_id
        FROM public.forum_comments
        WHERE id = NEW.parent_id;

        -- Notify parent comment author if not self-action
        IF v_parent_author_id IS NOT NULL AND v_parent_author_id != NEW.author_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
            VALUES (
                v_parent_author_id,
                NEW.author_id,
                'FORUM_REPLY',
                'Новый ответ в теме',
                'Вам ответили на комментарий в теме "' || COALESCE(v_post_title, 'Форум') || '"',
                jsonb_build_object('postId', NEW.post_id, 'commentId', NEW.id, 'parentId', NEW.parent_id, 'postSlug', v_post_slug),
                '/forum/posts/' || COALESCE(v_post_slug, NEW.post_id::text),
                false
            );
        END IF;
    END IF;

    -- Notify post author if not self-action and not already notified as parent comment author
    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.author_id AND (NEW.parent_id IS NULL OR v_post_author_id != v_parent_author_id) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
        VALUES (
            v_post_author_id,
            NEW.author_id,
            'FORUM_COMMENT',
            'Новый комментарий',
            'Новый комментарий в вашей теме "' || COALESCE(v_post_title, 'Форум') || '"',
            jsonb_build_object('postId', NEW.post_id, 'commentId', NEW.id, 'postSlug', v_post_slug),
            '/forum/posts/' || COALESCE(v_post_slug, NEW.post_id::text),
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_forum_comment ON public.forum_comments;
CREATE TRIGGER trg_notify_forum_comment
    AFTER INSERT ON public.forum_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_comment_notification();


-- Trigger 2: Forum Post Like Notification
CREATE OR REPLACE FUNCTION public.handle_forum_post_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_post_title TEXT;
    v_post_slug TEXT;
    v_post_author_id UUID;
BEGIN
    SELECT title, slug, author_id
    INTO v_post_title, v_post_slug, v_post_author_id
    FROM public.forum_posts
    WHERE id = NEW.post_id;

    IF v_post_author_id IS NOT NULL AND v_post_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
        VALUES (
            v_post_author_id,
            NEW.user_id,
            'FORUM_LIKE',
            'Новый лайк',
            'Кому-то понравилась ваша публикация "' || COALESCE(v_post_title, 'Форум') || '"',
            jsonb_build_object('postId', NEW.post_id, 'postSlug', v_post_slug),
            '/forum/posts/' || COALESCE(v_post_slug, NEW.post_id::text),
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_forum_post_like ON public.forum_post_likes;
CREATE TRIGGER trg_notify_forum_post_like
    AFTER INSERT ON public.forum_post_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_post_like_notification();


-- Trigger 3: Forum Comment Like Notification
CREATE OR REPLACE FUNCTION public.handle_forum_comment_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_comment_author_id UUID;
    v_post_title TEXT;
    v_post_slug TEXT;
BEGIN
    SELECT c.author_id, p.title, p.slug
    INTO v_comment_author_id, v_post_title, v_post_slug
    FROM public.forum_comments c
    JOIN public.forum_posts p ON p.id = c.post_id
    WHERE c.id = NEW.comment_id;

    IF v_comment_author_id IS NOT NULL AND v_comment_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
        VALUES (
            v_comment_author_id,
            NEW.user_id,
            'FORUM_COMMENT_LIKE',
            'Новый лайк',
            'Кому-то понравился ваш комментарий в теме "' || COALESCE(v_post_title, 'Форум') || '"',
            jsonb_build_object('commentId', NEW.comment_id, 'postSlug', v_post_slug),
            '/forum/posts/' || COALESCE(v_post_slug, 'post'),
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_forum_comment_like ON public.forum_comment_likes;
CREATE TRIGGER trg_notify_forum_comment_like
    AFTER INSERT ON public.forum_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_forum_comment_like_notification();


-- Trigger 4: Blog Comment Notification (Replies & Top-level Comments)
CREATE OR REPLACE FUNCTION public.handle_blog_comment_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_blog_title TEXT;
    v_blog_slug TEXT;
    v_blog_author_id UUID;
    v_parent_user_id UUID;
BEGIN
    SELECT title, slug, author_id
    INTO v_blog_title, v_blog_slug, v_blog_author_id
    FROM public.blog_posts
    WHERE id = NEW.post_id;

    IF NEW.parent_id IS NOT NULL THEN
        SELECT user_id
        INTO v_parent_user_id
        FROM public.blog_comments
        WHERE id = NEW.parent_id;

        IF v_parent_user_id IS NOT NULL AND v_parent_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
            VALUES (
                v_parent_user_id,
                NEW.user_id,
                'BLOG_REPLY',
                'Новый ответ к статье',
                'Вам ответили на комментарий к статье "' || COALESCE(v_blog_title, 'Блог') || '"',
                jsonb_build_object('blogId', NEW.post_id, 'commentId', NEW.id, 'blogSlug', v_blog_slug),
                '/blog/' || COALESCE(v_blog_slug, NEW.post_id::text),
                false
            );
        END IF;
    END IF;

    IF v_blog_author_id IS NOT NULL AND v_blog_author_id != NEW.user_id AND (NEW.parent_id IS NULL OR v_blog_author_id != v_parent_user_id) THEN
        INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
        VALUES (
            v_blog_author_id,
            NEW.user_id,
            'BLOG_COMMENT',
            'Новый комментарий к статье',
            'Новый комментарий к вашей статье "' || COALESCE(v_blog_title, 'Блог') || '"',
            jsonb_build_object('blogId', NEW.post_id, 'commentId', NEW.id, 'blogSlug', v_blog_slug),
            '/blog/' || COALESCE(v_blog_slug, NEW.post_id::text),
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_blog_comment ON public.blog_comments;
CREATE TRIGGER trg_notify_blog_comment
    AFTER INSERT ON public.blog_comments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_blog_comment_notification();


-- Trigger 5: Blog Comment Like Notification
CREATE OR REPLACE FUNCTION public.handle_blog_comment_like_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_comment_author_id UUID;
    v_blog_title TEXT;
    v_blog_slug TEXT;
BEGIN
    SELECT c.user_id, p.title, p.slug
    INTO v_comment_author_id, v_blog_title, v_blog_slug
    FROM public.blog_comments c
    JOIN public.blog_posts p ON p.id = c.post_id
    WHERE c.id = NEW.comment_id;

    IF v_comment_author_id IS NOT NULL AND v_comment_author_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, title, message, data, link, read)
        VALUES (
            v_comment_author_id,
            NEW.user_id,
            'BLOG_LIKE',
            'Новый лайк',
            'Кому-то понравился ваш комментарий к статье "' || COALESCE(v_blog_title, 'Блог') || '"',
            jsonb_build_object('commentId', NEW.comment_id, 'blogSlug', v_blog_slug),
            '/blog/' || COALESCE(v_blog_slug, 'blog'),
            false
        );
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_blog_comment_like ON public.blog_comment_likes;
CREATE TRIGGER trg_notify_blog_comment_like
    AFTER INSERT ON public.blog_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_blog_comment_like_notification();
