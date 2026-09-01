-- [59] Add check_booking_conflict RPC for pre-booking validation
-- This function allows checking for booking conflicts BEFORE attempting to create a booking
-- Prevents double-booking by checking existing reservations and availability blocks

CREATE OR REPLACE FUNCTION public.check_booking_conflict(
    p_item_id UUID,
    p_item_type TEXT,
    p_check_in DATE,
    p_check_out DATE
) RETURNS JSONB AS $$
DECLARE
    v_overlap_count INTEGER;
    v_item_status TEXT;
    v_host_id UUID;
    v_provider_id UUID;
BEGIN
    -- Validate date range
    IF p_check_in >= p_check_out THEN
        RETURN jsonb_build_object(
            'has_conflict', true,
            'conflict_type', 'invalid_dates',
            'message', 'Check-in date must be before check-out date'
        );
    END IF;

    -- Check based on item type
    IF p_item_type = 'property' THEN
        -- Property Validation
        SELECT status, host_id INTO v_item_status, v_host_id
        FROM properties
        WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'has_conflict', true,
                'conflict_type', 'property_not_found',
                'message', 'Property not found'
            );
        END IF;

        IF v_item_status != 'approved' THEN
            RETURN jsonb_build_object(
                'has_conflict', true,
                'conflict_type', 'property_unavailable',
                'message', 'Property is not available for booking'
            );
        END IF;

        -- Check for overlapping existing bookings
        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id
          AND item_type = 'property'
          AND status NOT IN ('cancelled', 'rejected')
          AND (
              (p_check_in < check_out) AND (p_check_out > check_in)
          );

        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object(
                'has_conflict', true,
                'conflict_type', 'dates_booked',
                'message', 'Dates are already booked by another reservation'
            );
        END IF;

        -- Check for availability blocks (Manual blocks or iCal imports)
        SELECT COUNT(*) INTO v_overlap_count
        FROM property_availability
        WHERE property_id = p_item_id
          AND status != 'available'
          AND date >= p_check_in
          AND date < p_check_out;

        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object(
                'has_conflict', true,
                'conflict_type', 'dates_unavailable',
                'message', 'Dates are unavailable (blocked by host or external calendar)'
            );
        END IF;

    ELSIF p_item_type = 'service' OR p_item_type = 'product' THEN
        -- Service/Product Validation
        SELECT provider_id INTO v_provider_id
        FROM services
        WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object(
                'has_conflict', true,
                'conflict_type', 'service_not_found',
                'message', 'Service not found'
            );
        END IF;

        -- Check for overlapping existing service bookings
        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id
          AND item_type = 'service'
          AND status NOT IN ('cancelled', 'rejected')
          AND (
              (p_check_in < check_out) AND (p_check_out > check_in)
          );

        -- For services, return warning but allow host to manually approve
        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object(
                'has_conflict', false,
                'conflict_type', 'service_overlap_warning',
                'message', 'There are existing bookings for this service during this period. Host approval required.',
                'existing_bookings', v_overlap_count
            );
        END IF;

    ELSE
        -- Unknown item type
        RETURN jsonb_build_object(
            'has_conflict', true,
            'conflict_type', 'invalid_type',
            'message', 'Invalid item type. Must be property, service, or product'
        );
    END IF;

    -- No conflicts found
    RETURN jsonb_build_object(
        'has_conflict', false,
        'conflict_type', 'none',
        'message', 'No conflicts found'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
