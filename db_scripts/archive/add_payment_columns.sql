-- Create Payout Status Enum if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
        CREATE TYPE public.payout_status AS ENUM ('pending', 'processing', 'paid', 'failed', 'hold');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
        CREATE TYPE public.payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
    END IF;
END$$;

-- Update Profiles Table (Manual Payout Details)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS iban TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_holder_name TEXT;

-- Update Bookings Table (Financial Tracking)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payout_status public.payout_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payout_due_date TIMESTAMP WITH TIME ZONE;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookings_payout_status ON public.bookings(payout_status);
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public.bookings(payment_status);
