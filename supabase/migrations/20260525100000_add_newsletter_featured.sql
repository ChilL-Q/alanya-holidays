-- Add newsletter_featured flag for Signature tier listings
-- Migration: 20260525100000_add_newsletter_featured

ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS newsletter_featured BOOLEAN NOT NULL DEFAULT false;
