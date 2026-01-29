import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Checkout } from './Checkout';
import * as CartContext from '../context/CartContext';
import { db } from '../services';

vi.mock('../services', () => ({ db: { createBooking: vi.fn() } }));
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => vi.fn(),
        Link: ({ children }: any) => <a>{children}</a>
    };
});
vi.mock('../context/CartContext', () => ({ useCart: vi.fn() }));
vi.mock('../context/AuthContext', () => ({ useAuth: () => ({ isAuthenticated: true, user: { id: '550e8400-e29b-41d4-a716-446655440000' } }) }));
vi.mock('../context/LanguageContext', () => ({ useLanguage: () => ({ t: (k: string) => k }) }));
vi.mock('../services/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { url: 'http://test.com' }, error: null })
        }
    }
}));
vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        formatPrice: (p) => `€${p}`,
        convertPrice: (p) => p,
        currency: 'EUR',
        rates: {}
    })
}));

describe('Checkout', () => {
    const mockClearCart = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock window.location
        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: '', origin: 'http://localhost' }
        });
    });

    it('renders empty state when cart is empty', () => {
        vi.mocked(CartContext.useCart).mockReturnValue({
            items: [],
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            total: 0,
            isCartOpen: false,
            setIsCartOpen: vi.fn(),
            clearCart: mockClearCart
        });

        render(<Checkout />);
        expect(screen.getByText('checkout.empty')).toBeInTheDocument();
    });

    it('renders cart items and total', () => {
        vi.mocked(CartContext.useCart).mockReturnValue({
            items: [
                { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Villa A', price: 100, type: 'property' }
            ],
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            total: 100,
            isCartOpen: false,
            setIsCartOpen: vi.fn(),
            clearCart: mockClearCart
        });

        render(<Checkout />);
        expect(screen.getByText('Villa A')).toBeInTheDocument();
        expect(screen.getAllByText('€100').length).toBeGreaterThan(0);
    });

    it('handles payment submission', async () => {
        vi.mocked(CartContext.useCart).mockReturnValue({
            items: [
                { id: '550e8400-e29b-41d4-a716-446655440001', title: 'Villa A', price: 100, type: 'property' }
            ],
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            total: 100,
            isCartOpen: false,
            setIsCartOpen: vi.fn(),
            clearCart: mockClearCart
        });

        render(<Checkout />);

        // The button contains "checkout.pay" (from mock t function) and the price "€100"
        const payBtn = screen.getByTestId('pay-button');
        fireEvent.click(payBtn);

        expect(await screen.findByText(/checkout\.success_title/i, {}, { timeout: 3000 })).toBeInTheDocument();
        expect(mockClearCart).toHaveBeenCalled();
    });
});
