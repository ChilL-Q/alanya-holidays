-- Migration: 20260827000000_fix_blog_likes_and_audit.sql
-- Description: Fix blog comment like_count sync trigger, notifications insert RLS, like notification deduplication, forum-media bucket size, and directory audit trigger.

-- ============================================================
-- 1. Blog Comment Likes Sync Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.blog_sync_comment_like_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.blog_comments
        SET like_count = like_count + 1
        WHERE id = NEW.comment_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.blog_comments
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.comment_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_blog_sync_comment_like_count ON public.blog_comment_likes;
CREATE TRIGGER trg_blog_sync_comment_like_count
    AFTER INSERT OR DELETE ON public.blog_comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.blog_sync_comment_like_count();

-- ============================================================
-- 2. Harden Notifications RLS Insert Policy
-- ============================================================
DROP POLICY IF EXISTS "notifications_insert_policy" ON public.notifications;
CREATE POLICY "notifications_insert_policy" ON public.notifications
    FOR INSERT WITH CHECK (
        (SELECT auth.role()) = 'service_role'
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid()) AND role = 'admin'
        )
    );

-- ============================================================
-- 3. Notifications Deduplication for Likes
-- ============================================================
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

    IF v_post_author_id IS NOT NULL 
       AND v_post_author_id != NEW.user_id 
       AND NOT EXISTS (
           SELECT 1 FROM public.notifications
           WHERE user_id = v_post_author_id
             AND actor_id = NEW.user_id
             AND type = 'FORUM_LIKE'
             AND (data->>'postId') = NEW.post_id::text
             AND created_at > now() - interval '24 hours'
       ) THEN
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

    IF v_comment_author_id IS NOT NULL 
       AND v_comment_author_id != NEW.user_id
       AND NOT EXISTS (
           SELECT 1 FROM public.notifications
           WHERE user_id = v_comment_author_id
             AND actor_id = NEW.user_id
             AND type = 'FORUM_COMMENT_LIKE'
             AND (data->>'commentId') = NEW.comment_id::text
             AND created_at > now() - interval '24 hours'
       ) THEN
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

-- ============================================================
-- 4. Update forum-media bucket size limit to 5MB (5242880 bytes)
-- ============================================================
UPDATE storage.buckets
SET file_size_limit = 5242880
WHERE id = 'forum-media';

-- ============================================================
-- 5. DB Audit Trigger on directory_listings status changes
-- ============================================================
CREATE OR REPLACE FUNCTION public.log_directory_listing_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.moderation_audit_log (
            entity_type,
            entity_id,
            action,
            admin_id,
            reason,
            metadata
        )
        VALUES (
            'directory_listing',
            NEW.id::text,
            'status_change_' || NEW.status,
            auth.uid(),
            NEW.rejection_reason,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'name', NEW.name
            )
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_directory_listing_status ON public.directory_listings;
CREATE TRIGGER trg_audit_directory_listing_status
    AFTER UPDATE OF status ON public.directory_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.log_directory_listing_status_change();
