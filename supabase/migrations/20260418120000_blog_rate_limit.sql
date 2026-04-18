-- Migration: 20260418120000_blog_rate_limit
-- Purpose: Implement daily rate limit for blog submissions [A2-L1]

CREATE OR REPLACE FUNCTION public.check_blog_submission_limit(p_user_id UUID, p_limit INTEGER DEFAULT 5)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT count(*) INTO v_count
    FROM public.blog_submissions
    WHERE user_id = p_user_id
      AND created_at > now() - INTERVAL '24 hours';

    RETURN v_count < p_limit;
END;
$$;

-- Allow authenticated users to check their own limit
GRANT EXECUTE ON FUNCTION public.check_blog_submission_limit(UUID, INTEGER) TO authenticated;
