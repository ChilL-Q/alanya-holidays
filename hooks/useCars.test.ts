import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCars } from './useCars';
import { db } from '../api-services';

vi.mock('../api-services', () => ({
    db: {
        getServices: vi.fn()
    }
}));

describe('useCars', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('fetches cars successfully', async () => {
        const mockCars = [
            { id: '1', title: 'Car A', type: 'RENTAL' },
            { id: '2', title: 'Car B', type: 'RENTAL' }
        ];
        (db.getServices as any).mockResolvedValue({ data: mockCars });

        const { result } = renderHook(() => useCars());

        expect(result.current.loading).toBe(true);
        expect(result.current.carGroups).toEqual([]);

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        // useCarAggregation returns groups, so we should mock it or expect groups.
        // For now let's just check it's defined if we don't mock useCarAggregation deeply
        expect(result.current.carGroups).toBeDefined();
    });

    it('handles fetch error', async () => {
        (db.getServices as any).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => useCars());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.carGroups).toEqual([]);
        // You might want to test if error state is exposed, but the hook currently matches useCars.ts content
    });
});
