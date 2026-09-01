
-- List the TOP 20 most expensive bookings to identify the anomaly
SELECT id, total_price, status, created_at, user_id
FROM bookings
ORDER BY total_price DESC
LIMIT 20;

-- Calculate total revenue again
SELECT 
    SUM(total_price) as total_confirmed_revenue
FROM bookings
WHERE status IN ('confirmed', 'completed');
