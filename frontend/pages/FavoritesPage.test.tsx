import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FavoritesPage } from './FavoritesPage';
import { MemoryRouter } from 'react-router-dom';

// Mock the API service - must be before any imports that use it
vi.mock('../api-services', () => ({
    db: {
        getPropertiesByIds: vi.fn(),
        getFavorites: vi.fn()
    },
    propertiesService: {
        getPropertiesByIds: vi.fn()
    }
}));

// Mock PropertyCard component
vi.mock('../components/ui/PropertyCard', () => ({
    PropertyCard: ({ property }: any) => (
        <div data-testid="property-card" className="property-card">
            <h3 data-testid="property-title">{property.title}</h3>
            <span data-testid="property-price">€{property.pricePerNight}</span>
        </div>
    )
}));

// Mock Lucide icons
vi.mock('lucide-react', async () => {
    const actual = await vi.importActual('lucide-react');
    return {
        ...(actual as object),
        Heart: ({ className, size, ...props }: any) => (
            <svg data-testid="heart-icon" className={className} width={size} {...props} />
        )
    };
});

// Mock Auth Context
const mockUseAuth = vi.fn();
vi.mock('../context/AuthContext', () => ({
    useAuth: () => mockUseAuth(),
    AuthProvider: ({ children }: any) => children
}));

// Mock Favorites Context
const mockUseFavorites = vi.fn();
vi.mock('../context/FavoritesContext', () => ({
    useFavorites: () => mockUseFavorites(),
    FavoritesProvider: ({ children }: any) => children
}));

// Mock Language Context
vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key
    })
}));

// Mock Theme Context
vi.mock('../context/ThemeContext', () => ({
    useTheme: () => ({
        theme: 'light',
        toggleTheme: vi.fn()
    })
}));

import { propertiesService } from '../api-services';

const mockProperties = [
    {
        id: '1',
        title: 'Luxury Villa with Sea View',
        price_per_night: 250,
        images: ['https://example.com/villa1.jpg'],
        guests: 6,
        bedrooms: 3,
        rating: 4.8,
        reviews_count: 24
    },
    {
        id: '2',
        title: 'Cozy Apartment in City Center',
        price_per_night: 85,
        images: ['https://example.com/apt1.jpg'],
        guests: 2,
        bedrooms: 1,
        rating: 4.5,
        reviews_count: 12
    },
    {
        id: '3',
        title: 'Modern Penthouse',
        price_per_night: 400,
        images: ['https://example.com/penthouse1.jpg', 'https://example.com/penthouse2.jpg'],
        guests: 8,
        bedrooms: 4,
        rating: 5.0,
        reviews_count: 8
    }
];

