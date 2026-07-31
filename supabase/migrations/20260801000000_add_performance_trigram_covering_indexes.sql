-- Migration: Add GIN Trigram & Covering Indexes for High Performance
-- Date: 2026-08-01

-- 1. Enable pg_trgm extension for O(log N) fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Covering B-Tree Index for Overlapping Bookings (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_bookings_overlap_lookup 
ON public.bookings (item_id, item_type, status) 
INCLUDE (check_in, check_out)
WHERE status NOT IN ('cancelled', 'rejected');

-- 3. GIN Trigram Indexes for Fast Title & Location Searches (O(log N))
CREATE INDEX IF NOT EXISTS idx_properties_trgm_search 
ON public.properties USING gin (title gin_trgm_ops, location gin_trgm_ops);

-- 4. Fast composite index on bookings per user & status
CREATE INDEX IF NOT EXISTS idx_bookings_user_status_composite
ON public.bookings (user_id, status);
