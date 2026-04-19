-- Migration: 20260419000001_drop_redundant_payment_status_check
-- Purpose: Drop the redundant blog_submissions_payment_status_check constraint added in
--   20260419000000 — it was missing 'failed' which is a valid value used by stripe-webhook.
--   The correct constraint (check_blog_submissions_payment_status) already exists from
--   20260418000000_blog_submissions_state_machine.sql.

ALTER TABLE public.blog_submissions DROP CONSTRAINT IF EXISTS blog_submissions_payment_status_check;
