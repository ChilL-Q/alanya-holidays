-- ============================================================
-- Migration: Fix listing claim RPCs broken by service-role backend calls
-- Date: 2026-07-31
--
-- Problem: approve_listing_claim / reject_listing_claim
-- resolved the caller via auth.uid(), which only works inside a
-- Postgres session tied to the user's JWT. The NestJS backend calls
-- these RPCs through a single service-role SupabaseClient with no
-- per-request JWT, so auth.uid() was always NULL there. The backend
-- has already verified the user is an admin via DirectoryRepository.getUserRole(),
-- but the RPC-level check fails because auth.uid() = NULL.
--
-- Fix: accept p_user_id explicitly. The backend's AuthGuard already
-- verifies the JWT via supabase.auth.getUser(token) before calling
-- these RPCs (see backend/src/auth/auth.guard.ts), so p_user_id is
-- a trusted, server-verified value, not client input.
--
-- IMPORTANT: p_user_id is trustworthy ONLY because these functions are
-- restricted to service_role below. CREATE OR REPLACE with a different
-- parameter list creates a NEW function overload — Postgres/Supabase
-- auto-grants EXECUTE on new functions to PUBLIC and anon by default
-- (see 20260607090007_fix_revoke_anon_explicit_grants.sql for this
-- exact footgun documented elsewhere in this repo). Without the REVOKE
-- block at the bottom of this file, any anonymous caller could POST to
-- /rest/v1/rpc/approve_listing_claim with an arbitrary p_user_id and
-- approve claims as if they were an admin — auth.uid() is gone, so
-- nothing else would stop them.
-- ============================================================

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
  v_claim record;
  v_is_admin BOOLEAN;
  v_claimant_user_id UUID;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if the provided user is admin
  v_is_admin := public.is_admin(p_user_id::TEXT);

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

CREATE OR REPLACE FUNCTION public.reject_listing_claim(
    p_claim_id UUID,
    p_reason TEXT,
    p_user_id UUID
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT
) AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check if the provided user is admin
  v_is_admin := public.is_admin(p_user_id::TEXT);

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

-- Lock the new overloads to the backend only. service_role bypasses
-- EXECUTE checks entirely (see 20260607090007), so no explicit GRANT
-- is needed — only the REVOKEs below matter.
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.reject_listing_claim(UUID, TEXT, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_listing_claim(UUID, TEXT, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.reject_listing_claim(UUID, TEXT, UUID) FROM authenticated;

-- Drop the old auth.uid()-based overloads — dead now that the backend
-- calls the p_user_id signature above, and leaving them reachable is
-- unnecessary and unused attack surface.
DROP FUNCTION IF EXISTS public.approve_listing_claim(UUID);
DROP FUNCTION IF EXISTS public.reject_listing_claim(UUID, TEXT);
