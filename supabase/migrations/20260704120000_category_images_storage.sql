-- Migration: 20260704120000_category_images_storage
-- Purpose: Create category-images storage bucket so admins can override the
-- directory category tile photos from the admin panel. Public read/list
-- (DirectoryHome lists the bucket anonymously to discover overrides),
-- admin-only writes.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category-images',
    'category-images',
    true,
    5242880, -- 5MB in bytes
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- SELECT: public read + list
CREATE POLICY "category_images_select" ON storage.objects
    FOR SELECT
    USING (bucket_id = 'category-images');

-- INSERT: admins only
CREATE POLICY "category_images_insert" ON storage.objects
    FOR INSERT
    WITH CHECK (
        bucket_id = 'category-images'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- UPDATE: admins only (required for upsert overwrites)
CREATE POLICY "category_images_update" ON storage.objects
    FOR UPDATE
    USING (
        bucket_id = 'category-images'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- DELETE: admins only
CREATE POLICY "category_images_delete" ON storage.objects
    FOR DELETE
    USING (
        bucket_id = 'category-images'
        AND EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );
