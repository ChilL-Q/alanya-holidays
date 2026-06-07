-- Purpose: Require authentication for messages INSERT.
-- The prior policy "messages_insert_public" (created in 20260407145257) had no TO clause,
-- making it apply to all roles including anon. Contact form submissions now require login.
DROP POLICY IF EXISTS "messages_insert_public" ON public.messages;

CREATE POLICY "messages_insert_authenticated" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (true);
