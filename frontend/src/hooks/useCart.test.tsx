import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import React from "react";
import { CartProvider, useCart } from "./useCart";
import { Money } from "@/domain/money.vo";

describe("useCart hook", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <CartProvider>{children}</CartProvider>
  );

  it("should initialize with empty cart and zero subtotalMoney", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items).toEqual([]);
    expect(result.current.itemCount).toBe(0);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotalMoney.isZero()).toBe(true);
  });

  it("should add item with string price, calculate subtotalMoney accurately", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Turkish Delight Box",
        price: "€15.50",
        icon: "ri-gift-line",
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productName).toBe("Turkish Delight Box");
    expect(result.current.items[0].moneyPrice.amount).toBe(15.5);
    expect(result.current.items[0].moneyPrice.cents).toBe(1550);
    expect(result.current.subtotalMoney.amount).toBe(15.5);
    expect(result.current.subtotalMoney.cents).toBe(1550);
  });

  it("should persist and restore the optional product image URL", async () => {
    const firstRender = renderHook(() => useCart(), { wrapper });

    act(() => {
      firstRender.result.current.addToCart({
        name: "Pink Peshtemal",
        price: "€30.00",
        icon: "ri-t-shirt-line",
        imageUrl: "https://example.com/pink-peshtemal.jpg",
      });
    });

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem("alanya_cart") || "[]");
      expect(stored[0].imageUrl).toBe(
        "https://example.com/pink-peshtemal.jpg",
      );
    });

    firstRender.unmount();
    const restored = renderHook(() => useCart(), { wrapper });

    expect(restored.result.current.items[0].imageUrl).toBe(
      "https://example.com/pink-peshtemal.jpg",
    );
  });

  it("should keep legacy stored cart entries usable without an image URL", () => {
    localStorage.setItem(
      "alanya_cart",
      JSON.stringify([
        {
          productName: "Legacy Gift",
          price: "€12.00",
          icon: "ri-gift-line",
          quantity: 2,
        },
      ]),
    );

    const { result } = renderHook(() => useCart(), { wrapper });

    expect(result.current.items[0]).toMatchObject({
      productName: "Legacy Gift",
      quantity: 2,
    });
    expect(result.current.items[0].imageUrl).toBeUndefined();
    expect(result.current.subtotalMoney.cents).toBe(2400);
  });

  it("should handle decimal addition without float drift (0.1 + 0.2 === 0.3)", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Postcard 1",
        price: "€0.10",
        icon: "ri-mail-line",
      });
      result.current.addToCart({
        name: "Postcard 2",
        price: "€0.20",
        icon: "ri-mail-line",
      });
    });

    expect(result.current.items.length).toBe(2);
    expect(result.current.subtotalMoney.amount).toBe(0.3);
    expect(result.current.subtotalMoney.cents).toBe(30);
  });

  it("should increment quantity when adding duplicate item name", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Alanya Mug",
        price: 12.0,
        icon: "ri-cup-line",
      });
      result.current.addToCart({
        name: "Alanya Mug",
        price: 12.0,
        icon: "ri-cup-line",
      });
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].quantity).toBe(2);
    expect(result.current.totalItems).toBe(2);
    expect(result.current.subtotalMoney.amount).toBe(24.0);
    expect(result.current.subtotalMoney.cents).toBe(2400);
  });

  it("should update quantity and remove when quantity is 0", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Handmade Carpet",
        price: Money.fromDecimal(120, "EUR"),
        icon: "ri-store-line",
      });
    });

    expect(result.current.subtotalMoney.amount).toBe(120);

    act(() => {
      result.current.updateQuantity("Handmade Carpet", 3);
    });

    expect(result.current.items[0].quantity).toBe(3);
    expect(result.current.subtotalMoney.amount).toBe(360);

    act(() => {
      result.current.updateQuantity("Handmade Carpet", 0);
    });

    expect(result.current.items.length).toBe(0);
    expect(result.current.subtotalMoney.isZero()).toBe(true);
  });

  it("should remove item by name", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Item A",
        price: 10,
        icon: "ri-file-line",
      });
      result.current.addToCart({
        name: "Item B",
        price: 20,
        icon: "ri-file-line",
      });
    });

    expect(result.current.items.length).toBe(2);

    act(() => {
      result.current.removeFromCart("Item A");
    });

    expect(result.current.items.length).toBe(1);
    expect(result.current.items[0].productName).toBe("Item B");
    expect(result.current.subtotalMoney.amount).toBe(20);
  });

  it("should clear cart completely", () => {
    const { result } = renderHook(() => useCart(), { wrapper });

    act(() => {
      result.current.addToCart({
        name: "Item A",
        price: 10,
        icon: "ri-file-line",
      });
      result.current.clearCart();
    });

    expect(result.current.items).toEqual([]);
    expect(result.current.totalItems).toBe(0);
    expect(result.current.subtotalMoney.isZero()).toBe(true);
  });
});
