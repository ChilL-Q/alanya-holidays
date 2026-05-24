-- Purpose: Create locations table for Antalya Province coverage (LST-001)
-- All 22 districts/cities with lat/lng for map display and search filters

CREATE TABLE IF NOT EXISTS locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_tr TEXT,
    lat DOUBLE PRECISION,
    lng DOUBLE PRECISION,
    parent_region TEXT CHECK (parent_region IN ('Antalya City', 'Alanya', 'Other')),
    type TEXT CHECK (type IN ('city', 'district', 'town')),
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;

-- Everyone can read active locations
CREATE POLICY "locations_select_public"
    ON locations FOR SELECT
    USING (is_active = true);

-- Only admins can manage locations
CREATE POLICY "locations_admin_all"
    ON locations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_locations_parent_region ON locations(parent_region);
CREATE INDEX IF NOT EXISTS idx_locations_active ON locations(is_active);

-- Seed Antalya Province locations
INSERT INTO locations (name, name_tr, lat, lng, parent_region, type, display_order) VALUES
    -- Antalya City districts
    ('Antalya', 'Antalya', 37.0951672, 31.0793705, 'Antalya City', 'city', 1),
    ('Aksu', 'Aksu', 36.9538900, 30.8477800, 'Antalya City', 'district', 2),
    ('Dosemealti', 'Döşemealtı', 37.0236600, 30.5904000, 'Antalya City', 'district', 3),
    ('Kepez', 'Kepez', 37.0118700, 30.7596600, 'Antalya City', 'district', 4),
    ('Konyaalti', 'Konyaaltı', 36.8642400, 30.6271400, 'Antalya City', 'district', 5),
    ('Muratpasa', 'Muratpaşa', 36.8915700, 30.7649800, 'Antalya City', 'district', 6),

    -- Alanya sub-area
    ('Alanya', 'Alanya', 36.5500, 32.0000, 'Alanya', 'city', 10),
    ('Avsallar', 'Avsallar', 36.6222, 31.7667, 'Alanya', 'town', 11),
    ('Konakli', 'Konaklı', 36.5830, 31.8830, 'Alanya', 'town', 12),
    ('Kestel', 'Kestel', 36.5161, 32.0743, 'Alanya', 'town', 13),
    ('Mahmutlar', 'Mahmutlar', 36.4946, 32.0909, 'Alanya', 'town', 14),
    ('Kargicak', 'Kargıcak', 36.4782, 32.1093, 'Alanya', 'town', 15),

    -- Other Antalya Province districts
    ('Akseki', 'Akseki', 37.0486100, 31.7900000, 'Other', 'district', 20),
    ('Demre', 'Demre', 36.2444400, 29.9850000, 'Other', 'district', 21),
    ('Elmali', 'Elmalı', 36.7358300, 29.9177500, 'Other', 'district', 22),
    ('Finike', 'Finike', 36.4235500, 30.0664500, 'Other', 'district', 23),
    ('Gazipasa', 'Gazipaşa', 36.2694200, 32.3179200, 'Other', 'district', 24),
    ('Gundogmus', 'Gündoğmuş', 36.8244600, 32.0067900, 'Other', 'district', 25),
    ('Ibradi', 'İbradı', 37.0969400, 31.5991700, 'Other', 'district', 26),
    ('Kas', 'Kaş', 36.2017600, 29.6376600, 'Other', 'district', 27),
    ('Kemer', 'Kemer', 36.5977800, 30.5605600, 'Other', 'district', 28),
    ('Korkuteli', 'Korkuteli', 37.0649800, 30.1956500, 'Other', 'district', 29)
ON CONFLICT DO NOTHING;
