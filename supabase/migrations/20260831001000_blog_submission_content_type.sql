-- Preserve whether a community submission is intended for the blog or travel guides.
-- Existing submissions remain blog content for backward compatibility.
ALTER TABLE public.blog_submissions
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'blog';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'blog_submissions_content_type_check'
      AND conrelid = 'public.blog_submissions'::regclass
  ) THEN
    ALTER TABLE public.blog_submissions
      ADD CONSTRAINT blog_submissions_content_type_check
      CHECK (content_type IN ('blog', 'guide')) NOT VALID;
  END IF;
END
$$;

ALTER TABLE public.blog_submissions
  VALIDATE CONSTRAINT blog_submissions_content_type_check;
