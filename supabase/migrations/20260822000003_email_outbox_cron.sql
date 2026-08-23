-- Process Email Outbox Cron Job (audit 2.4)
-- Requires: pg_cron and pg_net extensions enabled (same as cancel-expired-bookings).
-- Requires: vault secrets 'project_url' and 'cron_secret' (already set for the existing cron).

select
  cron.schedule(
    'process-email-outbox',
    '* * * * *',
    $$
    select
      net.http_post(
        url := (
          select decrypted_secret
          from vault.decrypted_secrets
          where name = 'project_url'
        ) || '/functions/v1/process-email-outbox',
        headers := jsonb_build_object(
          'Content-Type',  'application/json',
          'X-Cron-Secret', (
            select decrypted_secret
            from vault.decrypted_secrets
            where name = 'cron_secret'
          )
        ),
        body := jsonb_build_object('triggered_at', now()),
        timeout_milliseconds := 55000
      ) as request_id;
    $$
  );
