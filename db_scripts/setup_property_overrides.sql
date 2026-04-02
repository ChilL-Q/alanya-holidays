-- Create Property Overrides Table
-- This table maps custom slugs to property UUIDs for SEO and marketing purposes.
CREATE TABLE IF NOT EXISTS property_overrides (
    slug TEXT PRIMARY KEY,
    uuid UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE property_overrides ENABLE ROW LEVEL SECURITY;

-- Policies for Property Overrides
-- Public read access
DROP POLICY IF EXISTS "Property overrides are viewable by everyone" ON property_overrides;
CREATE POLICY "Property overrides are viewable by everyone" 
    ON property_overrides FOR SELECT 
    USING (true);

-- Insert initial mapping
-- 'castle-view-penthouse' -> 'eee2d685-eac5-4ec8-bd24-63fea94f25ee'
INSERT INTO property_overrides (slug, uuid)
VALUES ('castle-view-penthouse', 'eee2d685-eac5-4ec8-bd24-63fea94f25ee')
ON CONFLICT (slug) DO UPDATE 
SET uuid = EXCLUDED.uuid;

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
