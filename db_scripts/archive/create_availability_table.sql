-- Create types safely
DO $$ BEGIN
    CREATE TYPE availability_status AS ENUM ('available', 'booked', 'blocked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE availability_source AS ENUM ('manual', 'ical', 'reservation');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS property_availability (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    status availability_status DEFAULT 'available',
    price DECIMAL(10, 2), -- Optional override price
    source availability_source DEFAULT 'manual',
    external_id TEXT, -- ID from iCal event
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Prevent duplicate entries for same property and date
    UNIQUE(property_id, date)
);

-- Indexes
CREATE INDEX idx_availability_property_date ON property_availability(property_id, date);

-- RLS Policies
ALTER TABLE property_availability ENABLE ROW LEVEL SECURITY;

-- Public read access (needed for search page to filter)
CREATE POLICY "Public availability view"
ON property_availability FOR SELECT
USING (true);

-- Host write access (their own properties)
CREATE POLICY "Hosts can manage their own availability"
ON property_availability FOR ALL
USING (
    property_id IN (
        SELECT id FROM properties WHERE host_id = auth.uid()
    )
)
WITH CHECK (
    property_id IN (
        SELECT id FROM properties WHERE host_id = auth.uid()
    )
);

-- Admin access
CREATE POLICY "Admins can manage all availability"
ON property_availability FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
