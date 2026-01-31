import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { SearchResultsPage } from './SearchResultsPage';
import { MemoryRouter } from 'react-router-dom';
import { usePropertyFilters } from '../hooks/usePropertyFilters';

// Mock the hook
vi.mock('../hooks/usePropertyFilters', () => ({
    usePropertyFilters: vi.fn()
}));

// Mock child components
vi.mock('../components/ui/PropertyCard', () => ({
    PropertyCard: ({ property }: any) => <div data-testid="property-card">{property.title}</div>
}));
vi.mock('../components/ui/PropertyFilters', () => ({
    PropertyFilters: () => <div data-testid="property-filters">Filters</div>
}));
vi.mock('../components/ui/Map', () => ({
    Map: () => <div data-testid="map">Map</div>
}));
vi.mock('../components/ui/Pagination', () => ({
    Pagination: () => <div data-testid="pagination">Pagination</div>
}));

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

describe('SearchResultsPage', () => {
    const mockUsePropertyFilters = usePropertyFilters as any;

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders loading state', () => {
        mockUsePropertyFilters.mockReturnValue({
            isLoading: true,
            filteredProperties: [],
            totalCount: 0,
            filters: {},
            activeFilterCount: 0
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading stays...')).toBeDefined();
    });

    it('renders properties when loaded', () => {
        mockUsePropertyFilters.mockReturnValue({
            isLoading: false,
            filteredProperties: [
                { id: '1', title: 'Luxury Villa', price_per_night: 100 },
                { id: '2', title: 'Cozy Apartment', price_per_night: 50 },
            ],
            totalCount: 2,
            totalPages: 1,
            page: 1,
            filters: {},
            activeFilterCount: 0
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getAllByTestId('property-card')).toHaveLength(2);
        expect(screen.getByText('Luxury Villa')).toBeDefined();
        expect(screen.getByText('Cozy Apartment')).toBeDefined();
        expect(screen.getByText(/2 properties found/i)).toBeDefined();
    });

    it('renders empty state when no properties found', () => {
        mockUsePropertyFilters.mockReturnValue({
            isLoading: false,
            filteredProperties: [],
            totalCount: 0,
            filters: {},
            activeFilterCount: 0
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('No properties match your filters')).toBeDefined();
        expect(screen.getByText('Clear all filters')).toBeDefined();
    });
});
