-- Add status column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected'));

-- Update existing services to approved (optional, assuming current ones are good)
UPDATE services SET status = 'approved' WHERE status IS NULL;
