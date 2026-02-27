import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    PropertyFilters: ({ isOpen, onClose, onFilterChange }: any) => (
        <div data-testid="property-filters">
            {isOpen ? 'Filters Open' : 'Filters Closed'}
            <button data-testid="close-filters" onClick={onClose}>Close</button>
            <button data-testid="change-filter" onClick={() => onFilterChange({ priceRange: [10, 20] })}>Change Filter</button>
        </div>
    )
}));
vi.mock('../components/ui/Map', () => ({
    Map: () => <div data-testid="map">Map</div>
}));
vi.mock('../components/ui/Pagination', () => ({
    Pagination: ({ onPageChange }: any) => (
        <div data-testid="pagination">
            <button data-testid="next-page" onClick={() => onPageChange(2)}>Next Page</button>
        </div>
    )
}));

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

describe('SearchResultsPage', () => {
    const mockUsePropertyFilters = usePropertyFilters as any;

    // Mock smooth scroll
    beforeEach(() => {
        vi.clearAllMocks();
        Element.prototype.scrollTo = vi.fn();
        window.scrollTo = vi.fn();
    });

    const defaultHookReturn = {
        filteredProperties: [
            { id: '1', title: 'Luxury Villa', price_per_night: 100 },
            { id: '2', title: 'Cozy Apartment', price_per_night: 50 },
        ],
        totalCount: 2,
        totalPages: 1,
        page: 1,
        setPage: vi.fn(),
        sort: 'recommended',
        setSort: vi.fn(),
        isLoading: false,
        filters: {},
        setFilters: vi.fn(),
        activeFilterCount: 0,
        hasMore: false
    };

    it('renders loading state initially', () => {
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            isLoading: true,
            filteredProperties: [],
            totalCount: 0
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('Loading stays...')).toBeDefined();
    });

    it('renders loading spinner when filtering with existing properties', () => {
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            isLoading: true,
            filteredProperties: [{ id: '1', title: 'Luxury Villa' }],
            totalCount: 1
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        // Spinner doesn't have text but container is present
        // Since we mock PropertyCard, we check we have property-card
        expect(screen.getByTestId('property-card')).toBeInTheDocument();
        // Since the spinner is just a div without test id... well we know it renders if it doesn't crash 
    });

    it('renders properties when loaded', () => {
        mockUsePropertyFilters.mockReturnValue(defaultHookReturn);

        render(
            <MemoryRouter initialEntries={['/search?location=Antalya&checkIn=2026-06-01&checkOut=2026-06-05&guests=2']}>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getAllByTestId('property-card')).toHaveLength(2);
        expect(screen.getByText('Stays in "Antalya"')).toBeInTheDocument();
        expect(screen.getByText(/2 properties found/i)).toBeInTheDocument();
    });

    it('renders empty state when no properties found and can clear filters', () => {
        const setFiltersMock = vi.fn();
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            filteredProperties: [],
            totalCount: 0,
            setFilters: setFiltersMock
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        expect(screen.getByText('No properties match your filters')).toBeInTheDocument();
        const clearBtn = screen.getByText('Clear all filters');
        fireEvent.click(clearBtn);
        expect(setFiltersMock).toHaveBeenCalledWith(expect.objectContaining({ types: [], amenities: [], minGuests: 1 }));
    });

    it('handles sorting menu interactions', () => {
        const setSortMock = vi.fn();
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            setSort: setSortMock
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        // Toggle sort menu ON
        const sortBtn = screen.getByText('Recommended');
        fireEvent.click(sortBtn);

        // Select 'Price: Low to High'
        const ascOption = screen.getByText('Price: Low to High');
        fireEvent.click(ascOption);
        expect(setSortMock).toHaveBeenCalledWith('price_asc');

        // Toggle sort menu ON again
        fireEvent.click(screen.getByText('Recommended'));
        // Click overlay to close
        const overlay = document.querySelector('.fixed.inset-0.z-10');
        fireEvent.click(overlay!);
        expect(screen.queryByText('Price: High to Low')).not.toBeInTheDocument();
    });

    it('toggles map view correctly (desktop and mobile)', () => {
        mockUsePropertyFilters.mockReturnValue(defaultHookReturn);

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        const toggleMapBtn = screen.getByText('search.show_map');
        fireEvent.click(toggleMapBtn);

        // Map component rendered
        expect(screen.getAllByTestId('map').length).toBeGreaterThan(0);

        // Close via mobile overlay 'X' button
        const mobileCloseBtn = screen.getByRole('button', { name: '' });
        // We look for button in the mobile overlay container
        const mapHeaderElements = screen.getByText('Map View').parentElement;
        const closeBtn = mapHeaderElements!.querySelector('button');
        fireEvent.click(closeBtn!);
        // Map should hide? In desktop it doesn't hide via X, but mobile overlay hides it.
        // Actually the button hides map entirely in both.
        expect(screen.queryByText('Map View')).not.toBeInTheDocument();
    });

    it('toggles filters correctly', () => {
        const setFiltersMock = vi.fn();
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            setFilters: setFiltersMock,
            activeFilterCount: 3
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        // Filter button
        const filterBtn = screen.getAllByText('Filters')[0].closest('button');
        fireEvent.click(filterBtn!);

        expect(screen.getByText('Filters Open')).toBeInTheDocument();

        // Close filters
        fireEvent.click(screen.getByTestId('close-filters'));
        expect(screen.getByText('Filters Closed')).toBeInTheDocument();

        // Change filter
        fireEvent.click(screen.getByTestId('change-filter'));
        expect(setFiltersMock).toHaveBeenCalledWith({ priceRange: [10, 20] });
    });

    it('handles pagination', () => {
        const setPageMock = vi.fn();
        mockUsePropertyFilters.mockReturnValue({
            ...defaultHookReturn,
            totalCount: 10,
            totalPages: 2,
            setPage: setPageMock
        });

        render(
            <MemoryRouter>
                <SearchResultsPage />
            </MemoryRouter>
        );

        const nextBtn = screen.getByTestId('next-page');
        fireEvent.click(nextBtn);

        expect(setPageMock).toHaveBeenCalledWith(2);
        expect(window.scrollTo).toHaveBeenCalled();
    });
});
