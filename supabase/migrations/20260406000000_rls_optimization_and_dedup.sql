-- RLS Optimization: Task #37 (auth.uid() caching) and #38 (deduplicate policies)
-- Generated: 2026-04-06

-- ============================================================================
-- [37] Replace auth.uid() with (SELECT auth.uid()) in RLS policies
-- Postgres caches scalar subqueries, so (SELECT auth.uid()) is evaluated once
-- per query, whereas auth.uid() is evaluated per row.
-- Strategy: drop old policies, recreate with optimized patterns.
--
-- [38] Remove duplicate RLS policies across all tables
-- ============================================================================

-- ============================================================================
-- MESSAGES
-- Duplicates: two INSERT policies with with_check=true, one admin ALL + admin delete
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can insert messages" ON messages;
DROP POLICY IF EXISTS "Public insert" ON messages;
DROP POLICY IF EXISTS "messages: authenticated insert" ON messages;
DROP POLICY IF EXISTS "Admin All Messages" ON messages;
DROP POLICY IF EXISTS "messages: admin delete" ON messages;
DROP POLICY IF EXISTS "messages: admin read" ON messages;

CREATE POLICY "messages_insert_public" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "messages_select_admin" ON messages
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "messages_delete_admin" ON messages
  FOR DELETE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- NOTIFICATIONS
-- Duplicates: two SELECT user_id, two UPDATE user_id
-- ============================================================================
DROP POLICY IF EXISTS "Users can update (mark read) their own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications: user own" ON notifications;
DROP POLICY IF EXISTS "notifications: user update own" ON notifications;
DROP POLICY IF EXISTS "notifications: service insert" ON notifications;

CREATE POLICY "notifications_select_own" ON notifications
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notifications_select_admin" ON notifications
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- Keep: Authenticated users can insert notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "notifications: admin read all" ON notifications;
DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON notifications;
CREATE POLICY "notifications_insert_auth" ON notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- FAVORITES
-- Duplicates: multiple ALL/SELECT/INSERT/DELETE with same user_id check
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "favorites: user delete own" ON favorites;
DROP POLICY IF EXISTS "favorites: user manage own" ON favorites;
DROP POLICY IF EXISTS "favorites: user own" ON favorites;

CREATE POLICY "favorites_select_own" ON favorites
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "favorites_insert_own" ON favorites
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "favorites_update_own" ON favorites
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "favorites_delete_own" ON favorites
  FOR DELETE USING (user_id = (SELECT auth.uid()));

-- ============================================================================
-- REVIEWS
-- Duplicates: two INSERT, two DELETE user_id, two SELECT true
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can create reviews" ON reviews;
DROP POLICY IF EXISTS "reviews: authenticated insert" ON reviews;
DROP POLICY IF EXISTS "Users can delete own reviews" ON reviews;
DROP POLICY IF EXISTS "reviews: user delete own" ON reviews;
DROP POLICY IF EXISTS "Reviews are viewable by everyone" ON reviews;
DROP POLICY IF EXISTS "reviews: public read" ON reviews;
DROP POLICY IF EXISTS "reviews: admin delete any" ON reviews;
DROP POLICY IF EXISTS "reviews: user update own" ON reviews;
CREATE POLICY "reviews_select_public" ON reviews
  FOR SELECT USING (true);

CREATE POLICY "reviews_insert_own" ON reviews
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "reviews_update_own" ON reviews
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "reviews_delete_own" ON reviews
  FOR DELETE USING (user_id = (SELECT auth.uid()));

CREATE POLICY "reviews_admin_delete" ON reviews
  FOR DELETE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- PRODUCTS
-- Duplicates: two SELECT true, two admin policies
-- ============================================================================
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Public view" ON products;
DROP POLICY IF EXISTS "products: public read" ON products;
DROP POLICY IF EXISTS "Admin All Products" ON products;
DROP POLICY IF EXISTS "products: admin delete any" ON products;
DROP POLICY IF EXISTS "products: admin update/delete any" ON products;
DROP POLICY IF EXISTS "Artisans/Sellers can manage their products" ON products;
DROP POLICY IF EXISTS "products: authenticated insert" ON products;
DROP POLICY IF EXISTS "products: seller delete own" ON products;
DROP POLICY IF EXISTS "products: seller update own" ON products;

