-- Add email verification and approval workflow to listing_claims

-- Add new columns to listing_claims table
ALTER TABLE public.listing_claims
ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN verification_token UUID NOT NULL DEFAULT gen_random_uuid(),
ADD COLUMN verification_expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
ADD COLUMN rejection_reason TEXT;

-- Create unique index on verification_token for fast lookup
CREATE UNIQUE INDEX idx_listing_claims_verification_token ON public.listing_claims (verification_token);

-- RPC: verify_claim_email - mark claim as email verified (public, called via link)
CREATE OR REPLACE FUNCTION public.verify_claim_email(p_token UUID)
RETURNS TABLE(
  claim_id UUID,
  listing_id UUID,
  business_name TEXT,
  claimant_email TEXT
) AS $$
BEGIN
  RETURN QUERY
  UPDATE public.listing_claims
  SET email_verified = true
  WHERE verification_token = p_token
    AND verification_expires_at > now()
    AND email_verified = false
  RETURNING
    id,
    listing_id,
    listing_claims.business_name,
    listing_claims.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: approve_listing_claim - admin approves, transfers ownership (admin only, SECURITY DEFINER)
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

  -- Update the listing with claim data and set owner
  UPDATE public.directory_listings
  SET
    name = v_claim.business_name,
    whatsapp = v_claim.contact_phone,
    website = v_claim.website,
    address = v_claim.address,
    short_description = v_claim.description,
    owner_user_id = v_claimant_user_id,
    updated_at = now()
  WHERE id = v_claim.listing_id;

  -- Mark claim as approved
  UPDATE public.listing_claims
  SET status = 'approved', updated_at = now()
  WHERE id = p_claim_id;

  RETURN QUERY SELECT true, 'Claim approved successfully'::TEXT, v_claim.listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- RPC: reject_listing_claim - admin rejects claim (admin only, SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.reject_listing_claim(p_claim_id UUID, p_reason TEXT)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if current user is admin
  v_is_admin := public.is_admin(auth.uid()::TEXT);

  IF NOT v_is_admin THEN
    RETURN QUERY SELECT false, 'Only admins can reject claims'::TEXT;
    RETURN;
  END IF;

  UPDATE public.listing_claims
  SET
    status = 'rejected',
    rejection_reason = p_reason,
    updated_at = now()
  WHERE id = p_claim_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Claim not found or already processed'::TEXT;
    RETURN;
  END IF;

  RETURN QUERY SELECT true, 'Claim rejected successfully'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions on RPCs to authenticated users
GRANT EXECUTE ON FUNCTION public.verify_claim_email(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.approve_listing_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_listing_claim(UUID, TEXT) TO authenticated;
