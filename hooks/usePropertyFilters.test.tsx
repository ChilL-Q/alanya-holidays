
import { renderHook, act, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { usePropertyFilters } from './usePropertyFilters';
import { propertiesService } from '../services/api/properties';
import { MemoryRouter } from 'react-router-dom';

// Mock the properties service
vi.mock('../services/api/properties', () => ({
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
            host: { full_name: 'Test Host' } 
        },
        { 
            id: '2', 
            title: 'Test Apartment', 
            price_per_night: 50, 
            type: 'apartment', 
            host: { full_name: 'Test Host' } 
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mock implementation
        (propertiesService.getProperties as any).mockResolvedValue({
            data: mockProperties,
            count: 2
        });
        (propertiesService.getAvailableProperties as any).mockResolvedValue([]);
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <MemoryRouter>{children}</MemoryRouter>
    );

    it('should initialize with default states', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null,
            checkOut: null,
            location: null,
            guests: null
        }), { wrapper });

        expect(result.current.isLoading).toBe(true);
        expect(result.current.filters.types).toEqual([]);
        expect(result.current.page).toBe(1);

        await waitFor(() => {
             expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.filteredProperties).toHaveLength(2);
        expect(result.current.totalCount).toBe(2);
    });

    it('should reset page when filters change', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null,
            checkOut: null,
            location: null,
            guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        // Advance page
        act(() => {
            result.current.setPage(2);
        });
        expect(result.current.page).toBe(2);

        // Change filter
        act(() => {
            result.current.setFilters(prev => ({ ...prev, types: ['villa'] }));
        });

        // Page should reset to 1
        expect(result.current.page).toBe(1);
        expect(propertiesService.getProperties).toHaveBeenCalled(); 
    });

    it('should fetch properties with correct parameters', async () => {
        const { result } = renderHook(() => usePropertyFilters({
            checkIn: null,
            checkOut: null,
            location: 'Alanya', // Location from prop
            guests: null
        }), { wrapper });

        await waitFor(() => expect(result.current.isLoading).toBe(false));

        expect(propertiesService.getProperties).toHaveBeenCalledWith(
            1, // page
            12, // limit
            expect.objectContaining({ types: [] }), // filters
            'Alanya', // location
            undefined, // availableIds
            'recommended' // sort
        );
    });
});
