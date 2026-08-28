-- Foundation for business registration without changing existing resource ownership rules.

-- Replace the deployed listing-claim approval function to remove its dependency
-- on the legacy profiles.is_admin column while preserving its existing behavior.
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
  v_claim public.listing_claims%ROWTYPE;
  v_is_admin BOOLEAN;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = p_user_id
      AND role = 'admin'
  )
  INTO v_is_admin;

  IF NOT v_is_admin THEN
    RETURN QUERY
    SELECT false, 'Only admins can approve claims'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  SELECT *
  INTO v_claim
  FROM public.listing_claims
  WHERE id = p_claim_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Claim not found'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  IF v_claim.status = 'approved' THEN
    RETURN QUERY
    SELECT true, 'Claim already approved'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  IF v_claim.status <> 'pending' THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  PERFORM 1
  FROM public.directory_listings
  WHERE id = v_claim.listing_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Listing not found'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  -- Recheck after both rows are locked. The listing lock serializes approvals
  -- for distinct claims that target the same listing.
  IF v_claim.status <> 'pending' THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.listing_claims AS other_claim
    WHERE other_claim.listing_id = v_claim.listing_id
      AND other_claim.status = 'approved'
      AND other_claim.id <> v_claim.id
  ) THEN
    RETURN QUERY
    SELECT false, 'Another claim is already approved'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  UPDATE public.directory_listings
  SET
    name = v_claim.business_name,
    whatsapp = v_claim.contact_phone,
    website = v_claim.website,
    address = v_claim.address,
    short_description = v_claim.description,
    owner_user_id = v_claim.user_id,
    claimed_at = now(),
    updated_at = now()
  WHERE id = v_claim.listing_id;

  UPDATE public.listing_claims
  SET status = 'approved', updated_at = now()
  WHERE id = v_claim.id
    AND status = 'pending';

  IF NOT FOUND THEN
    RETURN QUERY
    SELECT false, 'Claim is not pending'::TEXT, v_claim.listing_id;
    RETURN;
  END IF;

  RETURN QUERY
  SELECT true, 'Claim approved successfully'::TEXT, v_claim.listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM anon;
REVOKE EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.approve_listing_claim(UUID, UUID) TO service_role;

CREATE TABLE public.business_account_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  account_type TEXT NOT NULL,
  business_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  website TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT business_account_applications_account_type_check
    CHECK (account_type IN ('seller', 'service_provider', 'property_host', 'directory_owner')),
  CONSTRAINT business_account_applications_business_name_check
    CHECK (business_name = btrim(business_name) AND char_length(business_name) BETWEEN 2 AND 120),
  CONSTRAINT business_account_applications_contact_email_check
    CHECK (
      contact_email = btrim(contact_email)
      AND char_length(contact_email) BETWEEN 3 AND 254
      AND contact_email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$'
    ),
  CONSTRAINT business_account_applications_contact_phone_check
    CHECK (
      contact_phone IS NULL
      OR (contact_phone = btrim(contact_phone) AND char_length(contact_phone) BETWEEN 7 AND 32)
    ),
  CONSTRAINT business_account_applications_website_check
    CHECK (
      website IS NULL
      OR (
        website = btrim(website)
        AND char_length(website) BETWEEN 8 AND 2048
        AND website ~* '^https?://[^[:space:]]+$'
      )
    ),
  CONSTRAINT business_account_applications_status_check
    CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  CONSTRAINT business_account_applications_rejection_reason_check
    CHECK (
      rejection_reason IS NULL
      OR (rejection_reason = btrim(rejection_reason) AND char_length(rejection_reason) BETWEEN 3 AND 1000)
    ),
  CONSTRAINT business_account_applications_lifecycle_check
    CHECK (
      (status = 'pending' AND rejection_reason IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL)
      OR (status = 'approved' AND rejection_reason IS NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
      OR (status = 'rejected' AND rejection_reason IS NOT NULL AND reviewed_by IS NOT NULL AND reviewed_at IS NOT NULL)
      OR (status = 'withdrawn' AND rejection_reason IS NULL AND reviewed_by IS NULL AND reviewed_at IS NULL)
    ),
  CONSTRAINT business_account_applications_timestamps_check
    CHECK (updated_at >= created_at)
);

CREATE UNIQUE INDEX business_account_applications_one_pending_idx
  ON public.business_account_applications (applicant_user_id)
  WHERE status = 'pending';

CREATE UNIQUE INDEX business_account_applications_one_approved_idx
  ON public.business_account_applications (applicant_user_id, account_type)
  WHERE status = 'approved';

CREATE INDEX business_account_applications_applicant_created_idx
  ON public.business_account_applications (applicant_user_id, created_at DESC);

CREATE INDEX business_account_applications_pending_created_idx
  ON public.business_account_applications (created_at)
  WHERE status = 'pending';

ALTER TABLE public.business_account_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "business applications: owner read"
  ON public.business_account_applications
  FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = applicant_user_id);

REVOKE ALL ON TABLE public.business_account_applications FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.business_account_applications TO authenticated;
GRANT ALL ON TABLE public.business_account_applications TO service_role;

CREATE OR REPLACE FUNCTION public.transition_business_account_application(
  p_application_id UUID,
  p_status TEXT,
  p_reviewed_by UUID DEFAULT NULL,
  p_rejection_reason TEXT DEFAULT NULL
)
RETURNS public.business_account_applications
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_application public.business_account_applications%ROWTYPE;
  v_now TIMESTAMPTZ := clock_timestamp();
