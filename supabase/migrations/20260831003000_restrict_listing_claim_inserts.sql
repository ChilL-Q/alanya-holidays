-- Listing claims must be submitted through the authenticated backend endpoint.
-- The backend uses service_role and applies rate limits, derives user_id from the
-- JWT, creates the verification token server-side, and checks claim eligibility.
-- Direct REST inserts would bypass all of those controls.
DROP POLICY IF EXISTS "Allow public insert on listing_claims"
  ON public.listing_claims;

REVOKE INSERT ON public.listing_claims FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.listing_claims TO service_role;
