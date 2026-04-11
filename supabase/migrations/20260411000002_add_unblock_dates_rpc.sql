-- [78] Add RPC to unblock dates when a booking is cancelled/rejected
-- Centralizes the responsibility of releasing property_availability rows.
-- Both the cancel-expired-bookings Edge Function and updateBookingStatus API
-- should call this to avoid duplicating SQL logic (DRY).

CREATE OR REPLACE FUNCTION public.unblock_dates_for_booking(
    p_booking_id UUID
) RETURNS JSONB AS $$
DECLARE
    v_booking RECORD;
    v_deleted_count INTEGER;
BEGIN
    -- Fetch the booking to verify it exists and is in a cancelled/rejected state
    SELECT id, status, item_id, item_type
    INTO v_booking
    FROM bookings
    WHERE id = p_booking_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('error', 'Booking not found');
    END IF;

    -- Only unblock if the booking is cancelled or rejected
    IF v_booking.status NOT IN ('cancelled', 'rejected') THEN
        RETURN jsonb_build_object('error', 'Cannot unblock dates for a booking that is not cancelled or rejected');
    END IF;

    -- Only unblock for properties (services/products don't manage calendar dates)
    IF v_booking.item_type != 'property' THEN
        RETURN jsonb_build_object('data', jsonb_build_object('unblocked', 0, 'message', 'Not a property booking'));
    END IF;

    -- Delete the availability rows that were reserved by this booking
    DELETE FROM property_availability
    WHERE property_id = v_booking.item_id
      AND source = 'reservation'
      AND external_id = p_booking_id::text
      AND status = 'booked';

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'data', jsonb_build_object(
            'unblocked', v_deleted_count,
            'property_id', v_booking.item_id,
            'message', format('Released %d blocked date(s)', v_deleted_count)
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
