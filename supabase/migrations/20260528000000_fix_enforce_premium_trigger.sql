-- Fix enforce_premium_admin_only trigger to allow service_role bypass
-- Service role (used by Edge Functions/webhooks) has no profile row, so auth.uid() admin check fails.
-- This unblocks webhook-driven tier upgrades on subscription creation/cancellation.

CREATE OR REPLACE FUNCTION enforce_premium_admin_only()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.is_premium = true AND OLD.is_premium = false) OR
       (NEW.tier IS DISTINCT FROM OLD.tier AND NEW.tier != 'explorer') THEN
        -- Allow service_role (Edge Functions using service key)
        IF (SELECT auth.role()) = 'service_role' THEN
            RETURN NEW;
        END IF;
        -- Allow admin users
        IF NOT EXISTS (
            SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Only admins can set premium or non-explorer tier';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;