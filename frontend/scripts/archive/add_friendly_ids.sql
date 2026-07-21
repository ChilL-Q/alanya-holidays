-- SQL Script to add a "Friendly ID" (e.g., 1, 2, 3...) to your properties table.
-- UUIDs (the long ugly strings) are required for Security and Database integrity, 
-- but we can add this 'ref_id' for you to refer to properties easily.

-- 1. Add the column (It will automatically fill with 1, 2, 3... for existing rows)
ALTER TABLE properties 
ADD COLUMN ref_id SERIAL;

-- 2. (Optional) Make sure it's visible and unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_properties_ref_id ON properties(ref_id);

-- 3. (Optional) If you want bookings to strictly reference this new ID, 
-- we can reference it, but usually we just keep it on the Property table for display.

-- After running this:
-- You will see a new column 'ref_id' in your Table Editor with simple numbers.
