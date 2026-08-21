-- Composite B-Tree indexes for high-frequency admin moderation queries
-- Optimizes queries filtering by status and ordering by created_at DESC

CREATE INDEX IF NOT EXISTS idx_directory_listings_status_created_at
  ON public.directory_listings (status, created_at DESC);

-- Ensure listing_claims table exists before creating composite index
CREATE TABLE IF NOT EXISTS public.listing_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    additional_notes TEXT,
    business_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    whatsapp TEXT,
    website TEXT,
    address TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_listing_claims_status_created_at
  ON public.listing_claims (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_blog_submissions_status_created_at
  ON public.blog_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_concierge_enquiries_status_created_at
  ON public.concierge_enquiries (status, created_at DESC);

