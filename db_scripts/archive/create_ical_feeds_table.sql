-- Create property_ical_feeds table
CREATE TABLE IF NOT EXISTS property_ical_feeds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL, -- e.g. "Airbnb", "Booking.com"
    url TEXT NOT NULL,
    last_synced_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_ical_feeds_property ON property_ical_feeds(property_id);

-- Enable RLS
ALTER TABLE property_ical_feeds ENABLE ROW LEVEL SECURITY;

-- RLS Policies for property_ical_feeds
DO $$ BEGIN
    CREATE POLICY "Hosts can manage their own ical feeds" ON property_ical_feeds FOR ALL
    USING (property_id IN (SELECT id FROM properties WHERE host_id = auth.uid()))
    WITH CHECK (property_id IN (SELECT id FROM properties WHERE host_id = auth.uid()));
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update property_availability to link to specific feeds
ALTER TABLE property_availability 
ADD COLUMN IF NOT EXISTS feed_id UUID REFERENCES property_ical_feeds(id) ON DELETE CASCADE;

-- Add index for feed_id
CREATE INDEX IF NOT EXISTS idx_availability_feed ON property_availability(feed_id);

-- Migration: If possible, we could migrate existing ical_url from properties to this table, 
-- but since we are in dev, we can just leave it for now or user can re-add.
