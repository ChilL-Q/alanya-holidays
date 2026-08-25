-- Migration: 20260825000000_add_forum_comments_parent_id
-- Purpose: Add parent_id to forum_comments for threaded/nested replies
-- The codebase already supports threading in backend + frontend, only the DB column is missing

ALTER TABLE public.forum_comments
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.forum_comments(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_forum_comments_parent_id
  ON public.forum_comments (parent_id)
  WHERE parent_id IS NOT NULL;
