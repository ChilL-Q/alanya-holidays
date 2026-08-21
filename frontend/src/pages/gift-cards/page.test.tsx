import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import GiftCardsPage from "./page";
import { Money } from "@/domain/money.vo";
import { GIFT_CARD_COLLECTIONS, FAQ_ITEMS, REDEMPTION_STEPS } from "./data/giftCardsData";

// Mock useCart hook
const mockAddToCart = vi.fn();
const mockRemoveFromCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearCart = vi.fn();

vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({
    items: [],
    addToCart: mockAddToCart,
    removeFromCart: mockRemoveFromCart,
    updateQuantity: mockUpdateQuantity,
    clearCart: mockClearCart,
    itemCount: 0,
    totalItems: 0,
    subtotalMoney: Money.zero("EUR"),
  }),
}));

// Mock AuthContext
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
}));

// Mock notifications service
vi.mock("@/api-services/notifications.service", () => ({
  notificationsService: {
    getUnreadCount: vi.fn().mockResolvedValue(0),
    getNotifications: vi.fn().mockResolvedValue([]),
  },
  getNotifications: vi.fn().mockResolvedValue([]),
  markAsRead: vi.fn().mockResolvedValue({}),
  markAllAsRead: vi.fn().mockResolvedValue({}),
  deleteNotification: vi.fn().mockResolvedValue({}),
  formatNotificationTime: vi.fn().mockReturnValue("Just now"),
}));

