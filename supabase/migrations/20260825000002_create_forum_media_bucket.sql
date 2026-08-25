-- Migration: 20260825000002_create_forum_media_bucket
-- Purpose: Create forum-media storage bucket for image/video attachments in forum posts

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'forum-media',
  'forum-media',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- RLS policies for forum-media bucket
-- ============================================================

-- SELECT: public read
CREATE POLICY "forum_media_select_public" ON storage.objects
    FOR SELECT USING (bucket_id = 'forum-media');

-- INSERT: authenticated users, path must start with their user_id
CREATE POLICY "forum_media_insert_auth" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'forum-media'
        AND (SELECT auth.role()) = 'authenticated'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- UPDATE: file owner only
CREATE POLICY "forum_media_update_owner" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'forum-media'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- DELETE: file owner or admin
CREATE POLICY "forum_media_delete_owner_admin" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'forum-media'
        AND (
            (storage.foldername(name))[1] = (SELECT auth.uid())::text
            OR EXISTS (
                SELECT 1 FROM public.profiles
                WHERE id = (SELECT auth.uid()) AND role = 'admin'
            )
        )
    );
