-- [79] Add payment_intent_id column to bookings table
-- Required by stripe-webhook to look up bookings when handling
-- payment_intent.payment_failed and charge.dispute.created events.
-- Without this column, both handlers silently return null and never update bookings.

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT;

CREATE INDEX IF NOT EXISTS idx_bookings_payment_intent_id
ON bookings (payment_intent_id)
WHERE payment_intent_id IS NOT NULL;
