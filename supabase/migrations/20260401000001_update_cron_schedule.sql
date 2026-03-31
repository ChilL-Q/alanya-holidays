-- Update cron schedule to run every 5 minutes instead of every hour
-- This is needed for 15-minute payment window enforcement

-- First, unschedule the existing job
select cron.unschedule('cancel-expired-bookings');

-- Reschedule to run every 5 minutes
select
  cron.schedule(
    'cancel-expired-bookings',
    '*/5 * * * *',  -- every 5 minutes
    $$
    select
      net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'project_url'
        ) || '/functions/v1/cancel-expired-bookings',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'anon_key'
          )
        ),
        body := jsonb_build_object('triggered_at', now()),
        timeout_milliseconds := 30000
      ) as request_id;
    $$
  );
