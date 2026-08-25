-- Migration: 20260827010000_grant_service_role_money_rpcs
-- Purpose: Restore EXECUTE on service-critical RPCs whose migrations revoked
-- PUBLIC by default without compensating grants. Without these, a fresh
-- deploy fails all checkout (create_product_order) and every Stripe webhook
-- (claim_stripe_event) with "permission denied for function".
-- Pattern matches sibling RPCs (e.g. confirm_bookings_from_stripe).

GRANT EXECUTE ON FUNCTION public.create_product_order(text, numeric, text, uuid, jsonb, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.claim_stripe_event(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.purge_old_stripe_events() TO service_role;
