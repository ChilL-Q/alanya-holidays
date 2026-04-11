-- [77] Fix advisory lock key in create_booking RPC
-- Previous migration used hashtext(item_id + check_in + check_out) which was incorrect:
-- overlapping but non-identical date ranges (e.g. Jan 5-10 vs Jan 7-12) got different
-- lock keys and could still race. Lock must be on item_id only.

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
    -- Advisory lock on item_id only — serializes ALL concurrent booking attempts
    -- for the same property/service regardless of date range.
    PERFORM pg_advisory_xact_lock(hashtext(p_item_id::text));

    IF p_check_in >= p_check_out THEN
        RETURN jsonb_build_object('error', 'Check-in date must be before check-out date');
    END IF;

    IF p_item_type = 'property' THEN
        SELECT status, host_id INTO v_item_status, v_host_id
        FROM properties WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('error', 'Property not found');
        END IF;
        IF v_item_status != 'approved' THEN
            RETURN jsonb_build_object('error', 'Property is not available for booking (Not Approved)');
        END IF;
        IF v_host_id = p_user_id THEN
            RETURN jsonb_build_object('error', 'You cannot book your own property');
        END IF;

        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id
          AND item_type = 'property'
          AND status NOT IN ('cancelled', 'rejected')
          AND (p_check_in < check_out) AND (p_check_out > check_in);

        IF v_overlap_count > 0 THEN
            RETURN jsonb_build_object('error', 'Dates are already booked by another reservation');
        END IF;

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
        SELECT provider_id INTO v_provider_id
        FROM services WHERE id = p_item_id;

        IF NOT FOUND THEN
            RETURN jsonb_build_object('error', 'Service not found');
        END IF;
        IF v_provider_id = p_user_id THEN
            RETURN jsonb_build_object('error', 'You cannot book your own service');
        END IF;

        SELECT COUNT(*) INTO v_overlap_count
        FROM bookings
        WHERE item_id = p_item_id
          AND item_type = 'service'
          AND status NOT IN ('cancelled', 'rejected')
          AND (p_check_in < check_out) AND (p_check_out > check_in);

    ELSE
        NULL;
    END IF;

    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out,
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_item_id,
        CASE
            WHEN p_item_type = 'property' THEN 'property'
            ELSE 'service'
        END,
        p_user_id, p_check_in, p_check_out,
        p_total_price, p_guests, p_message, p_payment_method, 'pending', 'pending'
    ) RETURNING id INTO v_booking_id;

    IF p_item_type = 'property' THEN
        INSERT INTO property_availability (property_id, date, status, source, external_id)
        SELECT
            p_item_id, d::date,
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
