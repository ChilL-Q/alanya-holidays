-- Add claimed_at column to directory_listings
ALTER TABLE public.directory_listings
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Recreate or update approve_listing_claim function to set claimed_at = now() on approved claim
CREATE OR REPLACE FUNCTION public.approve_listing_claim(p_claim_id UUID)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  listing_id UUID
) AS $$
DECLARE
  v_claim record;
  v_is_admin BOOLEAN;
  v_claimant_user_id UUID;
BEGIN
  -- Check if current user is admin
  v_is_admin := public.is_admin(auth.uid()::TEXT);

  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Only admins can approve claims'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Fetch the claim
  SELECT id, listing_id, user_id, business_name, contact_phone, website, address, description
  INTO v_claim
  FROM public.listing_claims
  WHERE id = p_claim_id AND status = 'pending';

  IF v_claim IS NULL THEN
    RETURN QUERY SELECT false, 'Claim not found or already processed'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  v_claimant_user_id := v_claim.user_id;

  -- Update the listing with claim data, set owner, and record claim timestamp
  UPDATE public.directory_listings
  SET
    name = v_claim.business_name,
    whatsapp = v_claim.contact_phone,
    website = v_claim.website,
    address = v_claim.address,
    short_description = v_claim.description,
    owner_user_id = v_claimant_user_id,
    claimed_at = now(),
    updated_at = now()
  WHERE id = v_claim.listing_id;

  -- Mark claim as approved
  UPDATE public.listing_claims
  SET status = 'approved', updated_at = now()
  WHERE id = p_claim_id;

  RETURN QUERY SELECT true, 'Claim approved successfully'::TEXT, v_claim.listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
