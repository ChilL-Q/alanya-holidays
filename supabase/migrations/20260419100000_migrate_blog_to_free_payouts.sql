-- Migration: 20260419100000_migrate_blog_to_free_payouts
-- Purpose: Remove Stripe payment requirement for blog submissions.
-- Admin contacts author via chat to arrange payment manually.

-- 1. Add payment_details for author's PayPal/IBAN (optional, shown to admin in chat context)
ALTER TABLE public.blog_submissions
    ADD COLUMN payment_details TEXT;

-- 2. Update default status and clean up old data
-- We update pending_payment to pending_review to keep active submissions
UPDATE public.blog_submissions SET status = 'pending_review' WHERE status = 'pending_payment';

ALTER TABLE public.blog_submissions ALTER COLUMN status SET DEFAULT 'pending_review';

-- 3. Update existing CHECK constraint for status to remove 'pending_payment'
ALTER TABLE public.blog_submissions DROP CONSTRAINT blog_submissions_status_check;
ALTER TABLE public.blog_submissions ADD CONSTRAINT blog_submissions_status_check
    CHECK (status IN ('pending_review', 'approved', 'rejected'));

-- 4. Remove Stripe and legacy payment columns
ALTER TABLE public.blog_submissions DROP COLUMN stripe_session_id;
ALTER TABLE public.blog_submissions DROP COLUMN payment_expires_at;
ALTER TABLE public.blog_submissions DROP COLUMN payment_status;

-- 5. Drop old indexes
DROP INDEX IF EXISTS idx_blog_submissions_stripe_session;

-- 6. Update the status transition trigger function
CREATE OR REPLACE FUNCTION public.validate_blog_submission_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_allowed BOOLEAN;
BEGIN
    v_old_status := OLD.status;
    v_new_status := NEW.status;

    IF v_old_status IS NOT DISTINCT FROM v_new_status THEN
        RETURN NEW;
    END IF;

    v_allowed := CASE
        WHEN v_old_status = 'pending_review' AND v_new_status IN ('approved', 'rejected') THEN TRUE
        WHEN v_old_status = 'approved' AND v_new_status = 'pending_review' THEN TRUE
        ELSE FALSE
    END;

    IF NOT v_allowed THEN
        RAISE EXCEPTION 'Invalid blog submission status transition: % -> %', v_old_status, v_new_status
            USING ERRCODE = 'check_violation',
                  DETAIL = format('Transition from "%s" to "%s" is not allowed.', v_old_status, v_new_status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
