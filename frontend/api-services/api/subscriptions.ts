import { supabase } from '../supabase';
import { apiClient } from '../core/apiClient';

export type SubscriptionTier = 'voyager' | 'signature';

export interface PremiumStatus {
  isPremium: boolean;
  tier: SubscriptionTier | null;
  plan: 'monthly' | 'annual' | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
}

export const subscriptionsService = {
  /**
   * Get user's current premium subscription status.
   * Uses RLS to fetch only the user's own record.
   */
  async getPremiumStatus(userId?: string): Promise<PremiumStatus> {
    const defaultStatus: PremiumStatus = {
      isPremium: false,
      tier: null,
      plan: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    };

    const fetchStatus = async (): Promise<PremiumStatus> => {
      let targetUserId = userId;
      if (!targetUserId) {
        // First try fast local session lookup
        const { data: { session } } = await supabase.auth.getSession();
        targetUserId = session?.user?.id;

        // Fallback to getUser() if no local session found
        if (!targetUserId) {
          const { data: { user } } = await supabase.auth.getUser();
          targetUserId = user?.id;
        }
      }

      if (!targetUserId) return defaultStatus;

      // Use direct client with RLS
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .select('tier, plan, status, current_period_end, cancel_at_period_end')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (error || !data) {
        return defaultStatus;
      }

      return {
        isPremium: data.status === 'active' || data.status === 'trialing',
        tier: (data.tier as SubscriptionTier | null) ?? null,
        plan: data.plan as 'monthly' | 'annual' | null,
        currentPeriodEnd: data.current_period_end,
        cancelAtPeriodEnd: data.cancel_at_period_end,
      };
    };

    // Timeout safety wrapper (max 3000ms)
    return Promise.race([
      fetchStatus(),
      new Promise<PremiumStatus>((resolve) =>
        setTimeout(() => resolve(defaultStatus), 3000)
      ),
    ]);
  },

  /**
   * Create a Stripe Checkout Session for a tier subscription.
   */
  async createSubscriptionCheckout(plan: 'monthly' | 'annual', tier?: SubscriptionTier): Promise<{ url: string }> {
    const data = await apiClient.invokeFunction<{ url?: string; error?: string }>('create-subscription-checkout', tier ? { plan, tier } : { plan });
    if (data?.error) throw new Error(data.error);
    if (!data?.url) throw new Error('No checkout URL returned');

    return { url: data.url };
  },

  /**
   * Cancel subscription at end of billing period.
   */
  async cancelSubscription(): Promise<{ success: boolean }> {
    const data = await apiClient.invokeFunction<{ error?: string }>('cancel-subscription', {});
    if (data?.error) throw new Error(data.error);

    return { success: true };
  },

  /**
   * Get Stripe Customer Portal URL for managing subscription.
   */
  async getSubscriptionPortalUrl(): Promise<{ url: string }> {
    const data = await apiClient.invokeFunction<{ url?: string; error?: string }>('get-subscription-portal', {});
    if (data?.error) throw new Error(data.error);
    if (!data?.url) throw new Error('No portal URL returned');

    return { url: data.url };
  },
};