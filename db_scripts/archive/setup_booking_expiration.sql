-- Function to cleanup bookings that have been pending for more than 15 minutes
-- and release their dates in the calendar.

CREATE OR REPLACE FUNCTION cancel_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    r_booking RECORD;
BEGIN
    -- Loop through expired pending bookings
    FOR r_booking IN
        SELECT id
        FROM bookings
        WHERE status = 'pending'
          AND created_at < (NOW() - INTERVAL '15 minutes')
    LOOP
        -- 1. Update booking status to 'cancelled'
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = r_booking.id;

        -- 2. Release dates in property_availability
        -- We identify rows by external_id which stores the booking_id
        DELETE FROM property_availability
        WHERE source = 'reservation'
          AND external_id = r_booking.id::text;
          
        RAISE NOTICE 'Cancelled expired booking: %', r_booking.id;
    END LOOP;
END;
$$;

-- Instructions for enabling automatic execution:
-- Run the following SQL if you have the pg_cron extension enabled:
-- SELECT cron.schedule('*/5 * * * *', 'SELECT cancel_expired_bookings()');
-- This will run the check every 5 minutes.
