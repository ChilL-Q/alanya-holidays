# Stripe Checkout + 15-Minute Payment Window

Automated Stripe payment integration with 15-minute payment window for pending bookings.

## Architecture

```
User creates booking (pending)
  → Checkout Page
    → create-checkout-session Edge Function
      → Stripe Checkout Session (expires in 30 min)
      → Update bookings: stripe_session_id, payment_expires_at (+15 min)
        → Redirect to Stripe Checkout

User completes payment
  → Stripe webhook → stripe-webhook Edge Function
    → checkout.session.completed event
    → Update bookings: status='confirmed', payment_status='paid'
    → Send booking_confirmed email to guest

User doesn't pay within 15 minutes
  → pg_cron (every 5 minutes) → cancel-expired-bookings Edge Function
    → Cancel bookings where payment_expires_at < NOW()
    → Send booking_expired_guest email
```

## Setup Instructions

### Шаг 1 — Применить миграцию БД

```bash
supabase db push
```

Или через Dashboard: **SQL Editor** → выполнить содержимое файла:  
`supabase/migrations/20260401000000_add_stripe_session_id.sql`

Это добавит колонки:
- `stripe_session_id` — для поиска брони по вебхуку
- `payment_expires_at` — момент автоматической отмены брони

### Шаг 2 — Задеплоить Edge Functions

```bash
# Create Checkout Session function
supabase functions deploy create-checkout-session

# Stripe Webhook function
supabase functions deploy stripe-webhook
```

### Шаг 3 — Добавить секреты в Supabase Dashboard

Перейти: **Dashboard → Edge Functions → Secrets**

Добавить:
```
STRIPE_SECRET_KEY       = sk_live_...   (или sk_test_... для теста)
STRIPE_WEBHOOK_SECRET   = whsec_...
```

### Шаг 4 — Настроить Stripe Webhook

В **Stripe Dashboard → Developers → Webhooks** добавить endpoint:

```
https://<PROJECT_REF>.supabase.co/functions/v1/stripe-webhook
```

**Событие:** `checkout.session.completed`

Скопировать **Signing secret** (начинается с `whsec_...`) — это и есть `STRIPE_WEBHOOK_SECRET` для Шага 3.

### Шаг 5 — Применить миграцию кронджоба

```bash
supabase db push
```

Или через Dashboard: **SQL Editor** → выполнить содержимое файла:  
`supabase/migrations/20260401000001_update_cron_schedule.sql`

Это изменит расписание с каждого часа на **каждые 5 минут**.

### Шаг 6 — Проверить что всё работает

**В SQL Editor:**

```sql
-- Посмотреть все cron jobs
select * from cron.job;

-- Посмотреть историю запусков
select * from cron.job_run_details order by start_time desc limit 10;
```

**Тестовый сценарий:**
1. Создать бронирование на сайте
2. Перейти к оплате
3.完成тить оплату через Stripe Test Mode
4. Проверить что booking.status = 'confirmed'
5. Проверить что email отправлен

## Configuration

| Parameter | Value | Description |
|-----------|-------|-------------|
| `PAYMENT_WINDOW_MINUTES` | 15 | Время на оплату после создания брони |
| Stripe `expires_at` | 30 min | Минимальное время жизни сессии (Stripe requirement) |
| Cron Schedule | `*/5 * * * *` | Проверка каждые 5 минут |
| Cancelled bookings | Только с `payment_expires_at` | Брони без Stripe не затрагиваются |

## Frontend Integration

### Вызов create-checkout-session

```typescript
const { data } = await supabase.functions.invoke('create-checkout-session', {
  body: {
    items: [
      {
        title: 'Property Name',
        price: 500,
        image: 'https://...',
        bookingId: 'uuid-here'
      }
    ],
    userId: user.id,
    email: user.email,
    origin: window.location.origin
  }
})

// Redirect to Stripe
window.location.href = data.url
```

## Files Created/Modified

| File | Purpose |
|------|---------|
| `supabase/migrations/20260401000000_add_stripe_session_id.sql` | DB schema |
| `supabase/migrations/20260401000001_update_cron_schedule.sql` | Cron schedule |
| `supabase/functions/create-checkout-session/index.ts` | Create Stripe session |
| `supabase/functions/stripe-webhook/index.ts` | Handle webhook |
| `supabase/functions/cancel-expired-bookings/index.ts` | Updated for 15-min window |

## Summary

| Что | Где |
|-----|-----|
| DB Schema | `bookings` table (stripe_session_id, payment_expires_at) |
| Checkout Session | `create-checkout-session` Edge Function |
| Webhook Handler | `stripe-webhook` Edge Function |
| Payment Window | 15 минут (константа `PAYMENT_WINDOW_MINUTES`) |
| Cron Schedule | Каждые 5 минут (`*/5 * * * *`) |
| Email on Success | `booking_confirmed` (через `send-email`) |
| Email on Expire | `booking_expired_guest` (через `send-email`) |
