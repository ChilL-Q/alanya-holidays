-- Composite B-Tree indexes for high-frequency admin moderation queries
-- Optimizes queries filtering by status and ordering by created_at DESC

CREATE INDEX IF NOT EXISTS idx_directory_listings_status_created_at
  ON public.directory_listings (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_listing_claims_status_created_at
  ON public.listing_claims (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_submissions_status_created_at
  ON public.blog_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_enquiries_status_created_at
  ON public.concierge_enquiries (status, created_at DESC);
