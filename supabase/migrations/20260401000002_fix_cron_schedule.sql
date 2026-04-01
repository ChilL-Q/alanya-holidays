-- Fix: run every 15 minutes to match the 15-minute payment window
select cron.schedule(
  'cancel-expired-bookings',
  '*/15 * * * *',
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