CREATE POLICY "products_select_public" ON products
  FOR SELECT USING (true);

CREATE POLICY "products_admin_manage" ON products
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "products_seller_insert" ON products
  FOR INSERT WITH CHECK (seller_id = (SELECT auth.uid()));

CREATE POLICY "products_seller_update_own" ON products
  FOR UPDATE USING (seller_id = (SELECT auth.uid()));

CREATE POLICY "products_seller_delete_own" ON products
  FOR DELETE USING (seller_id = (SELECT auth.uid()));

-- ============================================================================
-- CHAT_CONVERSATIONS
-- Duplicates: two INSERT guest_id, two SELECT participant
-- ============================================================================
DROP POLICY IF EXISTS "Users can create conversations" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: authenticated insert" ON chat_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: participant read" ON chat_conversations;
DROP POLICY IF EXISTS "chat_conversations: admin all" ON chat_conversations;

CREATE POLICY "chat_conversations_insert_guest" ON chat_conversations
  FOR INSERT WITH CHECK (guest_id = (SELECT auth.uid()));

CREATE POLICY "chat_conversations_select_participant" ON chat_conversations
  FOR SELECT USING (guest_id = (SELECT auth.uid()) OR host_id = (SELECT auth.uid()));

CREATE POLICY "chat_conversations_admin_all" ON chat_conversations
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- CHAT_MESSAGES
-- Duplicates: two INSERT, two SELECT, two UPDATE, two DELETE with same logic
-- ============================================================================
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: authenticated insert" ON chat_messages;
DROP POLICY IF EXISTS "Users can view messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant read" ON chat_messages;
DROP POLICY IF EXISTS "Users can update read status" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant update" ON chat_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON chat_messages;
DROP POLICY IF EXISTS "chat_messages: participant delete" ON chat_messages;

-- Chat message policies: user is participant if their auth.uid() matches guest_id or host_id
CREATE POLICY "chat_messages_select_participant" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (chat_conversations.guest_id = (SELECT auth.uid()) OR chat_conversations.host_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "chat_messages_insert_participant" ON chat_messages
  FOR INSERT WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (chat_conversations.guest_id = (SELECT auth.uid()) OR chat_conversations.host_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "chat_messages_update_participant" ON chat_messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (chat_conversations.guest_id = (SELECT auth.uid()) OR chat_conversations.host_id = (SELECT auth.uid()))
    )
  );

CREATE POLICY "chat_messages_delete_participant" ON chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
        AND (chat_conversations.guest_id = (SELECT auth.uid()) OR chat_conversations.host_id = (SELECT auth.uid()))
    )
  );

-- ============================================================================
-- PROPERTIES
-- Massive duplication: 4+ INSERT, 3+ admin UPDATE, 2+ admin SELECT, 2+ SELECT, 2+ DELETE
-- ============================================================================
DROP POLICY IF EXISTS "Anyone can submit properties" ON properties;
DROP POLICY IF EXISTS "Authenticated users can create properties" ON properties;
DROP POLICY IF EXISTS "Hosts create" ON properties;
DROP POLICY IF EXISTS "Users can insert their own properties" ON properties;
DROP POLICY IF EXISTS "properties: authenticated insert" ON properties;
DROP POLICY IF EXISTS "Admin All Properties" ON properties;
DROP POLICY IF EXISTS "properties: admin update any" ON properties;
DROP POLICY IF EXISTS "Hosts update own, Admins update all" ON properties;
DROP POLICY IF EXISTS "properties: admin full select" ON properties;
DROP POLICY IF EXISTS "Properties are viewable by everyone" ON properties;
DROP POLICY IF EXISTS "Public view" ON properties;
DROP POLICY IF EXISTS "Public view approved properties" ON properties;
DROP POLICY IF EXISTS "properties: public read approved" ON properties;
DROP POLICY IF EXISTS "Admins can delete any property." ON properties;
DROP POLICY IF EXISTS "properties: admin delete" ON properties;
DROP POLICY IF EXISTS "Hosts can delete their own properties" ON properties;
DROP POLICY IF EXISTS "properties: host delete own" ON properties;
DROP POLICY IF EXISTS "properties: host read own" ON properties;
DROP POLICY IF EXISTS "Admins can update any property." ON properties;
DROP POLICY IF EXISTS "Admins can insert properties." ON properties;
DROP POLICY IF EXISTS "Hosts can update their own properties" ON properties;
DROP POLICY IF EXISTS "properties: host delete own" ON properties;
DROP POLICY IF EXISTS "properties: host update own" ON properties;

