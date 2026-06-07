-- Remove duplicate index on premium_subscriptions.stripe_subscription_id
-- The UNIQUE constraint already creates an implicit unique index, making this explicit one redundant.
-- See: DB_FIXES.md Fix #9

DROP INDEX IF EXISTS public.idx_premium_subscriptions_stripe_sub_id;

-- ============================================================
-- Add indexes for unindexed foreign keys
-- These FK columns are used in JOINs and WHERE clauses but lack indexes,
-- causing sequential scans on large tables.
-- See: DB_FIXES.md Fix #10
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_directory_listings_subscription_id
  ON public.directory_listings(subscription_id);

CREATE INDEX IF NOT EXISTS idx_forum_comment_likes_user_id
  ON public.forum_comment_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_comments_author_id
  ON public.forum_comments(author_id);

CREATE INDEX IF NOT EXISTS idx_forum_post_likes_user_id
  ON public.forum_post_likes(user_id);

CREATE INDEX IF NOT EXISTS idx_forum_reports_reporter_id
  ON public.forum_reports(reporter_id);

CREATE INDEX IF NOT EXISTS idx_listing_locations_location_id
  ON public.listing_locations(location_id);

CREATE INDEX IF NOT EXISTS idx_listing_reviews_user_id
  ON public.listing_reviews(user_id);