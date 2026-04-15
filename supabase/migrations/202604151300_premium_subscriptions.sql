-- Create table for premium subscriptions
CREATE TABLE IF NOT EXISTS public.premium_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL CHECK (plan IN ('monthly', 'annual')),
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('active', 'cancelled', 'past_due', 'trialing')),
    stripe_subscription_id TEXT UNIQUE NOT NULL,
    stripe_customer_id TEXT NOT NULL,
    current_period_end TIMESTAMPTZ NOT NULL,
    cancel_at_period_end BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for stripe_subscription_id lookups (user_id already has UNIQUE constraint above)
CREATE UNIQUE INDEX idx_premium_subscriptions_stripe_sub_id ON public.premium_subscriptions (stripe_subscription_id);

-- RLS Policies
ALTER TABLE public.premium_subscriptions ENABLE ROW LEVEL SECURITY;

-- User can only read their own subscription
CREATE POLICY "Users can view their own subscription"
ON public.premium_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admin can view all subscriptions
CREATE POLICY "Admins can view all subscriptions"
ON public.premium_subscriptions
FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- INSERT/UPDATE/DELETE only for service role (via webhook and RPC logic)
-- We create the table without public insert policy.
-- The `is_premium` RPC will use SECURITY DEFINER to bypass this for checks.
-- Webhook will use SERVICE_ROLE_KEY which bypasses RLS anyway.

-- Trigger for updated_at auto-update
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_premium_subscriptions_updated_at
    BEFORE UPDATE ON public.premium_subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();