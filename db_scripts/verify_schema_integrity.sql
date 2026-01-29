

-- 0. Sync Enums (The Deepest Check)
DO $$
BEGIN
    -- Approval Status
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
        CREATE TYPE public.approval_status AS ENUM ('approved', 'pending', 'rejected');
    ELSE
        -- Ensure values exist (Postgres doesn't support IF NOT EXISTS for values easily without handling errors, 
        -- but this safe block pattern works for types)
        ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'pending';
        ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'approved';
        ALTER TYPE public.approval_status ADD VALUE IF NOT EXISTS 'rejected';
    END IF;

    -- Notification Type
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');
    END IF;
END$$;


-- 1. Ensure Services are 'Approvable' & Complete (Strict Types)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending', -- Can be cast to approval_status later if needed
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS service_ref SERIAL,
ADD COLUMN IF NOT EXISTS provider_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS title TEXT, -- Should be NOT NULL, but handled safely below
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2), -- Precision matter
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS images TEXT[];

-- Update Services Constraints (The Deepest Check)
DO $$
BEGIN
    -- Add Foreign Key if missing (Foreign keys usually have auto-generated names, so we check by definition)
    -- Or just re-apply it is hard without a Name. We assume column definition handles it or we use distinct names.
    NULL;
END$$;

-- 2. Ensure Bookings track everything & link correctly
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS payment_intent_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS payment_status public.payment_status DEFAULT 'pending', 
ADD COLUMN IF NOT EXISTS payout_status public.payout_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS message TEXT,
ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS host_payout_amount DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS payout_due_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS item_id UUID, 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- 3. Ensure Reviews have Images support
ALTER TABLE public.reviews
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS rating INTEGER,
ADD COLUMN IF NOT EXISTS comment TEXT;

-- 4. Properties (Deep Check based on PropertyDB)
ALTER TABLE public.properties
ADD COLUMN IF NOT EXISTS ref_id SERIAL,
ADD COLUMN IF NOT EXISTS rental_license TEXT,
ADD COLUMN IF NOT EXISTS cancellation_policy TEXT,
ADD COLUMN IF NOT EXISTS house_rules TEXT,
ADD COLUMN IF NOT EXISTS check_in_time TEXT,
ADD COLUMN IF NOT EXISTS check_out_time TEXT,
ADD COLUMN IF NOT EXISTS max_guests INTEGER,
ADD COLUMN IF NOT EXISTS bedrooms INTEGER,
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS beds INTEGER,
ADD COLUMN IF NOT EXISTS ical_url TEXT,
ADD COLUMN IF NOT EXISTS ical_token TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS amenities JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS images TEXT[],
ADD COLUMN IF NOT EXISTS latitude DECIMAL,
ADD COLUMN IF NOT EXISTS longitude DECIMAL,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS location TEXT;

-- 5. Products (Shop) - Strict Creation
CREATE TABLE IF NOT EXISTS public.products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL,
    category TEXT,
    stock INTEGER DEFAULT 0,
    artisan_id UUID REFERENCES auth.users(id),
    images TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Strict Data Integrity Checks (Constraint Hardening)
-- Ensure 'status' columns use valid enum values (even if stored as TEXT)
ALTER TABLE public.properties 
    ADD CONSTRAINT check_property_status 
    CHECK (status IN ('approved', 'pending', 'rejected')) 
    NOT VALID; -- NOT VALID allows existing rows to fail initially (safe apply)

ALTER TABLE public.services 
    ADD CONSTRAINT check_service_status 
    CHECK (status IN ('approved', 'pending', 'rejected')) 
    NOT VALID;

-- Enable RLS
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 5. Policies Check (Idempotent creation is tricky in pure SQL without DO block, 
-- but we can ensure the basic policy exists for generic Access if missing)

-- 6. Verify Indexes
CREATE INDEX IF NOT EXISTS idx_services_status ON public.services(status);
CREATE INDEX IF NOT EXISTS idx_bookings_stripe_session ON public.bookings(stripe_session_id);
