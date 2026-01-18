-- Fix Sapadere Canyon Category
-- It was incorrectly categorized as 'water' (Water Sports).
-- Moving it to 'adventure' (Activities) or 'land' (Land Tours) based on available subcategories.
-- In AddService.tsx, subcategories are: water, safari, air, land, wellness.
-- Sapadere Canyon fits best in 'land' (Land Tours).

UPDATE services
SET features = jsonb_set(features, '{subcategory}', '"land"'),
    type = 'tour' -- Ensure it is a tour
WHERE title ILIKE '%Sapadere Canyon%';
