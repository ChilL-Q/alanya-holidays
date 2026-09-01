\set ON_ERROR_STOP on

BEGIN;

DO $$
DECLARE
  v_regular_id UUID := '12000000-0000-4000-8000-000000000001';
  v_applicant_id UUID := '12000000-0000-4000-8000-000000000002';
  v_admin_id UUID := '12000000-0000-4000-8000-000000000003';
  v_invalid_id UUID := '12000000-0000-4000-8000-000000000004';
  v_second_applicant_id UUID := '12000000-0000-4000-8000-000000000005';
  v_application_id UUID;
  v_second_application_id UUID;
  v_application public.business_account_applications%ROWTYPE;
  v_count INTEGER;
BEGIN
  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (v_regular_id, 'regular@example.test', '{"full_name":"Regular User"}'::JSONB);

  IF (SELECT role FROM public.profiles WHERE id = v_regular_id) <> 'guest' THEN
    RAISE EXCEPTION 'Regular signup did not receive the guest role';
  END IF;

  SELECT count(*) INTO v_count
  FROM public.business_account_applications
  WHERE applicant_user_id = v_regular_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Regular signup created a business application';
  END IF;

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (v_admin_id, 'business-admin@example.test', '{"full_name":"Business Admin"}'::JSONB);
  UPDATE public.profiles SET role = 'admin' WHERE id = v_admin_id;

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    v_applicant_id,
    'business-owner@example.test',
    jsonb_build_object(
      'registration_path', 'business',
      'account_type', 'seller',
      'business_name', 'Alanya Market',
      'contact_email', 'Owner@Example.test',
      'contact_phone', '+90 555 000 0000',
      'website', 'https://example.test',
      'role', 'admin'
    )
  );

  IF (SELECT role FROM public.profiles WHERE id = v_applicant_id) <> 'guest' THEN
    RAISE EXCEPTION 'Role metadata escalated business signup privileges';
  END IF;

  SELECT * INTO v_application
  FROM public.business_account_applications
  WHERE applicant_user_id = v_applicant_id;

  IF v_application.id IS NULL
     OR v_application.account_type <> 'seller'
     OR v_application.business_name <> 'Alanya Market'
     OR v_application.contact_email <> 'owner@example.test'
     OR v_application.contact_phone <> '+90 555 000 0000'
     OR v_application.website <> 'https://example.test'
     OR v_application.status <> 'pending'
     OR v_application.rejection_reason IS NOT NULL
     OR v_application.reviewed_by IS NOT NULL
     OR v_application.reviewed_at IS NOT NULL THEN
    RAISE EXCEPTION 'Valid business signup application mismatch: %', row_to_json(v_application);
  END IF;
  v_application_id := v_application.id;

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    v_invalid_id,
    'invalid-business@example.test',
    '{"registration_path":"business","account_type":"seller","business_name":"X","contact_email":"not-an-email"}'::JSONB
  );

  SELECT count(*) INTO v_count
  FROM public.business_account_applications
  WHERE applicant_user_id = v_invalid_id;
  IF v_count <> 0 THEN
    RAISE EXCEPTION 'Invalid business metadata created an application';
  END IF;

  BEGIN
    INSERT INTO public.business_account_applications (
      applicant_user_id, account_type, business_name, contact_email
    ) VALUES (
      v_applicant_id, 'service_provider', 'Second Pending Business', 'second@example.test'
    );
    RAISE EXCEPTION 'A second global pending application was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  IF has_function_privilege('anon', 'public.transition_business_account_application(uuid,text,uuid,text)', 'EXECUTE')
     OR has_function_privilege('authenticated', 'public.transition_business_account_application(uuid,text,uuid,text)', 'EXECUTE')
     OR NOT has_function_privilege('service_role', 'public.transition_business_account_application(uuid,text,uuid,text)', 'EXECUTE') THEN
    RAISE EXCEPTION 'Unexpected business lifecycle RPC privileges';
  END IF;

  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_applicant_id, 'role', 'authenticated')::TEXT, true);
  SET LOCAL ROLE authenticated;
  BEGIN
    UPDATE public.profiles SET role = 'admin' WHERE id = v_applicant_id;
    RAISE EXCEPTION 'Authenticated owner directly escalated profile role';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  BEGIN
    PERFORM public.transition_business_account_application(v_application_id, 'approved', v_admin_id, NULL);
    RAISE EXCEPTION 'Authenticated user executed the service-role-only transition';
  EXCEPTION WHEN insufficient_privilege THEN
    NULL;
  END;
  RESET ROLE;

  SET LOCAL ROLE service_role;
  UPDATE public.profiles SET role = 'seller' WHERE id = v_applicant_id;
  RESET ROLE;
  SET LOCAL ROLE supabase_admin;
  UPDATE public.profiles SET role = 'guest' WHERE id = v_applicant_id;
  RESET ROLE;

  IF (SELECT role FROM public.profiles WHERE id = v_applicant_id) <> 'guest' THEN
    RAISE EXCEPTION 'Trusted database roles could not change a profile role';
  END IF;

  PERFORM set_config('request.jwt.claims', jsonb_build_object('sub', v_admin_id, 'role', 'authenticated')::TEXT, true);
  SET LOCAL ROLE authenticated;
  UPDATE public.profiles SET role = 'seller' WHERE id = v_applicant_id;
  RESET ROLE;
  IF (SELECT role FROM public.profiles WHERE id = v_applicant_id) <> 'seller' THEN
    RAISE EXCEPTION 'Authenticated profile admin could not change a profile role';
  END IF;

  UPDATE public.profiles SET role = 'guest' WHERE id = v_applicant_id;
  PERFORM set_config('request.jwt.claims', '{}', true);

  SET LOCAL ROLE service_role;
  SELECT * INTO v_application
  FROM public.transition_business_account_application(v_application_id, 'approved', v_admin_id, NULL);
  RESET ROLE;

  IF v_application.status <> 'approved'
     OR v_application.reviewed_by IS DISTINCT FROM v_admin_id
     OR v_application.reviewed_at IS NULL
     OR v_application.rejection_reason IS NOT NULL
     OR v_application.updated_at < v_application.created_at THEN
    RAISE EXCEPTION 'Approval lifecycle fields are invalid: %', row_to_json(v_application);
  END IF;

  INSERT INTO public.business_account_applications (
    applicant_user_id, account_type, business_name, contact_email
  ) VALUES (
    v_applicant_id, 'service_provider', 'Alanya Services', 'services@example.test'
  ) RETURNING id INTO v_second_application_id;

  SET LOCAL ROLE service_role;
  PERFORM public.transition_business_account_application(v_second_application_id, 'approved', v_admin_id, NULL);
  RESET ROLE;

  SELECT count(*) INTO v_count
  FROM public.business_account_applications
  WHERE applicant_user_id = v_applicant_id AND status = 'approved';
  IF v_count <> 2 THEN
    RAISE EXCEPTION 'Approved applications were not preserved per applicant/type';
  END IF;

  BEGIN
    INSERT INTO public.business_account_applications (
      applicant_user_id, account_type, business_name, contact_email,
      status, reviewed_by, reviewed_at
    ) VALUES (
      v_applicant_id, 'seller', 'Duplicate Approved Market', 'duplicate@example.test',
      'approved', v_admin_id, now()
    );
    RAISE EXCEPTION 'Duplicate approved application for one type was accepted';
  EXCEPTION WHEN unique_violation THEN
    NULL;
  END;

  INSERT INTO auth.users (id, email, raw_user_meta_data)
  VALUES (
    v_second_applicant_id,
    'rejected-owner@example.test',
    '{"registration_path":"business","account_type":"property_host","business_name":"Rejected Stay","contact_email":"stay@example.test"}'::JSONB
  );
  SELECT id INTO v_second_application_id
  FROM public.business_account_applications
  WHERE applicant_user_id = v_second_applicant_id;

  SET LOCAL ROLE service_role;
  SELECT * INTO v_application
  FROM public.transition_business_account_application(
    v_second_application_id, 'rejected', v_admin_id, 'Business details could not be verified'
  );
  RESET ROLE;

  IF v_application.status <> 'rejected'
     OR v_application.rejection_reason <> 'Business details could not be verified'
     OR v_application.reviewed_by IS DISTINCT FROM v_admin_id
     OR v_application.reviewed_at IS NULL THEN
    RAISE EXCEPTION 'Rejection lifecycle fields are invalid: %', row_to_json(v_application);
  END IF;

  SET LOCAL ROLE service_role;
  BEGIN
    PERFORM public.transition_business_account_application(
      v_second_application_id, 'approved', v_admin_id, NULL
    );
    RAISE EXCEPTION 'Terminal application transitioned twice';
  EXCEPTION WHEN check_violation THEN
    NULL;
  END;
  RESET ROLE;
END;
$$;

ROLLBACK;

SELECT 'Business account registration verification passed' AS result;
