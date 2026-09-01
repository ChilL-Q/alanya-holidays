import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { Money } from "@/domain/money.vo";

export interface CartItem {
  id?: string | number;
  productId?: string | number;
  productName: string;
  price: string;
  moneyPrice: Money;
  icon: string;
  imageUrl?: string;
  quantity: number;
  skuId?: string | number | null;
  skuLabel?: string | null;
}

export interface AddToCartProduct {
  name: string;
  price: string | number | Money;
  icon: string;
  imageUrl?: string;
  variantLabel?: string;
  productId?: string | number;
  skuId?: string | number | null;
  skuLabel?: string | null;
  quantity?: number;
}

export interface CartContextValue {
  items: CartItem[];
  addToCart: (product: AddToCartProduct) => void;
  removeFromCart: (productName: string) => void;
  updateQuantity: (productName: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  totalItems: number;
  subtotalMoney: Money;
}

const CartContext = createContext<CartContextValue>({
  items: [],
  addToCart: () => {},
  removeFromCart: () => {},
  updateQuantity: () => {},
  clearCart: () => {},
  itemCount: 0,
  totalItems: 0,
  subtotalMoney: Money.zero(),
});

const STORAGE_KEY = "alanya_cart";

function deserializeCartItem(raw: Record<string, unknown>): CartItem {
  const productName = String(raw.productName || "");
  const price = String(raw.price || "");
  const icon = String(raw.icon || "ri-shopping-bag-3-line");
  const imageUrl =
    typeof raw.imageUrl === "string" && raw.imageUrl.length > 0
      ? raw.imageUrl
      : undefined;
  const quantity =
    typeof raw.quantity === "number" && raw.quantity > 0 ? raw.quantity : 1;
  const productId = raw.productId as string | number | undefined;
  const skuId = raw.skuId as string | number | null | undefined;
  const skuLabel = raw.skuLabel as string | null | undefined;

  let moneyPrice: Money;
  if (raw.moneyPrice && typeof raw.moneyPrice === "object") {
    moneyPrice = Money.fromJSON(
      raw.moneyPrice as { cents?: number; amount?: number; currency?: string },
    );
  } else {
    moneyPrice = Money.parse(price);
  }

  return {
    productId,
    productName,
    price: price || moneyPrice.format(),
    moneyPrice,
    icon,
    imageUrl,
    quantity,
    skuId,
    skuLabel,
  };
}

function loadCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((item) =>
          deserializeCartItem(item as Record<string, unknown>),
        );
      }
    }
  } catch {
    // corrupted data, reset
  }
  return [];
}

function saveCart(items: CartItem[]): void {
  try {
    const serialized = items.map((item) => ({
      productId: item.productId,
      productName: item.productName,
      price: item.price,
      moneyPrice: item.moneyPrice.toJSON(),
      icon: item.icon,
      imageUrl: item.imageUrl,
      quantity: item.quantity,
      skuId: item.skuId,
      skuLabel: item.skuLabel,
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serialized));
  } catch {
    // storage full or unavailable
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadCart);

  useEffect(() => {
    saveCart(items);
  }, [items]);

  const addToCart = useCallback((product: AddToCartProduct) => {
    const displayName = product.variantLabel
      ? `${product.name} - ${product.variantLabel}`
      : product.name;

    let money: Money;
    if (product.price instanceof Money) {
      money = product.price;
    } else if (typeof product.price === "number") {
      money = Money.fromDecimal(product.price);
    } else {
      money = Money.parse(product.price);
    }

    const priceStr =
      typeof product.price === "string" ? product.price : money.format();
    const qtyToAdd =
      product.quantity && product.quantity > 0 ? product.quantity : 1;

    setItems((prev) => {
      const existing = prev.find((item) => item.productName === displayName);
      if (existing) {
        return prev.map((item) =>
          item.productName === displayName
            ? {
                ...item,
                imageUrl: item.imageUrl || product.imageUrl,
                quantity: item.quantity + qtyToAdd,
              }
            : item,
        );
      }
      return [
        ...prev,
        {
          productId: product.productId,
          productName: displayName,
          price: priceStr,
          moneyPrice: money,
          icon: product.icon,
          imageUrl: product.imageUrl,
          quantity: qtyToAdd,
          skuId: product.skuId,
          skuLabel: product.skuLabel || product.variantLabel,
        },
      ];
    });
  }, []);

  const removeFromCart = useCallback((productName: string) => {
    setItems((prev) =>
      prev.filter((item) => item.productName !== productName),
    );
  }, []);

  const updateQuantity = useCallback(
    (productName: string, quantity: number) => {
      if (quantity <= 0) {
        setItems((prev) =>
          prev.filter((item) => item.productName !== productName),
        );
        return;
      }
      setItems((prev) =>
        prev.map((item) =>
          item.productName === productName ? { ...item, quantity } : item,
        ),
      );
    },
    [],
  );

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const totalItems = useMemo(
    () => items.reduce((sum, item) => sum + item.quantity, 0),
    [items],
  );

  const subtotalMoney = useMemo(() => {
    if (items.length === 0) return Money.zero();
    const firstCurrency = items[0].moneyPrice?.currency || "EUR";
    return items.reduce((sum, item) => {
      const itemMoney = item.moneyPrice || Money.parse(item.price);
      return sum.add(itemMoney.multiply(item.quantity));
    }, Money.zero(firstCurrency));
  }, [items]);

  const value: CartContextValue = useMemo(
    () => ({
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      itemCount: items.length,
      totalItems,
      subtotalMoney,
    }),
    [
      items,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      totalItems,
      subtotalMoney,
    ],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  return useContext(CartContext);
}
