import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CartDrawer from "./CartDrawer";
import { CartProvider, useCart } from "@/hooks/useCart";
import { BrowserRouter } from "react-router-dom";
import React from "react";

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

function CartWithItem({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { addToCart } = useCart();
  React.useEffect(() => {
    addToCart({
      name: "Silk Scarf",
      price: "€45.00",
      icon: "ri-gift-line",
      imageUrl: "https://example.com/silk-scarf.jpg",
    });
  }, [addToCart]);

  return <CartDrawer open={open} onClose={onClose} />;
}

describe("CartDrawer Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  it("locks body scroll when open and restores it when closed", () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawer open={true} onClose={onClose} />
        </CartProvider>
      </BrowserRouter>
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender(
      <BrowserRouter>
        <CartProvider>
          <CartDrawer open={false} onClose={onClose} />
        </CartProvider>
      </BrowserRouter>
    );

    expect(document.body.style.overflow).toBe("");
  });

  it("renders into document.body portal with high z-index and fixed viewport classes", () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CartProvider>
          <div data-testid="parent-nav" style={{ height: "80px", backdropFilter: "blur(10px)" }}>
            <CartDrawer open={true} onClose={onClose} />
          </div>
        </CartProvider>
      </BrowserRouter>
    );

    const dialog = screen.getByRole("dialog", { name: /shopping cart/i });
    expect(dialog).toBeInTheDocument();

    // Dialog should be directly under document.body or a portal container, not trapped inside parent-nav
    const parentNav = screen.getByTestId("parent-nav");
    expect(parentNav.contains(dialog)).toBe(false);

    // Verify viewport and z-index classes
    expect(dialog.className).toMatch(/fixed/);
    expect(dialog.className).toMatch(/inset-y-0|h-screen|h-dvh/);
  });

  it("navigates to /checkout and calls onClose when Proceed to Checkout is clicked", () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CartProvider>
          <CartWithItem open={true} onClose={onClose} />
        </CartProvider>
      </BrowserRouter>
    );

    const checkoutBtn = screen.getByRole("button", { name: /proceed to checkout/i });
    fireEvent.click(checkoutBtn);

    expect(onClose).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith("/checkout");
  });

  it("renders the product image and falls back to the category icon on load error", () => {
    render(
      <BrowserRouter>
        <CartProvider>
          <CartWithItem open={true} onClose={vi.fn()} />
        </CartProvider>
      </BrowserRouter>
    );

    const image = screen.getByRole("img", { name: "Silk Scarf" });
    expect(image).toHaveAttribute(
      "src",
      "https://example.com/silk-scarf.jpg",
    );

    fireEvent.error(image);

    expect(
      screen.queryByRole("img", { name: "Silk Scarf" }),
    ).not.toBeInTheDocument();
    expect(document.querySelector(".ri-gift-line")).toBeInTheDocument();
  });

  it("closes when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawer open={true} onClose={onClose} />
        </CartProvider>
      </BrowserRouter>
    );

    const backdrop = document.querySelector(".fixed.inset-0");
    expect(backdrop).toBeInTheDocument();
    if (backdrop) {
      fireEvent.click(backdrop);
      expect(onClose).toHaveBeenCalled();
    }
  });

  it("closes when Escape key is pressed", () => {
    const onClose = vi.fn();
    render(
      <BrowserRouter>
        <CartProvider>
          <CartDrawer open={true} onClose={onClose} />
        </CartProvider>
      </BrowserRouter>
    );

    fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });
});
