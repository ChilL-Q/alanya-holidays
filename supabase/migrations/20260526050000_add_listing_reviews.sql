-- Purpose: Directory listing review system with pre-moderation pipeline (GAP-002)
-- Depends on: directory_listings (reviews_average, reviews_count already exist)

CREATE TABLE IF NOT EXISTS public.listing_reviews (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id  UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment     TEXT NOT NULL CHECK (char_length(comment) >= 10),
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at  TIMESTAMPTZ DEFAULT now(),
    UNIQUE (listing_id, user_id)
);

-- Enable RLS
ALTER TABLE public.listing_reviews ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "listing_reviews_select" ON public.listing_reviews
    FOR SELECT USING (status = 'approved' OR user_id = auth.uid());

CREATE POLICY "listing_reviews_insert" ON public.listing_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "listing_reviews_admin_update" ON public.listing_reviews
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "listing_reviews_delete" ON public.listing_reviews
    FOR DELETE USING (public.is_admin() OR user_id = auth.uid());

-- Partial indexes
CREATE INDEX IF NOT EXISTS idx_listing_reviews_pending
    ON public.listing_reviews(created_at DESC)
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_listing_reviews_listing_approved
    ON public.listing_reviews(listing_id, created_at DESC)
    WHERE status = 'approved';

-- Trigger: sync reviews_average + reviews_count on directory_listings
CREATE OR REPLACE FUNCTION public.sync_listing_review_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_listing_id UUID;
BEGIN
    v_listing_id := COALESCE(NEW.listing_id, OLD.listing_id);

    UPDATE public.directory_listings
    SET
        reviews_count   = (SELECT COUNT(*)           FROM public.listing_reviews WHERE listing_id = v_listing_id AND status = 'approved'),
        reviews_average = COALESCE((SELECT ROUND(AVG(rating)::numeric, 1) FROM public.listing_reviews WHERE listing_id = v_listing_id AND status = 'approved'), 0)
    WHERE id = v_listing_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_listing_review_stats ON public.listing_reviews;
CREATE TRIGGER trg_sync_listing_review_stats
    AFTER INSERT OR UPDATE OF status OR DELETE
    ON public.listing_reviews
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_listing_review_stats();
