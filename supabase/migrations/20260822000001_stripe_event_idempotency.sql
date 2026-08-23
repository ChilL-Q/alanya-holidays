-- Migration: 20260822000001_stripe_event_idempotency
-- Purpose: Persistent idempotency for Stripe webhook processing (audit 2.3).
-- Replaces the in-memory processedEventIds Map in StripeWebhookService which
-- lost dedup state on restart / across multiple instances, causing duplicate
-- checkout.session.completed handling (double confirmations, notifications).

CREATE TABLE IF NOT EXISTS public.processed_stripe_events (
    event_id TEXT PRIMARY KEY,
    event_type TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_processed_stripe_events_processed_at
    ON public.processed_stripe_events (processed_at);

ALTER TABLE public.processed_stripe_events ENABLE ROW LEVEL SECURITY;

-- No policies: the table is only accessed via service role (backend) and
-- the SECURITY DEFINER claim function below.

-- Atomic claim: returns true only for the first delivery of an event.
CREATE OR REPLACE FUNCTION public.claim_stripe_event(
    p_event_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_inserted BOOLEAN;
BEGIN
    INSERT INTO public.processed_stripe_events (event_id)
    VALUES (p_event_id)
    ON CONFLICT (event_id) DO NOTHING;

    v_inserted := FOUND;
    RETURN v_inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.claim_stripe_event FROM anon, public;

-- Retention: drop events older than 30 days (Stripe retries stop well before).
CREATE OR REPLACE FUNCTION public.purge_old_stripe_events()
RETURNS void AS $$
BEGIN
    DELETE FROM public.processed_stripe_events
    WHERE processed_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.purge_old_stripe_events FROM anon, public;
