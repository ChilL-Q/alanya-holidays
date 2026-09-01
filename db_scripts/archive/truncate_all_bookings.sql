-- ⚠️ DANGER: HISTORICAL ARCHIVE ONLY. DO NOT EXECUTE IN PRODUCTION OR CI ENVIRONMENTS.
-- ⚠️ WARNING: This will delete ALL bookings and reviews from the database.
-- Use this to clean up after running the seed_stress_test.ts script.

BEGIN;

-- 1. Delete all reviews (since they typically reference bookings/users/properties)
TRUNCATE TABLE reviews CASCADE;

-- 2. Delete all bookings
TRUNCATE TABLE bookings CASCADE;

COMMIT;

-- Verification: Check if empty
SELECT count(*) as bookings_count FROM bookings;
