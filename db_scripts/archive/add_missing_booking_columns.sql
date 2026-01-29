-- Add missing columns to bookings table required by create_booking RPC
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card';

-- Add index for payment_method in case we want to filter/report by it
CREATE INDEX IF NOT EXISTS idx_bookings_payment_method ON public.bookings(payment_method);