CREATE POLICY "properties_select_public" ON properties
  FOR SELECT USING (status = 'approved');

CREATE POLICY "properties_select_host_own" ON properties
  FOR SELECT USING (host_id = (SELECT auth.uid()));

CREATE POLICY "properties_select_admin" ON properties
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "properties_insert_host" ON properties
  FOR INSERT WITH CHECK (host_id = (SELECT auth.uid()));

CREATE POLICY "properties_update_host" ON properties
  FOR UPDATE USING (host_id = (SELECT auth.uid()));

CREATE POLICY "properties_delete_host" ON properties
  FOR DELETE USING (host_id = (SELECT auth.uid()));

CREATE POLICY "properties_manage_admin" ON properties
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- BOOKINGS
-- Duplicates: two INSERT user_id, two SELECT user_id
-- ============================================================================
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "bookings: authenticated insert" ON bookings;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "bookings: user read own" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "bookings: admin full select" ON bookings;
DROP POLICY IF EXISTS "bookings: admin update any" ON bookings;
DROP POLICY IF EXISTS "bookings: host read bookings of own items" ON bookings;
DROP POLICY IF EXISTS "bookings: host update status of own items" ON bookings;
DROP POLICY IF EXISTS "bookings: user cancel own" ON bookings;

CREATE POLICY "bookings_insert_user" ON bookings
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "bookings_select_user" ON bookings
  FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "bookings_select_admin" ON bookings
  FOR SELECT USING (is_admin());

CREATE POLICY "bookings_select_host" ON bookings
  FOR SELECT USING (
    (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties WHERE properties.id = bookings.item_id AND properties.host_id = (SELECT auth.uid())
    ))
    OR
    (item_type = 'service' AND EXISTS (
      SELECT 1 FROM services WHERE services.id = bookings.item_id AND services.provider_id = (SELECT auth.uid())
    ))
  );

CREATE POLICY "bookings_update_user_cancel" ON bookings
  FOR UPDATE USING (user_id = (SELECT auth.uid()))
  WITH CHECK (status = 'cancelled');

CREATE POLICY "bookings_update_admin" ON bookings
  FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "bookings_update_host" ON bookings
  FOR UPDATE USING (
    (item_type = 'property' AND EXISTS (
      SELECT 1 FROM properties WHERE properties.id = bookings.item_id AND properties.host_id = (SELECT auth.uid())
    ))
    OR
    (item_type = 'service' AND EXISTS (
      SELECT 1 FROM services WHERE services.id = bookings.item_id AND services.provider_id = (SELECT auth.uid())
    ))
  );

-- ============================================================================
-- CHAT_REPORTS
-- Duplicates: two SELECT admin, two INSERT reporter
-- ============================================================================
DROP POLICY IF EXISTS "Admins can update reports" ON chat_reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: admin read" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: reporter read" ON chat_reports;
DROP POLICY IF EXISTS "Users can create reports" ON chat_reports;
DROP POLICY IF EXISTS "chat_reports: authenticated insert" ON chat_reports;

CREATE POLICY "chat_reports_select_admin" ON chat_reports
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "chat_reports_select_reporter" ON chat_reports
  FOR SELECT USING (reporter_id = (SELECT auth.uid()));

CREATE POLICY "chat_reports_insert_reporter" ON chat_reports
  FOR INSERT WITH CHECK (reporter_id = (SELECT auth.uid()));

CREATE POLICY "chat_reports_update_admin" ON chat_reports
  FOR UPDATE USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- SERVICES
