-- Duplicate index consolidation
-- Two migrations create the same index:
--   20260525000000_voyager_tier_analytics.sql (canonical)
--   20260528000003_create_listing_analytics_table_and_track_rpcs.sql (defensive)
-- Both define: idx_listing_analytics_listing_date ON listing_analytics(listing_id, date DESC)
-- This migration consolidates to avoid redundancy in migration history.

DROP INDEX IF EXISTS public.idx_listing_analytics_listing_date;

CREATE INDEX idx_listing_analytics_listing_date
    ON public.listing_analytics(listing_id, date DESC);
