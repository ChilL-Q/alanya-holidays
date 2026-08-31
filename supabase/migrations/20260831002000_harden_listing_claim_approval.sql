-- Close the approval-time eligibility gap left after creation_source became
-- authoritative. Submission eligibility alone is insufficient because claims
-- may predate that invariant or a listing may be claimed before moderation.

UPDATE public.listing_claims AS claims
SET
  status = 'rejected',
  rejection_reason = CASE
    WHEN listings.claimed_at IS NOT NULL
      THEN 'Migration remediation: listing was already claimed'
    ELSE 'Migration remediation: listing was not admin-created'
  END,
  updated_at = now()
FROM public.directory_listings AS listings
WHERE listings.id = claims.listing_id
  AND claims.status = 'pending'
  AND (
    listings.creation_source IS DISTINCT FROM 'admin'
    OR listings.claimed_at IS NOT NULL
  );

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
  v_listing public.directory_listings%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'admin'
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

  SELECT *
  INTO v_listing
  FROM public.directory_listings
  WHERE id = v_claim.listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Listing not found'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  -- The listing lock serializes distinct claims targeting the same listing.
  -- Rechecking the durable source and ownership state after that lock prevents
  -- stale pending claims from bypassing the submission-time trigger.
  IF v_listing.creation_source IS DISTINCT FROM 'admin' THEN
    RETURN QUERY
    SELECT false, 'Listing is not eligible for ownership claims'::TEXT,
      v_claim.listing_id;
    RETURN;
  END IF;

  IF v_listing.claimed_at IS NOT NULL THEN
    RETURN QUERY
    SELECT false, 'Listing is already claimed'::TEXT, v_claim.listing_id;
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
  WHERE id = v_claim.listing_id
    AND creation_source = 'admin'
    AND claimed_at IS NULL;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Listing is not eligible for ownership claims'::TEXT,
      v_claim.listing_id;
    RETURN;
  END IF;

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
