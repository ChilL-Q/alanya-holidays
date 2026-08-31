import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProductDetailPage from "./page";
import { productsService } from "@/api-services/products.service";

const cartState = vi.hoisted(() => ({
  addToCart: vi.fn(),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => cartState,
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    isFavorite: vi.fn(() => false),
    toggleFavorite: vi.fn(),
    favorites: [],
  }),
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
    ToastContainer: () => null,
  }),
}));

vi.mock("@/api-services/products.service", () => ({
  productsService: {
    getProductDetails: vi.fn(),
    createProductOrder: vi.fn(),
  },
}));

vi.mock("@/lib/api-client", () => ({
  isAbortError: () => false,
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("./components/ProductBreadcrumb", () => ({
  ProductBreadcrumb: () => null,
}));
vi.mock("./components/ProductGallery", () => ({ ProductGallery: () => null }));
vi.mock("./components/ProductInfo", () => ({
  ProductInfo: ({ onAddToCart }: { onAddToCart: () => void }) => (
    <button onClick={onAddToCart}>Add product</button>
  ),
}));
vi.mock("./components/CheckoutForm", () => ({ CheckoutForm: () => null }));
vi.mock("./components/CoffeeTourSection", () => ({
  CoffeeTourSection: () => null,
}));
vi.mock("./components/SendToPhoneModal", () => ({
  SendToPhoneModal: () => null,
}));

describe("ProductDetailPage cart images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsService.getProductDetails).mockResolvedValue({
      product: {
        id: 42,
        name: "Pink Peshtemal",
        description: "Handwoven cotton towel",
        price: 30,
        currency: "EUR",
        stock: 5,
        media: [
          {
            type: "image",
            url: "https://example.com/pink-peshtemal.jpg",
          },
        ],
        category_id: 7,
        product_categories: { id: 7, name: "Turkish Textiles" },
      },
      variants: [],
      skus: [],
    });
  });

  it("passes the product image URL when adding from product detail", async () => {
    render(
      <MemoryRouter initialEntries={["/shop/42"]}>
        <Routes>
          <Route path="/shop/:productId" element={<ProductDetailPage />} />
        </Routes>
      </MemoryRouter>,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Add product" }));

    expect(cartState.addToCart).toHaveBeenCalledWith({
      name: "Pink Peshtemal",
      price: "€30.00",
      icon: "ri-t-shirt-line",
      variantLabel: undefined,
      imageUrl: "https://example.com/pink-peshtemal.jpg",
    });
  });
});
