-- Keep Google Places rating data separate from Alanya Holidays community aggregates.
-- reviews_average/reviews_count remain owned by sync_listing_review_stats().

ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS google_rating numeric(2, 1),
  ADD COLUMN IF NOT EXISTS google_review_count integer;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'directory_listings_google_rating_range'
      AND conrelid = 'public.directory_listings'::regclass
  ) THEN
    ALTER TABLE public.directory_listings
      ADD CONSTRAINT directory_listings_google_rating_range
      CHECK (google_rating IS NULL OR google_rating BETWEEN 0 AND 5);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'directory_listings_google_review_count_nonnegative'
      AND conrelid = 'public.directory_listings'::regclass
  ) THEN
    ALTER TABLE public.directory_listings
      ADD CONSTRAINT directory_listings_google_review_count_nonnegative
      CHECK (google_review_count IS NULL OR google_review_count >= 0);
  END IF;
END
$migration$;

COMMENT ON COLUMN public.directory_listings.google_rating IS
  'Rating imported from Google Places; never an Alanya Holidays community aggregate.';
COMMENT ON COLUMN public.directory_listings.google_review_count IS
  'Review count imported from Google Places; never an Alanya Holidays community review count.';

-- No legacy rating value has durable Google provenance. Leave both new columns
-- NULL for every existing row; an authorized post-deploy Google resync is the
-- only supported population path.
