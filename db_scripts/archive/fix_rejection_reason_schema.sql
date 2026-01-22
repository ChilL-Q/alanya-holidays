-- Ensure properties table has rejection_reason
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Ensure services table has rejection_reason (just in case)
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Force PostgREST to reload the schema cache
-- This fixes "Could not find the 'rejection_reason' column ... in the schema cache" errors
NOTIFY pgrst, 'reload config';
