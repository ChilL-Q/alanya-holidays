-- Migration: 20260723140000_temporal_cleanups_pg_cron.sql
-- Description: Move temporal booking cancellations and listing add-on expirations into atomic Postgres functions managed by pg_cron.

-- 1. Function to cancel expired pending bookings
CREATE OR REPLACE FUNCTION cancel_expired_pending_bookings()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cancelled_count INTEGER := 0;
  v_rec RECORD;
BEGIN
  -- Find all pending bookings created more than 24 hours ago
  FOR v_rec IN
    SELECT id
    FROM bookings
    WHERE status = 'pending'
      AND created_at < (NOW() - INTERVAL '24 hours')
  LOOP
    -- Update booking status
    UPDATE bookings
    SET status = 'cancelled',
        payment_status = CASE WHEN payment_status = 'pending' THEN 'failed' ELSE payment_status END,
        updated_at = NOW()
    WHERE id = v_rec.id;

    -- Unblock availability dates if property booking
    PERFORM unblock_dates_for_booking(v_rec.id);

    v_cancelled_count := v_cancelled_count + 1;
  END LOOP;

  RETURN v_cancelled_count;
END;
$$;

-- 2. Function to expire promotional listing add-ons
CREATE OR REPLACE FUNCTION expire_listing_addons()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER := 0;
  v_addon RECORD;
BEGIN
  -- Find active add-ons whose expiration timestamp has passed
  FOR v_addon IN
    SELECT id, listing_id, addon_type, metadata
    FROM listing_addons
    WHERE status = 'active'
      AND expires_at IS NOT NULL
      AND expires_at <= NOW()
  LOOP
    -- Update add-on status to expired
    UPDATE listing_addons
    SET status = 'expired'
    WHERE id = v_addon.id;

    -- Revert listing-level featured flag if it wasn't featured before
    IF v_addon.addon_type = 'seasonal_placement' THEN
      IF (v_addon.metadata->>'was_featured_before')::BOOLEAN IS NOT TRUE THEN
        UPDATE directory_listings
        SET is_featured = FALSE
        WHERE id = v_addon.listing_id;
      END IF;
    END IF;

    v_expired_count := v_expired_count + 1;
  END LOOP;

  RETURN v_expired_count;
END;
$$;

-- 3. Schedule cron jobs if pg_cron extension exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    -- Schedule booking cleanup every 15 minutes
    PERFORM cron.schedule(
      'cancel-expired-bookings-job',
      '*/15 * * * *',
      'SELECT cancel_expired_pending_bookings()'
    );

    -- Schedule listing add-on expiration check every hour
    PERFORM cron.schedule(
      'expire-listing-addons-job',
      '0 * * * *',
      'SELECT expire_listing_addons()'
    );
  END IF;
END $$;
