\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  v_listing_id UUID := '21000000-0000-4000-8000-000000000001';
  v_claim_id UUID := '31000000-0000-4000-8000-000000000001';
  v_expired_claim_id UUID := '31000000-0000-4000-8000-000000000002';
  v_token_hash TEXT := encode(extensions.digest(repeat('A', 43), 'sha256'), 'hex');
  v_expired_hash TEXT := encode(extensions.digest(repeat('B', 43), 'sha256'), 'hex');
  v_result RECORD;
  v_count INTEGER;
  v_config TEXT[];
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'listing_claims'
      AND column_name = 'verification_token'
  ) THEN
    RAISE EXCEPTION 'plaintext verification_token column still exists';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'listing_claims'
      AND indexname = 'idx_listing_claims_verification_token_hash'
      AND indexdef LIKE '%UNIQUE%'
  ) THEN
    RAISE EXCEPTION 'verification token hash unique index is missing';
  END IF;

  SELECT proconfig INTO v_config
  FROM pg_proc
  WHERE oid = 'public.verify_claim_email(text)'::regprocedure;

  IF NOT ('search_path=""' = ANY (v_config)) THEN
    RAISE EXCEPTION 'verify_claim_email search_path is not hardened: %', v_config;
  END IF;

  IF has_function_privilege('anon', 'public.verify_claim_email(text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.verify_claim_email(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon/authenticated can execute verify_claim_email';
  END IF;

  IF NOT has_function_privilege('service_role', 'public.verify_claim_email(text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'service_role cannot execute verify_claim_email';
  END IF;

  INSERT INTO public.directory_listings (id, name, title, slug, status, creation_source)
  VALUES (
    v_listing_id,
    'Token Security Listing',
    'Token Security Listing',
    'claim-token-security-test',
    'approved',
    'admin'
  );

  INSERT INTO public.listing_claims (
    id, listing_id, email, phone, role, business_name, contact_phone,
    status, verification_token_hash, verification_expires_at
  ) VALUES
    (
      v_claim_id, v_listing_id, 'valid-claim@example.test', '+900000000001',
      'owner', 'Valid Claim', '+900000000001', 'pending', v_token_hash,
      now() + INTERVAL '1 hour'
    ),
    (
      v_expired_claim_id, v_listing_id, 'expired-claim@example.test', '+900000000002',
      'owner', 'Expired Claim', '+900000000002', 'pending', v_expired_hash,
      now() - INTERVAL '1 second'
    );

  SELECT * INTO v_result FROM public.verify_claim_email(v_token_hash);
  IF v_result.claim_id IS DISTINCT FROM v_claim_id
     OR v_result.claimant_email IS DISTINCT FROM 'valid-claim@example.test' THEN
    RAISE EXCEPTION 'valid token hash was not verified: %', row_to_json(v_result);
  END IF;

  SELECT count(*) INTO v_count FROM public.verify_claim_email(v_token_hash);
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'verification token was reusable';
  END IF;

  SELECT count(*) INTO v_count FROM public.verify_claim_email(v_expired_hash);
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'expired verification token was accepted';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE id = v_claim_id
      AND (email_verified = false OR verification_token_hash IS NOT NULL)
  ) THEN
    RAISE EXCEPTION 'successful verification did not consume the token hash';
  END IF;
END;
$$;

ROLLBACK;

SELECT 'Listing claim token security verification passed' AS result;
