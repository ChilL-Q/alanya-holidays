-- Add iCal fields to properties table
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS ical_url TEXT,
ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ical_token UUID DEFAULT uuid_generate_v4(); -- For secure export URL

-- Index for cron jobs / sync logic
CREATE INDEX IF NOT EXISTS idx_properties_last_synced ON properties(last_synced_at);
