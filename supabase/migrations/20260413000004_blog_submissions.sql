-- Migration: 20260413000004_blog_submissions
-- Purpose: Create blog_submissions table for user-submitted blog posts awaiting payment + moderation
-- Task: [88] Блог — заявки от пользователей + оплата $5

-- ============================================================
-- 1. CREATE blog_submissions table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.blog_submissions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    video_url TEXT,
    media_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending_payment' CHECK (status IN ('pending_payment', 'pending_review', 'approved', 'rejected')),
    stripe_session_id TEXT UNIQUE,
    payment_expires_at TIMESTAMPTZ,
    payment_status TEXT DEFAULT 'unpaid',
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_blog_submissions_user_id ON public.blog_submissions (user_id);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_status ON public.blog_submissions (status);
CREATE INDEX IF NOT EXISTS idx_blog_submissions_stripe_session ON public.blog_submissions (stripe_session_id) WHERE stripe_session_id IS NOT NULL;

-- ============================================================
-- 3. ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE public.blog_submissions ENABLE ROW LEVEL SECURITY;

-- SELECT: users can see their own submissions
CREATE POLICY "blog_submissions_select_own" ON public.blog_submissions
    FOR SELECT
    USING (user_id = (SELECT auth.uid()));

-- SELECT: admin can see all submissions
CREATE POLICY "blog_submissions_select_admin" ON public.blog_submissions
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- INSERT: authenticated users can create submissions (user_id forced in API layer)
CREATE POLICY "blog_submissions_insert" ON public.blog_submissions
    FOR INSERT
    WITH CHECK ((SELECT auth.role()) = 'authenticated');

-- UPDATE: users can update their own submissions only while pending_payment
CREATE POLICY "blog_submissions_update" ON public.blog_submissions
    FOR UPDATE
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );

-- DELETE: users can delete their own submissions; admin can delete any
CREATE POLICY "blog_submissions_delete" ON public.blog_submissions
    FOR DELETE
    USING (
        user_id = (SELECT auth.uid())
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        )
    );
