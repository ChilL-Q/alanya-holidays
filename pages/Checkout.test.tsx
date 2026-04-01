import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { Checkout } from './Checkout';
import { MemoryRouter } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../api-services';
import { supabase } from '../api-services/supabase';

// Mocks
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async (importOriginal) => {
    const actual = await importOriginal() as any;
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../context/CartContext', () => ({
    useCart: vi.fn(),
}));

vi.mock('../context/CurrencyContext', () => ({
    useCurrency: () => ({
        convertPrice: (p: number) => p,
        formatPrice: (p: number) => `€${p}`,
        currency: 'EUR',
        rates: { EUR: 1 }
    }),
}));

vi.mock('../context/LanguageContext', () => ({
    useLanguage: () => ({ t: (s: string) => s }),
}));

vi.mock('../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../api-services', () => ({
    db: {
        createBooking: vi.fn(),
    },
}));

vi.mock('../api-services/supabase', () => ({
    supabase: {
        functions: {
            invoke: vi.fn(),
        },
    },
}));

// Mock window.location
const mockLocation = { href: '' };
// @ts-ignore
delete window.location;
// @ts-ignore
window.location = mockLocation;

// Mock alert
const mockAlert = vi.fn();
vi.stubGlobal('alert', mockAlert);

describe('Checkout', () => {
    const mockItems = [
        { id: '1', title: 'Luxury Villa', price: 100, type: 'property', image: 'v.jpg', startDate: '2026-04-01', endDate: '2026-04-05', guests: 2 }
    ];

    const mockCartContext = {
        items: mockItems,
        total: 100,
        removeFromCart: vi.fn(),
        addToCart: vi.fn(),
        clearCart: vi.fn(),
    };

    const mockAuthContext = {
        user: { id: 'u1', email: 'test@test.com' },
        isAuthenticated: true,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers();
        (useCart as any).mockReturnValue(mockCartContext);
        (useAuth as any).mockReturnValue(mockAuthContext);
        (db.createBooking as any).mockResolvedValue({ id: 'b1' });
        (supabase.functions.invoke as any).mockResolvedValue({ data: { url: 'https://stripe.com/pay' }, error: null });
        mockLocation.href = '';
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    const renderCheckout = () => {
        return render(
            <MemoryRouter>
                <Checkout />
            </MemoryRouter>
        );
    };

    it('renders empty cart state', () => {
        (useCart as any).mockReturnValue({ ...mockCartContext, items: [], total: 0 });
        renderCheckout();
        expect(screen.getByText('checkout.empty')).toBeInTheDocument();
    });

    it('renders cart items and summary', () => {
        renderCheckout();
        expect(screen.getByText('Luxury Villa')).toBeInTheDocument();
        const totalElements = screen.getAllByText('€100');
        expect(totalElements.length).toBeGreaterThan(0);
    });

    it('adds Welcome Pack to cart', () => {
        renderCheckout();
        const addBtn = screen.getByText('checkout.add_welcome');
        fireEvent.click(addBtn);
        expect(mockCartContext.addToCart).toHaveBeenCalledWith(expect.objectContaining({
            id: 'rec-2',
            title: 'Welcome Pack'
        }));
    });

    it('prevents payment if not authenticated', async () => {
        (useAuth as any).mockReturnValue({ isAuthenticated: false, user: null });
        renderCheckout();
        const payBtn = screen.getByTestId('pay-button');
        
        await act(async () => {
            fireEvent.click(payBtn);
        });

        expect(mockAlert).toHaveBeenCalledWith("Please login to complete booking");
    });

    it('handles Stripe redirect for card payment', async () => {
        renderCheckout();
        const payBtn = screen.getByTestId('pay-button');
        
        await act(async () => {
            fireEvent.click(payBtn);
        });

        expect(db.createBooking).toHaveBeenCalled();
        expect(supabase.functions.invoke).toHaveBeenCalledWith('create-checkout-session', expect.any(Object));
        expect(mockLocation.href).toBe('https://stripe.com/pay');
    });

    it('handles Stripe redirect for card payment with Welcome Pack', async () => {
        const itemsWithWP = [
            ...mockItems,
            { id: 'rec-2', title: 'Welcome Pack', price: 30, type: 'OTHER', image: 'wp.jpg' }
        ];
        (useCart as any).mockReturnValue({ ...mockCartContext, items: itemsWithWP });
        
        renderCheckout();
        const payBtn = screen.getByTestId('pay-button');
        
        await act(async () => {
            fireEvent.click(payBtn);
        });

        expect(db.createBooking).toHaveBeenCalled();
        // Verify that the welcome pack was included in the Stripe items
        const invokeCall = (supabase.functions.invoke as any).mock.calls[0];
        const stripeItems = invokeCall[1].body.items;
        expect(stripeItems).toHaveLength(2); // Villa + WP
        expect(stripeItems).toContainEqual(expect.objectContaining({ listingId: 'rec-2' }));
    });

    it('handles Stripe redirect for cash deposit', async () => {
        renderCheckout();
        fireEvent.click(screen.getByText('checkout.method.cash'));
        
        const payBtn = screen.getByTestId('pay-button');
        await act(async () => {
            fireEvent.click(payBtn);
        });

        expect(db.createBooking).toHaveBeenCalledWith(expect.objectContaining({
            payment_method: 'cash'
        }));
        expect(supabase.functions.invoke).toHaveBeenCalled();
        expect(mockLocation.href).toBe('https://stripe.com/pay');
    });

    it('handles manual payment (bank) and shows success view', async () => {
        renderCheckout();
        fireEvent.click(screen.getByText('checkout.method.bank'));
        
        const payBtn = screen.getByTestId('pay-button');
        await act(async () => {
            fireEvent.click(payBtn);
        });

        expect(db.createBooking).toHaveBeenCalled();
        expect(supabase.functions.invoke).not.toHaveBeenCalled();
        expect(mockCartContext.clearCart).toHaveBeenCalled();
        expect(screen.getByText('checkout.success_title')).toBeInTheDocument();

        act(() => {
            vi.advanceTimersByTime(3000);
        });
        expect(mockNavigate).toHaveBeenCalledWith('/profile');
    });

    it('handles welcome pack logic in booking message', async () => {
        const itemsWithWP = [
            ...mockItems,
            { id: 'rec-2', title: 'Welcome Pack', price: 30, type: 'OTHER' }
        ];
        (useCart as any).mockReturnValue({ ...mockCartContext, items: itemsWithWP });
        
        renderCheckout();
        fireEvent.click(screen.getByText('checkout.method.bank'));
        
        await act(async () => {
            fireEvent.click(screen.getByTestId('pay-button'));
        });

        expect(db.createBooking).toHaveBeenCalledWith(expect.objectContaining({
            total_price: 130,
            message: expect.stringContaining('[EXTRAS]: Includes Welcome Pack')
        }));
    });

    it('handles checkout error gracefully', async () => {
        (db.createBooking as any).mockRejectedValue(new Error('DB Error'));
        renderCheckout();
        
        await act(async () => {
            fireEvent.click(screen.getByTestId('pay-button'));
        });

        expect(mockAlert).toHaveBeenCalledWith('DB Error');
    });

    it('handles stripe function error', async () => {
        (supabase.functions.invoke as any).mockResolvedValue({ data: null, error: { message: 'Stripe Error' } });
        renderCheckout();
        
        await act(async () => {
            fireEvent.click(screen.getByTestId('pay-button'));
        });

        expect(mockAlert).toHaveBeenCalledWith('Stripe Error');
    });
});
