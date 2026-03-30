import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PropertyDetails } from './PropertyDetails';

// Mock contexts
vi.mock('../context/AuthContext', () => ({
    useAuth: () => ({
        isAuthenticated: true,
        user: { id: 'test-user-id' }
    })
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({
        t: (key: string) => key,
        language: 'en'
    })
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (val: number) => val,
        formatPrice: (val: number) => `€${val}`
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
        cart: []
    })
}));

vi.mock('../context/ChatContext', () => ({
    useChat: () => ({
        startConversation: vi.fn(),
        activeConversationId: 'conv-1',
        setActiveConversationId: vi.fn(),
        sendMessage: vi.fn(),
        conversations: [{ 
            id: 'conv-1', 
            guest_id: 'guest-1', 
            host: { full_name: 'Test Host' },
            guest: { full_name: 'Test Guest' }
        }],
        clearHistory: vi.fn(),
        cart: []
    })
}));

// Mock ChatWindow to avoid deep rendering issues and make it easy to find
vi.mock('../components/chat/ChatWindow', () => ({
    ChatWindow: () => <div data-testid="chat-window">Mocked Chat Window</div>
}));

// Mock API services
vi.mock('../api-services', () => ({
    db: {
        getProperty: vi.fn().mockResolvedValue({
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
        }),
        getUnavailableDates: vi.fn().mockResolvedValue([]),
        getReviewCount: vi.fn().mockResolvedValue(10),
        getBookings: vi.fn().mockResolvedValue([]),
        getServices: vi.fn().mockResolvedValue({ data: [] })
    }
}));

import { MemoryRouter, Routes, Route } from 'react-router-dom';

const renderWithRouter = (ui: React.ReactElement) => {
    return render(
        <MemoryRouter initialEntries={['/property/prop-1']}>
            <Routes>
                <Route path="/property/:id" element={ui} />
            </Routes>
        </MemoryRouter>
    );
};

describe('PropertyDetails Component', () => {
    it('renders property title and basic info', async () => {
        renderWithRouter(<PropertyDetails />);
        
        const titles = await screen.findAllByText('Test Villa');
        expect(titles.length).toBeGreaterThan(0);
        expect(screen.getByText('4 Guests')).toBeDefined();
        // Price check matches mocked price_per_night
        expect(screen.getAllByText(/€100/)).toBeDefined();
    });

    it('shows booking card with calculated price', async () => {
        renderWithRouter(<PropertyDetails />);
        
        await screen.findAllByText('Test Villa');
        // Default nights is 5 in state. Total = 100 * 5 + 50 (cleaning) = 550
        expect(screen.getByText(/100 x 5 nights/)).toBeDefined();
        expect(screen.getByText(/€550/)).toBeDefined();
    });

    it('opens chat when contact host is clicked', async () => {
        renderWithRouter(<PropertyDetails />);
        
        await screen.findAllByText('Test Villa');
        const contactBtn = screen.getByText('Contact Host');
        fireEvent.click(contactBtn);
        
        // Check for mocked ChatWindow
        expect(await screen.findByTestId('chat-window')).toBeDefined();
    });
});
