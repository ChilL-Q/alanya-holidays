-- Create table for business listing claim submissions
CREATE TABLE IF NOT EXISTS public.listing_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL,
    additional_notes TEXT,
    business_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    whatsapp TEXT,
    website TEXT,
    address TEXT,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;

-- Allow public insert on listing_claims (both anonymous and authenticated)
CREATE POLICY "Allow public insert on listing_claims"
ON public.listing_claims
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow users to view their own claims, and admins to view all claims
CREATE POLICY "Allow select on listing_claims"
ON public.listing_claims
FOR SELECT
TO authenticated, anon
USING (
    (user_id = auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Allow admins to update or delete claims
CREATE POLICY "Allow admin update on listing_claims"
ON public.listing_claims
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Allow admin delete on listing_claims"
ON public.listing_claims
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
