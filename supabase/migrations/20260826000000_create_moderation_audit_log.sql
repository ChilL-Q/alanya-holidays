-- Migration: 20260826000000_create_moderation_audit_log.sql
-- Description: Centralized immutable moderation audit log table with composite indexes and admin RLS

CREATE TABLE IF NOT EXISTS public.moderation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Composite and standard B-Tree indexes for fast audit querying and filtering
CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_entity
    ON public.moderation_audit_log (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_created_at
    ON public.moderation_audit_log (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_admin_id
    ON public.moderation_audit_log (admin_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_moderation_audit_log_action
    ON public.moderation_audit_log (action, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.moderation_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS: Only admins can view moderation audit logs
CREATE POLICY "moderation_audit_log_select_admin" ON public.moderation_audit_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
        )
    );

-- RLS: Only admins or system service role can insert moderation audit logs
CREATE POLICY "moderation_audit_log_insert_admin" ON public.moderation_audit_log
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = (SELECT auth.uid())
              AND profiles.role = 'admin'
        )
    );
