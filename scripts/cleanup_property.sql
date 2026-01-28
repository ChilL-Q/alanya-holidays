-- SQL script to force delete property "Cleopatra Beachfront Suite" and its dependencies.
-- Run this in your Supabase Dashboard -> SQL Editor

-- 1. Get the Property ID (you can also hardcode it if you know it)
-- Replacing with the ID from our previous debug step: '5d02c67b-ef4e-4b08-bac5-085ab5b9788f'
-- Or selecting by title:

DO $$
DECLARE
    target_property_id UUID;
BEGIN
    SELECT id INTO target_property_id FROM properties WHERE title LIKE 'Cleopatra Beachfront Suite%' LIMIT 1;

    IF target_property_id IS NOT NULL THEN
        -- 2. Delete Reviews (The blocker)
        DELETE FROM reviews WHERE property_id = target_property_id;
        
        -- 3. Delete Favorites
        DELETE FROM favorites WHERE item_id = target_property_id;
        
        -- 4. Delete Availability/Calendar
        DELETE FROM property_availability WHERE property_id = target_property_id;
        DELETE FROM property_ical_feeds WHERE property_id = target_property_id;

        -- 5. Delete Bookings (Optional - might want to keep history, but if deleting property, usually delete bookings too)
        -- DELETE FROM bookings WHERE item_id = target_property_id::text AND item_type = 'property';

        -- 6. Delete the Property itself
        DELETE FROM properties WHERE id = target_property_id;

        RAISE NOTICE 'Property % deleted successfully.', target_property_id;
    ELSE
        RAISE NOTICE 'Property not found.';
    END IF;
END $$;
