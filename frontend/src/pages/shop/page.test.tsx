import "@testing-library/jest-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ShopPage from "./page";
import { productsService } from "@/api-services/products.service";

const cartState = vi.hoisted(() => ({
  addToCart: vi.fn(),
}));

vi.mock("@/hooks/useCart", () => ({
  useCart: () => cartState,
}));

vi.mock("@/hooks/useToast", () => ({
  useToast: () => ({
    showToast: vi.fn(),
    ToastContainer: () => null,
  }),
}));

vi.mock("@/api-services/products.service", () => ({
  productsService: {
    getShopCatalog: vi.fn(),
  },
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/base/PageHeroImage", () => ({ default: () => null }));
vi.mock("@/pages/shop/components/PersonalShopperForm", () => ({
  default: () => null,
}));
vi.mock("@/pages/shop/components/RecentEnquiriesSidebar", () => ({
  default: () => null,
}));

describe("ShopPage cart images", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(productsService.getShopCatalog).mockResolvedValue({
      categories: [{ id: 7, name: "Turkish Textiles" }],
      products: [
        {
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
      ],
    });
  });

  it("passes the catalog image URL when adding a product to the cart", async () => {
    render(
      <MemoryRouter>
        <ShopPage />
      </MemoryRouter>,
    );

    fireEvent.click(
      await screen.findByRole("button", { name: /add to cart/i }),
    );

    expect(cartState.addToCart).toHaveBeenCalledWith({
      name: "Pink Peshtemal",
      price: "€30.00",
      icon: "ri-t-shirt-line",
      imageUrl: "https://example.com/pink-peshtemal.jpg",
    });
  });
});
