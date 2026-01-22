-- Add payment_method and payment_status to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_method text CHECK (payment_method IN ('card', 'bank', 'crypto', 'cash')),
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded'));

-- Make columns nullable for backward compatibility with existing bookings
-- Add comments
COMMENT ON COLUMN bookings.payment_method IS 'Method of payment selected by user';
COMMENT ON COLUMN bookings.payment_status IS 'Status of the payment transaction';
