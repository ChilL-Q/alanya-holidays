-- Migration: 20260413000001_directory_listings_premium
-- Purpose: Add is_premium column to directory_listings for paid/promoted listings
-- Task: [95] Landing — Free Listings + Premium Listings

-- ============================================================
-- 1. ADD is_premium COLUMN
-- ============================================================
ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS is_premium BOOLEAN NOT NULL DEFAULT false;

-- ============================================================
-- 2. INDEXES
-- ============================================================
-- Partial index: only premium listings (small, fast lookups)
CREATE INDEX IF NOT EXISTS idx_directory_listings_premium
    ON public.directory_listings (id)
    WHERE is_premium = true;

-- Composite: category + premium for ordered queries
CREATE INDEX IF NOT EXISTS idx_directory_listings_category_premium
    ON public.directory_listings (category_id, is_premium DESC);

-- ============================================================
-- 3. RLS: RESTRICT is_premium UPDATES TO ADMIN ONLY
-- ============================================================
-- The existing policies allow any authenticated user to UPDATE all columns.
-- We need a CHECK constraint that prevents non-admin users from setting is_premium = true.
-- Since RLS UPDATE policy already exists, we add a SECURITY DEFINER trigger
-- that validates the is_premium field on update/insert.

-- Approach: Use a BEFORE UPDATE/INSERT trigger to enforce admin-only is_premium changes.
CREATE OR REPLACE FUNCTION public.enforce_premium_admin()
RETURNS TRIGGER AS $$
BEGIN
    -- If is_premium is being changed, verify user is admin
    IF TG_OP = 'UPDATE' AND OLD.is_premium IS DISTINCT FROM NEW.is_premium THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        ) THEN
            NEW.is_premium := OLD.is_premium; -- revert to old value silently
        END IF;
    END IF;

    IF TG_OP = 'INSERT' AND NEW.is_premium = true THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = (SELECT auth.uid())
            AND role = 'admin'
        ) THEN
            NEW.is_premium := false; -- force to false for non-admins
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_enforce_premium_admin ON public.directory_listings;
CREATE TRIGGER trg_enforce_premium_admin
    BEFORE INSERT OR UPDATE ON public.directory_listings
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_premium_admin();

-- Revoke direct execute on the trigger function (only used by trigger)
REVOKE EXECUTE ON FUNCTION public.enforce_premium_admin() FROM PUBLIC;
