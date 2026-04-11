-- [77] Fix race condition in create_booking — prevent double-booking via advisory lock
-- Problem: SELECT COUNT(*) for overlap check is not atomic with INSERT.
-- Two concurrent requests can both see 0 overlaps and both insert a booking.
-- Solution: Use pg_advisory_xact_lock to serialize concurrent bookings for the same item.

CREATE OR REPLACE FUNCTION public.create_booking(
    p_item_id UUID,
    p_user_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_total_price DECIMAL,
    p_guests INTEGER,
    p_message TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'card',
    p_item_type TEXT DEFAULT 'property'
) RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_overlap_count INTEGER;
    v_item_status TEXT;
    v_host_id UUID;
    v_provider_id UUID;
BEGIN
    -- [77] Advisory lock — serialize ALL concurrent booking attempts for the same item.
    -- Lock key is item_id only (not dates) so that overlapping date ranges
    -- (e.g. Jan 5–10 vs Jan 7–12) also get serialized — they would produce
    -- different hashes if dates were included, defeating the purpose.
    -- The lock is automatically released at transaction end.
    PERFORM pg_advisory_xact_lock(hashtext(p_item_id::text));

    -- Validate date range
    IF p_check_in >= p_check_out THEN
        RETURN jsonb_build_object('error', 'Check-in date must be before check-out date');
    END IF;

    -- 0. Validation based on Type
    IF p_item_type = 'property' THEN
        -- Property Validation
        SELECT status, host_id INTO v_item_status, v_host_id
        FROM properties
        WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('error', 'Property not found');
        END IF;

        IF v_item_status != 'approved' THEN
            RETURN jsonb_build_object('error', 'Property is not available for booking (Not Approved)');
        END IF;

        IF v_host_id = p_user_id THEN
             RETURN jsonb_build_object('error', 'You cannot book your own property');
        END IF;

        -- Check Property Overlap (existing bookings)
        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id
          AND item_type = 'property'
          AND status NOT IN ('cancelled', 'rejected')
          AND (
              (p_check_in < check_out) AND (p_check_out > check_in)
          );

        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object('error', 'Dates are already booked by another reservation');
        END IF;

        -- Check Availability (Calendar blocks)
        SELECT COUNT(*) INTO v_overlap_count
        FROM property_availability
        WHERE property_id = p_item_id
          AND status != 'available'
          AND date >= p_check_in
          AND date < p_check_out;

        IF v_overlap_count > 0 THEN
             RETURN jsonb_build_object('error', 'Dates are unavailable (blocked by host or external calendar)');
        END IF;

    ELSIF p_item_type = 'service' OR p_item_type = 'product' THEN
        -- Service/Product Validation
        SELECT provider_id INTO v_provider_id
        FROM services
        WHERE id = p_item_id;

        IF NOT FOUND THEN
             RETURN jsonb_build_object('error', 'Service not found');
        END IF;

        IF v_provider_id = p_user_id THEN
             RETURN jsonb_build_object('error', 'You cannot book your own service');
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

        -- For services with limited capacity, you may want to check max_bookings_per_slot
        -- For now, we allow overlaps but the host must manually approve
        -- TODO: Add service capacity checking if services.max_bookings column exists

    ELSE
        -- For unknown types, allow but flag for manual review
        NULL;
    END IF;

    -- 3. Insert Booking
    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out,
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_item_id,
        CASE
            WHEN p_item_type IN ('property') THEN 'property'
            WHEN p_item_type IN ('service', 'product', 'tour', 'rental', 'car') THEN 'service'
            ELSE 'service'
        END,
        p_user_id, p_check_in, p_check_out,
        p_total_price, p_guests, p_message, p_payment_method, 'pending', 'pending'
    ) RETURNING id INTO v_booking_id;

    -- 4. Block dates if Property
    IF p_item_type = 'property' THEN
        INSERT INTO property_availability (property_id, date, status, source, external_id)
        SELECT
            p_item_id,
            d::date,
            'booked'::availability_status,
            'reservation'::availability_source,
            v_booking_id::text
        FROM generate_series(p_check_in, p_check_out - INTERVAL '1 day', '1 day') AS d
        ON CONFLICT (property_id, date) DO UPDATE SET
            status = 'booked',
            source = 'reservation',
            external_id = v_booking_id::text;
    END IF;

    RETURN jsonb_build_object('data', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
