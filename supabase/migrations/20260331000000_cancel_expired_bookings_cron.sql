-- Cancel Expired Bookings Cron Job
-- Requires: pg_cron and pg_net extensions enabled in Dashboard → Database → Extensions
-- Requires: vault secrets 'project_url' and 'anon_key' set via SQL Editor:
--   select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
--   select vault.create_secret('<ANON_KEY>', 'anon_key');

-- cron.schedule is idempotent by name — re-running updates the existing job
select
  cron.schedule(
    'cancel-expired-bookings',
    '0 * * * *',
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
          ),
          'X-Cron-Secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'cron_secret'
          )
        ),
        body := jsonb_build_object('triggered_at', now()),
        timeout_milliseconds := 30000
      ) as request_id;
    $$
  );
