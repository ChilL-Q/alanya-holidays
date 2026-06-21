-- ============================================================
-- Migration: fix Real Estate category image
-- Purpose: the seeded Real Estate & Investment category pointed at
--          /images/properties/tepe-villa-main.png, which does not exist,
--          so the tile rendered a broken image. Clear it so the card
--          falls back to its gradient (consistent with other tiles).
-- ============================================================

UPDATE public.forum_categories
SET image_url = NULL
WHERE slug = 'real-estate'
  AND image_url = '/images/properties/tepe-villa-main.png';
