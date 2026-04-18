-- Migration: 20260418000000_blog_submissions_state_machine
-- Purpose: Add CHECK constraints and state machine trigger for blog_submissions [A2-H4]

-- 1. Add CHECK constraint for payment_status (status already has one)
-- NOT VALID: skip validation of existing rows (safe for production with live data);
-- VALIDATE runs separately to avoid locking the table on large datasets.
ALTER TABLE public.blog_submissions
    ADD CONSTRAINT check_blog_submissions_payment_status
    CHECK (payment_status IN ('unpaid', 'paid', 'failed', 'refunded'))
    NOT VALID;

ALTER TABLE public.blog_submissions
    VALIDATE CONSTRAINT check_blog_submissions_payment_status;

-- 2. State machine function for blog_submissions
CREATE OR REPLACE FUNCTION public.validate_blog_submission_status_transition()
RETURNS TRIGGER AS $$
DECLARE
    v_old_status TEXT;
    v_new_status TEXT;
    v_allowed BOOLEAN;
BEGIN
    v_old_status := OLD.status;
    v_new_status := NEW.status;

    -- No transition if status hasn't changed
    IF v_old_status IS NOT DISTINCT FROM v_new_status THEN
        RETURN NEW;
    END IF;

    -- Determine if this transition is allowed
    v_allowed := CASE
        -- From pending_payment: can go to pending_review (paid) or rejected
        WHEN v_old_status = 'pending_payment' AND v_new_status IN ('pending_review', 'rejected') THEN TRUE
        -- From pending_review: can go to approved or rejected
        WHEN v_old_status = 'pending_review' AND v_new_status IN ('approved', 'rejected') THEN TRUE
        -- From approved: can go back to pending_review (compensation rollback [A2-C2])
        WHEN v_old_status = 'approved' AND v_new_status = 'pending_review' THEN TRUE
        -- rejected, approved (unless rollback) are terminal
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

-- 3. Create the trigger
DROP TRIGGER IF EXISTS trg_validate_blog_submission_status_transition ON public.blog_submissions;

CREATE TRIGGER trg_validate_blog_submission_status_transition
    BEFORE UPDATE OF status ON public.blog_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_blog_submission_status_transition();
