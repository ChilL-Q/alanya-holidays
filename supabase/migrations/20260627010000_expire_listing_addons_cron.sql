-- Migration: 20260627010000_expire_listing_addons_cron
-- Purpose: Daily expiry of time-boxed listing add-ons (e.g. seasonal_placement)
-- Requires: pg_cron + pg_net extensions and vault secrets project_url, anon_key, cron_secret
-- cron.schedule is idempotent by name — re-running updates the existing job.

-- Runs at 3:10 AM UTC daily (offset from cleanup-blog-media at 3:00).
-- A day's granularity is fine: placements last 90 days, so sub-day precision
-- on the expiry boundary is not meaningful.
SELECT cron.schedule(
    'expire-listing-addons',
    '10 3 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
            || '/functions/v1/expire-listing-addons',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
            'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := jsonb_build_object('triggered_at', now()),
        timeout_milliseconds := 30000
    ) AS request_id;
    $$
);
