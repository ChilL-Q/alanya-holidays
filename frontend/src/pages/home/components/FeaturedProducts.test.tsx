import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { productsService, type ShopProduct } from "@/api-services/products.service";
import FeaturedProducts from "./FeaturedProducts";
import i18n from "@/i18n";

const product: ShopProduct = {
  id: 41,
  name: "Alanya Keepsake",
  description: "A keepsake made in Alanya.",
  price: 25,
  currency: "EUR",
  stock: 3,
  media: [],
  category_id: null,
  product_categories: null,
};

describe("FeaturedProducts", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("localizes product chrome in Russian while preserving product content", async () => {
    await i18n.changeLanguage("ru");
    vi.spyOn(productsService, "getFeaturedProducts").mockResolvedValue([product]);

    render(
      <MemoryRouter>
        <FeaturedProducts />
      </MemoryRouter>,
    );

    expect(await screen.findByText("Alanya Keepsake")).toBeInTheDocument();
    expect(screen.getByText("Новинка")).toBeInTheDocument();
    expect(screen.getByText("Подробнее")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все товары" })).toHaveAttribute("href", "/shop");
  });

  it("surfaces product API errors", async () => {
    vi.spyOn(productsService, "getFeaturedProducts").mockRejectedValue(
      new Error("Products API unavailable"),
    );

    render(
      <MemoryRouter>
        <FeaturedProducts />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Products API unavailable");
  });
});
