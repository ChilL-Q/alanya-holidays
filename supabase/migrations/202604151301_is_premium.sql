-- Create function to check if user has active premium subscription
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
          AND status = 'active'
          AND current_period_end > NOW()
    ) INTO exists_result;

    RETURN COALESCE(exists_result, FALSE);
END;
$$;

-- Grant execute to authenticated users only (anon has no business checking premium status)
GRANT EXECUTE ON FUNCTION public.is_premium(UUID) TO authenticated;