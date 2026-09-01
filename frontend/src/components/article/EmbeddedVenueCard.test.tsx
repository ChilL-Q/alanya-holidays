import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EmbeddedVenueCard from "./EmbeddedVenueCard";
import { directoryService, type Business } from "@/api-services/directory.service";

const mockBusiness: Business = {
  id: "biz-001",
  name: "Kale Panorama Restaurant",
  category: "restaurants-cafes",
  subcategory: "Turkish Cuisine",
  description: "Perched on the hillside beneath Alanya Castle, Kale Panorama offers authentic Ottoman and Mediterranean cuisine.",
  address: "Hisariçi Mahallesi, Kale Yolu 42, 07400 Alanya/Antalya",
  phone: "+90 242 513 44 21",
  email: "reservations@kalepanorama.com",
  website: "https://kalepanorama.com",
  rating: 4.8,
  reviewCount: 347,
  image: "https://images.unsplash.com/photo-test-kale-panorama.jpg",
  tags: ["Turkish Cuisine", "Seafood", "Rooftop", "Sunset Views"],
  featured: true,
  trustBadge: "Signature Collection",
  priceRange: "$$$",
  openingHours: "12:00 - 23:30",
  lat: 36.5333,
  lng: 31.995,
};

describe("EmbeddedVenueCard Component", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Tier 1: Core Functional Rendering (Card Layout)", () => {
    it("renders full venue details including name, rating, reviews, price range, and image", () => {
      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={mockBusiness} layout="card" />
        </MemoryRouter>
      );

      // Name
      expect(screen.getByText("Kale Panorama Restaurant")).toBeInTheDocument();
      // Rating & Reviews
      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(screen.getByText(/347/)).toBeInTheDocument();
      // Price range & Subcategory
      expect(screen.getByText("$$$")).toBeInTheDocument();
      expect(screen.getByText("Turkish Cuisine")).toBeInTheDocument();
      // Trust badge
      expect(screen.getByText(/Signature Collection/i)).toBeInTheDocument();
      // Image
      const img = screen.getByRole("img", { name: /Kale Panorama Restaurant/i });
      expect(img).toHaveAttribute("src", mockBusiness.image);
    });

    it("renders 1-click navigation link pointing to the business directory page", () => {
      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={mockBusiness} layout="card" />
        </MemoryRouter>
      );

      const links = screen.getAllByRole("link");
      const businessLink = links.find((link) =>
        link.getAttribute("href")?.includes("/business/biz-001") ||
        link.getAttribute("href")?.includes("biz-001")
      );
      expect(businessLink).toBeDefined();
    });

    it("triggers onClick callback when card or action button is clicked", () => {
      const handleClick = vi.fn();
      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={mockBusiness} onClick={handleClick} />
        </MemoryRouter>
      );

      const action = screen.getByRole("link", { name: /view|explore|kale panorama/i });
      fireEvent.click(action);
      expect(handleClick).toHaveBeenCalledWith("biz-001");
    });
  });

  describe("Tier 2: Compact Layout", () => {
    it("renders a streamlined compact variant with essential metadata and quick link", () => {
      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={mockBusiness} layout="compact" />
        </MemoryRouter>
      );

      expect(screen.getByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("4.8")).toBeInTheDocument();
      // In compact layout, check that it renders with compact styling classes or pill badge
      expect(screen.getByText(/Turkish Cuisine|\$\$\$/i)).toBeInTheDocument();
    });
  });

  describe("Tier 3: Lookup by ID and Fallback Handling", () => {
    it("resolves venue details automatically when venueId is passed instead of full venue object", async () => {
      vi.spyOn(directoryService, "getListingById").mockResolvedValue(mockBusiness);

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venueId="biz-001" />
        </MemoryRouter>
      );

      expect(screen.getByText(/loading venue details/i)).toBeInTheDocument();
      expect(await screen.findByText("Kale Panorama Restaurant")).toBeInTheDocument();
      expect(screen.getByText("4.8")).toBeInTheDocument();
      expect(directoryService.getListingById).toHaveBeenCalledWith("biz-001", {
        allowSyncFallback: false,
      });
    });

    it("renders graceful fallback UI when venueId is not found in directory", async () => {
      vi.spyOn(directoryService, "getListingById").mockResolvedValue(null);

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venueId="non-existent-venue-999" />
        </MemoryRouter>
      );

      expect(screen.queryByText("Kale Panorama Restaurant")).not.toBeInTheDocument();
      expect(
        await screen.findByText(/venue not found|listing unavailable|explore directory/i)
      ).toBeInTheDocument();
    });
  });

  describe("Tier 4: Boundary & Missing Field Robustness", () => {
    it("renders cleanly without trust badge or tags when omitted", () => {
      const minimalVenue: Business = {
        id: "biz-min-001",
        name: "Simple Local Kebab",
        category: "restaurants-cafes",
        subcategory: "Street Food",
        description: "Quick bites.",
        address: "Ataturk Caddesi No 12",
        phone: "",
        email: "",
        website: "",
        rating: 4.2,
        reviewCount: 15,
        image: "https://images.unsplash.com/photo-min.jpg",
        tags: [],
        featured: false,
        priceRange: "$",
        openingHours: "10:00 - 22:00",
        lat: 36.54,
        lng: 32.0,
      };

      render(
        <MemoryRouter>
          <EmbeddedVenueCard venue={minimalVenue} />
        </MemoryRouter>
      );

      expect(screen.getByText("Simple Local Kebab")).toBeInTheDocument();
      expect(screen.getByText("4.2")).toBeInTheDocument();
      expect(screen.getByText("$")).toBeInTheDocument();
    });
  });
});
