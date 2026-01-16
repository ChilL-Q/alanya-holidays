-- 1. Add status column to services table
ALTER TABLE services 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('approved', 'pending', 'rejected'));

-- 2. Update existing services to 'approved' by default so they don't disappear
UPDATE services SET status = 'approved' WHERE status IS NULL;

-- 3. Ensure RLS policies allow Admins to update services
-- (This assumes you have RLS enabled. If not, this part is optional but recommended)

-- Policy: Admins can update any service
CREATE POLICY "Admins can update any service"
ON services
FOR UPDATE
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
)
WITH CHECK (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);

-- Policy: Admins can delete any service
CREATE POLICY "Admins can delete any service"
ON services
FOR DELETE
USING (
  auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
);
