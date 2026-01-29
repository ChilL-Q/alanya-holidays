-- Clean up recent PENDING bookings to free up dates
-- This deletes bookings created in the last 24 hours that are still 'pending'
-- RUN THIS to fix "Dates are already booked" error during testing.

DELETE FROM property_availability 
WHERE status = 'booked' 
  AND source = 'reservation'
  AND external_id IN (
    SELECT id::text FROM bookings 
    WHERE status = 'pending' 
      AND created_at > NOW() - INTERVAL '24 hours'
  );

DELETE FROM bookings 
WHERE status = 'pending' 
  AND created_at > NOW() - INTERVAL '24 hours';
