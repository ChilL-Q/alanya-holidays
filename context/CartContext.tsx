import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { CartItem } from '../types/index';

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
  total: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider: React.FC<CartProviderProps> = ({ children }) => {
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from local storage', error);
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(items));
    } catch (error) {
      console.error('Failed to save cart to local storage', error);
    }
  }, [items]);

  const addToCart = (item: CartItem) => {
    setItems(prev => {
      // Avoid duplicates
      if (prev.some(i => i.id === item.id)) {
        return prev;
      }
      // logic for auto-open needs to know if it was empty, but here we are in setter.
      // We can check prev.length inside.
      return [...prev, item];
    });

    // Side effect for cart open: relies on current 'items' which is stale, but logic:
    // "Only auto-open if it's the first item".
    // If items.length is 0, we are adding one. 
    // If we call twice, items.length is 0 both times. Open called twice. Harmless.
    if (items.length === 0) {
      setIsCartOpen(true);
    }
  };

  const removeFromCart = (id: string) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  const clearCart = () => setItems([]);

  const total = items.reduce((sum, item) => sum + item.price, 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};