-- ============================================================================
-- PostgreSQL Test DB Initialization & Supabase Schema Mock
-- Used by CI to validate migrations and RLS policies
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Mock Auth Schema
CREATE SCHEMA IF NOT EXISTS auth;

CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  role text DEFAULT 'authenticated',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION auth.uid() 
RETURNS uuid AS $$ 
  SELECT null::uuid 
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.role() 
RETURNS text AS $$ 
  SELECT 'authenticated'::text 
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.email() 
RETURNS text AS $$ 
  SELECT 'test@example.com'::text 
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION auth.jwt() 
RETURNS jsonb AS $$ 
  SELECT '{}'::jsonb 
$$ LANGUAGE sql STABLE;

-- Mock pg_cron Schema
CREATE SCHEMA IF NOT EXISTS cron;

CREATE TABLE IF NOT EXISTS cron.job (
  jobid bigserial PRIMARY KEY,
  schedule text,
  command text,
  nodename text,
  nodeport integer,
  database text,
  username text,
  active boolean,
  jobname text
);

CREATE OR REPLACE FUNCTION cron.schedule(name text, schedule text, command text) 
RETURNS bigint AS $$ 
  SELECT 1::bigint 
$$ LANGUAGE sql;

CREATE OR REPLACE FUNCTION cron.unschedule(name text) 
RETURNS void AS $$ 
$$ LANGUAGE sql;

-- Mock Storage Schema
CREATE SCHEMA IF NOT EXISTS storage;

CREATE TABLE IF NOT EXISTS storage.buckets (
  id text PRIMARY KEY,
  name text,
  public boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS storage.objects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket_id text REFERENCES storage.buckets(id),
  name text,
  owner uuid,
  created_at timestamptz DEFAULT now()
);

-- Pre-seed public enums if needed
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE public.payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payout_status') THEN
    CREATE TYPE public.payout_status AS ENUM ('pending', 'eligible', 'processing', 'paid', 'failed');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'approval_status') THEN
    CREATE TYPE public.approval_status AS ENUM ('approved', 'pending', 'rejected');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
    CREATE TYPE public.notification_type AS ENUM ('info', 'success', 'warning', 'error');
  END IF;
END $$;
