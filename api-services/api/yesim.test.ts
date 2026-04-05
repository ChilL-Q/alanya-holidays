import { describe, it, expect, vi, beforeEach } from 'vitest';
import { yesimService } from './yesim';
import { supabase } from '../supabase';

vi.mock('../supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

describe('yesimService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPlans', () => {
        it('returns plans from edge function', async () => {
            const mockPlans = [
                { id: 'turkey_3gb', name: 'Turkey Essential', days: '7', price: '3.50', data: '3', countries_included: 'Turkey', countryIso2: 'TR', operators: 'Turkcell', image: 'https://cdn.yesim.app/flags/ver/1/tr.svg', plan_type: 'country' },
            ];
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: { data: mockPlans },
                error: null,
            });

            const plans = await yesimService.getPlans();

            expect(supabase.functions.invoke).toHaveBeenCalledWith('yesim-proxy', {
                body: { action: 'getPlans' },
            });
            expect(plans).toEqual(mockPlans);
            expect(plans[0]).toHaveProperty('name', 'Turkey Essential');
        });

        it('throws when edge function returns error', async () => {
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: null,
                error: { message: 'API Error' },
            });

            await expect(yesimService.getPlans()).rejects.toThrow('API Error');
        });
    });

    describe('createOrder', () => {
        it('completes the full order flow via edge function', async () => {
            const mockOrder = {
                id: 'SIM123',
                iccid: 'ICCID123',
                qrcode: 'QRDATA',
                ios_tap_link: 'APPLINK',
            };
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: { data: mockOrder },
                error: null,
            });

            const order = await yesimService.createOrder('plan123');

            expect(supabase.functions.invoke).toHaveBeenCalledWith('yesim-proxy', {
                body: { action: 'createOrder', planId: 'plan123' },
            });
            expect(order).toEqual(mockOrder);
        });

        it('throws error if edge function returns error', async () => {
            (supabase.functions.invoke as any).mockResolvedValueOnce({
                data: { error: 'Activation failed' },
                error: null,
            });

            await expect(yesimService.createOrder('plan123')).rejects.toThrow('Activation failed');
        });
    });
});
