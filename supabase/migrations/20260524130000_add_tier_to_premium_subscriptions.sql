-- Purpose: Add tier column to premium_subscriptions for Voyager/Signature tracking (LST-002)
ALTER TABLE public.premium_subscriptions
    ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('voyager', 'signature'));
