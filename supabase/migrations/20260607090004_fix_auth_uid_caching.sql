-- Optimize RLS policies: replace bare auth.uid() with (SELECT auth.uid())
-- for query plan caching. Bare auth.uid() is evaluated per-row;
-- wrapping in a subquery allows PostgreSQL to evaluate it once per query.
-- See: DB_FIXES.md Fix #7

-- ============================================================
-- listing_votes (3 policies)
-- ============================================================

DROP POLICY "listing_votes_insert" ON public.listing_votes;
CREATE POLICY "listing_votes_insert" ON public.listing_votes
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

DROP POLICY "listing_votes_update" ON public.listing_votes;
CREATE POLICY "listing_votes_update" ON public.listing_votes
  FOR UPDATE USING ((SELECT auth.uid()) = user_id);

DROP POLICY "listing_votes_delete" ON public.listing_votes;
CREATE POLICY "listing_votes_delete" ON public.listing_votes
  FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- lawyer_contacts (1 policy - admin SELECT)
-- ============================================================

DROP POLICY "Admin can read lawyer contacts" ON public.lawyer_contacts;
CREATE POLICY "Admin can read lawyer contacts" ON public.lawyer_contacts
  FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ============================================================
-- premium_subscriptions (1 policy)
-- ============================================================

DROP POLICY "Users can view their own subscription" ON public.premium_subscriptions;
CREATE POLICY "Users can view their own subscription" ON public.premium_subscriptions
  FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- ============================================================
-- notifications (1 policy)
-- ============================================================

DROP POLICY "notifications_insert_secure" ON public.notifications;
CREATE POLICY "notifications_insert_secure" ON public.notifications
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

-- ============================================================
-- audit_logs (1 policy)
-- ============================================================

DROP POLICY "audit_logs_insert_user" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_user" ON public.audit_logs
  FOR INSERT WITH CHECK (user_id = (SELECT auth.uid()) OR user_id IS NULL);

-- ============================================================
-- blog_submissions (2 policies)
-- ============================================================

DROP POLICY "blog_submissions_update_secure" ON public.blog_submissions;
CREATE POLICY "blog_submissions_update_secure" ON public.blog_submissions
  FOR UPDATE USING (user_id = (SELECT auth.uid()) AND status = 'pending_payment');

DROP POLICY "blog_submissions_insert_secure" ON public.blog_submissions;
CREATE POLICY "blog_submissions_insert_secure" ON public.blog_submissions
  FOR INSERT WITH CHECK (
    (SELECT auth.role()) = 'authenticated' AND user_id = (SELECT auth.uid())
  );

-- ============================================================
-- locations (1 policy)
-- ============================================================

DROP POLICY "locations_admin_all" ON public.locations;
CREATE POLICY "locations_admin_all" ON public.locations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
  );

-- ============================================================
-- saved_itineraries (1 policy)
-- ============================================================

DROP POLICY "owner_all" ON public.saved_itineraries;
CREATE POLICY "owner_all" ON public.saved_itineraries
  FOR ALL USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- listing_locations (3 policies)
-- ============================================================

DROP POLICY "listing_locations_insert_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_insert_owner" ON public.listing_locations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_locations.listing_id
        AND dl.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY "listing_locations_delete_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_delete_owner" ON public.listing_locations
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_locations.listing_id
        AND dl.owner_user_id = (SELECT auth.uid())
    )
  );

DROP POLICY "listing_locations_update_owner" ON public.listing_locations;
CREATE POLICY "listing_locations_update_owner" ON public.listing_locations
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_locations.listing_id
        AND dl.owner_user_id = (SELECT auth.uid())
    )
  ) WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_locations.listing_id
        AND dl.owner_user_id = (SELECT auth.uid())
    )
  );

-- ============================================================
-- listing_reviews (3 policies)
-- ============================================================

DROP POLICY "listing_reviews_select" ON public.listing_reviews;
CREATE POLICY "listing_reviews_select" ON public.listing_reviews
  FOR SELECT USING (status = 'approved' OR user_id = (SELECT auth.uid()));

DROP POLICY "listing_reviews_insert" ON public.listing_reviews;
CREATE POLICY "listing_reviews_insert" ON public.listing_reviews
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'pending');

DROP POLICY "listing_reviews_delete" ON public.listing_reviews;
CREATE POLICY "listing_reviews_delete" ON public.listing_reviews
  FOR DELETE USING ((SELECT public.is_admin()) OR user_id = (SELECT auth.uid()));

-- ============================================================
-- listing_analytics (1 policy)
-- ============================================================

DROP POLICY "listing_analytics: owner read" ON public.listing_analytics;
CREATE POLICY "listing_analytics: owner read" ON public.listing_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.directory_listings dl
      WHERE dl.id = listing_analytics.listing_id
        AND dl.owner_user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (SELECT auth.uid()) AND role = 'admin'
    )
  );