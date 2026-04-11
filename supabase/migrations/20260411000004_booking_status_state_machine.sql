-- [81] Booking state machine — enforce valid status transitions at the DB level
-- Prevents illegal transitions like cancelled→confirmed or rejected→confirmed
-- via direct Supabase SDK calls or manual SQL.

-- Valid transitions:
--   pending    → confirmed, cancelled, rejected
--   confirmed  → cancelled, completed
--   cancelled  → (terminal)
--   rejected   → (terminal)
--   completed  → (terminal)

CREATE OR REPLACE FUNCTION public.validate_booking_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_allowed BOOLEAN;
BEGIN
    v_old_status := OLD.status;
    v_new_status := NEW.status;

    -- No transition if status hasn't changed
    IF v_old_status IS NOT DISTINCT FROM v_new_status THEN
        RETURN NEW;
    END IF;

    -- Determine if this transition is allowed
    v_allowed := CASE
        -- From pending: can go to confirmed, cancelled, or rejected
        WHEN v_old_status = 'pending' AND v_new_status IN ('confirmed', 'cancelled', 'rejected') THEN TRUE
        -- From confirmed: can go to cancelled or completed
        WHEN v_old_status = 'confirmed' AND v_new_status IN ('cancelled', 'completed') THEN TRUE
        -- From cancelled: no transitions allowed (terminal state)
        WHEN v_old_status = 'cancelled' THEN FALSE
        -- From rejected: no transitions allowed (terminal state)
        WHEN v_old_status = 'rejected' THEN FALSE
        -- From completed: no transitions allowed (terminal state)
        WHEN v_old_status = 'completed' THEN FALSE
        -- Unknown old status: deny by default
        ELSE FALSE
    END;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Invalid booking status transition: % → %', v_old_status, v_new_status
            USING ERRCODE = 'check_violation',
                  DETAIL = format('Transition from "%s" to "%s" is not allowed.', v_old_status, v_new_status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if it exists (idempotent)
DROP TRIGGER IF EXISTS trg_validate_booking_status_transition ON bookings;

-- Create the trigger — fires BEFORE every UPDATE on bookings
CREATE TRIGGER trg_validate_booking_status_transition
    BEFORE UPDATE OF status ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_booking_status_transition();
