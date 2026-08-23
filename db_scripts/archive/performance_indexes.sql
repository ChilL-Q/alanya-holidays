-- Database Performance Optimization Migration Script
-- Enables Trigram GIN indexes and covering B-Tree indexes for ultra-low latency queries.

-- 1. Enable pg_trgm extension for O(log N) fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Covering B-Tree Index for Overlapping Bookings (Index-Only Scan)
CREATE INDEX IF NOT EXISTS idx_bookings_overlap_lookup 
ON bookings (item_id, item_type, status) 
INCLUDE (check_in, check_out)
WHERE status NOT IN ('cancelled', 'rejected');

-- 3. GIN Trigram Indexes for Fast Title & Location Searches (O(log N))
CREATE INDEX IF NOT EXISTS idx_properties_trgm_search 
ON properties USING gin (title gin_trgm_ops, location gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tours_search_composite
ON tours (category_id, status, price);

-- 4. Fast composite index on bookings per user
CREATE INDEX IF NOT EXISTS idx_bookings_user_status
ON bookings (user_id, status);
