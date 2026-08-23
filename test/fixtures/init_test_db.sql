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

-- Base Public Tables
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  phone text,
  company_name text,
  role text DEFAULT 'user',
  is_admin boolean DEFAULT false,
  bio text,
  iban text,
  bank_name text,
  bank_account_holder_name text,
  crypto_wallet text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND (role = 'admin' OR is_admin = true)
  );
END;
$$;

CREATE OR REPLACE FUNCTION storage.foldername(name text)
RETURNS text[] AS $$
  SELECT string_to_array(name, '/');
$$ LANGUAGE sql IMMUTABLE;

CREATE OR REPLACE FUNCTION public.update_property_rating() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.cancel_expired_bookings() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.cancel_expired_pending_bookings() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.expire_listing_addons() RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.get_available_properties(date, date) RETURNS SETOF record AS $$ SELECT 1 WHERE false; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.handle_new_chat_message() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.get_property_by_ref_id(integer) RETURNS SETOF record AS $$ SELECT 1 WHERE false; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.create_booking(uuid, uuid, date, date, numeric, integer, text, text) RETURNS uuid AS $$ SELECT gen_random_uuid(); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.create_booking(uuid, uuid, date, date, numeric, integer, text, text, text) RETURNS uuid AS $$ SELECT gen_random_uuid(); $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.vote_listing(UUID, SMALLINT, TEXT) RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.get_user_vote(UUID, TEXT) RETURNS smallint AS $$ SELECT 0::smallint; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.recalculate_net_votes() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.remove_listing_vote(UUID, TEXT) RETURNS void AS $$ BEGIN END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.get_user_votes_batch(UUID[], TEXT) RETURNS TABLE(listing_id uuid, vote smallint) AS $$ SELECT gen_random_uuid(), 0::smallint WHERE false; $$ LANGUAGE sql;
CREATE OR REPLACE FUNCTION public.enforce_premium_admin() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.enforce_premium_admin_only() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.validate_booking_status_transition() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE OR REPLACE FUNCTION public.validate_blog_submission_status_transition() RETURNS trigger AS $$ BEGIN RETURN NEW; END; $$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  property_type text DEFAULT 'apartment',
  category text DEFAULT 'villa',
  location text,
  district text,
  price_per_night numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  bedrooms integer DEFAULT 1,
  bathrooms integer DEFAULT 1,
  max_guests integer DEFAULT 2,
  images text[] DEFAULT ARRAY[]::text[],
  amenities text[] DEFAULT ARRAY[]::text[],
  is_featured boolean DEFAULT false,
  status text DEFAULT 'approved',
  rating numeric DEFAULT 5.0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  service_type text NOT NULL,
  category text,
  price numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  duration_minutes integer,
  images text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'approved',
  rating numeric DEFAULT 5.0,
  review_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  provider_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  item_type text NOT NULL DEFAULT 'property',
  item_id uuid,
  check_in date,
  check_out date,
  start_date date,
  end_date date,
  guest_count integer DEFAULT 1,
  total_price numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  status text DEFAULT 'pending',
  payment_status text DEFAULT 'pending',
  payout_status text DEFAULT 'pending',
  stripe_session_id text,
  payment_intent_id text,
  guest_name text,
  guest_email text,
  guest_phone text,
  special_requests text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  booking_id uuid REFERENCES public.bookings(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  item_type text NOT NULL DEFAULT 'property',
  item_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  date date NOT NULL,
  is_available boolean DEFAULT true,
  status text DEFAULT 'available',
  price_override numeric,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_ical_feeds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  name text NOT NULL,
  url text NOT NULL,
  last_synced_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  read boolean DEFAULT false,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  artisan_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  price numeric DEFAULT 0,
  currency text DEFAULT 'EUR',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_edits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid REFERENCES public.services(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  title text,
  description text,
  price numeric,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  subject text NOT NULL,
  status text DEFAULT 'open',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  guest_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  host_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id uuid REFERENCES public.properties(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.service_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.property_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id uuid REFERENCES public.properties(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.chat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reported_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  conversation_id uuid REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.directory_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  category_id uuid,
  title text,
  name text,
  slug text,
  is_featured boolean DEFAULT false,
  is_verified boolean DEFAULT false,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text,
  event_type text,
  entity_type text,
  entity_id uuid,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  title text NOT NULL,
  slug text UNIQUE,
  excerpt text,
  content text,
  category text,
  cover_image text,
  tags text[] DEFAULT ARRAY[]::text[],
  is_published boolean DEFAULT false,
  views_count integer DEFAULT 0,
  published_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  tier text DEFAULT 'explorer',
  status text DEFAULT 'active',
  current_period_end timestamptz,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text,
  content text NOT NULL,
  avatar_url text,
  rating integer DEFAULT 5,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on core tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.property_ical_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
