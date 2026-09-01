-- Migration: 20260723150000_add_analytics_subscription_indexes.sql
-- Optimizes SQL queries joining directory_listings with premium_subscriptions and filtering listing_analytics.

-- 1. Index subscription_id on directory_listings for owner analytics queries
CREATE INDEX IF NOT EXISTS idx_directory_listings_subscription_id
    ON public.directory_listings(subscription_id);

-- 2. Index listing_analytics date for time-range filtering
CREATE INDEX IF NOT EXISTS idx_listing_analytics_date
    ON public.listing_analytics(date);

-- 3. Composite index on directory_listings for category and status filtering
CREATE INDEX IF NOT EXISTS idx_directory_listings_category_status
    ON public.directory_listings(category_id, status);
