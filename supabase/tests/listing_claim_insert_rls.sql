\set ON_ERROR_STOP on

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role BYPASSRLS;
  ELSE
    ALTER ROLE service_role BYPASSRLS;
  END IF;
END;
$$;

CREATE TABLE public.listing_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  user_id uuid,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.listing_claims ENABLE ROW LEVEL SECURITY;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT INSERT ON public.listing_claims TO anon, authenticated, service_role;

CREATE POLICY "Allow public insert on listing_claims"
ON public.listing_claims
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

\ir ../migrations/20260831003000_restrict_listing_claim_inserts.sql

SAVEPOINT anon_direct_insert;
SET LOCAL ROLE anon;
\set ON_ERROR_STOP off
INSERT INTO public.listing_claims (listing_id, user_id, email)
VALUES (
  '10000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000001',
  'anon@example.com'
);
\if :ERROR
  \echo 'anon direct claim insert correctly denied'
\else
  \echo 'anon direct claim insert unexpectedly succeeded'
  \quit 1
\endif
\set ON_ERROR_STOP on
ROLLBACK TO SAVEPOINT anon_direct_insert;

SAVEPOINT authenticated_direct_insert;
SET LOCAL ROLE authenticated;
\set ON_ERROR_STOP off
INSERT INTO public.listing_claims (listing_id, user_id, email)
VALUES (
  '10000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000002',
  'authenticated@example.com'
);
\if :ERROR
  \echo 'authenticated direct claim insert correctly denied'
\else
  \echo 'authenticated direct claim insert unexpectedly succeeded'
  \quit 1
\endif
\set ON_ERROR_STOP on
ROLLBACK TO SAVEPOINT authenticated_direct_insert;

SET LOCAL ROLE service_role;
INSERT INTO public.listing_claims (listing_id, user_id, email)
VALUES (
  '10000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000003',
  'backend@example.com'
);
RESET ROLE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.listing_claims
    WHERE email = 'backend@example.com'
  ) THEN
    RAISE EXCEPTION 'service_role backend insert was not preserved';
  END IF;
END;
$$;

ROLLBACK;
