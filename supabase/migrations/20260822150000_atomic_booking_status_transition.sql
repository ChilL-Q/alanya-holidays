-- Migration: 20260822150000_atomic_booking_status_transition.sql
-- Description: Atomic booking status transitions with row-level locking (SELECT ... FOR UPDATE) and calendar unblocking

CREATE OR REPLACE FUNCTION public.transition_booking_status(
    p_booking_id UUID,
    p_new_status TEXT,
    p_user_id UUID DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_payment_status TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_old_status TEXT;
    v_unblocked_count INTEGER := 0;
    v_allowed BOOLEAN := FALSE;
BEGIN
    -- 1. Acquire exclusive row-level lock on the target booking
    SELECT id, status, item_id, item_type, user_id, check_in, check_out, total_price, payment_status
    INTO v_booking
    FROM public.bookings
    WHERE id = p_booking_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'NOT_FOUND',
            'error', 'Booking not found'
        );
    END IF;

    v_old_status := v_booking.status;

    -- 2. Idempotency Check: if status already matches, return success without mutating
    IF v_old_status = p_new_status THEN
        RETURN jsonb_build_object(
            'success', TRUE,
            'code', 'IDEMPOTENT_NOOP',
            'data', jsonb_build_object(
                'id', v_booking.id,
                'old_status', v_old_status,
                'new_status', p_new_status,
                'unblocked_dates_count', 0,
                'item_id', v_booking.item_id,
                'item_type', v_booking.item_type,
                'user_id', v_booking.user_id,
                'check_in', v_booking.check_in,
                'check_out', v_booking.check_out,
                'total_price', v_booking.total_price
            )
        );
    END IF;

    -- 3. Strict State Machine Validation
    v_allowed := CASE
        WHEN v_old_status = 'pending' AND p_new_status IN ('confirmed', 'cancelled', 'rejected') THEN TRUE
        WHEN v_old_status = 'confirmed' AND p_new_status IN ('cancelled', 'completed') THEN TRUE
        WHEN v_old_status IN ('cancelled', 'rejected', 'completed') THEN FALSE
        ELSE FALSE
    END;

    IF NOT v_allowed THEN
        RETURN jsonb_build_object(
            'success', FALSE,
            'code', 'INVALID_STATUS_TRANSITION',
            'error', format('Invalid status transition from "%s" to "%s"', v_old_status, p_new_status)
        );
    END IF;

    -- 4. Atomic Date Management (Property Availability)
    IF p_new_status IN ('cancelled', 'rejected') AND v_booking.item_type = 'property' THEN
        DELETE FROM public.property_availability
        WHERE property_id = v_booking.item_id
          AND source = 'reservation'
          AND external_id = p_booking_id::text
          AND status = 'booked';

        GET DIAGNOSTICS v_unblocked_count = ROW_COUNT;
    END IF;

    -- 5. Atomic Booking Record Mutation
    UPDATE public.bookings
    SET status = p_new_status,
        payment_status = COALESCE(
            p_payment_status,
            CASE
                WHEN p_new_status = 'cancelled' AND payment_status = 'pending' THEN 'failed'
                ELSE payment_status
            END
        ),
        updated_at = NOW()
    WHERE id = p_booking_id;

    -- 6. Return Enriched Mutation Context for Downstream Events / Outbox
    RETURN jsonb_build_object(
        'success', TRUE,
        'code', 'TRANSITION_SUCCESS',
        'data', jsonb_build_object(
            'id', v_booking.id,
            'old_status', v_old_status,
            'new_status', p_new_status,
            'unblocked_dates_count', v_unblocked_count,
            'item_id', v_booking.item_id,
            'item_type', v_booking.item_type,
            'user_id', v_booking.user_id,
            'check_in', v_booking.check_in,
            'check_out', v_booking.check_out,
            'total_price', v_booking.total_price
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execution permissions
REVOKE EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT, UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transition_booking_status(UUID, TEXT, UUID, TEXT, TEXT) TO authenticated, service_role;
