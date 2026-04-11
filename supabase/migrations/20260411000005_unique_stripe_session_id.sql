-- [82] Add UNIQUE constraint on bookings.stripe_session_id
-- Idempotency for Stripe webhooks was only application-level.
-- A DB-level unique constraint ensures no two bookings share the same
-- stripe_session_id even under concurrent webhook retries.

-- Drop the plain index added in migration 20260401000000 first
-- (a UNIQUE constraint creates its own index)
DROP INDEX IF EXISTS bookings_stripe_session_id_idx;

-- Add unique constraint (partial — only where stripe_session_id is set)
ALTER TABLE bookings
ADD CONSTRAINT bookings_stripe_session_id_unique
UNIQUE (stripe_session_id);
