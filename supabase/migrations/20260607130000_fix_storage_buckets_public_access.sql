-- Make properties bucket public so getPublicUrl() works for all visitors.
-- It was private, causing CORB errors: browser got JSON 403 instead of image/webp.
UPDATE storage.buckets
SET public = true
WHERE id = 'properties';

-- Create avatars bucket (was missing; code falls back to properties bucket without it).
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'avatars',
    'avatars',
    true,
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop the owner-only SELECT policy on properties — redundant now that the bucket
-- is public (Supabase bypasses RLS for /object/public/ URLs on public buckets).
-- The existing "Public Access" policy covers the authenticated endpoint too.
DROP POLICY IF EXISTS "properties_select" ON storage.objects;

-- RLS for avatars bucket: owners can insert their own files.
CREATE POLICY "avatars_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- RLS for avatars bucket: owners can delete their own files.
CREATE POLICY "avatars_delete_owner" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

-- RLS for avatars bucket: admins can delete any avatar.
CREATE POLICY "avatars_delete_admin" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'avatars'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = (SELECT auth.uid())
        AND profiles.role = 'admin'
    )
  );
