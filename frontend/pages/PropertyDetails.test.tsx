import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Rule 1: vi.hoisted for shared mocks
const { mockNavigate } = vi.hoisted(() => ({
    mockNavigate: vi.fn()
}));

// Rule 2: Standard mocks
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
        useParams: () => ({ id: 'prop-1' })
    };
});

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (amount: number) => `€${amount}`,
        convertPrice: (amount: number) => amount,
        currency: 'EUR'
    })
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        user: { id: 'user-1', full_name: 'Test User', role: 'user' },
        isAuthenticated: true
    })
}));

vi.mock('../context/LightboxContext', () => ({
    useLightbox: () => ({
        openLightbox: vi.fn()
    })
}));

vi.mock('../context/CartContext', () => ({
    useCart: () => ({
        addToCart: vi.fn(),
        items: []
    })
}));

vi.mock('../context/ChatContext', () => ({
    useChat: () => ({
        startConversation: vi.fn(),
        activeConversationId: null,
        setActiveConversationId: vi.fn(),
        sendMessage: vi.fn(),
        conversations: []
    })
}));

vi.mock('../context/NotificationContext', () => ({
    useNotifications: () => ({
        addNotification: vi.fn()
    })
}));

// Rule 3: API mocks
vi.mock('../api-services', () => ({
    db: {
        getProperty: vi.fn(),
        getUnavailableDates: vi.fn().mockResolvedValue([]),
        getReviewCount: vi.fn().mockResolvedValue(0),
        getReviews: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
        getBookings: vi.fn().mockResolvedValue([]),
        getServices: vi.fn().mockResolvedValue({ data: [] })
    },
    propertiesService: {
        getProperty: vi.fn(),
        getUnavailableDates: vi.fn().mockResolvedValue([]),
        getReviewCount: vi.fn().mockResolvedValue(0),
        getReviews: vi.fn().mockResolvedValue({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } }),
        getBookings: vi.fn().mockResolvedValue([])
    },
    bookingsService: {
        getBookings: vi.fn().mockResolvedValue([])
    },
    servicesService: {
        getServices: vi.fn().mockResolvedValue({ data: [] })
    }
}));

// Mock ChatWindow to simplify
vi.mock('../components/chat/ChatWindow', () => ({
    ChatWindow: () => <div data-testid="chat-window">Mocked Chat Window</div>
}));

import { PropertyDetails } from './PropertyDetails';
import { propertiesService } from '../api-services';

describe('PropertyDetails Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        window.scrollTo = vi.fn();
    });

    const renderPage = (id = 'prop-1') => {
        const queryClient = new QueryClient();
        return render(
            <QueryClientProvider client={queryClient}>
                <MemoryRouter initialEntries={[`/property/${id}`]}>
                    <Routes>
                        <Route path="/property/:id" element={<PropertyDetails />} />
                    </Routes>
                </MemoryRouter>
            </QueryClientProvider>
        );
    };

    it('shows loading state initially', () => {
        (propertiesService.getProperty as any).mockReturnValue(new Promise(() => {})); // Never resolves
        renderPage();
        expect(screen.getByText('Loading property details...')).toBeInTheDocument();
    });

    it('renders property details after fetch', async () => {
        const mockProperty = {
            id: 'prop-1',
            title: 'Test Villa',
            description: 'Beautiful villa',
            images: ['img1.jpg'],
            amenities: ['wifi', 'pool'],
            price_per_night: 100,
            max_guests: 4,
            bedrooms: 2,
            beds: 2,
            bathrooms: 2,
            host_id: 'host-1',
            rating: 4.8,
            reviews_count: 10,
            cleaning_fee: 50
        };
        (propertiesService.getProperty as any).mockResolvedValue(mockProperty);

        renderPage();

        await waitFor(() => {
            expect(screen.getAllByText('Test Villa').length).toBeGreaterThan(0);
            expect(screen.getByText('Beautiful villa')).toBeInTheDocument();
            expect(screen.getByText(/4 Guests/)).toBeInTheDocument();
        });
    });

    it('shows error message when property is not found', async () => {
        (propertiesService.getProperty as any).mockResolvedValue(null);
        
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Property not found')).toBeInTheDocument();
            expect(screen.getByText(/could not be loaded/)).toBeInTheDocument();
        });
    });

    it('shows error message on API failure', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        (propertiesService.getProperty as any).mockRejectedValue(new Error('Fetch failed'));
        
        renderPage();

        await waitFor(() => {
            expect(screen.getByText('Property not found')).toBeInTheDocument();
        });
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('calculates total price correctly in booking card', async () => {
        const mockProperty = {
            id: 'prop-1',
            title: 'Test Villa',
            price_per_night: 100,
            cleaning_fee: 50,
            images: ['img1.jpg'],
            amenities: [],
            max_guests: 4,
            bedrooms: 1,
            beds: 1,
            bathrooms: 1,
            rating: 5,
            reviews_count: 0,
            host_id: 'host-1',
            description: 'Test description'
        };
        (propertiesService.getProperty as any).mockResolvedValue(mockProperty);

        renderPage();

        await waitFor(() => {
            // Default is 5 nights. 100 * 5 + 50 = 550
            expect(screen.getByText(/100 x 5 nights/)).toBeInTheDocument();
            expect(screen.getByText(/€550/)).toBeInTheDocument();
        });
    });
});
