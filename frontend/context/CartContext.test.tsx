import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { CartProvider, useCart } from './CartContext';
import { CartItem } from '../types/index';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <CartProvider>{children}</CartProvider>
);

describe('CartContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('useCart', () => {
    it('should throw error when used outside CartProvider', () => {
      expect(() => renderHook(() => useCart())).toThrow(
        'useCart must be used within a CartProvider'
      );
    });
  });

  describe('initialization', () => {
    it('should initialize with empty cart when localStorage is empty', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toEqual([]);
      expect(result.current.total).toBe(0);
      expect(result.current.isCartOpen).toBe(false);
    });

    it('should load cart from localStorage on initialization', () => {
      const mockCart: CartItem[] = [
        { id: '1', type: 'service', title: 'Item 1', price: 10 },
        { id: '2', type: 'service', title: 'Item 2', price: 20 },
      ];
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockCart));

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toEqual(mockCart);
      expect(result.current.total).toBe(30);
    });

    it('should handle invalid localStorage data gracefully', () => {
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('Invalid JSON');
      });

      const { result } = renderHook(() => useCart(), { wrapper });

      expect(result.current.items).toEqual([]);
    });
  });

  describe('addToCart', () => {
    it('should add item to empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0]).toEqual(item);
      expect(result.current.total).toBe(25);
    });

    it('should add multiple items to cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1: CartItem = { id: '1', type: 'service', title: 'Item 1', price: 10 };
      const item2: CartItem = { id: '2', type: 'service', title: 'Item 2', price: 20 };

      act(() => {
        result.current.addToCart(item1);
        result.current.addToCart(item2);
      });

      expect(result.current.items).toHaveLength(2);
      expect(result.current.total).toBe(30);
    });

    it('should prevent duplicate items', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
        result.current.addToCart(item);
      });

      expect(result.current.items).toHaveLength(1);
    });

    it('should auto-open cart when adding first item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
      });

      expect(result.current.isCartOpen).toBe(true);
    });

    it('should save cart to localStorage when adding item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('removeFromCart', () => {
    it('should remove item from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1: CartItem = { id: '1', type: 'service', title: 'Item 1', price: 10 };
      const item2: CartItem = { id: '2', type: 'service', title: 'Item 2', price: 20 };

      act(() => {
        result.current.addToCart(item1);
        result.current.addToCart(item2);
        result.current.removeFromCart('1');
      });

      expect(result.current.items).toHaveLength(1);
      expect(result.current.items[0].id).toBe('2');
      expect(result.current.total).toBe(20);
    });

    it('should handle removing non-existent item gracefully', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.removeFromCart('non-existent');
      });

      expect(result.current.items).toHaveLength(0);
    });

    it('should save cart to localStorage when removing item', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
        result.current.removeFromCart('1');
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('clearCart', () => {
    it('should remove all items from cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1: CartItem = { id: '1', type: 'service', title: 'Item 1', price: 10 };
      const item2: CartItem = { id: '2', type: 'service', title: 'Item 2', price: 20 };

      act(() => {
        result.current.addToCart(item1);
        result.current.addToCart(item2);
        result.current.clearCart();
      });

      expect(result.current.items).toHaveLength(0);
      expect(result.current.total).toBe(0);
    });

    it('should save cart to localStorage when clearing', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item: CartItem = { id: '1', type: 'service', title: 'Test Item', price: 25 };

      act(() => {
        result.current.addToCart(item);
        result.current.clearCart();
      });

      expect(localStorageMock.setItem).toHaveBeenCalled();
    });
  });

  describe('cart total', () => {
    it('should calculate total correctly', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      const item1: CartItem = { id: '1', type: 'service', title: 'Item 1', price: 15 };
      const item2: CartItem = { id: '2', type: 'service', title: 'Item 2', price: 25 };
      const item3: CartItem = { id: '3', type: 'service', title: 'Item 3', price: 30 };

      act(() => {
        result.current.addToCart(item1);
        result.current.addToCart(item2);
        result.current.addToCart(item3);
      });

      expect(result.current.total).toBe(70);
    });

    it('should return 0 total for empty cart', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.total).toBe(0);
    });
  });

  describe('cart open/close state', () => {
    it('should allow manual control of cart open state', () => {
      const { result } = renderHook(() => useCart(), { wrapper });

      act(() => {
        result.current.setIsCartOpen(true);
      });

      expect(result.current.isCartOpen).toBe(true);

      act(() => {
        result.current.setIsCartOpen(false);
      });

      expect(result.current.isCartOpen).toBe(false);
    });

    it('should start with cart closed', () => {
      const { result } = renderHook(() => useCart(), { wrapper });
      expect(result.current.isCartOpen).toBe(false);
    });
  });
});
