import { describe, it, expect, vi, beforeEach } from 'vitest';
import { waitFor } from '@testing-library/react';
import { renderHookWithQuery } from '../utils/test-utils';
import { useServicePrices } from './useServicePrices';
import { servicesService } from '../api-services';

vi.mock('../api-services', () => ({
    servicesService: {
        getServices: vi.fn()
    }
}));

describe('useServicePrices', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches and calculates min prices', async () => {
        (servicesService.getServices as any).mockResolvedValue({
            data: [
                { id: '1', price: 50, type: 'tour', features: { subcategory: 'water' } },
                { id: '2', price: 30, type: 'tour', features: { subcategory: 'water' } },
                { id: '3', price: 100, type: 'tour', features: { subcategory: 'safari' } }
            ]
        });

        const { result } = renderHookWithQuery(() => useServicePrices());

        expect(result.current.isLoading).toBe(true);
        expect(result.current.minPrices).toEqual({});

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.minPrices).toEqual({
            water: 30,
            safari: 100
        });
    });

    it('handles error gracefully', async () => {
        (servicesService.getServices as any).mockRejectedValue(new Error('Failed'));

        const { result } = renderHookWithQuery(() => useServicePrices());

        await waitFor(() => {
            expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.minPrices).toEqual({});
    });
});