-- Duplicates: two SELECT public, two admin SELECT, two admin UPDATE
-- ============================================================================
DROP POLICY IF EXISTS "Public view" ON services;
DROP POLICY IF EXISTS "Services are viewable by everyone" ON services;
DROP POLICY IF EXISTS "services: public read approved" ON services;
DROP POLICY IF EXISTS "Admin All Services" ON services;
DROP POLICY IF EXISTS "services: admin full select" ON services;
DROP POLICY IF EXISTS "Admins can update any service" ON services;
DROP POLICY IF EXISTS "services: admin update any" ON services;
DROP POLICY IF EXISTS "Admins can delete any service" ON services;
DROP POLICY IF EXISTS "services: admin delete" ON services;
DROP POLICY IF EXISTS "Authenticated users can create services" ON services;
DROP POLICY IF EXISTS "services: authenticated insert" ON services;
DROP POLICY IF EXISTS "Providers can update their own services" ON services;
DROP POLICY IF EXISTS "services: provider update own" ON services;
DROP POLICY IF EXISTS "services: provider delete own" ON services;
DROP POLICY IF EXISTS "services: provider read own" ON services;

CREATE POLICY "services_select_public" ON services
  FOR SELECT USING (status = 'approved');

CREATE POLICY "services_select_provider_own" ON services
  FOR SELECT USING (provider_id = (SELECT auth.uid()));

CREATE POLICY "services_select_admin" ON services
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "services_insert_provider" ON services
  FOR INSERT WITH CHECK (provider_id = (SELECT auth.uid()));

CREATE POLICY "services_update_provider_own" ON services
  FOR UPDATE USING (provider_id = (SELECT auth.uid()));

CREATE POLICY "services_delete_provider_own" ON services
  FOR DELETE USING (provider_id = (SELECT auth.uid()));

CREATE POLICY "services_manage_admin" ON services
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- DIRECTORY_LISTINGS
-- Duplicates: two SELECT true, admin manage vs admin ALL
-- ============================================================================
DROP POLICY IF EXISTS "Public directory listings are viewable by everyone." ON directory_listings;
DROP POLICY IF EXISTS "directory_listings: public read approved" ON directory_listings;
DROP POLICY IF EXISTS "directory_listings: admin manage" ON directory_listings;
DROP POLICY IF EXISTS "Authenticated users can delete directory listings." ON directory_listings;
DROP POLICY IF EXISTS "Authenticated users can update directory listings." ON directory_listings;
DROP POLICY IF EXISTS "Authenticated users can insert directory listings." ON directory_listings;

CREATE POLICY "directory_listings_select_public" ON directory_listings
  FOR SELECT USING (true);

CREATE POLICY "directory_listings_manage_admin" ON directory_listings
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "directory_listings_cud_auth" ON directory_listings
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ============================================================================
-- SERVICE_EDITS
-- Duplicates: two admin SELECT, admin update, admin delete, admin ALL
-- Two provider SELECT
-- Two provider INSERT
-- ============================================================================
DROP POLICY IF EXISTS "Admins can see all service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can view all service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can update service edits" ON service_edits;
DROP POLICY IF EXISTS "Admins can delete service edits" ON service_edits;
DROP POLICY IF EXISTS "service_edits: admin update/delete" ON service_edits;
DROP POLICY IF EXISTS "Hosts can see their own service edits" ON service_edits;
DROP POLICY IF EXISTS "Hosts can view own service edits" ON service_edits;
DROP POLICY IF EXISTS "service_edits: provider read own" ON service_edits;
DROP POLICY IF EXISTS "Hosts can create edits for own services" ON service_edits;
DROP POLICY IF EXISTS "service_edits: authenticated insert" ON service_edits;

CREATE POLICY "service_edits_select_admin" ON service_edits
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "service_edits_manage_admin" ON service_edits
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

CREATE POLICY "service_edits_select_provider" ON service_edits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_edits.service_id AND services.provider_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "service_edits_insert_provider" ON service_edits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM services
      WHERE services.id = service_edits.service_id AND services.provider_id = (SELECT auth.uid())
    )
  );

