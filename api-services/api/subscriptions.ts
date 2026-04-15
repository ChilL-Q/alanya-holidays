import { supabase } from '../supabase';

export interface PremiumStatus {
  isPremium: boolean;
  plan: 'monthly' | 'annual' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const subscriptionsService = {
  /**
   * Get user's current premium subscription status.
   * Uses RLS to fetch only the user's own record.
   */
  async getPremiumStatus(): Promise<PremiumStatus> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { isPremium: false, plan: null, currentPeriodEnd: null, cancelAtPeriodEnd: false };

    // Use direct client with RLS
    const { data, error } = await supabase
      .from('premium_subscriptions')
      .select('plan, status, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !data) {
      return { isPremium: false, plan: null, currentPeriodEnd: null, cancelAtPeriodEnd: false };
    }

    return {
      isPremium: data.status === 'active',
      plan: data.plan as 'monthly' | 'annual' | null,
      currentPeriodEnd: data.current_period_end,
      cancelAtPeriodEnd: data.cancel_at_period_end,
    };
  },

  /**
   * Create a Stripe Checkout Session for subscription.
   */
  async createSubscriptionCheckout(plan: 'monthly' | 'annual'): Promise<{ url: string }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase.functions.invoke('create-subscription-checkout', {
      body: { plan },
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.url) throw new Error('No checkout URL returned');

    return { url: data.url };
  },

  /**
   * Cancel subscription at end of billing period.
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    const { data, error } = await supabase.functions.invoke('cancel-subscription', {
      body: {},
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);

    return { success: true };
  },

  /**
   * Get Stripe Customer Portal URL for managing subscription.
   */
  async getSubscriptionPortalUrl(): Promise<{ url: string }> {
    const { data, error } = await supabase.functions.invoke('get-subscription-portal', {
      body: {},
    });

    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    if (!data?.url) throw new Error('No portal URL returned');

    return { url: data.url };
  },
};