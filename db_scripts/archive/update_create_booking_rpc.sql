CREATE OR REPLACE FUNCTION create_booking(
    p_item_id UUID,
    p_user_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_total_price DECIMAL,
    p_guests INTEGER,
    p_message TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'card',
    p_item_type TEXT DEFAULT 'property' -- Added parameter
) RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_overlap_count INTEGER;
    v_item_status TEXT;
    v_host_id UUID;
    v_provider_id UUID;
BEGIN
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

        -- Check Property Overlap
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

        -- Check Availability (Calendar)
        SELECT COUNT(*) INTO v_overlap_count
        FROM property_availability
        WHERE property_id = p_item_id
          AND status != 'available'
          AND date >= p_check_in
          AND date < p_check_out;

        IF v_overlap_count > 0 THEN
             RETURN jsonb_build_object('error', 'Dates are unavailable (blocked by host or external calendar)');
        END IF;

    ELSE
        -- Service/Tour/Rental Validation
        -- We treat everything else as a 'service' for now, checking the services table
        -- Note: 'rental' and 'tour' display types map to 'service' item_type in bookings usually,
        -- but frontend might pass specific strings. Let's align with bookings table which uses 'service'.
        
        SELECT provider_id INTO v_provider_id
        FROM services
        WHERE id = p_item_id;

        IF NOT FOUND THEN
             RETURN jsonb_build_object('error', 'Service not found');
        END IF;
        
        IF v_provider_id = p_user_id THEN
             RETURN jsonb_build_object('error', 'You cannot book your own service');
        END IF;

        -- TODO: Implement availability check for Rentals/Tours if needed
        -- For now, we assume infinite capacity or manual approval
    END IF;

    -- 3. Insert Booking
    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out, 
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_item_id, 
        CASE 
            WHEN p_item_type = 'RENTAL' THEN 'service' -- Map UI types to DB types if needed? 
            -- Actually, let's trust the passed type or normalize it. 
            -- The bookings table usually expects 'property' or 'service'.
            -- If user passes 'RENTAL' or 'TOUR', we might want to normalize to 'service' or keep specific.
            -- Existing logic in bookings.ts normalized inputs.
            -- Let's use the passed type but genericize 'property' vs others in DB.
            -- Ideally we store 'property', 'service'.
            WHEN p_item_type = 'property' THEN 'property'
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
