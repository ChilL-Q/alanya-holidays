-- Listing add-ons / upsells (Host "Upgrades" tab)
-- Each row is one add-on a listing owner has purchased or is purchasing.
-- Activation/expiry is performed by the Stripe webhook (service role, bypasses RLS).

CREATE TABLE IF NOT EXISTS public.listing_addons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES public.directory_listings(id) ON DELETE CASCADE,
    addon_type TEXT NOT NULL CHECK (addon_type IN (
        'instant_booking',
        'verified_badge',
        'seasonal_placement',
        'sponsored_article',
        'ai_localization'
    )),
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
    stripe_payment_intent_id TEXT,
    stripe_subscription_id TEXT,
    starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    expires_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_addons_listing
    ON public.listing_addons (listing_id);

-- At most one active add-on of a given type per listing
CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_addons_active_unique
    ON public.listing_addons (listing_id, addon_type)
    WHERE status = 'active';

ALTER TABLE public.listing_addons ENABLE ROW LEVEL SECURITY;

-- Owners read add-ons for listings they own; admins read all
DROP POLICY IF EXISTS "listing_addons_select" ON public.listing_addons;
CREATE POLICY "listing_addons_select" ON public.listing_addons
    FOR SELECT USING (
        public.is_admin()
        OR EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_addons.listing_id
              AND dl.owner_user_id = (SELECT auth.uid())
        )
    );

-- Owners may initiate a purchase (pending) for a listing they own
DROP POLICY IF EXISTS "listing_addons_insert" ON public.listing_addons;
CREATE POLICY "listing_addons_insert" ON public.listing_addons
    FOR INSERT WITH CHECK (
        status = 'pending'
        AND EXISTS (
            SELECT 1 FROM public.directory_listings dl
            WHERE dl.id = listing_addons.listing_id
              AND dl.owner_user_id = (SELECT auth.uid())
        )
    );

-- Manual overrides by admins only (normal activation goes through the webhook)
DROP POLICY IF EXISTS "listing_addons_update_admin" ON public.listing_addons;
CREATE POLICY "listing_addons_update_admin" ON public.listing_addons
    FOR UPDATE USING (public.is_admin()) WITH CHECK (public.is_admin());

NOTIFY pgrst, 'reload schema';
