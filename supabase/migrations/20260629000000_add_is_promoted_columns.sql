-- Fix: PGRST204 "Could not find the 'is_promoted' column ... in the schema cache"
-- on property/service save.
--
-- The "promoted listing" feature is used throughout the code (ListProperty,
-- AddService, AdminEditProperty/Service, ServiceBasicDetailsForm, FavoritesPage)
-- and typed in types/models.ts, but no migration ever created the column.
--
-- Idempotent: ADD COLUMN IF NOT EXISTS is safe whether or not the column exists,
-- and the NOTIFY reloads a stale PostgREST schema cache (the other condition the
-- same error text can indicate).

ALTER TABLE public.properties ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;
ALTER TABLE public.services   ADD COLUMN IF NOT EXISTS is_promoted boolean NOT NULL DEFAULT false;

NOTIFY pgrst, 'reload schema';
