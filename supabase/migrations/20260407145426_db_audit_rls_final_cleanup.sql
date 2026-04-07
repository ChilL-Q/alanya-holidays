-- ============================================================================
-- Final RLS cleanup: remaining auth_rls_initplan fixes, consolidate bookings
-- policies, fix property_availability, re-add critical FK indexes
-- ============================================================================

-- PROFILES: fix auth.uid() → (SELECT auth.uid())
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE USING (((SELECT auth.uid()) = id) OR (SELECT is_admin()));

-- NOTIFICATIONS: drop stale policy, fix auth.role()
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- DIRECTORY_LISTINGS: fix auth.role() → (SELECT auth.role())
DROP POLICY IF EXISTS "directory_listings_insert" ON directory_listings;
DROP POLICY IF EXISTS "directory_listings_update" ON directory_listings;
DROP POLICY IF EXISTS "directory_listings_delete" ON directory_listings;
CREATE POLICY "directory_listings_insert" ON directory_listings FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "directory_listings_update" ON directory_listings FOR UPDATE USING ((SELECT auth.role()) = 'authenticated');
CREATE POLICY "directory_listings_delete" ON directory_listings FOR DELETE USING ((SELECT auth.role()) = 'authenticated');

-- AUDIT_LOGS: fix auth.role()
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON audit_logs;
CREATE POLICY "audit_logs_insert_auth" ON audit_logs FOR INSERT WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- BOOKINGS: consolidate 3 SELECT + 3 UPDATE policies into 1 each
DROP POLICY IF EXISTS "bookings_select_own" ON bookings;
DROP POLICY IF EXISTS "bookings_select_host" ON bookings;
DROP POLICY IF EXISTS "bookings_select_admin" ON bookings;
DROP POLICY IF EXISTS "bookings_update_user_cancel" ON bookings;
DROP POLICY IF EXISTS "bookings_update_host" ON bookings;
DROP POLICY IF EXISTS "bookings_update_admin" ON bookings;

CREATE POLICY "bookings_select" ON bookings
  FOR SELECT USING (
    (SELECT auth.uid()) = user_id
    OR (item_type = 'property' AND EXISTS (SELECT 1 FROM properties WHERE id = bookings.item_id AND host_id = (SELECT auth.uid())))
    OR (item_type = 'service' AND EXISTS (SELECT 1 FROM services WHERE id = bookings.item_id AND provider_id = (SELECT auth.uid())))
    OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')
  );

CREATE POLICY "bookings_update" ON bookings
  FOR UPDATE
  USING (
    (SELECT auth.uid()) = user_id
    OR (item_type = 'property' AND EXISTS (SELECT 1 FROM properties WHERE id = bookings.item_id AND host_id = (SELECT auth.uid())))
    OR (item_type = 'service' AND EXISTS (SELECT 1 FROM services WHERE id = bookings.item_id AND provider_id = (SELECT auth.uid())))
    OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    ((SELECT auth.uid()) = user_id AND status = 'cancelled')
    OR (item_type = 'property' AND EXISTS (SELECT 1 FROM properties WHERE id = bookings.item_id AND host_id = (SELECT auth.uid())))
    OR (item_type = 'service' AND EXISTS (SELECT 1 FROM services WHERE id = bookings.item_id AND provider_id = (SELECT auth.uid())))
    OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- PROPERTY_AVAILABILITY: split ALL into specific commands to avoid SELECT conflict
DROP POLICY IF EXISTS "property_availability_select" ON property_availability;
DROP POLICY IF EXISTS "property_availability_manage" ON property_availability;
CREATE POLICY "property_availability_select" ON property_availability FOR SELECT USING (true);
CREATE POLICY "property_availability_insert" ON property_availability FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE id = property_availability.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "property_availability_update" ON property_availability FOR UPDATE USING (EXISTS (SELECT 1 FROM properties WHERE id = property_availability.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "property_availability_delete" ON property_availability FOR DELETE USING (EXISTS (SELECT 1 FROM properties WHERE id = property_availability.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Re-add critical FK indexes (needed for FK constraint checks and JOIN performance)
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_property_id ON chat_conversations (property_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id ON chat_messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_conversation_id ON chat_reports (conversation_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reported_id ON chat_reports (reported_id);
CREATE INDEX IF NOT EXISTS idx_chat_reports_reporter_id ON chat_reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_products_artisan_id ON products (artisan_id);
CREATE INDEX IF NOT EXISTS idx_reviews_property_id ON reviews (property_id);
CREATE INDEX IF NOT EXISTS idx_service_edits_service_id ON service_edits (service_id);
CREATE INDEX IF NOT EXISTS idx_services_provider_id ON services (provider_id);
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
