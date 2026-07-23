import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { subscriptionsService } from './subscriptions';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
    supabase: {
        auth: {
            getUser: vi.fn(),
            getSession: vi.fn(),
        },
        from: vi.fn(),
    }
}));

describe('subscriptionsService.getPremiumStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns default un-premium status if no session or user found', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({ data: { session: null } });
        (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

        const promise = subscriptionsService.getPremiumStatus();
        await vi.runAllTimersAsync();
        const status = await promise;

        expect(status).toEqual({
            isPremium: false,
            tier: null,
            plan: null,
            currentPeriodEnd: null,
            cancelAtPeriodEnd: false,
        });
    });

    it('times out and returns default status if database query hangs', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: { id: 'user-123' } } }
        });

        // Mock a hanging query that never resolves
        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockReturnValue(new Promise(() => {}))
        });

        const promise = subscriptionsService.getPremiumStatus();
        
        // Fast-forward past the 3000ms timeout
        await vi.advanceTimersByTimeAsync(3500);

        const status = await promise;
        expect(status.isPremium).toBe(false);
    });

    it('returns active premium status when record exists and is active', async () => {
        (supabase.auth.getSession as any).mockResolvedValue({
            data: { session: { user: { id: 'user-123' } } }
        });

        (supabase.from as any).mockReturnValue({
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
                data: {
                    status: 'active',
                    tier: 'voyager',
                    plan: 'monthly',
                    current_period_end: '2026-12-31',
                    cancel_at_period_end: false
                },
                error: null
            })
        });

        const promise = subscriptionsService.getPremiumStatus();
        await vi.runAllTimersAsync();
        const status = await promise;

        expect(status.isPremium).toBe(true);
        expect(status.tier).toBe('voyager');
    });
});
