-- 1. Add cleaning_fee to properties
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS cleaning_fee numeric DEFAULT 0;

-- 2. Add rejection_reason to properties (if not exists)
ALTER TABLE properties
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 3. Update 'type' check constraint on services table to include 'wellness'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'services_type_check'
    ) THEN
        ALTER TABLE services DROP CONSTRAINT services_type_check;
    END IF;
END $$;

ALTER TABLE services
ADD CONSTRAINT services_type_check 
CHECK (type IN ('car', 'bike', 'tour', 'transfer', 'visa', 'esim', 'wellness'));

-- 4. Update 'payment_method' check constraint on bookings table to include 'cash'
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'bookings_payment_method_check'
    ) THEN
        ALTER TABLE bookings DROP CONSTRAINT bookings_payment_method_check;
    END IF;
END $$;

ALTER TABLE bookings
ADD CONSTRAINT bookings_payment_method_check
CHECK (payment_method IN ('card', 'bank', 'crypto', 'cash'));
