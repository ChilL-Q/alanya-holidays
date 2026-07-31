-- Purpose: Optimize search, filtering, and foreign key lookup performance
-- Audit date: 2026-07-31

-- 1. Properties indexes
CREATE INDEX IF NOT EXISTS idx_properties_status_location ON public.properties(status, location);
CREATE INDEX IF NOT EXISTS idx_properties_host_id ON public.properties(host_id);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- 2. Directory listings indexes
CREATE INDEX IF NOT EXISTS idx_directory_category_active ON public.directory_listings(category, is_active);
CREATE INDEX IF NOT EXISTS idx_directory_district ON public.directory_listings(district);

-- 3. Bookings indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);

-- 4. Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_target_id ON public.reviews(target_id);
