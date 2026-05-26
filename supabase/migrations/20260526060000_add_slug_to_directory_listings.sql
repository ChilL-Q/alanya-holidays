-- Purpose: Add slug column to directory_listings for SEO-003 silo URL structure
-- Provides canonical per-listing URLs: /restaurants/listing-slug, /alanya-hotels/listing-slug, etc.

ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS slug TEXT;

-- Backfill existing rows using Turkish-aware slugify logic
DO $$
DECLARE
    rec RECORD;
    base_slug TEXT;
    candidate TEXT;
    counter INT;
BEGIN
    FOR rec IN SELECT id, name FROM public.directory_listings WHERE slug IS NULL ORDER BY created_at LOOP
        base_slug := lower(rec.name);
        base_slug := replace(base_slug, 'ç', 'c');
        base_slug := replace(base_slug, 'ğ', 'g');
        base_slug := replace(base_slug, 'ı', 'i');
        base_slug := replace(base_slug, 'ö', 'o');
        base_slug := replace(base_slug, 'ş', 's');
        base_slug := replace(base_slug, 'ü', 'u');
        base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
        base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');

        candidate := base_slug;
        counter := 1;
        WHILE EXISTS (SELECT 1 FROM public.directory_listings WHERE slug = candidate) LOOP
            candidate := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;

        UPDATE public.directory_listings SET slug = candidate WHERE id = rec.id;
    END LOOP;
END $$;

ALTER TABLE public.directory_listings
    ALTER COLUMN slug SET NOT NULL,
    ADD CONSTRAINT directory_listings_slug_unique UNIQUE (slug);

CREATE INDEX IF NOT EXISTS idx_directory_listings_slug
    ON public.directory_listings (slug);

-- Auto-generate slug on INSERT if not provided
CREATE OR REPLACE FUNCTION public.auto_slug_directory_listing()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    base_slug TEXT;
    candidate TEXT;
    counter INT;
BEGIN
    IF NEW.slug IS NULL OR NEW.slug = '' THEN
        base_slug := lower(NEW.name);
        base_slug := replace(base_slug, 'ç', 'c');
        base_slug := replace(base_slug, 'ğ', 'g');
        base_slug := replace(base_slug, 'ı', 'i');
        base_slug := replace(base_slug, 'ö', 'o');
        base_slug := replace(base_slug, 'ş', 's');
        base_slug := replace(base_slug, 'ü', 'u');
        base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
        base_slug := regexp_replace(base_slug, '^-+|-+$', '', 'g');
        candidate := base_slug;
        counter := 1;
        WHILE EXISTS (SELECT 1 FROM public.directory_listings WHERE slug = candidate AND id != NEW.id) LOOP
            candidate := base_slug || '-' || counter;
            counter := counter + 1;
        END LOOP;
        NEW.slug := candidate;
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_slug_directory_listing ON public.directory_listings;
CREATE TRIGGER trg_auto_slug_directory_listing
    BEFORE INSERT ON public.directory_listings
    FOR EACH ROW EXECUTE FUNCTION public.auto_slug_directory_listing();
