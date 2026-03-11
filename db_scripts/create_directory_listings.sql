-- Create Directory Listings Table
CREATE TABLE IF NOT EXISTS public.directory_listings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    short_description TEXT NOT NULL,
    is_featured BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    website TEXT,
    whatsapp TEXT,
    gallery TEXT[] DEFAULT '{}'::TEXT[],
    reviews_average NUMERIC(2,1) DEFAULT 0.0,
    reviews_count INTEGER DEFAULT 0,
    languages_spoken TEXT[] DEFAULT '{}'::TEXT[],
    certifications TEXT[] DEFAULT '{}'::TEXT[],
    location TEXT NOT NULL,
    google_map_url TEXT,
    price_level INTEGER CHECK (price_level >= 1 AND price_level <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.directory_listings ENABLE ROW LEVEL SECURITY;

-- Create Policies
-- 1. Anyone can read directory listings
CREATE POLICY "Public directory listings are viewable by everyone." 
ON public.directory_listings FOR SELECT 
USING (true);

-- 2. Authenticated users (admins) can insert
CREATE POLICY "Authenticated users can insert directory listings." 
ON public.directory_listings FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Authenticated users (admins) can update
CREATE POLICY "Authenticated users can update directory listings." 
ON public.directory_listings FOR UPDATE 
USING (auth.role() = 'authenticated');

-- 4. Authenticated users (admins) can delete
CREATE POLICY "Authenticated users can delete directory listings." 
ON public.directory_listings FOR DELETE 
USING (auth.role() = 'authenticated');

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_directory_listings_updated_at
    BEFORE UPDATE ON public.directory_listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
