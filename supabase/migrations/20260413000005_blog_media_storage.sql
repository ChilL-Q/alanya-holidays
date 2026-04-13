-- Migration: 20260413000005_blog_media_storage
-- Purpose: Create blog-media storage bucket with RLS policies for path-based access control
-- Task: [89] Блог — медиафайлы в Supabase Storage

-- ============================================================
-- 1. CREATE blog-media storage bucket
-- ============================================================
-- This is the first bucket created via migration (previously done via dashboard)
-- 5MB file size limit, image/jpeg + image/png + image/webp only
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'blog-media',
    'blog-media',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. RLS on storage.objects for blog-media bucket
-- ============================================================
-- Note: storage.objects RLS is managed by Supabase — no ALTER TABLE needed here

-- SELECT: public read (bucket is public, images viewable without auth)
CREATE POLICY "blog_media_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'blog-media');

-- INSERT: authenticated users only, path must start with their user_id
-- storage.foldername(name) returns path segments as text array
-- e.g., 'abc123/photo.jpg' → ['abc123', 'photo.jpg']
-- We require the first segment to match auth.uid()
CREATE POLICY "blog_media_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'blog-media'
        AND (SELECT auth.role()) = 'authenticated'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- UPDATE: file owner only (prevent moving/renaming others' files)
CREATE POLICY "blog_media_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'blog-media'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

-- DELETE: file owner or admin
CREATE POLICY "blog_media_delete_owner" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'blog-media'
        AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
    );

CREATE POLICY "blog_media_delete_admin" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'blog-media'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );
