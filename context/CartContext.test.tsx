import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, screen, cleanup, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { CartItem } from '../types/index';

// Mock CartItem for testing
const mockItem1 = { id: '1', title: 'Item 1', price: 100, image: 'img1', type: 'service' } as CartItem;
const mockItem2 = { id: '2', title: 'Item 2', price: 200, image: 'img2', type: 'service' } as CartItem;

const TestComponent = () => {
    const { items, addToCart, removeFromCart, clearCart, total, isCartOpen, setIsCartOpen } = useCart();
    return (
        <div>
            <span data-testid="count">{items.length}</span>
            <span data-testid="total">{total}</span>
            <span data-testid="isOpen">{isCartOpen ? 'open' : 'closed'}</span>
            <button onClick={() => addToCart(mockItem1)}>Add Item 1</button>
            <button onClick={() => addToCart(mockItem2)}>Add Item 2</button>
            <button onClick={() => removeFromCart('1')}>Remove Item 1</button>
            <button onClick={() => clearCart()}>Clear Cart</button>
            <button onClick={() => setIsCartOpen(true)}>Open Cart</button>
            <button onClick={() => setIsCartOpen(false)}>Close Cart</button>
        </div>
    );
};

describe('CartContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    it('provides initial empty state', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );
        expect(screen.getByTestId('count').textContent).toBe('0');
        expect(screen.getByTestId('total').textContent).toBe('0');
        expect(screen.getByTestId('isOpen').textContent).toBe('closed');
    });

    it('loads cart from localStorage', () => {
        localStorage.setItem('cart', JSON.stringify([mockItem1]));
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );
        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByTestId('total').textContent).toBe('100');
    });

    it('adds item to cart and updates total', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByTestId('total').textContent).toBe('100');
        expect(localStorage.getItem('cart')).toContain('Item 1');
    });

    it('auto-opens cart on first item addition', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        expect(screen.getByTestId('isOpen').textContent).toBe('closed');

        act(() => {
            screen.getByText('Add Item 1').click();
        });

        expect(screen.getByTestId('isOpen').textContent).toBe('open');
    });

    it('does not duplicate items', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
        });
        act(() => {
            screen.getByText('Add Item 1').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
    });

    it('removes item from cart', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
            screen.getByText('Add Item 2').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('2');
        expect(screen.getByTestId('total').textContent).toBe('300');

        act(() => {
            screen.getByText('Remove Item 1').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('1');
        expect(screen.getByTestId('total').textContent).toBe('200');
    });

    it('clears cart', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Add Item 1').click();
        });

        act(() => {
            screen.getByText('Clear Cart').click();
        });

        expect(screen.getByTestId('count').textContent).toBe('0');
        expect(screen.getByTestId('total').textContent).toBe('0');
    });

    it('toggles cart visibility', () => {
        render(
            <CartProvider>
                <TestComponent />
            </CartProvider>
        );

        act(() => {
            screen.getByText('Open Cart').click();
        });
        expect(screen.getByTestId('isOpen').textContent).toBe('open');

        act(() => {
            screen.getByText('Close Cart').click();
        });
        expect(screen.getByTestId('isOpen').textContent).toBe('closed');
    });
});
