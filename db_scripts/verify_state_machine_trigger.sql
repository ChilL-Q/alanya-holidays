-- Verify the state machine trigger is working
DO $$
DECLARE
    v_trigger_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_validate_booking_status_transition'
          AND tgrelid = 'bookings'::regclass
    ) INTO v_trigger_exists;

    IF v_trigger_exists THEN
        RAISE NOTICE '✅ Trigger trg_validate_booking_status_transition exists on bookings table';
    ELSE
        RAISE NOTICE '❌ Trigger NOT found on bookings table';
    END IF;
END $$;
