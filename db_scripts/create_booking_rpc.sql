-- Function to create a booking with strict availability checks
-- Returns: JSON object with { "data": booking_id } or { "error": message }

CREATE OR REPLACE FUNCTION create_booking(
    p_property_id UUID,
    p_user_id UUID,
    p_check_in DATE,
    p_check_out DATE,
    p_total_price DECIMAL,
    p_guests INTEGER,
    p_message TEXT DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'card'
) RETURNS JSONB AS $$
DECLARE
    v_booking_id UUID;
    v_overlap_count INTEGER;
BEGIN
    -- 1. Check for overlapping existing bookings (ACTIVE ones only)
    -- Range overlap logic: (StartA <= EndB) and (EndA >= StartB)
    -- Our bookings are nightly, so overlap if (CheckIn_New < CheckOut_Existing) AND (CheckOut_New > CheckIn_Existing)
    SELECT COUNT(*) INTO v_overlap_count
    FROM bookings
    WHERE item_id = p_property_id
      AND item_type = 'property'
      AND status NOT IN ('cancelled', 'rejected') 
      AND (
          (p_check_in < check_out) AND (p_check_out > check_in)
      );
      
    IF v_overlap_count > 0 THEN
        RETURN jsonb_build_object('error', 'Dates are already booked by another reservation');
    END IF;

    -- 2. Check for availability blocks (Manual blocks or iCal imports)
    -- Availability table stores individual dates (nights) that are occupied.
    -- If I book Jan 10-12, I need Jan 10 night and Jan 11 night to be available. Jan 12 is checkout.
    -- So we check for any entry with status != 'available' in range [p_check_in, p_check_out)
    SELECT COUNT(*) INTO v_overlap_count
    FROM property_availability
    WHERE property_id = p_property_id
      AND status != 'available'
      AND date >= p_check_in
      AND date < p_check_out;

    IF v_overlap_count > 0 THEN
         RETURN jsonb_build_object('error', 'Dates are unavailable (blocked by host or external calendar)');
    END IF;

    -- 3. Insert Booking
    INSERT INTO bookings (
        item_id, item_type, user_id, check_in, check_out, 
        total_price, guests, message, payment_method, status, payment_status
    ) VALUES (
        p_property_id, 'property', p_user_id, p_check_in, p_check_out,
        p_total_price, p_guests, p_message, p_payment_method, 'pending', 'pending'
    ) RETURNING id INTO v_booking_id;

    -- 4. Automatically block these dates in property_availability matches
    -- This ensures subsequent queries see them as booked immediately
    INSERT INTO property_availability (property_id, date, status, source, external_id)
    SELECT 
        p_property_id,
        d::date,
        'booked'::availability_status,
        'reservation'::availability_source,
        v_booking_id::text
    FROM generate_series(p_check_in, p_check_out - INTERVAL '1 day', '1 day') AS d
    ON CONFLICT (property_id, date) DO UPDATE SET
        status = 'booked',
        source = 'reservation',
        external_id = v_booking_id::text;

    RETURN jsonb_build_object('data', v_booking_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
