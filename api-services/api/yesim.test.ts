import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { yesimService } from './yesim';

vi.mock('axios');

describe('yesimService', () => {
    const mockToken = 'test-token';

    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('getPlans', () => {
        it('returns demo data if token is missing', async () => {
            vi.stubEnv('VITE_YESIM_API_TOKEN', '');
            const plans = await yesimService.getPlans();
            expect(plans).toBeInstanceOf(Array);
            expect(plans.length).toBeGreaterThan(0);
            expect(plans[0]).toHaveProperty('name', 'Turkey Essential');
        });

        it('calls API if token exists', async () => {
            vi.stubEnv('VITE_YESIM_API_TOKEN', mockToken);
            const mockPlans = [{ id: 'plan1', name: 'Plan 1' }];
            (axios.get as any).mockResolvedValueOnce({ data: mockPlans });

            const plans = await yesimService.getPlans();
            
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/plans'), {
                headers: { Authorization: `Bearer ${mockToken}` }
            });
            expect(plans).toEqual(mockPlans);
        });

        it('handles API error', async () => {
            (axios.get as any).mockRejectedValueOnce(new Error('API Error'));
            await expect(yesimService.getPlans()).rejects.toThrow('API Error');
        });
    });

    describe('createOrder', () => {
        it('completes the full order flow', async () => {
            // 1. Mock new_esim
            (axios.get as any).mockResolvedValueOnce({ 
                data: { status: 'success', iccid: 'ICCID123', id: 'SIM123' } 
            });
            // 2. Mock add_plan_iccid
            (axios.post as any).mockResolvedValueOnce({ 
                data: { status: 'success' } 
            });
            // 3. Mock sim_info
            (axios.get as any).mockResolvedValueOnce({ 
                data: { qrcode: 'QRDATA', ios_tap_link: 'APPLINK' } 
            });

            const order = await yesimService.createOrder('plan123');

            expect(order).toEqual({
                id: 'SIM123',
                iccid: 'ICCID123',
                qrcode: 'QRDATA',
                ios_tap_link: 'APPLINK'
            });

            expect(axios.get).toHaveBeenCalledTimes(2);
            expect(axios.post).toHaveBeenCalledTimes(1);
        });

        it('throws error if SIM creation fails', async () => {
            (axios.get as any).mockResolvedValueOnce({ 
                data: { status: 'error', message: 'No SIMs available' } 
            });

            await expect(yesimService.createOrder('plan123')).rejects.toThrow('No SIMs available');
        });

        it('throws error if activation fails', async () => {
            (axios.get as any).mockResolvedValueOnce({ 
                data: { status: 'success', iccid: 'ICCID123', id: 'SIM123' } 
            });
            (axios.post as any).mockResolvedValueOnce({ 
                data: { status: 'error', description: 'Activation failed' } 
            });

            await expect(yesimService.createOrder('plan123')).rejects.toThrow('Activation failed');
        });
    });
});
