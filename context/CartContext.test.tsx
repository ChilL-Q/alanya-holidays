import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { CartItem } from '../types';

describe('CartContext', () => {
    beforeEach(() => {
        localStorage.clear();
        vi.clearAllMocks();
    });

    const wrapper = ({ children }: { children: React.ReactNode }) => (
        <CartProvider>{children}</CartProvider>
    );

    it('provides initial empty state', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        expect(result.current.items).toEqual([]);
        expect(result.current.total).toBe(0);
        expect(result.current.isCartOpen).toBe(false);
    });

    it('adds item to cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item: CartItem = {
            id: '1',
            title: 'Test Item',
            price: 100,
            type: 'product',
            image: 'test.jpg'
        };

        act(() => {
            result.current.addToCart(item);
        });

        expect(result.current.items).toHaveLength(1);
        expect(result.current.items[0]).toEqual(item);
        expect(result.current.total).toBe(100);
    });

    it('opens cart automatically on first addition', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item: CartItem = {
            id: '1',
            title: 'Test Item',
            price: 100,
            type: 'product',
            image: 'test.jpg'
        };

        act(() => {
            result.current.addToCart(item);
        });

        expect(result.current.isCartOpen).toBe(true);
    });

    it('does not duplicate items with same ID', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item: CartItem = {
            id: '1',
            title: 'Test Item',
            price: 100,
            type: 'product',
            image: 'test.jpg'
        };

        act(() => {
            result.current.addToCart(item);
            result.current.addToCart(item);
        });

        expect(result.current.items).toHaveLength(1);
    });

    it('removes item from cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item: CartItem = {
            id: '1',
            title: 'Test Item',
            price: 100,
            type: 'product',
            image: 'test.jpg'
        };

        act(() => {
            result.current.addToCart(item);
            result.current.removeFromCart('1');
        });

        expect(result.current.items).toHaveLength(0);
        expect(result.current.total).toBe(0);
    });

    it('clears cart', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item1: CartItem = { id: '1', title: 'Item 1', price: 100, type: 'product', image: '1.jpg' };
        const item2: CartItem = { id: '2', title: 'Item 2', price: 200, type: 'product', image: '2.jpg' };

        act(() => {
            result.current.addToCart(item1);
            result.current.addToCart(item2);
            result.current.clearCart();
        });

        expect(result.current.items).toHaveLength(0);
    });

    it('calculates total correctly', () => {
        const { result } = renderHook(() => useCart(), { wrapper });
        const item1: CartItem = { id: '1', title: 'Item 1', price: 100, type: 'product', image: '1.jpg' };
        const item2: CartItem = { id: '2', title: 'Item 2', price: 200, type: 'product', image: '2.jpg' };

        act(() => {
            result.current.addToCart(item1);
            result.current.addToCart(item2);
        });

        expect(result.current.total).toBe(300);
    });

    it('persists to localStorage', () => {
        // Mock localStorage
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

        const { result } = renderHook(() => useCart(), { wrapper });
        const item: CartItem = { id: '1', title: 'Test', price: 100, type: 'product', image: 'test.jpg' };

        act(() => {
            result.current.addToCart(item);
        });

        expect(setItemSpy).toHaveBeenCalledWith('cart', JSON.stringify([item]));
    });
});
