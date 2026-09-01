-- Purpose: Sprint "Drafts everywhere" (#11) — allow draft listings for
-- properties and services. Adds 'draft' to the status CHECK constraints
-- (constraint names vary across environments, resolved dynamically) and
-- widens owner RLS INSERT policies to accept 'draft' in addition to 'pending'.

-- ============================================================
-- 1. Status CHECK constraints: include 'draft'
-- ============================================================

DO $$
DECLARE
  con_name text;
  rel_name text;
  old_def text;
  new_def text;
BEGIN
  FOR con_name, rel_name, old_def IN
    SELECT c.conname::text, cl.relname::text, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_class cl ON cl.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = cl.relnamespace
    WHERE c.contype = 'c'
      AND n.nspname = 'public'
      AND cl.relname IN ('properties', 'services')
      AND pg_get_constraintdef(c.oid) ILIKE '%status%'
      AND pg_get_constraintdef(c.oid) ILIKE '%pending%'
  LOOP
    IF old_def ILIKE '%draft%' THEN
      CONTINUE;
    END IF;

    BEGIN
      EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', rel_name, con_name);
      -- Insert 'draft' at the head of the status IN-list.
      new_def := regexp_replace(old_def, '\(''pending''', '(''draft'', ''pending''', 'i');
      EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I %s', rel_name, con_name, new_def);
    EXCEPTION WHEN others THEN
      RAISE WARNING 'Failed to widen status check on %.%: %', rel_name, con_name, SQLERRM;
    END;
  END LOOP;
END $$;

-- ============================================================
-- 2. RLS: owners may insert their own drafts
-- ============================================================

DROP POLICY IF EXISTS "properties_insert" ON public.properties;
CREATE POLICY "properties_insert" ON public.properties FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = host_id AND status IN ('draft', 'pending'));

DROP POLICY IF EXISTS "services_insert" ON public.services;
CREATE POLICY "services_insert" ON public.services FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = provider_id AND status IN ('draft', 'pending'));
