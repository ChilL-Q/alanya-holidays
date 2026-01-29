
-- Check total revenue manually
SELECT 
    SUM(total_price) as total_confirmed_revenue
FROM bookings
WHERE status IN ('confirmed', 'completed');

-- Check if there are any other high value bookings that might have been missed
SELECT id, total_price, status 
FROM bookings 
ORDER BY total_price DESC 
LIMIT 10;