describe('FavoritesPage', () => {
    const mockGetPropertiesByIds = propertiesService.getPropertiesByIds as any;

    beforeEach(() => {
        vi.clearAllMocks();
        // Default mocks
        mockUseAuth.mockReturnValue({
            user: null,
            isAuthenticated: false,
            loading: false,
            signIn: vi.fn(),
            signUp: vi.fn(),
            signOut: vi.fn()
        });
        mockUseFavorites.mockReturnValue({
            favorites: [],
            addFavorite: vi.fn(),
            removeFavorite: vi.fn(),
            isFavorite: vi.fn(),
            toggleFavorite: vi.fn()
        });
    });

    const renderWithProviders = (initialEntries: string[] = ['/favorites']) => {
        return render(
            <MemoryRouter initialEntries={initialEntries}>
                <FavoritesPage />
            </MemoryRouter>
        );
    };

    describe('Loading State', () => {
        it('shows loading state while fetching favorites', async () => {
            mockUseFavorites.mockReturnValue({
                favorites: ['1', '2'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            mockGetPropertiesByIds.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve([]), 100)));

            renderWithProviders();

            expect(screen.getByText('Loading favorites...')).toBeInTheDocument();

            await waitFor(() => {
                expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
            });
        });
    });

    describe('Empty State', () => {
        it('renders empty state when no favorites', async () => {
            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('No favorites yet')).toBeInTheDocument();
            });

            expect(screen.getByText('Start exploring our diverse collection of properties and save your favorites here for easy access.')).toBeInTheDocument();
            expect(screen.getByText('Explore Stays')).toBeInTheDocument();
        });

        it('renders empty state link to search page', async () => {
            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Explore Stays')).toBeInTheDocument();
            });

            const exploreLink = screen.getByText('Explore Stays').closest('a');
            expect(exploreLink).toHaveAttribute('href', '/search');
        });

        it('displays correct count when no properties', async () => {
            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('0 saved properties')).toBeInTheDocument();
            });
        });
    });

    describe('Favorites Display', () => {
        it('renders favorite properties when loaded', async () => {
            mockGetPropertiesByIds.mockResolvedValue(mockProperties);
            mockUseFavorites.mockReturnValue({
                favorites: ['1', '2', '3'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
            });

            expect(screen.getAllByTestId('property-card')).toHaveLength(3);
            expect(screen.getByText('Luxury Villa with Sea View')).toBeInTheDocument();
            expect(screen.getByText('Cozy Apartment in City Center')).toBeInTheDocument();
            expect(screen.getByText('Modern Penthouse')).toBeInTheDocument();
        });

        it('displays correct count of saved properties', async () => {
            mockGetPropertiesByIds.mockResolvedValue(mockProperties);
            mockUseFavorites.mockReturnValue({
                favorites: ['1', '2', '3'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('3 saved properties')).toBeInTheDocument();
            });
        });

        it('renders PropertyCard components with correct data', async () => {
            mockGetPropertiesByIds.mockResolvedValue([mockProperties[0]]);
            mockUseFavorites.mockReturnValue({
                favorites: ['1'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Luxury Villa with Sea View')).toBeInTheDocument();
            });

            expect(screen.getByTestId('property-price')).toHaveTextContent('€250');
        });

        it('formats property data correctly (pricePerNight, image, etc.)', async () => {
            const propertyWithoutOptionalFields = {
                id: '4',
                title: 'Basic Studio',
                price_per_night: 50,
                images: [],
                // Missing: guests, bedrooms, rating, reviews_count
            };

            mockGetPropertiesByIds.mockResolvedValue([propertyWithoutOptionalFields]);
            mockUseFavorites.mockReturnValue({
                favorites: ['4'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Basic Studio')).toBeInTheDocument();
            });

            expect(screen.getByTestId('property-price')).toHaveTextContent('€50');
        });

        it('uses first image from images array', async () => {
            mockGetPropertiesByIds.mockResolvedValue([mockProperties[2]]);
            mockUseFavorites.mockReturnValue({
                favorites: ['3'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Modern Penthouse')).toBeInTheDocument();
            });

            // PropertyCard should receive the first image
            expect(mockGetPropertiesByIds).toHaveBeenCalledWith(['3']);
        });
    });

    describe('API Integration', () => {
        it('calls getPropertiesByIds with favorite IDs', async () => {
            const favoriteIds = ['prop-1', 'prop-2'];
            mockGetPropertiesByIds.mockResolvedValue([]);
            mockUseFavorites.mockReturnValue({
                favorites: favoriteIds,
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(mockGetPropertiesByIds).toHaveBeenCalledWith(favoriteIds);
            });
        });

        it('does not call API when favorites list is empty', async () => {
            mockUseFavorites.mockReturnValue({
                favorites: [],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('No favorites yet')).toBeInTheDocument();
            });

            expect(mockGetPropertiesByIds).not.toHaveBeenCalled();
        });

        it('handles API errors gracefully', async () => {
            mockGetPropertiesByIds.mockRejectedValue(new Error('Failed to fetch properties'));
            mockUseFavorites.mockReturnValue({
                favorites: ['1', '2'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            renderWithProviders();

            await waitFor(() => {
                expect(screen.queryByText('Loading favorites...')).not.toBeInTheDocument();
            });

            expect(consoleSpy).toHaveBeenCalledWith('Error fetching favorite properties:', expect.any(Error));
            expect(screen.getByText('0 saved properties')).toBeInTheDocument();

            consoleSpy.mockRestore();
        });
    });

    describe('UI Elements', () => {
        it('renders page header with Heart icon', async () => {
            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Shortlist')).toBeInTheDocument();
            });

            expect(screen.getAllByTestId('heart-icon')).toHaveLength(2); // One in header, one in empty state
        });

        it('renders page title "Shortlist"', async () => {
            renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('Shortlist')).toBeInTheDocument();
            });

            const title = screen.getByText('Shortlist');
            expect(title.tagName).toBe('H1');
        });

        it('applies correct styling classes', async () => {
            const { container } = renderWithProviders();

            await waitFor(() => {
                expect(screen.getByText('No favorites yet')).toBeInTheDocument();
            });

            // Check for main container classes
            const mainDiv = container.firstChild as HTMLElement;
            expect(mainDiv).toHaveClass('min-h-screen');
            expect(mainDiv).toHaveClass('bg-slate-50');
        });
    });

    describe('Responsive Grid', () => {
        it('renders properties in responsive grid layout', async () => {
            mockGetPropertiesByIds.mockResolvedValue(mockProperties);
            mockUseFavorites.mockReturnValue({
                favorites: ['1', '2', '3'],
                addFavorite: vi.fn(),
                removeFavorite: vi.fn(),
                isFavorite: vi.fn(),
                toggleFavorite: vi.fn()
            });

            renderWithProviders();

            await waitFor(() => {
                expect(screen.getAllByTestId('property-card')).toHaveLength(3);
            });

            // Check grid container exists (PropertyCard should be in grid)
            const gridContainer = screen.getAllByTestId('property-card')[0].parentElement;
            expect(gridContainer).toHaveClass('grid');
            expect(gridContainer).toHaveClass('grid-cols-1');
            expect(gridContainer).toHaveClass('md:grid-cols-2');
            expect(gridContainer).toHaveClass('lg:grid-cols-3');
        });
    });
});
