-- Migration: 20260418140000_harden_rls_batch_3_high
-- Purpose: Address A3-H1 to A3-H4 high-priority security issues [Batch 3]
-- Security Notes:
-- - A3-H1: Restrict notifications INSERT to own user_id or admin.
-- - A3-H2: Restrict audit_logs SELECT to admin, INSERT to own user_id or NULL.
-- - A3-H3: Restrict blog_submissions UPDATE to pending_payment only for owners.
-- - A3-H4: Update premium and consultant policies to use public.is_admin() helper.

-- ============================================================================
-- 1. Notifications Hardening (A3-H1)
-- ============================================================================
DROP POLICY IF EXISTS "notifications_insert" ON public.notifications;
CREATE POLICY "notifications_insert_secure" ON public.notifications
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR public.is_admin());

-- ============================================================================
-- 2. Audit Logs Hardening (A3-H2)
-- ============================================================================
-- Drop legacy policies from setup_audit_logs.sql
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
-- Drop any existing names from failed/previous attempts
DROP POLICY IF EXISTS "audit_logs_select_admin" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_auth" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_user" ON public.audit_logs;

CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
    FOR SELECT
    USING (public.is_admin());

CREATE POLICY "audit_logs_insert_user" ON public.audit_logs
    FOR INSERT
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- ============================================================================
-- 3. Blog Submissions Content Integrity (A3-H3)
-- ============================================================================
DROP POLICY IF EXISTS "blog_submissions_update" ON public.blog_submissions;
CREATE POLICY "blog_submissions_update_secure" ON public.blog_submissions
    FOR UPDATE
    USING (
        (user_id = auth.uid() AND status = 'pending_payment')
        OR public.is_admin()
    );

-- Tighten INSERT as defense-in-depth
DROP POLICY IF EXISTS "blog_submissions_insert" ON public.blog_submissions;
CREATE POLICY "blog_submissions_insert_secure" ON public.blog_submissions
    FOR INSERT
    WITH CHECK (
        (SELECT auth.role()) = 'authenticated'
        AND user_id = auth.uid()
    );

-- ============================================================================
-- 4. Consistency & Production Alignment (A3-H4)
-- ============================================================================
-- Update premium_subscriptions to use is_admin()
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.premium_subscriptions;
CREATE POLICY "premium_subscriptions_select_admin" ON public.premium_subscriptions
    FOR SELECT
    USING (public.is_admin());

-- Update consultant_profiles to use is_admin()
DROP POLICY IF EXISTS "Admin can manage all consultant profiles" ON public.consultant_profiles;
CREATE POLICY "consultant_profiles_all_admin" ON public.consultant_profiles
    FOR ALL
    USING (public.is_admin());
