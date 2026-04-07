-- ============================================================================
-- [37] auth_rls_initplan — replace auth.uid() with (SELECT auth.uid())
-- [38] multiple_permissive_policies — consolidate duplicate policies
-- Strategy: drop all old policies per table, recreate as clean minimal set
-- ============================================================================

-- AUDIT_LOGS
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role has full access to audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs: admin read" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs: service role insert" ON audit_logs;
CREATE POLICY "audit_logs_select_admin" ON audit_logs FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "audit_logs_insert_auth" ON audit_logs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- BOOKINGS
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "bookings: admin full select" ON bookings;
DROP POLICY IF EXISTS "bookings: admin update any" ON bookings;
DROP POLICY IF EXISTS "bookings: authenticated insert" ON bookings;
DROP POLICY IF EXISTS "bookings: host read bookings of own items" ON bookings;
DROP POLICY IF EXISTS "bookings: host update status of own items" ON bookings;
DROP POLICY IF EXISTS "bookings: user cancel own" ON bookings;
DROP POLICY IF EXISTS "bookings: user read own" ON bookings;
CREATE POLICY "bookings_select_own" ON bookings FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "bookings_select_host" ON bookings FOR SELECT USING (((item_type = 'property') AND EXISTS (SELECT 1 FROM properties WHERE id = bookings.item_id AND host_id = (SELECT auth.uid()))) OR ((item_type = 'service') AND EXISTS (SELECT 1 FROM services WHERE id = bookings.item_id AND provider_id = (SELECT auth.uid()))));
CREATE POLICY "bookings_select_admin" ON bookings FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "bookings_insert_own" ON bookings FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "bookings_update_user_cancel" ON bookings FOR UPDATE USING ((SELECT auth.uid()) = user_id) WITH CHECK (status = 'cancelled');
CREATE POLICY "bookings_update_host" ON bookings FOR UPDATE USING (((item_type = 'property') AND EXISTS (SELECT 1 FROM properties WHERE id = bookings.item_id AND host_id = (SELECT auth.uid()))) OR ((item_type = 'service') AND EXISTS (SELECT 1 FROM services WHERE id = bookings.item_id AND provider_id = (SELECT auth.uid()))));
CREATE POLICY "bookings_update_admin" ON bookings FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- CHAT_CONVERSATIONS
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: admin all" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: authenticated insert" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: participant read" ON chat_conversations;
CREATE POLICY "chat_conversations_select" ON chat_conversations FOR SELECT USING ((SELECT auth.uid()) = guest_id OR (SELECT auth.uid()) = host_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "chat_conversations_insert" ON chat_conversations FOR INSERT WITH CHECK ((SELECT auth.uid()) = guest_id);

-- CHAT_MESSAGES
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "Users can update read status" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: authenticated insert" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant delete" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant read" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant update" ON chat_messages;
CREATE POLICY "chat_messages_select" ON chat_messages FOR SELECT USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND ((guest_id = (SELECT auth.uid())) OR (host_id = (SELECT auth.uid())))));
CREATE POLICY "chat_messages_insert" ON chat_messages FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND ((guest_id = (SELECT auth.uid())) OR (host_id = (SELECT auth.uid())))));
CREATE POLICY "chat_messages_update" ON chat_messages FOR UPDATE USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND ((guest_id = (SELECT auth.uid())) OR (host_id = (SELECT auth.uid())))));
CREATE POLICY "chat_messages_delete" ON chat_messages FOR DELETE USING (EXISTS (SELECT 1 FROM chat_conversations WHERE id = chat_messages.conversation_id AND ((guest_id = (SELECT auth.uid())) OR (host_id = (SELECT auth.uid())))));

