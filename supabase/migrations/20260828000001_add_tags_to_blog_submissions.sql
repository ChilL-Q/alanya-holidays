-- Preserve selected blog tags while a community submission awaits moderation.
ALTER TABLE public.blog_submissions
    ADD COLUMN IF NOT EXISTS tag_ids UUID[] NOT NULL DEFAULT '{}';

ALTER TABLE public.blog_submissions
    DROP CONSTRAINT IF EXISTS blog_submissions_tag_ids_limit;

ALTER TABLE public.blog_submissions
    ADD CONSTRAINT blog_submissions_tag_ids_limit
    CHECK (cardinality(tag_ids) <= 5);
