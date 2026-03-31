# Cancel Expired Bookings

Automated cron job that cancels pending bookings after 24 hours and sends notification emails to guests.

## Architecture

```
pg_cron (каждый час)
  → net.http_post → cancel-expired-bookings Edge Function
      → UPDATE bookings SET status = 'cancelled'
      → supabase.functions.invoke('send-email') × N
```

## Setup Instructions

### Шаг 1 — Включить расширения в Supabase Dashboard

Перейти: **Database → Extensions**

Включить:
- `pg_cron` — планировщик задач
- `pg_net` — HTTP запросы из SQL

### Шаг 2 — Сохранить секреты в Vault

В **SQL Editor** выполнить:

```sql
-- Сохранить URL проекта и anon key в Vault (один раз)
select vault.create_secret('https://<PROJECT_REF>.supabase.co', 'project_url');
select vault.create_secret('<YOUR_SUPABASE_ANON_KEY>', 'anon_key');
```

> `<PROJECT_REF>` — берётся из **Settings → API** в Supabase Dashboard  
> `<YOUR_SUPABASE_ANON_KEY>` — оттуда же

### Шаг 3 — Создать SQL миграцию с cron job

Файл миграции уже создан:  
`supabase/migrations/20260331000000_cancel_expired_bookings_cron.sql`

Применить миграцию:

```bash
supabase db push
```

Или через Dashboard: **SQL Editor** → вставить содержимое файла → Run

### Шаг 4 — Задеплоить Edge Function

```bash
supabase functions deploy cancel-expired-bookings
```

### Шаг 5 — Проверить что cron работает

В **SQL Editor**:

```sql
-- Посмотреть все jobs
select * from cron.job;

-- Посмотреть историю запусков
select * from cron.job_run_details order by start_time desc limit 10;
```

Для ручного тестирования (опционально):

```sql
-- Запустить вручную для теста
select cron.schedule(
  'cancel-expired-bookings-test',
  '5 seconds',
  $$ select net.http_post(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/cancel-expired-bookings',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'anon_key')
    ),
    body := jsonb_build_object('triggered_at', now()),
    timeout_milliseconds := 30000
  ) $$
);

-- Удалить тестовый job после проверки
select cron.unschedule('cancel-expired-bookings-test');
```

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `EXPIRY_HOURS` | 24 | Порог истечения pending бронирования |
| Schedule | `0 * * * *` | Запуск каждый час в :00 |
| Timeout | 30000ms | Таймаут HTTP запроса |

## Summary

| Что | Где |
|-----|-----|
| Расписание | Supabase Dashboard → Database → Cron Jobs |
| Секреты | Supabase Vault |
| Логика | `supabase/functions/cancel-expired-bookings/index.ts` |
| Email | делегируется в `send-email` (уже готова) |
| Порог | 24 часа (константа `EXPIRY_HOURS`) |
