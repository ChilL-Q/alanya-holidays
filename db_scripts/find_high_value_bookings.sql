
-- Find the bookings with the highest total_price
SELECT id, total_price, status, created_at
FROM bookings
ORDER BY total_price DESC
LIMIT 10;