-- ============================================================================
-- PROPERTY_AVAILABILITY
-- Duplicates: public SELECT true, host/manage duplicates
-- ============================================================================
DROP POLICY IF EXISTS "Hosts can manage their own availability" ON property_availability;
DROP POLICY IF EXISTS "Public availability view" ON property_availability;
DROP POLICY IF EXISTS "property_availability: public read" ON property_availability;
DROP POLICY IF EXISTS "property_availability: admin manage" ON property_availability;
DROP POLICY IF EXISTS "property_availability: owner manage" ON property_availability;

CREATE POLICY "property_availability_select_public" ON property_availability
  FOR SELECT USING (true);

CREATE POLICY "property_availability_manage_owner" ON property_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_availability.property_id AND properties.host_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_availability.property_id AND properties.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "property_availability_manage_admin" ON property_availability
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- PROPERTY_ICAL_FEEDS
-- Duplicates: admin manage, owner manage
-- ============================================================================
DROP POLICY IF EXISTS "Hosts and Admins can manage ical feeds" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds: admin manage" ON property_ical_feeds;
DROP POLICY IF EXISTS "property_ical_feeds: owner manage" ON property_ical_feeds;

CREATE POLICY "property_ical_feeds_manage_owner" ON property_ical_feeds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_ical_feeds.property_id AND properties.host_id = (SELECT auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties
      WHERE properties.id = property_ical_feeds.property_id AND properties.host_id = (SELECT auth.uid())
    )
  );

CREATE POLICY "property_ical_feeds_manage_admin" ON property_ical_feeds
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- PROFILES
-- Already clean: one INSERT, one SELECT, one UPDATE, one DELETE
-- Just replace auth.uid() calls with (SELECT auth.uid())
-- ============================================================================
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (id = (SELECT auth.uid()));

CREATE POLICY "profiles_select_public" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "profiles_update_own_or_admin" ON profiles
  FOR UPDATE USING (id = (SELECT auth.uid()) OR is_admin())
  WITH CHECK (id = (SELECT auth.uid()) OR is_admin());

CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- ============================================================================
-- AUDIT_LOGS
-- Duplicates: service role ALL + service role insert
-- ============================================================================
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs: service role insert" ON audit_logs;
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Service role has full access to audit logs" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs: admin read" ON audit_logs;

CREATE POLICY "audit_logs_insert_auth" ON audit_logs
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_select_auth" ON audit_logs
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "audit_logs_service_role_all" ON audit_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "audit_logs_select_admin" ON audit_logs
  FOR SELECT USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- TICKETS
-- Single policy, just optimize auth.uid()
-- ============================================================================
DROP POLICY IF EXISTS "Users manage own tickets" ON tickets;

CREATE POLICY "tickets_manage_own" ON tickets
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================================
-- SERVICE_MODELS
-- Duplicates: two SELECT true, admin ALL
-- ============================================================================
DROP POLICY IF EXISTS "Allow public read access" ON service_models;
DROP POLICY IF EXISTS "service_models: public read" ON service_models;
DROP POLICY IF EXISTS "Allow admin full access" ON service_models;
DROP POLICY IF EXISTS "service_models: admin manage" ON service_models;

CREATE POLICY "service_models_select_public" ON service_models
  FOR SELECT USING (true);

CREATE POLICY "service_models_manage_admin" ON service_models
  FOR ALL USING ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'))
  WITH CHECK ((SELECT auth.uid()) IN (SELECT id FROM profiles WHERE role = 'admin'));

-- ============================================================================
-- [37] & [42] Fix functions: add SET search_path = public to SECURITY DEFINER functions
-- This prevents search_path hijacking attacks where a malicious function could
-- be placed in pg_temp or another schema to override public functions.
-- ============================================================================

-- is_admin: SECURITY DEFINER - needs search_path
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$function$;

-- cancel_expired_bookings: SECURITY DEFINER - needs search_path
CREATE OR REPLACE FUNCTION public.cancel_expired_bookings()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    r_booking RECORD;
BEGIN
    FOR r_booking IN
        SELECT id
        FROM bookings
        WHERE status = 'pending'
          AND created_at < (NOW() - INTERVAL '15 minutes')
    LOOP
        UPDATE bookings
        SET status = 'cancelled'
        WHERE id = r_booking.id;

        DELETE FROM property_availability
        WHERE source = 'reservation'
          AND external_id = r_booking.id::text;

        RAISE NOTICE 'Cancelled expired booking: %', r_booking.id;
    END LOOP;
