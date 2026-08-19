import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";

export interface CartItem {
  productName: string;
  price: string;
  icon: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (product: { name: string; price: string; icon: string; variantLabel?: string }) => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalItems: number;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  totalItems: 0,
});

const STORAGE_KEY = "alanya_cart";

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // corrupted data, reset
  }
  return [];
}

function saveCart(items: CartItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // storage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addToCart = useCallback((product: { name: string; price: string; icon: string; variantLabel?: string }) => {
    const displayName = product.variantLabel ? `${product.name} - ${product.variantLabel}` : product.name;
    setItems((prev) => {
      const existing = prev.find((item) => item.productName === displayName);
      if (existing) {
        return prev.map((item) =>
          item.productName === displayName
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [...prev, { productName: displayName, price: product.price, icon: product.icon, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productName: string) => {
    setItems((prev) => prev.filter((item) => item.productName !== productName));
  }, []);

  const updateQuantity = useCallback((productName: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productName !== productName));
      return;
    }
    setItems((prev) =>
      prev.map((item) =>
        item.productName === productName ? { ...item, quantity } : item,
      ),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items]
  );

  const value: CartContextValue = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount: items.length,
      totalItems,
    }),
    [items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  return useContext(CartContext);
}