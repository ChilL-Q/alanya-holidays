import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BusinessCard from "./BusinessCard";
import type { Business } from "@/mocks/businesses";

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

const mockBusiness: Business = {
  id: "biz-001",
  name: "Alanya Harbor Restaurant",
  category: "dining",
  subcategory: "Seafood & Grill",
  rating: 4.8,
  reviewCount: 124,
  priceRange: "$$",
  address: "Harbor Street 12, Alanya",
  openingHours: "10:00 - 23:00",
  phone: "+90 242 511 00 00",
  email: "info@example.com",
  website: "https://example.com",
  image: "https://example.com/image.jpg",
  tags: ["Seafood", "Outdoor", "Sea View"],
  featured: true,
  lat: 36.54,
  lng: 31.99,
  description: "Fresh Mediterranean seafood right on the harbor.",
};

describe("BusinessCard Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("must not contain nested <a> tags (invalid DOM nesting)", () => {
    const { container } = render(
      <MemoryRouter>
        <BusinessCard business={mockBusiness} />
      </MemoryRouter>
    );

    const nestedLinks = container.querySelectorAll("a a");
    expect(nestedLinks.length).toBe(0);
  });

  it("must not contain nested <button> tags inside another <button>", () => {
    const { container } = render(
      <MemoryRouter>
        <BusinessCard business={mockBusiness} />
      </MemoryRouter>
    );

    const nestedButtons = container.querySelectorAll("button button");
    expect(nestedButtons.length).toBe(0);
  });

  it("navigates to the business detail page when clicking the card", () => {
    render(
      <MemoryRouter>
        <BusinessCard business={mockBusiness} />
      </MemoryRouter>
    );

    const card = screen.getByText("Alanya Harbor Restaurant").closest("[data-testid='business-card']") || screen.getByText("Alanya Harbor Restaurant").closest("div");
    expect(card).toBeDefined();
    if (card) {
      fireEvent.click(card);
      expect(mockedNavigate).toHaveBeenCalledWith("/business/biz-001");
    }
  });
});
