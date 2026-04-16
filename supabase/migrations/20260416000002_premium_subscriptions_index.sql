-- Add partial index on premium_subscriptions for webhook queries
-- Webhook handlers filter by status + current_period_end frequently
CREATE INDEX IF NOT EXISTS idx_premium_subscriptions_status_period
  ON public.premium_subscriptions(status, current_period_end)
  WHERE status IN ('active', 'past_due');
