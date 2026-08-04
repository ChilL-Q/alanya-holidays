-- Fix storage security: restrict INSERT policy and add MIME type validation for properties bucket
-- Problem 1: "Authenticated users can upload" allows any auth user to upload to any path in properties
-- Problem 2: properties bucket has no allowed_mime_types, unlike blog-media and avatars

-- 1. Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;

-- 2. Create scoped INSERT policy for properties with path-based ownership check
CREATE POLICY "properties_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'properties'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- 3. Add MIME type and size restrictions to properties bucket
UPDATE storage.buckets
SET
  file_size_limit = 10485760, -- 10MB, matching client-side validation in storage.ts
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
WHERE id = 'properties';
