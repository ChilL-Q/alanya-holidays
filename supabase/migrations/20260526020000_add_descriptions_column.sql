-- Purpose: Add multilingual descriptions JSONB to directory_listings (AI-002)
ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS descriptions JSONB NOT NULL DEFAULT '{}';

-- Validate: top-level keys must be strings, values must be strings or null
-- (enforced at application level via Zod, not DB constraint for flexibility)
