-- Automated Booking Cancellation via pg_cron
-- 
-- This script sets up automatic cancellation of pending bookings 
-- that have been waiting for more than 15 minutes.
--
-- HOW TO USE:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Paste this entire script and click "Run"
-- 3. It will schedule the cleanup to run every 5 minutes
--
-- PREREQUISITES:
-- The pg_cron extension must be enabled in your Supabase project.
-- Go to Dashboard → Database → Extensions → Search "pg_cron" → Enable

-- Step 1: Enable pg_cron (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 2: Schedule the cleanup every 5 minutes
SELECT cron.schedule(
    'cancel-expired-bookings',       -- job name (for identification)
    '*/5 * * * *',                   -- every 5 minutes
    'SELECT cancel_expired_bookings()'  -- the function we already have
);

-- To verify the job was created:
-- SELECT * FROM cron.job;

-- To remove the job later (if needed):
-- SELECT cron.unschedule('cancel-expired-bookings');