describe("GiftCardsPage Component (/gift-cards)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const renderComponent = () => {
    return render(
      <MemoryRouter>
        <GiftCardsPage />
      </MemoryRouter>
    );
  };

  it("renders the hero banner, trust badges, and heading", () => {
    renderComponent();

    // Check Hero title & subtitle
    expect(
      screen.getByRole("heading", { name: /Curated Culinary & Cultural/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Give the gift of unforgettable experiences/i)
    ).toBeInTheDocument();

    // Check Trust badges
    expect(screen.getByText("Instant Digital Delivery")).toBeInTheDocument();
    expect(screen.getAllByText("12-Month Validity").length).toBeGreaterThan(0);
    expect(screen.getByText("Flexible Free Exchanges")).toBeInTheDocument();
    expect(screen.getByText("Verified Partner Venues")).toBeInTheDocument();
  });

  it("renders all 6 curated gift card collections", () => {
    renderComponent();

    GIFT_CARD_COLLECTIONS.forEach((collection) => {
      expect(screen.getByText(collection.title)).toBeInTheDocument();
      expect(screen.getByText(`"${collection.tagline}"`)).toBeInTheDocument();
    });
  });

  it("filters collections by category selection", () => {
    renderComponent();

    // Click "Patisserie & Sweets" category pill
    const sweetPill = screen.getByRole("button", { name: /^Patisserie & Sweets$/i });
    fireEvent.click(sweetPill);

    // Sweet Story should be visible
    expect(screen.getByText("Sweet Story")).toBeInTheDocument();

    // Other collections should not be in the document
    expect(screen.queryByText("Turkish Village Breakfast")).not.toBeInTheDocument();
    expect(screen.queryByText("Coffee Tour Trail")).not.toBeInTheDocument();

    // Switch back to "All Experiences"
    const allPill = screen.getByRole("button", { name: /^All Experiences$/i });
    fireEvent.click(allPill);

    expect(screen.getByText("Sweet Story")).toBeInTheDocument();
    expect(screen.getByText("Turkish Village Breakfast")).toBeInTheDocument();
    expect(screen.getByText("Coffee Tour Trail")).toBeInTheDocument();
  });

  it("filters collections by search input query", () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search gift cards/i);
    fireEvent.change(searchInput, { target: { value: "Serpme" } });

    // Only Turkish Village Breakfast matches Serpme
    expect(screen.getByText("Turkish Village Breakfast")).toBeInTheDocument();
    expect(screen.queryByText("Sweet Story")).not.toBeInTheDocument();

    // Clear search
    const clearButton = screen.getByLabelText(/Clear search/i);
    fireEvent.click(clearButton);

    expect(screen.getByText("Sweet Story")).toBeInTheDocument();
    expect(screen.getByText("Turkish Village Breakfast")).toBeInTheDocument();
  });

  it("shows empty state when no collections match query, and resets filters cleanly", () => {
    renderComponent();

    const searchInput = screen.getByLabelText(/Search gift cards/i);
    fireEvent.change(searchInput, { target: { value: "NonExistentExperienceXYZ" } });

    expect(screen.getByText(/No gift cards match your filter/i)).toBeInTheDocument();

    // Click reset filters button
    const resetBtn = screen.getByRole("button", { name: /Reset All Filters/i });
    fireEvent.click(resetBtn);

    expect(screen.getByText("Sweet Story")).toBeInTheDocument();
    expect(screen.getByText("Weekend Brunch Bundle")).toBeInTheDocument();
  });

  it("allows switching experience tiers and updates the displayed price and perks", () => {
    renderComponent();

    const sweetCard = screen.getByTestId("gift-card-sweet-story");
    expect(sweetCard).toBeInTheDocument();

    // Sweet Story defaults to recommended tier "Patisserie Delight" (€28.00)
    expect(screen.getByText(/2 Artisanal Pastries \/ Soufflés/i)).toBeInTheDocument();

    // Switch to Tier 1 "Sweet Treat" (€15.00)
    const sweetTreatButton = screen.getByRole("button", { name: /Sweet Treat tier/i });
    fireEvent.click(sweetTreatButton);

    expect(screen.getByText(/1 Signature Dessert \/ Soufflé/i)).toBeInTheDocument();

    // Switch to Tier 3 "Grand Tasting Banquet" (€50.00)
    const grandTastingButton = screen.getByRole("button", { name: /Grand Tasting Banquet tier/i });
    fireEvent.click(grandTastingButton);

    expect(screen.getByText(/Chef's Grand Tasting Platter/i)).toBeInTheDocument();
  });

  it("adds selected tier to cart with Money VO and displays toast feedback", () => {
    renderComponent();

    // Find "Add to Cart" button for Sweet Story with default Patisserie Delight (€28)
    const sweetCardAddBtn = screen.getByRole("button", {
      name: /Add Sweet Story - Patisserie Delight to cart/i,
    });
    fireEvent.click(sweetCardAddBtn);

    expect(mockAddToCart).toHaveBeenCalledTimes(1);
    const addedItem = mockAddToCart.mock.calls[0][0];

    expect(addedItem.name).toBe("Sweet Story");
    expect(addedItem.variantLabel).toBe("Patisserie Delight");
    expect(addedItem.productId).toBe(100021);
    expect(addedItem.skuId).toBe("patisserie-delight");
    expect(addedItem.skuLabel).toBe("Patisserie Delight");
    expect(addedItem.quantity).toBe(1);
    expect(addedItem.price).toBeInstanceOf(Money);
    expect((addedItem.price as Money).cents).toBe(2800);
    expect((addedItem.price as Money).currency).toBe("EUR");

    // Check toast feedback rendered
    expect(screen.getByText("Added to cart")).toBeInTheDocument();
    expect(screen.getByText(/Sweet Story - Patisserie Delight/i)).toBeInTheDocument();
  });

  it("renders the 3-step redemption guide with all step details", () => {
    renderComponent();

    expect(screen.getByText("How Alanya Gift Cards Work")).toBeInTheDocument();

    REDEMPTION_STEPS.forEach((step) => {
      expect(screen.getByText(step.title)).toBeInTheDocument();
      expect(screen.getByText(step.subtitle)).toBeInTheDocument();
      expect(screen.getByText(step.description)).toBeInTheDocument();
      expect(screen.getAllByText(step.tag).length).toBeGreaterThan(0);
    });
  });

  it("renders the FAQ section and toggles accordion items with keyboard accessibility", () => {
    renderComponent();

    expect(screen.getByText("Everything You Need to Know")).toBeInTheDocument();

    // First FAQ item is open by default
    const firstFaq = FAQ_ITEMS[0];
    expect(screen.getByText(firstFaq.answer)).toBeInTheDocument();

    // Second FAQ item is initially closed
    const secondFaq = FAQ_ITEMS[1];
    expect(screen.queryByText(secondFaq.answer)).not.toBeInTheDocument();

    // Click second FAQ to open it
    const secondFaqBtn = screen.getByRole("button", { name: new RegExp(secondFaq.question, "i") });
    expect(secondFaqBtn).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(secondFaqBtn);

    expect(secondFaqBtn).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(secondFaq.answer)).toBeInTheDocument();
  });
});
