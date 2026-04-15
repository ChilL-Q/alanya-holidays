-- Create table for consultant profiles
CREATE TABLE IF NOT EXISTS public.consultant_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bio TEXT,
    specialties TEXT[] DEFAULT '{}',
    languages TEXT[] DEFAULT '{}',
    hourly_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Policies
ALTER TABLE public.consultant_profiles ENABLE ROW LEVEL SECURITY;

-- Everyone can view consultants (public listing)
CREATE POLICY "Anyone can view consultant profiles"
ON public.consultant_profiles
FOR SELECT
TO public
USING (true);

-- Only admin (service role) can insert/update/delete consultant profiles
-- This is enforced by requiring auth AND admin role check
CREATE POLICY "Admin can manage all consultant profiles"
ON public.consultant_profiles
FOR ALL
TO authenticated
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);