-- Migration: Add bio column to public.profiles
-- Enables user profile bio and about-me description in Settings/Profile Hub

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT DEFAULT NULL;
