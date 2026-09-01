\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
END;
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  role text NOT NULL
);

CREATE TABLE public.directory_listings (
  id uuid PRIMARY KEY,
  name text NOT NULL,
  whatsapp text,
  website text,
  address text,
  short_description text,
  owner_user_id uuid,
  claimed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  creation_source text NOT NULL
);

CREATE TABLE public.listing_claims (
  id uuid PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.directory_listings(id),
  user_id uuid,
  email text NOT NULL,
  phone text NOT NULL,
  role text NOT NULL,
  additional_notes text,
  business_name text NOT NULL,
  contact_phone text NOT NULL,
  whatsapp text,
  website text,
  address text,
  description text,
  status text NOT NULL DEFAULT 'pending',
  email_verified boolean NOT NULL DEFAULT true,
  verification_expires_at timestamptz,
  rejection_reason text,
  created_at timestamptz NOT NULL,
  updated_at timestamptz NOT NULL
);

CREATE UNIQUE INDEX idx_listing_claims_one_approved_per_listing
  ON public.listing_claims (listing_id)
  WHERE status = 'approved';

INSERT INTO public.profiles (id, role) VALUES
  ('00000000-0000-4000-8000-000000000001', 'admin'),
  ('00000000-0000-4000-8000-000000000002', 'user'),
  ('00000000-0000-4000-8000-000000000011', 'user'),
  ('00000000-0000-4000-8000-000000000012', 'user');

INSERT INTO public.directory_listings (
  id, name, creation_source, claimed_at, owner_user_id
) VALUES
  ('10000000-0000-4000-8000-000000000001', 'Merchant row', 'merchant', NULL, NULL),
  ('10000000-0000-4000-8000-000000000002', 'Import row', 'import', NULL, NULL),
  ('10000000-0000-4000-8000-000000000003', 'Claimed admin row', 'admin', '2026-08-01T00:00:00Z', '00000000-0000-4000-8000-000000000012'),
  ('10000000-0000-4000-8000-000000000004', 'Valid admin row', 'admin', NULL, NULL),
  ('10000000-0000-4000-8000-000000000005', 'Competing admin row', 'admin', NULL, NULL);

INSERT INTO public.listing_claims (
  id, listing_id, user_id, email, phone, role, business_name,
  contact_phone, status, created_at, updated_at
) VALUES
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 'merchant@example.com', '+905550000001', 'owner', 'Merchant claim', '+905550000001', 'pending', '2026-07-01T00:00:00Z', '2026-07-01T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 'import@example.com', '+905550000002', 'owner', 'Import claim', '+905550000002', 'pending', '2026-07-02T00:00:00Z', '2026-07-02T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000011', 'claimed@example.com', '+905550000003', 'owner', 'Claimed admin claim', '+905550000003', 'pending', '2026-07-03T00:00:00Z', '2026-07-03T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000011', 'valid@example.com', '+905550000004', 'owner', 'Valid admin claim', '+905550000004', 'pending', '2026-07-04T00:00:00Z', '2026-07-04T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000011', 'winner@example.com', '+905550000005', 'owner', 'Winning claim', '+905550000005', 'pending', '2026-07-05T00:00:00Z', '2026-07-05T00:00:00Z'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000012', 'loser@example.com', '+905550000006', 'owner', 'Competing claim', '+905550000006', 'pending', '2026-07-06T00:00:00Z', '2026-07-06T00:00:00Z');

\ir ../migrations/20260831002000_harden_listing_claim_approval.sql

DO $$
DECLARE
  result record;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE id = '20000000-0000-4000-8000-000000000001'
      AND status = 'rejected'
      AND rejection_reason = 'Migration remediation: listing was not admin-created'
      AND created_at = '2026-07-01T00:00:00Z'
      AND updated_at > '2026-07-01T00:00:00Z'
  ) THEN
    RAISE EXCEPTION 'merchant pending claim was not deterministically remediated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE id = '20000000-0000-4000-8000-000000000002'
      AND status = 'rejected'
      AND rejection_reason = 'Migration remediation: listing was not admin-created'
  ) THEN
    RAISE EXCEPTION 'import pending claim was not deterministically remediated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE id = '20000000-0000-4000-8000-000000000003'
      AND status = 'rejected'
      AND rejection_reason = 'Migration remediation: listing was already claimed'
  ) THEN
    RAISE EXCEPTION 'claimed admin pending claim was not remediated';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE id = '20000000-0000-4000-8000-000000000004'
      AND status = 'pending'
      AND updated_at = '2026-07-04T00:00:00Z'
  ) THEN
    RAISE EXCEPTION 'eligible admin pending claim was modified by remediation';
  END IF;

  SELECT * INTO result
  FROM public.approve_listing_claim(
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000002'
  );
  IF result.success OR result.message <> 'Only admins can approve claims' THEN
    RAISE EXCEPTION 'forged non-admin approval was not rejected';
  END IF;

  SELECT * INTO result
  FROM public.approve_listing_claim(
    '20000000-0000-4000-8000-000000000004',
    '00000000-0000-4000-8000-000000000001'
  );
  IF NOT result.success THEN
    RAISE EXCEPTION 'eligible admin claim was not approved: %', result.message;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.directory_listings
    WHERE id = '10000000-0000-4000-8000-000000000004'
      AND owner_user_id = '00000000-0000-4000-8000-000000000011'
      AND claimed_at IS NOT NULL
  ) THEN
    RAISE EXCEPTION 'valid approval did not transfer listing ownership';
  END IF;

  SELECT * INTO result
  FROM public.approve_listing_claim(
    '20000000-0000-4000-8000-000000000005',
    '00000000-0000-4000-8000-000000000001'
  );
  IF NOT result.success THEN
    RAISE EXCEPTION 'first competing claim was not approved: %', result.message;
  END IF;

  SELECT * INTO result
  FROM public.approve_listing_claim(
    '20000000-0000-4000-8000-000000000006',
    '00000000-0000-4000-8000-000000000001'
  );
  IF result.success OR result.message <> 'Listing is already claimed' THEN
    RAISE EXCEPTION 'serialized competing approval was not rejected';
  END IF;
END;
$$;

ROLLBACK;
