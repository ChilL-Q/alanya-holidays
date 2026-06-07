-- Remove public INSERT policy on lawyer_contacts
-- The only INSERT path is through the contact-lawyer Edge Function
-- which uses the service_role key (bypasses RLS).
-- The public INSERT policy allowed anonymous users to bypass
-- the Edge Function's Zod validation and insert directly.
-- See: DB_FIXES.md Fix #3

DROP POLICY "Allow public insert on lawyer_contacts" ON public.lawyer_contacts;

-- No replacement INSERT policy needed — service_role bypasses RLS.
-- If direct authenticated INSERT is needed in the future, add:
-- CREATE POLICY "lawyer_contacts_insert_authenticated" ON public.lawyer_contacts
--   FOR INSERT TO authenticated WITH CHECK (true);