BEGIN
  IF p_status NOT IN ('approved', 'rejected', 'withdrawn') THEN
    RAISE EXCEPTION 'Unsupported business application status: %', p_status
      USING ERRCODE = '22023';
  END IF;

  IF p_status IN ('approved', 'rejected') AND p_reviewed_by IS NULL THEN
    RAISE EXCEPTION 'reviewed_by is required for review decisions'
      USING ERRCODE = '23514';
  END IF;

  IF p_status = 'rejected' AND (
    p_rejection_reason IS NULL
    OR char_length(btrim(p_rejection_reason)) NOT BETWEEN 3 AND 1000
  ) THEN
    RAISE EXCEPTION 'A rejection reason between 3 and 1000 characters is required'
      USING ERRCODE = '23514';
  END IF;

  IF p_status <> 'rejected' AND p_rejection_reason IS NOT NULL THEN
    RAISE EXCEPTION 'rejection_reason is only valid when rejecting an application'
      USING ERRCODE = '23514';
  END IF;

  IF p_status = 'withdrawn' AND p_reviewed_by IS NOT NULL THEN
    RAISE EXCEPTION 'withdrawn applications cannot have a reviewer'
      USING ERRCODE = '23514';
  END IF;

  SELECT *
  INTO v_application
  FROM public.business_account_applications
  WHERE id = p_application_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Business account application not found'
      USING ERRCODE = 'P0002';
  END IF;

  IF v_application.status <> 'pending' THEN
    RAISE EXCEPTION 'Only pending business account applications can transition'
      USING ERRCODE = '23514';
  END IF;

  UPDATE public.business_account_applications
  SET
    status = p_status,
    rejection_reason = CASE WHEN p_status = 'rejected' THEN btrim(p_rejection_reason) ELSE NULL END,
    reviewed_by = CASE WHEN p_status IN ('approved', 'rejected') THEN p_reviewed_by ELSE NULL END,
    reviewed_at = CASE WHEN p_status IN ('approved', 'rejected') THEN v_now ELSE NULL END,
    updated_at = v_now
  WHERE id = p_application_id
  RETURNING * INTO v_application;

  RETURN v_application;
END;
$$;

REVOKE ALL ON FUNCTION public.transition_business_account_application(UUID, TEXT, UUID, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transition_business_account_application(UUID, TEXT, UUID, TEXT)
  TO service_role;

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_claims JSONB := COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::JSONB;
  v_actor_id UUID;
  v_is_trusted BOOLEAN;
BEGIN
  IF NEW.role IS NOT DISTINCT FROM OLD.role THEN
    RETURN NEW;
  END IF;

  BEGIN
    v_actor_id := NULLIF(v_claims->>'sub', '')::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    v_actor_id := NULL;
  END;

  v_is_trusted := current_user IN ('postgres', 'supabase_admin', 'service_role')
    OR EXISTS (
      SELECT 1
      FROM public.profiles AS actor
      WHERE actor.id = v_actor_id
        AND actor.role = 'admin'
    );

  IF NOT v_is_trusted THEN
    RAISE EXCEPTION 'Only trusted backend or admin workflows may change profile privileges'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE OF role ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_profile_privileges();

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_metadata JSONB := COALESCE(NEW.raw_user_meta_data, '{}'::JSONB);
  v_account_type TEXT := v_metadata->>'account_type';
  v_business_name TEXT := v_metadata->>'business_name';
  v_contact_email TEXT := v_metadata->>'contact_email';
  v_contact_phone TEXT := NULLIF(v_metadata->>'contact_phone', '');
  v_website TEXT := NULLIF(v_metadata->>'website', '');
  v_business_metadata_valid BOOLEAN;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, company_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(v_metadata->>'full_name', ''),
    COALESCE(NEW.email, ''),
    'guest',
    v_metadata->>'company_name',
    v_metadata->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  v_business_metadata_valid :=
    v_metadata->>'registration_path' = 'business'
    AND v_account_type IN ('seller', 'service_provider', 'property_host', 'directory_owner')
    AND v_business_name = btrim(v_business_name)
    AND char_length(v_business_name) BETWEEN 2 AND 120
    AND v_contact_email = btrim(v_contact_email)
    AND char_length(v_contact_email) BETWEEN 3 AND 254
    AND v_contact_email ~* '^[A-Z0-9.!#$%&''*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$'
    AND (v_contact_phone IS NULL OR (
      v_contact_phone = btrim(v_contact_phone)
      AND char_length(v_contact_phone) BETWEEN 7 AND 32
    ))
    AND (v_website IS NULL OR (
      v_website = btrim(v_website)
      AND char_length(v_website) BETWEEN 8 AND 2048
      AND v_website ~* '^https?://[^[:space:]]+$'
    ));

  IF COALESCE(v_business_metadata_valid, false) THEN
    INSERT INTO public.business_account_applications (
      applicant_user_id,
      account_type,
      business_name,
      contact_email,
      contact_phone,
      website
    )
    VALUES (
      NEW.id,
      v_account_type,
      v_business_name,
      lower(v_contact_email),
      v_contact_phone,
      v_website
    )
    ON CONFLICT (applicant_user_id) WHERE status = 'pending'
    DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;
