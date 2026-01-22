-- Backfill property_availability from existing bookings
-- This ensures that any bookings made BEFORE the new system are also reflected in the calendar blocks.

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT b.item_id AS property_id, b.check_in, b.check_out, b.id AS booking_id
        FROM bookings b
        JOIN properties p ON b.item_id = p.id -- Only proceed if property exists
        WHERE b.item_type = 'property' 
        AND b.status NOT IN ('cancelled', 'rejected')
    LOOP
        -- Insert blocked dates for this booking
        INSERT INTO property_availability (property_id, date, status, source, external_id)
        SELECT 
            r.property_id,
            d::date,
            'booked'::availability_status,
            'reservation'::availability_source,
            r.booking_id::text
        FROM generate_series(r.check_in, r.check_out - INTERVAL '1 day', '1 day') AS d
        ON CONFLICT (property_id, date) DO NOTHING; -- Skip if already exists
    END LOOP;
END $$;
