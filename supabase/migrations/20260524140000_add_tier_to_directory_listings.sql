-- Purpose: Add tier, base_score, subscription_id to directory_listings (LST-003)

ALTER TABLE directory_listings
    ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('explorer', 'voyager', 'signature', 'partner')) DEFAULT 'explorer',
    ADD COLUMN IF NOT EXISTS base_score INTEGER DEFAULT 0,
    ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES premium_subscriptions(id);

-- Backfill existing rows
UPDATE directory_listings SET tier = 'explorer', base_score = 0 WHERE tier IS NULL;
UPDATE directory_listings SET tier = 'voyager', base_score = 100 WHERE is_premium = true AND tier = 'explorer';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_directory_listings_tier ON directory_listings(tier);
CREATE INDEX IF NOT EXISTS idx_directory_listings_base_score ON directory_listings(base_score DESC);

-- Update admin trigger to guard tier changes
DROP TRIGGER IF EXISTS trg_enforce_premium_admin ON directory_listings;

CREATE OR REPLACE FUNCTION enforce_premium_admin_only()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_premium = true AND OLD.is_premium = false) OR
       (NEW.tier IS DISTINCT FROM OLD.tier AND NEW.tier != 'explorer') THEN
        IF NOT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only admins can set premium or non-explorer tier';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_enforce_premium_admin
    BEFORE UPDATE ON directory_listings
    FOR EACH ROW
    EXECUTE FUNCTION enforce_premium_admin_only();
