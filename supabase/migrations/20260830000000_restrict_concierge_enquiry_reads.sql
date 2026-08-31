-- Concierge enquiries contain contact details and request text. Public clients
-- may submit them, but only the service-role backend may read them.
DROP POLICY IF EXISTS "concierge_enquiries_public_select"
  ON public.concierge_enquiries;

REVOKE SELECT ON TABLE public.concierge_enquiries
  FROM PUBLIC, anon, authenticated;
