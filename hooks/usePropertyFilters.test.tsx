import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { usePropertyFilters } from './usePropertyFilters';
import { propertiesService } from '../api-services/api/properties';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../api-services/api/properties', () => ({
    propertiesService: {
        getProperties: vi.fn(),
        getAvailableProperties: vi.fn(),
    },
}));

describe('usePropertyFilters', () => {
    const mockProperties = [
        {
            id: '1',
            title: 'Test Villa',
            price_per_night: 100,
            type: 'villa',
            images: ['img1.jpg'],
            host: { full_name: 'Test Host' }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        (propertiesService.getProperties as any).mockResolvedValue({
            data: mockProperties,
            count: 1
        });
        (propertiesService.getAvailableProperties as any).mockResolvedValue([]);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>{children}</MemoryRouter>
    );

    it('filters by dates (availability)', async () => {
        (propertiesService.getAvailableProperties as any).mockResolvedValue([{ id: '1' }]);

        const { result } = renderHook(() => usePropertyFilters({
            checkIn: '2024-01-01',
            checkOut: '2024-01-05',
            location: null,
            guests: '2'
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(propertiesService.getAvailableProperties).toHaveBeenCalledWith('2024-01-01', '2024-01-05');
        expect(propertiesService.getProperties).toHaveBeenCalledWith(
            1, 12, expect.anything(), undefined, ['1'], 'recommended'
        );
    });

    it('handles sorting changes', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null, checkOut: null, location: null, guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            result.current.setSort('price_asc');
        });

        // Effect will trigger fetch
        await waitFor(() => {
            expect(propertiesService.getProperties).toHaveBeenCalledWith(
                1, 12, expect.anything(), undefined, undefined, 'price_asc'
            );
        });
    });

    it('calculates activeFilterCount correctly', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null, checkOut: null, location: null, guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            result.current.setFilters(prev => ({
                ...prev,
                types: ['villa'],
                minGuests: 3,
                hasPhotos: true
            }));
        });

        // types (1) + minGuests (1) + minBeds (1) + minBathrooms (1) + hasPhotos (1) = 5
        expect(result.current.activeFilterCount).toBe(5);
    });

    it('handles service errors', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (propertiesService.getProperties as any).mockRejectedValue(new Error('Fetch failed'));

        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null, checkOut: null, location: null, guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe('Fetch failed');
        consoleSpy.mockRestore();
    });

    it('resets page when filters change', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null, checkOut: null, location: null, guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        await act(async () => {
            result.current.setPage(2);
        });
        expect(result.current.page).toBe(2);

        await act(async () => {
            result.current.setFilters(prev => ({ ...prev, types: ['apartment'] }));
        });

        expect(result.current.page).toBe(1);
    });
});
