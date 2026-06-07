-- Migration 20260524130000 was recorded as applied but its SQL never executed on remote.
-- This migration adds the missing tier column.
ALTER TABLE public.premium_subscriptions
    ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('voyager', 'signature'));
