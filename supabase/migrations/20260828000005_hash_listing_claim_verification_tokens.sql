-- Keep claim verification secrets out of HTTP request URLs and out of the
-- listing_claims table. Raw tokens are held only in the durable email outbox
-- until delivery and in the browser URL fragment until it is scrubbed.
-- Existing UUID tokens are hashed before the plaintext column is removed, so
-- links already sent before this migration remain verifiable through the new
-- POST endpoint.

ALTER TABLE public.listing_claims
  ADD COLUMN verification_token_hash TEXT;

UPDATE public.listing_claims
SET verification_token_hash = encode(extensions.digest(verification_token::text, 'sha256'), 'hex')
WHERE verification_token_hash IS NULL
  AND email_verified = false;

-- Already-consumed tokens need no replacement hash.
UPDATE public.listing_claims
SET verification_token_hash = NULL
WHERE email_verified = true;

DROP FUNCTION IF EXISTS public.verify_claim_email(UUID);
DROP INDEX IF EXISTS public.idx_listing_claims_verification_token;
ALTER TABLE public.listing_claims DROP COLUMN verification_token;

ALTER TABLE public.listing_claims
  ALTER COLUMN verification_expires_at SET DEFAULT (now() + INTERVAL '24 hours');

-- Tighten outstanding seven-day tokens without reviving already-expired ones.
UPDATE public.listing_claims
SET verification_expires_at = LEAST(
  verification_expires_at,
  now() + INTERVAL '24 hours'
)
WHERE email_verified = false
  AND verification_expires_at > now();

CREATE UNIQUE INDEX idx_listing_claims_verification_token_hash
  ON public.listing_claims (verification_token_hash)
  WHERE verification_token_hash IS NOT NULL;

CREATE OR REPLACE FUNCTION public.verify_claim_email(p_token_hash TEXT)
RETURNS TABLE(
  claim_id UUID,
  listing_id UUID,
  business_name TEXT,
  claimant_email TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $function$
  UPDATE public.listing_claims AS claims
  SET
    email_verified = true,
    verification_token_hash = NULL,
    updated_at = pg_catalog.now()
  WHERE claims.verification_token_hash = p_token_hash
    AND claims.verification_expires_at > pg_catalog.now()
    AND claims.email_verified = false
    AND claims.status = 'pending'
  RETURNING
    claims.id,
    claims.listing_id,
    claims.business_name,
    claims.email;
$function$;

REVOKE ALL ON FUNCTION public.verify_claim_email(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_claim_email(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.verify_claim_email(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_claim_email(TEXT) TO service_role;
