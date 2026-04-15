-- Create table for lawyer contact submissions
CREATE TABLE IF NOT EXISTS public.lawyer_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Rate limiting: 1 submission per email per day
-- Only allow ONE entry per email per day
CREATE UNIQUE INDEX idx_lawyer_contacts_email_daily
ON public.lawyer_contacts (email, (created_at::date));

-- RLS Policies
ALTER TABLE public.lawyer_contacts ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth required)
CREATE POLICY "Allow public insert on lawyer_contacts"
ON public.lawyer_contacts
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admin read only
CREATE POLICY "Admin can read lawyer contacts"
ON public.lawyer_contacts
FOR SELECT
TO anon, authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- Prevent non-admins from updating or deleting
CREATE POLICY "Deny update on lawyer_contacts"
ON public.lawyer_contacts
FOR UPDATE
TO anon, authenticated
USING (false);

CREATE POLICY "Deny delete on lawyer_contacts"
ON public.lawyer_contacts
FOR DELETE
TO anon, authenticated
USING (false);