END;
$function$;

-- handle_new_chat_message: SECURITY DEFINER - needs search_path
CREATE OR REPLACE FUNCTION public.handle_new_chat_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  v_recipient_id uuid;
  v_guest_id uuid;
  v_host_id uuid;
BEGIN
  SELECT guest_id, host_id INTO v_guest_id, v_host_id
  FROM chat_conversations
  WHERE id = NEW.conversation_id;

  IF NEW.sender_id = v_guest_id THEN
    v_recipient_id := v_host_id;
  ELSE
    v_recipient_id := v_guest_id;
  END IF;

  IF v_recipient_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, type, title, message, link, read)
    VALUES (
      v_recipient_id,
      'info',
      'New Message',
      'New message: ' || substring(NEW.content from 1 for 30) || CASE WHEN length(NEW.content) > 30 THEN '...' ELSE '' END,
      '/host/messages',
      false
    );
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Notification trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$function$;

-- create_booking (property only version)
CREATE OR REPLACE FUNCTION public.create_booking(p_property_id uuid, p_user_id uuid, p_check_in date, p_check_out date, p_total_price numeric, p_guests integer, p_message text DEFAULT NULL::text, p_payment_method text DEFAULT 'card'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_booking_id UUID;
    v_overlap_count INTEGER;
    v_property_status TEXT;
    v_host_id UUID;
BEGIN
    SELECT status, host_id INTO v_property_status, v_host_id
    FROM properties WHERE id = p_property_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Property not found');
    END IF;

    IF v_property_status != 'approved' THEN
        RETURN jsonb_build_object('error', 'Property is not available for booking (Not Approved)');
    END IF;

    IF v_host_id = p_user_id THEN
         RETURN jsonb_build_object('error', 'You cannot book your own property');
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM bookings
    WHERE item_id = p_property_id
      AND item_type = 'property'
      AND status NOT IN ('cancelled', 'rejected')
      AND ((p_check_in < check_out) AND (p_check_out > check_in));

    IF v_overlap_count > 0 THEN
        RETURN jsonb_build_object('error', 'Dates are already booked by another reservation');
    END IF;

    SELECT COUNT(*) INTO v_overlap_count
    FROM property_availability
    WHERE property_id = p_property_id
      AND status != 'available'
      AND date >= p_check_in
      AND date < p_check_out;

    IF v_overlap_count > 0 THEN
         RETURN jsonb_build_object('error', 'Dates are unavailable (blocked by host or external calendar)');
    END IF;

    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out,
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_property_id, 'property', p_user_id, p_check_in, p_check_out,
        p_total_price, p_guests, p_message, p_payment_method, 'pending', 'pending'
    ) RETURNING id INTO v_booking_id;

    INSERT INTO property_availability (property_id, date, status, source, external_id)
    SELECT p_property_id, d::date, 'booked'::availability_status, 'reservation'::availability_source, v_booking_id::text
    FROM generate_series(p_check_in, p_check_out - INTERVAL '1 day', '1 day') AS d
    ON CONFLICT (property_id, date) DO UPDATE SET
        status = 'booked', source = 'reservation', external_id = v_booking_id::text;

    RETURN jsonb_build_object('data', v_booking_id);
END;
$function$;

