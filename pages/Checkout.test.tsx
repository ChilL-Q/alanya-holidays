import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Checkout } from './Checkout';
import * as CartContext from '../context/CartContext';
import * as CurrencyContext from '../context/CurrencyContext';
import * as LanguageContext from '../context/LanguageContext';
import * as AuthContext from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// Mocks
vi.mock('../services', () => ({
    db: {
        createBooking: vi.fn().mockResolvedValue({ id: 'booking-123' })
    }
}));

vi.mock('../services/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn().mockResolvedValue({ data: { url: 'http://stripe.com/checkout' }, error: null })
        }
    }
}));

const renderWithProviders = (component: React.ReactNode) => {
    return render(
        <BrowserRouter>
            {component}
        </BrowserRouter>
    );
};

describe('Checkout Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default Mocks
        vi.spyOn(LanguageContext, 'useLanguage').mockReturnValue({ t: (key: string) => key } as any);
        vi.spyOn(CurrencyContext, 'useCurrency').mockReturnValue({
            convertPrice: (p: number) => p,
            formatPrice: (p: number) => `€${p}`,
            currency: 'EUR',
            rates: {}
        } as any);
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { id: 'user-123', email: 'test@test.com' },
            isAuthenticated: true
        } as any);
    });

    it('renders "Empty Cart" message when cart is empty', () => {
        vi.spyOn(CartContext, 'useCart').mockReturnValue({
            items: [],
            total: 0,
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            clearCart: vi.fn(),
            isCartOpen: false,
            setIsCartOpen: vi.fn()
        });

        renderWithProviders(<Checkout />);
        expect(screen.getByText('checkout.empty')).toBeInTheDocument();
    });

    it('renders items and price details', () => {
        vi.spyOn(CartContext, 'useCart').mockReturnValue({
            items: [
                { id: '1', title: 'Test Property', price: 100, type: 'property', startDate: '2024-01-01', endDate: '2024-01-02' }
            ],
            total: 100,
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            clearCart: vi.fn(),
            isCartOpen: false,
            setIsCartOpen: vi.fn()
        });

        renderWithProviders(<Checkout />);
        expect(screen.getByText('Test Property')).toBeInTheDocument();
        const prices = screen.getAllByText('€100');
        expect(prices.length).toBeGreaterThanOrEqual(1);
    });

    it('toggles payment methods', () => {
        vi.spyOn(CartContext, 'useCart').mockReturnValue({
            items: [{ id: '1', title: 'Item', price: 100, type: 'product' }],
            total: 100,
            removeFromCart: vi.fn(),
            addToCart: vi.fn(),
            clearCart: vi.fn(),
            isCartOpen: false,
            setIsCartOpen: vi.fn()
        });

        renderWithProviders(<Checkout />);

        // Default is Card
        expect(screen.getByText('checkout.method.card')).toBeInTheDocument();

        // Switch to SWIFT
        fireEvent.click(screen.getByText('checkout.method.swift'));
        expect(screen.getByText('checkout.method.swift_desc')).toBeInTheDocument();
        expect(screen.getByText('Garanti Bank')).toBeInTheDocument();
    });

    it('adds welcome pack', () => {
        const addToCartMock = vi.fn();
        vi.spyOn(CartContext, 'useCart').mockReturnValue({
            items: [{ id: '1', title: 'Item', price: 100, type: 'property' }],
            total: 100,
            removeFromCart: vi.fn(),
            addToCart: addToCartMock,
            clearCart: vi.fn(),
            isCartOpen: false,
            setIsCartOpen: vi.fn()
        });

        renderWithProviders(<Checkout />);

        // Click Add Welcome Pack
        const addButton = screen.getByText('checkout.add_welcome');
        fireEvent.click(addButton);

        expect(addToCartMock).toHaveBeenCalledWith(expect.objectContaining({
            title: 'Welcome Pack',
            price: 30
        }));
    });
});
