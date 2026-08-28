-- Migration: 20260825171000_add_phone_email_to_directory_listings
-- Purpose: Directory listing submissions collect contact phone/email in the
-- backend (createDirectoryListing), but these columns were never added.

ALTER TABLE public.directory_listings
    ADD COLUMN IF NOT EXISTS phone TEXT,
    ADD COLUMN IF NOT EXISTS email TEXT;
