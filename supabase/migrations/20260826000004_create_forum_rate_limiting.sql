-- Migration: 20260826000004_create_forum_rate_limiting
-- Purpose: Dedicated forum rate limiting table and atomic hourly RPC check

CREATE TABLE IF NOT EXISTS public.forum_rate_limits (
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    count INTEGER NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, action, window_start)
);

CREATE INDEX IF NOT EXISTS idx_forum_rate_limits_user ON public.forum_rate_limits (user_id, action, window_start DESC);

ALTER TABLE public.forum_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "forum_rate_limits_admin_select" ON public.forum_rate_limits;
CREATE POLICY "forum_rate_limits_admin_select" ON public.forum_rate_limits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid()) AND profiles.role = 'admin'
        )
    );

CREATE OR REPLACE FUNCTION public.check_forum_rate_limit(
    p_user_id UUID,
    p_action TEXT,
    p_limit INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_window TIMESTAMPTZ;
    v_count INTEGER;
BEGIN
    v_window := date_trunc('hour', NOW());

    -- Prune entries older than 24 hours to keep table compact
    DELETE FROM public.forum_rate_limits
    WHERE window_start < NOW() - INTERVAL '24 hours';

    INSERT INTO public.forum_rate_limits (user_id, action, window_start, count)
    VALUES (p_user_id, p_action, v_window, 1)
    ON CONFLICT (user_id, action, window_start)
    DO UPDATE SET count = forum_rate_limits.count + 1
    RETURNING count INTO v_count;

    RETURN v_count <= p_limit;
END;
$$;

REVOKE ALL ON FUNCTION public.check_forum_rate_limit(UUID, TEXT, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_forum_rate_limit(UUID, TEXT, INTEGER) TO authenticated, service_role;
