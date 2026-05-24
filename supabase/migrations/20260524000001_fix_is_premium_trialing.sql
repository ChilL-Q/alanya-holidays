-- Fix is_premium() to include trialing subscriptions so trial users can access premium features
CREATE OR REPLACE FUNCTION public.is_premium(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    exists_result BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.premium_subscriptions
        WHERE user_id = p_user_id
          AND (status = 'active' OR status = 'trialing')
          AND current_period_end > NOW()
    ) INTO exists_result;

    RETURN COALESCE(exists_result, FALSE);
END;
$$;

-- Re-apply grants (idempotent)
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;
