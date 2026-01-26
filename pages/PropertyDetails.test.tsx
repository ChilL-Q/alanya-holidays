import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { PropertyDetails } from './PropertyDetails';
import { db } from '../services/db';
import * as RouterModule from 'react-router-dom';
import * as CartContext from '../context/CartContext';

vi.mock('../components/reviews/ReviewsSection', () => ({
    ReviewsSection: () => <div data-testid="reviews-section">Reviews</div>
}));

// Mock dependencies
vi.mock('../services/db');
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useParams: vi.fn(),
        useNavigate: vi.fn(),
    };
});
vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: '1' } }) }));
vi.mock('../context/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k, language: 'en' }) }));
vi.mock('../context/CurrencyContext', () => ({ useCurrency: () => ({ formatPrice: (p) => `$${p}`, convertPrice: (p) => p }) }));
vi.mock('../context/LightboxContext', () => ({ useLightbox: () => ({ openLightbox: vi.fn() }) }));
vi.mock('../context/ChatContext', () => ({ useChat: () => ({ startConversation: vi.fn() }) }));
vi.mock('react-datepicker', () => ({ default: () => <input type="text" placeholder="Select Date" /> }));

describe('PropertyDetails', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(RouterModule.useParams).mockReturnValue({ id: '123' });
        vi.mocked(CartContext.useCart).mockReturnValue({
            addToCart: vi.fn(),
            items: [],
            removeFromCart: vi.fn(),
            total: 0,
            isCartOpen: false,
            setIsCartOpen: vi.fn(),
            clearCart: vi.fn()
        });
        // Default mocks to prevent crashes
        vi.mocked(db.getServices).mockResolvedValue({ data: [], count: 0 });
        vi.mocked(db.getUnavailableDates).mockResolvedValue([]);
        vi.mocked(db.getReviewCount).mockResolvedValue(0);
        vi.mocked(db.getBookings).mockResolvedValue([]);
    });

    it('renders loading state initially', () => {
        // db.getProperty not resolved yet
        vi.mocked(db.getProperty).mockReturnValue(new Promise(() => { }));
        render(<PropertyDetails />);
        expect(screen.getByText('Loading property details...')).toBeInTheDocument();
    });

    it('renders property details after fetch', async () => {
        vi.mocked(db.getProperty).mockResolvedValue({
            id: '123',
            title: 'Luxury Villa',
            price_per_night: 100,
            images: ['img1.jpg'],
            amenities: [{ label: 'Wifi', icon: 'wifi' }, { label: 'Pool', icon: 'pool' }] as any,
            host: { full_name: 'John Doe' }
        } as any);
        vi.mocked(db.getUnavailableDates).mockResolvedValue([]);
        vi.mocked(db.getReviewCount).mockResolvedValue(5);
        vi.mocked(db.getBookings).mockResolvedValue([]);
        vi.mocked(db.getServices).mockResolvedValue({ data: [], count: 0 });

        render(<PropertyDetails />);

        await waitFor(() => {
            expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
            expect(screen.getByText((content) => content.includes('John Doe'))).toBeInTheDocument();
        });
    });
});
