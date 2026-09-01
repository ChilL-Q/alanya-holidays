-- ⚠️ DANGER: HISTORICAL ARCHIVE ONLY. DO NOT EXECUTE IN PRODUCTION OR CI ENVIRONMENTS.
-- Delete bookings with suspicious total_price (e.g. over 100,000)
-- CAUTION: This deletes data!

DELETE FROM bookings
WHERE total_price > 100000;

-- Verify deletion
SELECT count(*) as remaining_high_value_bookings
FROM bookings
WHERE total_price > 100000;