-- CHAT_REPORTS
DROP POLICY IF EXISTS "Admins can update reports" ON chat_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON chat_reports;
DROP POLICY IF EXISTS "Users can create reports" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: admin read" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: authenticated insert" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: reporter read" ON chat_reports;
CREATE POLICY "chat_reports_select" ON chat_reports FOR SELECT USING ((SELECT auth.uid()) = reporter_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "chat_reports_insert" ON chat_reports FOR INSERT WITH CHECK ((SELECT auth.uid()) = reporter_id);
CREATE POLICY "chat_reports_update_admin" ON chat_reports FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- DIRECTORY_LISTINGS
DROP POLICY IF EXISTS "Authenticated users can delete directory listings." ON directory_listings;
DROP POLICY IF EXISTS "Authenticated users can insert directory listings." ON directory_listings;
DROP POLICY IF EXISTS "Authenticated users can update directory listings." ON directory_listings;
DROP POLICY IF EXISTS "Public directory listings are viewable by everyone." ON directory_listings;
DROP POLICY IF EXISTS "directory_listings: admin manage" ON directory_listings;
DROP POLICY IF EXISTS "directory_listings: public read approved" ON directory_listings;
CREATE POLICY "directory_listings_select" ON directory_listings FOR SELECT USING (true);
CREATE POLICY "directory_listings_insert" ON directory_listings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "directory_listings_update" ON directory_listings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "directory_listings_delete" ON directory_listings FOR DELETE USING (auth.role() = 'authenticated');

-- FAVORITES
DROP POLICY IF EXISTS "Users can manage favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "favorites: user delete own" ON favorites;
DROP POLICY IF EXISTS "favorites: user manage own" ON favorites;
DROP POLICY IF EXISTS "favorites: user own" ON favorites;
CREATE POLICY "favorites_select" ON favorites FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "favorites_insert" ON favorites FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "favorites_delete" ON favorites FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- MESSAGES
DROP POLICY IF EXISTS "Admin All Messages" ON messages;
DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;
DROP POLICY IF EXISTS "Public insert" ON messages;
DROP POLICY IF EXISTS "messages: admin delete" ON messages;
DROP POLICY IF EXISTS "messages: admin read" ON messages;
DROP POLICY IF EXISTS "messages: authenticated insert" ON messages;
CREATE POLICY "messages_select_admin" ON messages FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "messages_insert_public" ON messages FOR INSERT WITH CHECK (true);
CREATE POLICY "messages_delete_admin" ON messages FOR DELETE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- NOTIFICATIONS
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update (mark read) their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications: admin read all" ON notifications;
DROP POLICY IF EXISTS "notifications: service insert" ON notifications;
DROP POLICY IF EXISTS "notifications: user own" ON notifications;
DROP POLICY IF EXISTS "notifications: user update own" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (user_id = (SELECT auth.uid()) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "notifications_insert" ON notifications FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (user_id = (SELECT auth.uid()));

-- PRODUCTS
DROP POLICY IF EXISTS "Admin All Products" ON products;
DROP POLICY IF EXISTS "Artisans/Sellers can manage their products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Public view" ON products;
DROP POLICY IF EXISTS "products: admin delete any" ON products;
DROP POLICY IF EXISTS "products: admin update/delete any" ON products;
DROP POLICY IF EXISTS "products: authenticated insert" ON products;
DROP POLICY IF EXISTS "products: public read" ON products;
DROP POLICY IF EXISTS "products: seller delete own" ON products;
DROP POLICY IF EXISTS "products: seller update own" ON products;
CREATE POLICY "products_select" ON products FOR SELECT USING (true);
CREATE POLICY "products_insert" ON products FOR INSERT WITH CHECK ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = artisan_id);
CREATE POLICY "products_update" ON products FOR UPDATE USING ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = artisan_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "products_delete" ON products FOR DELETE USING ((SELECT auth.uid()) = seller_id OR (SELECT auth.uid()) = artisan_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- PROFILES
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING ((SELECT is_admin()));
CREATE POLICY "profiles_update_own_or_admin" ON profiles FOR UPDATE USING ((auth.uid() = id) OR (SELECT is_admin()));

-- PROPERTIES
DROP POLICY IF EXISTS "Admin All Properties" ON properties;
DROP POLICY IF EXISTS "Admins can delete any property." ON properties;
DROP POLICY IF EXISTS "Admins can insert properties." ON properties;
DROP POLICY IF EXISTS "Admins can update any property." ON properties;
DROP POLICY IF EXISTS "Anyone can submit properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Hosts can delete their own properties" ON properties;
DROP POLICY IF EXISTS "Hosts can update their own properties" ON properties;
DROP POLICY IF EXISTS "Hosts create" ON properties;
DROP POLICY IF EXISTS "Hosts update own, Admins update all" ON properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Public view" ON properties;
DROP POLICY IF EXISTS "Public view approved properties" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "properties: admin delete" ON properties;
DROP POLICY IF EXISTS "properties: admin full select" ON properties;
DROP POLICY IF EXISTS "properties: admin update any" ON properties;
DROP POLICY IF EXISTS "properties: authenticated insert" ON properties;
DROP POLICY IF EXISTS "properties: host delete own" ON properties;
DROP POLICY IF EXISTS "properties: host read own" ON properties;
DROP POLICY IF EXISTS "properties: host update own" ON properties;
DROP POLICY IF EXISTS "properties: public read approved" ON properties;
CREATE POLICY "properties_select" ON properties FOR SELECT USING (status = 'approved' OR (SELECT auth.uid()) = host_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "properties_insert" ON properties FOR INSERT WITH CHECK ((SELECT auth.uid()) = host_id AND status = 'pending');
CREATE POLICY "properties_update" ON properties FOR UPDATE USING ((SELECT auth.uid()) = host_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "properties_delete" ON properties FOR DELETE USING ((SELECT auth.uid()) = host_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- PROPERTY_AVAILABILITY
DROP POLICY IF EXISTS "Hosts can manage their own availability" ON property_availability;
DROP POLICY IF EXISTS "Public availability view" ON property_availability;
DROP POLICY IF EXISTS "property_availability: admin manage" ON property_availability;
DROP POLICY IF EXISTS "property_availability: owner manage" ON property_availability;
DROP POLICY IF EXISTS "property_availability: public read" ON property_availability;
CREATE POLICY "property_availability_select" ON property_availability FOR SELECT USING (true);
CREATE POLICY "property_availability_manage" ON property_availability FOR ALL USING (EXISTS (SELECT 1 FROM properties WHERE id = property_availability.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE id = property_availability.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- PROPERTY_ICAL_FEEDS
DROP POLICY IF EXISTS "Hosts and Admins can manage ical feeds" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds: admin manage" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds: owner manage" ON property_ical_feeds;
CREATE POLICY "property_ical_feeds_manage" ON property_ical_feeds FOR ALL USING (EXISTS (SELECT 1 FROM properties WHERE id = property_ical_feeds.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin')) WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE id = property_ical_feeds.property_id AND host_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- REVIEWS
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "reviews: admin delete any" ON reviews;
DROP POLICY IF EXISTS "reviews: authenticated insert" ON reviews;
DROP POLICY IF EXISTS "reviews: public read" ON reviews;
DROP POLICY IF EXISTS "reviews: user delete own" ON reviews;
DROP POLICY IF EXISTS "reviews: user update own" ON reviews;
CREATE POLICY "reviews_select" ON reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "reviews_update" ON reviews FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "reviews_delete" ON reviews FOR DELETE USING ((SELECT auth.uid()) = user_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- SERVICE_EDITS
DROP POLICY IF EXISTS "Admins can delete service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can see all service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can update service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can view all service edits" ON service_edits;
DROP POLICY IF EXISTS "Hosts can create edits for own services" ON service_edits;
DROP POLICY IF EXISTS "Hosts can see their own service edits" ON service_edits;
DROP POLICY IF EXISTS "Hosts can view own service edits" ON service_edits;
DROP POLICY IF EXISTS "service_edits: admin update/delete" ON service_edits;
DROP POLICY IF EXISTS "service_edits: authenticated insert" ON service_edits;
DROP POLICY IF EXISTS "service_edits: provider read own" ON service_edits;
CREATE POLICY "service_edits_select" ON service_edits FOR SELECT USING (EXISTS (SELECT 1 FROM services WHERE id = service_edits.service_id AND provider_id = (SELECT auth.uid())) OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "service_edits_insert" ON service_edits FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM services WHERE id = service_edits.service_id AND provider_id = (SELECT auth.uid())));
CREATE POLICY "service_edits_update_admin" ON service_edits FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "service_edits_delete_admin" ON service_edits FOR DELETE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- SERVICE_MODELS
DROP POLICY IF EXISTS "Allow admin full access" ON service_models;
DROP POLICY IF EXISTS "Allow public read access" ON service_models;
DROP POLICY IF EXISTS "service_models: admin manage" ON service_models;
DROP POLICY IF EXISTS "service_models: public read" ON service_models;
CREATE POLICY "service_models_select" ON service_models FOR SELECT USING (true);
CREATE POLICY "service_models_insert_admin" ON service_models FOR INSERT WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "service_models_update_admin" ON service_models FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "service_models_delete_admin" ON service_models FOR DELETE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- SERVICES
DROP POLICY IF EXISTS "Admin All Services" ON services;
DROP POLICY IF EXISTS "Admins can delete any service" ON services;
DROP POLICY IF EXISTS "Admins can update any service" ON services;
DROP POLICY IF EXISTS "Authenticated users can create services" ON services;
DROP POLICY IF EXISTS "Providers can update their own services" ON services;
DROP POLICY IF EXISTS "Public view" ON services;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "services: admin delete" ON services;
DROP POLICY IF EXISTS "services: admin full select" ON services;
DROP POLICY IF EXISTS "services: admin update any" ON services;
DROP POLICY IF EXISTS "services: authenticated insert" ON services;
DROP POLICY IF EXISTS "services: provider delete own" ON services;
DROP POLICY IF EXISTS "services: provider read own" ON services;
DROP POLICY IF EXISTS "services: provider update own" ON services;
DROP POLICY IF EXISTS "services: public read approved" ON services;
CREATE POLICY "services_select" ON services FOR SELECT USING (status = 'approved' OR (SELECT auth.uid()) = provider_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "services_insert" ON services FOR INSERT WITH CHECK ((SELECT auth.uid()) = provider_id AND status = 'pending');
CREATE POLICY "services_update" ON services FOR UPDATE USING ((SELECT auth.uid()) = provider_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));
CREATE POLICY "services_delete" ON services FOR DELETE USING ((SELECT auth.uid()) = provider_id OR (SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- TICKETS
DROP POLICY IF EXISTS "Users manage own tickets" ON tickets;
CREATE POLICY "tickets_select" ON tickets FOR SELECT USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "tickets_insert" ON tickets FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);
CREATE POLICY "tickets_update" ON tickets FOR UPDATE USING ((SELECT auth.uid()) = user_id);
CREATE POLICY "tickets_delete" ON tickets FOR DELETE USING ((SELECT auth.uid()) = user_id);
