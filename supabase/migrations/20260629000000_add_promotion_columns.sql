-- Fix: PGRST204 "Could not find the 'is_promoted' / 'promotion_price' /
-- 'promotion_description' column ... in the schema cache" on property/service save.
--
-- The "promoted listing" feature (is_promoted + promotion_price +
-- promotion_description) is used across the code (ListProperty, AddService,
-- AdminEditProperty/Service, FavoritesPage) and typed in types/models.ts, but the
-- columns were never created by a migration. All three confirmed missing on
-- `properties` via an information_schema check; services use the same fields.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe whether or not the columns exist,
-- and NOTIFY reloads a stale PostgREST schema cache.

ALTER TABLE public.properties
    ADD COLUMN IF NOT EXISTS is_promoted           boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS promotion_price        numeric(10,2),
    ADD COLUMN IF NOT EXISTS promotion_description  text;

ALTER TABLE public.services
    ADD COLUMN IF NOT EXISTS is_promoted           boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS promotion_price        numeric(10,2),
    ADD COLUMN IF NOT EXISTS promotion_description  text;

NOTIFY pgrst, 'reload schema';
