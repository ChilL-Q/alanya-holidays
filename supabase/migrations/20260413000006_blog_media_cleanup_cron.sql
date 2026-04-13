-- Migration: 20260413000006_blog_media_cleanup_cron
-- Purpose: Schedule daily cleanup of orphaned blog media files
-- Task: [89] Блог — медиафайлы в Supabase Storage

-- ============================================================
-- Schedule daily cleanup of orphaned blog media files
-- Runs at 3:00 AM UTC daily
-- Calls the cleanup-blog-media Edge Function via HTTP
-- ============================================================
SELECT cron.schedule(
    'cleanup-blog-media',
    '0 3 * * *',
    $$
    SELECT net.http_post(
        url := (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'project_url')
            || '/functions/v1/cleanup-blog-media',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'anon_key'),
            'X-Cron-Secret', (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'cron_secret')
        ),
        body := jsonb_build_object('triggered_at', now()),
        timeout_milliseconds := 60000
    ) AS request_id;
    $$
);
