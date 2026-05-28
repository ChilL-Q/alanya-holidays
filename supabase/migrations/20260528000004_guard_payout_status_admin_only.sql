-- Purpose: Enforce that payout_status on bookings can only be changed by admins.
-- The client-side check in updatePayoutStatus() is insufficient — any authenticated
-- user can bypass it with a direct Supabase JS call on a row they own.
-- This trigger enforces the constraint at the DB level regardless of call origin.

CREATE OR REPLACE FUNCTION public.check_payout_status_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.payout_status IS DISTINCT FROM OLD.payout_status THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Unauthorized: payout_status can only be changed by admins';
        END IF;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER bookings_payout_status_guard
    BEFORE UPDATE ON public.bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.check_payout_status_update();
