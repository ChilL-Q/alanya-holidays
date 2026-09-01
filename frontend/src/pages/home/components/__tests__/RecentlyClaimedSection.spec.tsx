import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import RecentlyClaimedSection from "../RecentlyClaimedSection";
import { directoryService } from "@/api-services/directory.service";
import type { Business } from "@/mocks/businesses";
import i18n from "@/i18n";

const mockRecentlyClaimed: Business[] = [
  {
    id: "biz-recent-1",
    name: "Cleopatra Blue Seafood",
    category: "restaurants",
    subcategory: "Seafood",
    description: "Beachfront dining on Cleopatra beach.",
    address: "Cleopatra Beach No:4, Alanya",
    phone: "+90 242 512 0001",
    email: "info@cleopatrablue.test",
    website: "https://cleopatrablue.test",
    rating: 4.9,
    reviewCount: 210,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
    tags: ["Seafood", "Beachfront"],
    featured: true,
    priceRange: "$$$",
    openingHours: "10:00 - 00:00",
    lat: 36.54,
    lng: 31.98,
    is_claimed: true,
    is_verified: true,
  },
  {
    id: "biz-recent-2",
    name: "Red Tower Boutique Stay",
    category: "hotels",
    subcategory: "Boutique Hotel",
    description: "Historic boutique stay in Alanya Castle.",
    address: "Kale Cad. No:8, Alanya",
    phone: "+90 242 512 0002",
    email: "contact@redtowerhotel.test",
    website: "https://redtowerhotel.test",
    rating: 4.8,
    reviewCount: 95,
    image: "https://images.unsplash.com/photo-1566073771259-6a8506099945",
    tags: ["Historic", "Castle View"],
    featured: false,
    priceRange: "$$",
    openingHours: "24/7",
    lat: 36.53,
    lng: 31.99,
    is_claimed: true,
    is_verified: true,
  },
];

describe("RecentlyClaimedSection Component (Milestone M5 / R5)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("en");
  });

  it("fetches and renders recently claimed business cards", async () => {
    vi.spyOn(directoryService, "getRecentlyClaimedListings").mockResolvedValue(
      mockRecentlyClaimed
    );

    render(
      <BrowserRouter>
        <RecentlyClaimedSection />
      </BrowserRouter>
    );

    expect(screen.getByText(/recently claimed/i)).toBeInTheDocument();
    expect(
      await screen.findByText("Cleopatra Blue Seafood")
    ).toBeInTheDocument();
    expect(screen.getByText("Red Tower Boutique Stay")).toBeInTheDocument();
    expect(screen.getAllByText(/verified owner/i).length).toBeGreaterThan(0);
  });

  it("shows an honest empty state without substituting unrelated top-rated listings", async () => {
    vi.spyOn(directoryService, "getRecentlyClaimedListings").mockResolvedValue([]);
    const fallbackSpy = vi.spyOn(directoryService, "getListings");

    render(
      <BrowserRouter>
        <RecentlyClaimedSection />
      </BrowserRouter>
    );

    expect(await screen.findByText("No recently verified businesses yet")).toBeInTheDocument();
    expect(fallbackSpy).not.toHaveBeenCalled();
  });

  it("localizes the section chrome in Russian while preserving company names", async () => {
    await i18n.changeLanguage("ru");
    vi.spyOn(directoryService, "getRecentlyClaimedListings").mockResolvedValue(mockRecentlyClaimed);

    render(
      <BrowserRouter>
        <RecentlyClaimedSection />
      </BrowserRouter>
    );

    expect(await screen.findByRole("heading", { name: "Недавно подтверждённые компании" })).toBeInTheDocument();
    expect(screen.getAllByText("Подтверждённый владелец")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Подробнее" })).toHaveLength(2);
    expect(screen.getByText("Cleopatra Blue Seafood")).toBeInTheDocument();
  });

  it("surfaces API errors rather than collapsing into an empty section", async () => {
    vi.spyOn(directoryService, "getRecentlyClaimedListings").mockRejectedValue(
      new Error("Directory API unavailable"),
    );

    render(
      <BrowserRouter>
        <RecentlyClaimedSection />
      </BrowserRouter>
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Directory API unavailable");
  });
});
