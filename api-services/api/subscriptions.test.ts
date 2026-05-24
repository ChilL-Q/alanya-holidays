import { describe, it, expect, vi, beforeEach } from 'vitest';
import { subscriptionsService } from './subscriptions';

const { mockSupabase } = vi.hoisted(() => {
  return {
    mockSupabase: {
      from: vi.fn(),
      auth: {
        getUser: vi.fn().mockResolvedValue({ data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null }),
      },
      functions: {
        invoke: vi.fn().mockResolvedValue({ data: null, error: null }),
      },
    },
  };
});

vi.mock('../supabase', () => ({
  supabase: mockSupabase,
}));

describe('subscriptionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: '550e8400-e29b-41d4-a716-446655440001' } }, error: null,
    });
  });

  const createMockChain = (data: any = null, error: any = null) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      maybeSingle: vi.fn().mockResolvedValue({ data: Array.isArray(data) ? data[0] : data, error }),
      then: (resolve: any) => resolve({ data, count: error ? 0 : 1, error }),
    };
    return chain;
  };

  describe('getPremiumStatus', () => {
    it('returns default non-premium when user is not authenticated', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      const result = await subscriptionsService.getPremiumStatus();
      expect(result.isPremium).toBe(false);
      expect(result.tier).toBeNull();
      expect(result.plan).toBeNull();
      expect(result.currentPeriodEnd).toBeNull();
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it('returns premium true for active status', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          tier: 'voyager',
          plan: 'monthly',
          status: 'active',
          current_period_end: '2025-12-31',
          cancel_at_period_end: false,
        })
      );
      const result = await subscriptionsService.getPremiumStatus();
      expect(result.isPremium).toBe(true);
      expect(result.tier).toBe('voyager');
      expect(result.plan).toBe('monthly');
      expect(result.currentPeriodEnd).toBe('2025-12-31');
      expect(result.cancelAtPeriodEnd).toBe(false);
    });

    it('returns premium true for trialing status', async () => {
      mockSupabase.from.mockReturnValue(
        createMockChain({
          tier: 'signature',
          plan: 'annual',
          status: 'trialing',
          current_period_end: '2025-06-30',
          cancel_at_period_end: true,
        })
      );
      const result = await subscriptionsService.getPremiumStatus();
      expect(result.isPremium).toBe(true);
      expect(result.tier).toBe('signature');
      expect(result.plan).toBe('annual');
      expect(result.cancelAtPeriodEnd).toBe(true);
    });

    it('returns non-premium when subscription query errors', async () => {
      mockSupabase.from.mockReturnValue(createMockChain(null, new Error('DB error')));
      const result = await subscriptionsService.getPremiumStatus();
      expect(result.isPremium).toBe(false);
      expect(result.tier).toBeNull();
    });

    it('returns non-premium when no subscription record exists', async () => {
      mockSupabase.from.mockReturnValue(createMockChain(null));
      const result = await subscriptionsService.getPremiumStatus();
      expect(result.isPremium).toBe(false);
      expect(result.tier).toBeNull();
    });
  });

  describe('createSubscriptionCheckout', () => {
    it('throws Not authenticated when user is null', async () => {
      mockSupabase.auth.getUser.mockResolvedValueOnce({ data: { user: null }, error: null });
      await expect(subscriptionsService.createSubscriptionCheckout('monthly')).rejects.toThrow('Not authenticated');
    });

    it('returns url on successful invoke', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { url: 'https://checkout.stripe.com/test' }, error: null });
      const result = await subscriptionsService.createSubscriptionCheckout('annual', 'voyager');
      expect(result.url).toBe('https://checkout.stripe.com/test');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('create-subscription-checkout', {
        body: { plan: 'annual', tier: 'voyager' },
      });
    });

    it('throws when invoke returns an error', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: new Error('Invoke failed') });
      await expect(subscriptionsService.createSubscriptionCheckout('monthly')).rejects.toThrow('Invoke failed');
    });

    it('throws when data.error is present', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { error: 'Plan invalid' }, error: null });
      await expect(subscriptionsService.createSubscriptionCheckout('monthly')).rejects.toThrow('Plan invalid');
    });

    it('throws when no url is returned', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: {}, error: null });
      await expect(subscriptionsService.createSubscriptionCheckout('monthly')).rejects.toThrow('No checkout URL returned');
    });
  });

  describe('cancelSubscription', () => {
    it('returns success true on successful invoke', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { success: true }, error: null });
      const result = await subscriptionsService.cancelSubscription();
      expect(result.success).toBe(true);
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('cancel-subscription', { body: {} });
    });

    it('throws when invoke returns an error', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: new Error('Cancel failed') });
      await expect(subscriptionsService.cancelSubscription()).rejects.toThrow('Cancel failed');
    });

    it('throws when data.error is present', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { error: 'No active subscription' }, error: null });
      await expect(subscriptionsService.cancelSubscription()).rejects.toThrow('No active subscription');
    });
  });

  describe('getSubscriptionPortalUrl', () => {
    it('returns url on successful invoke', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { url: 'https://billing.stripe.com/portal' }, error: null });
      const result = await subscriptionsService.getSubscriptionPortalUrl();
      expect(result.url).toBe('https://billing.stripe.com/portal');
      expect(mockSupabase.functions.invoke).toHaveBeenCalledWith('get-subscription-portal', { body: {} });
    });

    it('throws when invoke returns an error', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: null, error: new Error('Portal failed') });
      await expect(subscriptionsService.getSubscriptionPortalUrl()).rejects.toThrow('Portal failed');
    });

    it('throws when data.error is present', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: { error: 'No customer' }, error: null });
      await expect(subscriptionsService.getSubscriptionPortalUrl()).rejects.toThrow('No customer');
    });

    it('throws when no url is returned', async () => {
      mockSupabase.functions.invoke.mockResolvedValueOnce({ data: {}, error: null });
      await expect(subscriptionsService.getSubscriptionPortalUrl()).rejects.toThrow('No portal URL returned');
    });
  });
});
