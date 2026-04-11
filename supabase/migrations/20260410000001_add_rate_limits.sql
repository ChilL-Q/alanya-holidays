-- Rate limiting table for edge functions
CREATE TABLE IF NOT EXISTS rate_limits (
    user_id       UUID        NOT NULL,
    function_name TEXT        NOT NULL,
    window_start  TIMESTAMPTZ NOT NULL,
    request_count INTEGER     NOT NULL DEFAULT 1,
    PRIMARY KEY (user_id, function_name, window_start)
);

-- Atomically check and increment rate limit counter.
-- Returns TRUE if the request is within the allowed quota, FALSE if over limit.
-- Uses a 1-minute fixed window per user per function.
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_user_id       UUID,
    p_function_name TEXT,
    p_max_requests  INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_count  INTEGER;
    v_window TIMESTAMPTZ;
BEGIN
    v_window := date_trunc('minute', NOW());

    -- Prune windows older than 1 hour to prevent table bloat
    DELETE FROM rate_limits
    WHERE window_start < NOW() - INTERVAL '1 hour';

    -- Atomically upsert and read back the new count
    INSERT INTO rate_limits (user_id, function_name, window_start, request_count)
    VALUES (p_user_id, p_function_name, v_window, 1)
    ON CONFLICT (user_id, function_name, window_start)
    DO UPDATE SET request_count = rate_limits.request_count + 1
    RETURNING request_count INTO v_count;

    RETURN v_count <= p_max_requests;
END;
$$;

-- Only service role (used by edge functions) can access this table directly.
-- The check_rate_limit function itself is SECURITY DEFINER, so it bypasses RLS.
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
