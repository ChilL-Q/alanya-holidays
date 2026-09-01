-- Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    event_type TEXT NOT NULL,
    details JSONB DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Authenticated users can read audit logs
DROP POLICY IF EXISTS "Authenticated users can read audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can read audit logs" 
ON public.audit_logs FOR SELECT 
TO authenticated 
USING (true);

-- 2. Authenticated users can insert audit logs
DROP POLICY IF EXISTS "Authenticated users can insert audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can insert audit logs" 
ON public.audit_logs FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Service role has full access
DROP POLICY IF EXISTS "Service role has full access to audit logs" ON public.audit_logs;
CREATE POLICY "Service role has full access to audit logs" 
ON public.audit_logs FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Reload Schema Cache
NOTIFY pgrst, 'reload config';
