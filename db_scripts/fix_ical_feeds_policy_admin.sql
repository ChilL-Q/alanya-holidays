-- Drop old restricted policy
DROP POLICY IF EXISTS "Hosts can manage their own ical feeds" ON property_ical_feeds;

-- Create new inclusive policy (Host OR Admin)
CREATE POLICY "Hosts and Admins can manage ical feeds" ON property_ical_feeds FOR ALL
USING (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
)
WITH CHECK (
    property_id IN (SELECT id FROM properties WHERE host_id = auth.uid())
    OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);