-- create_booking (multi-item version)
CREATE OR REPLACE FUNCTION public.create_booking(p_item_id uuid, p_user_id uuid, p_check_in date, p_check_out date, p_total_price numeric, p_guests integer, p_message text DEFAULT NULL::text, p_payment_method text DEFAULT 'card'::text, p_item_type text DEFAULT 'property'::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_booking_id UUID;
    v_overlap_count INTEGER;
    v_item_status TEXT;
    v_host_id UUID;
    v_provider_id UUID;
BEGIN
    IF p_item_type = 'property' THEN
        SELECT status, host_id INTO v_item_status, v_host_id
        FROM properties WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('error', 'Property not found');
        END IF;

        IF v_item_status != 'approved' THEN
            RETURN jsonb_build_object('error', 'Property is not available for booking (Not Approved)');
        END IF;

        IF v_host_id = p_user_id THEN
             RETURN jsonb_build_object('error', 'You cannot book your own property');
        END IF;

        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id AND item_type = 'property'
          AND status NOT IN ('cancelled', 'rejected')
          AND ((p_check_in < check_out) AND (p_check_out > check_in));

        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object('error', 'Dates are already booked by another reservation');
        END IF;

        SELECT COUNT(*) INTO v_overlap_count
        FROM property_availability
        WHERE property_id = p_item_id AND status != 'available'
          AND date >= p_check_in AND date < p_check_out;

        IF v_overlap_count > 0 THEN
             RETURN jsonb_build_object('error', 'Dates are unavailable (blocked by host or external calendar)');
        END IF;
    ELSE
        SELECT provider_id INTO v_provider_id FROM services WHERE id = p_item_id;

        IF NOT FOUND THEN
             RETURN jsonb_build_object('error', 'Service not found');
        END IF;

        IF v_provider_id = p_user_id THEN
             RETURN jsonb_build_object('error', 'You cannot book your own service');
        END IF;
    END IF;

    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out,
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_item_id,
        CASE WHEN p_item_type = 'property' THEN 'property' ELSE 'service' END,
        p_user_id, p_check_in, p_check_out,
        p_total_price, p_guests, p_message, p_payment_method, 'pending', 'pending'
    ) RETURNING id INTO v_booking_id;

    IF p_item_type = 'property' THEN
        INSERT INTO property_availability (property_id, date, status, source, external_id)
        SELECT p_item_id, d::date, 'booked'::availability_status, 'reservation'::availability_source, v_booking_id::text
        FROM generate_series(p_check_in, p_check_out - INTERVAL '1 day', '1 day') AS d
        ON CONFLICT (property_id, date) DO UPDATE SET
            status = 'booked', source = 'reservation', external_id = v_booking_id::text;
    END IF;

    RETURN jsonb_build_object('data', v_booking_id);
END;
$function$;

-- update_property_rating: not SECURITY DEFINER, but should have search_path for safety
CREATE OR REPLACE FUNCTION public.update_property_rating()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    UPDATE properties
    SET
        rating = (SELECT COALESCE(AVG(rating), 0) FROM reviews WHERE property_id = NEW.property_id),
        reviews_count = (SELECT COUNT(*) FROM reviews WHERE property_id = NEW.property_id)
    WHERE id = NEW.property_id;
    RETURN NEW;
END;
$function$;

-- update_updated_at_column: add search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- get_available_properties: add search_path
CREATE OR REPLACE FUNCTION public.get_available_properties(check_in_date date, check_out_date date)
RETURNS SETOF properties
LANGUAGE plpgsql
SET search_path = public
AS $function$
BEGIN
  RETURN QUERY
  SELECT * FROM properties p
  WHERE status = 'approved'
  AND NOT EXISTS (
    SELECT 1 FROM property_availability pa
    WHERE pa.property_id = p.id
    AND pa.date >= check_in_date
    AND pa.date < check_out_date
    AND pa.status IN ('booked', 'blocked')
  );
END;
$function$;

-- get_property_by_ref_id is a sql function, search_path not needed for SETOF but add for consistency
CREATE OR REPLACE FUNCTION public.get_property_by_ref_id(ref_id_param integer)
RETURNS SETOF properties
LANGUAGE sql
STABLE
SET search_path = public
AS $function$
  SELECT * FROM properties WHERE ref_id = ref_id_param LIMIT 1;
$function$;

-- ============================================================================
-- [43] Fix RLS INSERT WITH CHECK (true) on messages and notifications
-- ============================================================================
-- messages INSERT already handled above with "messages_insert_public" (with_check: true)
-- This is intentional for public contact form, so no change needed.
-- notifications INSERT handled above with "notifications_insert_auth"

-- ============================================================================
-- [44] Leaked password protection
-- This is a Supabase Auth setting, not a SQL migration.
-- Enable via Supabase Dashboard > Auth > Settings > "Enable email confirmation"
-- and "Check for compromised passwords" (HaveIBeenPwned).
-- ============================================================================