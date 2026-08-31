\set ON_ERROR_STOP on

BEGIN;

-- Reproduce the pre-migration state so duplicate remediation is exercised.
DROP INDEX IF EXISTS public.idx_listing_claims_one_approved_per_listing;

ALTER TABLE auth.users
ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB DEFAULT '{}'::JSONB;

-- The CI fixture intentionally models only core directory columns. Add the
-- production columns used by the approval RPC inside this rolled-back test.
ALTER TABLE public.directory_listings
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS short_description TEXT,
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

DO $$
DECLARE
  v_admin_id UUID := '10000000-0000-4000-8000-000000000001';
  v_first_user_id UUID := '10000000-0000-4000-8000-000000000002';
  v_second_user_id UUID := '10000000-0000-4000-8000-000000000003';
  v_listing_id UUID := '20000000-0000-4000-8000-000000000001';
  v_rejected_listing_id UUID := '20000000-0000-4000-8000-000000000002';
  v_historical_listing_id UUID := '20000000-0000-4000-8000-000000000003';
  v_first_claim_id UUID := '30000000-0000-4000-8000-000000000001';
  v_second_claim_id UUID := '30000000-0000-4000-8000-000000000002';
  v_rejected_claim_id UUID := '30000000-0000-4000-8000-000000000003';
  v_historical_owner_claim_id UUID := '30000000-0000-4000-8000-000000000004';
  v_historical_duplicate_claim_id UUID := '30000000-0000-4000-8000-000000000005';
  v_result RECORD;
  v_owner_id UUID;
  v_approved_count INTEGER;
BEGIN
  INSERT INTO auth.users (id, email)
  VALUES
    (v_admin_id, 'claim-admin@example.test'),
    (v_first_user_id, 'claim-first@example.test'),
    (v_second_user_id, 'claim-second@example.test');

  INSERT INTO public.profiles (id, email, role)
  VALUES
    (v_admin_id, 'claim-admin@example.test', 'admin'),
    (v_first_user_id, 'claim-first@example.test', 'user'),
    (v_second_user_id, 'claim-second@example.test', 'user')
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    role = EXCLUDED.role;

  INSERT INTO public.directory_listings (
    id,
    name,
    title,
    slug,
    status,
    creation_source
  )
  VALUES
    (v_listing_id, 'Original Listing', 'Original Listing', 'claim-lock-test', 'approved', 'admin'),
    (v_rejected_listing_id, 'Rejected Listing', 'Rejected Listing', 'claim-rejected-test', 'approved', 'admin'),
    (v_historical_listing_id, 'Historical Listing', 'Historical Listing', 'claim-historical-test', 'approved', 'admin');

  UPDATE public.directory_listings
  SET owner_user_id = v_second_user_id
  WHERE id = v_historical_listing_id;

  INSERT INTO public.listing_claims (
    id,
    listing_id,
    user_id,
    email,
    phone,
    role,
    business_name,
    contact_phone,
    status
  )
  VALUES
    (
      v_first_claim_id,
      v_listing_id,
      v_first_user_id,
      'claim-first@example.test',
      '+900000000001',
      'owner',
      'First Approved Business',
      '+900000000001',
      'pending'
    ),
    (
      v_second_claim_id,
      v_listing_id,
      v_second_user_id,
      'claim-second@example.test',
      '+900000000002',
      'owner',
      'Second Business',
      '+900000000002',
      'pending'
    ),
    (
      v_rejected_claim_id,
      v_rejected_listing_id,
      v_second_user_id,
      'claim-rejected@example.test',
      '+900000000003',
      'owner',
      'Rejected Business',
      '+900000000003',
      'rejected'
    ),
    (
      v_historical_owner_claim_id,
      v_historical_listing_id,
      v_second_user_id,
      'historical-owner@example.test',
      '+900000000004',
      'owner',
      'Historical Owner Claim',
      '+900000000004',
      'approved'
    ),
    (
      v_historical_duplicate_claim_id,
      v_historical_listing_id,
      v_first_user_id,
      'historical-duplicate@example.test',
      '+900000000005',
      'owner',
      'Historical Duplicate Claim',
      '+900000000005',
      'approved'
    );

  WITH ranked_approved_claims AS (
    SELECT
      claims.id,
      row_number() OVER (
        PARTITION BY claims.listing_id
        ORDER BY
          (claims.user_id = listings.owner_user_id) DESC NULLS LAST,
          claims.created_at ASC NULLS LAST,
          claims.id ASC
      ) AS approval_rank
    FROM public.listing_claims AS claims
    JOIN public.directory_listings AS listings ON listings.id = claims.listing_id
    WHERE claims.status = 'approved'
  )
  UPDATE public.listing_claims AS claims
  SET
    status = 'rejected',
    rejection_reason = 'Migration remediation: duplicate historical approved claim',
    updated_at = now()
  FROM ranked_approved_claims AS ranked
  WHERE claims.id = ranked.id
    AND ranked.approval_rank > 1;

  IF (SELECT status FROM public.listing_claims WHERE id = v_historical_owner_claim_id) <> 'approved'
     OR (SELECT status FROM public.listing_claims WHERE id = v_historical_duplicate_claim_id) <> 'rejected'
     OR (SELECT rejection_reason FROM public.listing_claims WHERE id = v_historical_duplicate_claim_id)
        <> 'Migration remediation: duplicate historical approved claim' THEN
    RAISE EXCEPTION 'Historical duplicate remediation did not preserve the current owner claim';
  END IF;

  CREATE UNIQUE INDEX idx_listing_claims_one_approved_per_listing
    ON public.listing_claims (listing_id)
    WHERE status = 'approved';

  SELECT * INTO v_result
  FROM public.approve_listing_claim(v_first_claim_id, v_admin_id);
  IF NOT v_result.success OR v_result.message <> 'Claim approved successfully' THEN
    RAISE EXCEPTION 'First approval failed: %', row_to_json(v_result);
  END IF;

  SELECT * INTO v_result
  FROM public.approve_listing_claim(v_first_claim_id, v_admin_id);
  IF NOT v_result.success OR v_result.message <> 'Claim already approved' THEN
    RAISE EXCEPTION 'Repeated approval was not idempotent: %', row_to_json(v_result);
  END IF;

  SELECT * INTO v_result
  FROM public.approve_listing_claim(v_second_claim_id, v_admin_id);
  IF v_result.success OR v_result.message <> 'Listing is already claimed' THEN
    RAISE EXCEPTION 'Second claim did not return conflict: %', row_to_json(v_result);
  END IF;

  SELECT * INTO v_result
  FROM public.approve_listing_claim(v_rejected_claim_id, v_admin_id);
  IF v_result.success OR v_result.message <> 'Claim is not pending' THEN
    RAISE EXCEPTION 'Rejected claim was not blocked: %', row_to_json(v_result);
  END IF;

  SELECT owner_user_id INTO v_owner_id
  FROM public.directory_listings
  WHERE id = v_listing_id;
  IF v_owner_id IS DISTINCT FROM v_first_user_id THEN
    RAISE EXCEPTION 'Listing ownership is %, expected %', v_owner_id, v_first_user_id;
  END IF;

  SELECT count(*) INTO v_approved_count
  FROM public.listing_claims
  WHERE listing_id = v_listing_id
    AND status = 'approved';
  IF v_approved_count <> 1 THEN
    RAISE EXCEPTION 'Expected one approved claim, found %', v_approved_count;
  END IF;
END;
$$;

ROLLBACK;

SELECT 'Listing claim approval verification passed' AS result;
