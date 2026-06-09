-- Consolidate multiple permissive RLS policies into single OR-based policies
-- PostgreSQL evaluates ALL permissive policies per row, so 12 tables × 2+ policies = 86+ total evaluations per query
-- Consolidating reduces overhead while maintaining identical semantics
--
-- Pattern: DROP all existing policies for [table/operation], CREATE single policy with conditions joined by OR
-- Special case: if any policy is USING (true), the merged result is USING (true)

-- ============================================================
-- BATCH 1: Simple cases (public SELECT = true → stays true)
-- ============================================================

-- ===== forum_posts: 3 SELECT → 1 =====
DROP POLICY IF EXISTS "forum_posts_select_public" ON public.forum_posts;
DROP POLICY IF EXISTS "forum_posts_select_own" ON public.forum_posts;
DROP POLICY IF EXISTS "forum_posts_select_admin" ON public.forum_posts;

CREATE POLICY "forum_posts_select" ON public.forum_posts
    FOR SELECT USING (
        is_removed = false
        OR author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ===== forum_comments: 3 SELECT → 1 =====
DROP POLICY IF EXISTS "forum_comments_select_public" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_select_own" ON public.forum_comments;
DROP POLICY IF EXISTS "forum_comments_select_admin" ON public.forum_comments;

CREATE POLICY "forum_comments_select" ON public.forum_comments
    FOR SELECT USING (
        is_removed = false
        OR author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- BATCH 2: Medium complexity (owner + admin split patterns)
-- ============================================================

-- ===== blog_posts: 3 SELECT → 1 =====
DROP POLICY IF EXISTS "blog_posts_select_published" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_own" ON public.blog_posts;
DROP POLICY IF EXISTS "blog_posts_select_admin" ON public.blog_posts;

CREATE POLICY "blog_posts_select" ON public.blog_posts
    FOR SELECT USING (
        status = 'published'
        OR author_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ===== blog_submissions: 2 SELECT → 1 =====
DROP POLICY IF EXISTS "blog_submissions_select_own" ON public.blog_submissions;
DROP POLICY IF EXISTS "blog_submissions_select_admin" ON public.blog_submissions;

CREATE POLICY "blog_submissions_select" ON public.blog_submissions
    FOR SELECT USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ===== premium_subscriptions: 2 SELECT → 1 =====
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.premium_subscriptions;
DROP POLICY IF EXISTS "premium_subscriptions_select_admin" ON public.premium_subscriptions;

CREATE POLICY "premium_subscriptions_select" ON public.premium_subscriptions
    FOR SELECT USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (SELECT 1 FROM public.profiles WHERE id = (SELECT auth.uid()) AND role = 'admin')
    );

-- ============================================================
-- BATCH 3: Already consolidated (no action needed, documented for clarity)
-- ============================================================

-- directory_listings: 1 SELECT policy already consolidated
-- listing_locations: 1 SELECT + 1 ALL admin policy (admin is single comprehensive policy, not multiple)
-- listing_reviews: 1 SELECT policy already consolidated
-- notifications: 1 SELECT policy already consolidated (user + admin joined by OR)
