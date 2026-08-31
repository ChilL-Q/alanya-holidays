import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { BrowserRouter } from "react-router-dom";
import BusinessCard from "../BusinessCard";
import type { Business } from "@/mocks/businesses";

const mockBusiness: Business = {
  id: "biz-test-1",
  name: "Alanya Mediterranean Bistro",
  category: "restaurants",
  subcategory: "Mediterranean Cuisine",
  description: "Exquisite coastal dining overlooking the Mediterranean harbor.",
  address: "Ahmet Tokus Blv. No:42, Alanya",
  phone: "+90 242 511 0000",
  email: "contact@alanya-bistro.test",
  website: "https://alanya-bistro.test",
  rating: 4.8,
  reviewCount: 142,
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  tags: ["Seafood", "Sunset View", "Outdoor Seating", "Cocktails", "Live Music"],
  featured: true,
  priceRange: "$$$",
  openingHours: "12:00 - 00:00",
  lat: 36.543,
  lng: 31.998,
};

describe("BusinessCard Component (Milestone M2 / R1)", () => {
  it("renders with horizontal layout by default", () => {
    render(
      <BrowserRouter>
        <BusinessCard business={mockBusiness} />
      </BrowserRouter>
    );

    const card = screen.getByTestId("business-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-layout", "horizontal");
    expect(screen.getByText("Alanya Mediterranean Bistro")).toBeInTheDocument();
    expect(screen.getByText("Mediterranean Cuisine")).toBeInTheDocument();
    expect(screen.getByText("Premium")).toBeInTheDocument(); // "$$$" -> "Premium"
    expect(screen.getByText("4.8")).toBeInTheDocument();
    expect(screen.getByText("(142)")).toBeInTheDocument();
  });

  it("renders in grid layout when specified", () => {
    render(
      <BrowserRouter>
        <BusinessCard business={mockBusiness} layout="grid" />
      </BrowserRouter>
    );

    const card = screen.getByTestId("business-card");
    expect(card).toBeInTheDocument();
    expect(card).toHaveAttribute("data-layout", "grid");
  });

  it("renders high-contrast typography and category icons/details", () => {
    render(
      <BrowserRouter>
        <BusinessCard business={mockBusiness} />
      </BrowserRouter>
    );

    expect(screen.getByText("Ahmet Tokus Blv. No:42, Alanya")).toBeInTheDocument();
    expect(screen.getByText("12:00 - 00:00")).toBeInTheDocument();
    expect(screen.getByText("Seafood")).toBeInTheDocument();
    expect(screen.getByText("Sunset View")).toBeInTheDocument();
    expect(screen.getByText("Call")).toHaveAttribute("href", "tel:+90 242 511 0000");
    expect(screen.getByText("Website")).toHaveAttribute("href", "https://alanya-bistro.test");
  });

  it("renders trust badge correctly on card", () => {
    render(
      <BrowserRouter>
        <BusinessCard business={mockBusiness} />
      </BrowserRouter>
    );

    // "$$$" + rating 4.8 resolves to Signature Collection
    const badge = screen.getByTestId("trust-badge");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("data-badge-type", "Signature Collection");
  });

  it("invokes onClaimClick when claim action is triggered", () => {
    const handleClaim = vi.fn();
    render(
      <BrowserRouter>
        <BusinessCard business={{ ...mockBusiness, can_claim: true }} onClaimClick={handleClaim} />
      </BrowserRouter>
    );

    const claimBtn = screen.getByTitle(/claim this listing/i);
    expect(claimBtn).toBeInTheDocument();
    fireEvent.click(claimBtn);
    expect(handleClaim).toHaveBeenCalledTimes(1);
    expect(handleClaim).toHaveBeenCalledWith({ ...mockBusiness, can_claim: true });
  });

  it("does not expose a claim action when the server marks a listing ineligible", () => {
    render(
      <BrowserRouter>
        <BusinessCard
          business={{ ...mockBusiness, can_claim: false }}
          onClaimClick={vi.fn()}
        />
      </BrowserRouter>
    );

    expect(screen.queryByTitle(/claim this listing/i)).not.toBeInTheDocument();
  });

  it("handles compare mode checkbox toggling", () => {
    const handleToggleCompare = vi.fn();
    render(
      <BrowserRouter>
        <BusinessCard
          business={mockBusiness}
          compareMode={true}
          isCompared={false}
          onToggleCompare={handleToggleCompare}
        />
      </BrowserRouter>
    );

    const compareBtn = screen.getByTitle(/add to comparison/i);
    expect(compareBtn).toBeInTheDocument();
    fireEvent.click(compareBtn);
    expect(handleToggleCompare).toHaveBeenCalledWith(mockBusiness.id);
  });
});
