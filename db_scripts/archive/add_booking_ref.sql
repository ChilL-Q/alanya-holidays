-- Add a friendly serial ID (booking_ref) to the bookings table
-- This will automatically generate sequential numbers (1, 2, 3...) for existing and new rows

ALTER TABLE bookings 
ADD COLUMN booking_ref SERIAL;

-- If you want to start from a specific number (e.g. 1000)
-- ALTER SEQUENCE bookings_booking_ref_seq RESTART WITH 1000;
