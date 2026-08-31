-- Compatibility repair for environments where the email-verification
-- migration is recorded as applied but its listing_claims changes are absent.
ALTER TABLE public.listing_claims
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_token UUID NOT NULL DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_claims_verification_token
  ON public.listing_claims (verification_token);

-- Serialize listing claim approval and enforce one approved claim per listing.
-- If historical data contains duplicate approved claims, preserve exactly one:
-- prefer the claim matching the listing's current owner, then the oldest claim
-- (created_at and id provide a stable tie-break). Rejected duplicates retain an
-- actionable remediation reason for administrators.

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

CREATE UNIQUE INDEX IF NOT EXISTS idx_listing_claims_one_approved_per_listing
ON public.listing_claims (listing_id)
WHERE status = 'approved';

CREATE OR REPLACE FUNCTION public.approve_listing_claim(
    p_claim_id UUID,
    p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  listing_id UUID
) AS $$
DECLARE
  v_claim public.listing_claims%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND (role = 'admin' OR is_admin = true)
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN QUERY
    SELECT false, 'Only admins can approve claims'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT *
  INTO v_claim
  FROM public.listing_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Claim not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_claim.status = 'approved' THEN
    RETURN QUERY
    SELECT true, 'Claim already approved'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  IF v_claim.status <> 'pending' THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.directory_listings
  WHERE id = v_claim.listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Listing not found'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  -- Recheck after both rows are locked. The listing lock serializes approvals
  -- for distinct claims that target the same listing.
  IF v_claim.status <> 'pending' THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.listing_claims AS other_claim
    WHERE other_claim.listing_id = v_claim.listing_id
      AND other_claim.status = 'approved'
      AND other_claim.id <> v_claim.id
  ) THEN
    RETURN QUERY
    SELECT false, 'Another claim is already approved'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  UPDATE public.directory_listings
  SET
    name = v_claim.business_name,
    whatsapp = v_claim.contact_phone,
    website = v_claim.website,
    address = v_claim.address,
    short_description = v_claim.description,
    owner_user_id = v_claim.user_id,
    claimed_at = now(),
    updated_at = now()
  WHERE id = v_claim.listing_id;

  UPDATE public.listing_claims
  SET status = 'approved', updated_at = now()
  WHERE id = v_claim.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT true, 'Claim approved successfully'::TEXT, v_claim.listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) TO service_role;
