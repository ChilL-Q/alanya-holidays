-- Migration: 20260419000000_blog_submission_payment_status_check
-- NOTE: This migration was superseded by 20260419000001_drop_redundant_payment_status_check.sql
-- A2-H4 was already addressed in 20260418000000_blog_submissions_state_machine.sql:
--   constraint check_blog_submissions_payment_status IN ('unpaid','paid','failed','refunded')
-- The constraint added here was redundant and more restrictive (missing 'failed'),
-- which would have blocked stripe-webhook from setting payment_status='failed'.

ALTER TABLE public.blog_submissions
    ADD CONSTRAINT blog_submissions_payment_status_check
    CHECK (payment_status IN ('unpaid', 'paid', 'refunded'));
