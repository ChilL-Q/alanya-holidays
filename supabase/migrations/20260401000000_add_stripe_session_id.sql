-- Add Stripe payment columns to bookings table

alter table bookings
  add column if not exists stripe_session_id text,
  add column if not exists payment_expires_at timestamptz;

create index if not exists bookings_stripe_session_id_idx on bookings (stripe_session_id);

-- Comment: stripe_session_id is used for webhook lookup
-- payment_expires_at is the time when the booking auto-cancels (15 minutes for Stripe payments)
