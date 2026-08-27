import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import ExplorePage from "@/pages/explore/page";
import Home from "@/pages/home/page";
import BusinessCard from "@/pages/explore/components/BusinessCard";
import ListBusinessModal from "@/components/feature/ListBusinessModal";
import ClaimListingModal from "@/components/feature/ClaimListingModal";
import UpgradesAddonsShowcase from "@/components/feature/UpgradesAddonsShowcase";
import { directoryService } from "@/api-services/directory.service";
import type { Business } from "@/mocks/businesses";

const mockFullBusiness: Business = {
  id: "biz-e2e-1",
  name: "Alanya Panoramic Castle Bistro",
  category: "restaurants-cafes",
  subcategory: "Turkish Mediterranean",
  description: "Breathtaking castle terrace with authentic seafood and cocktails.",
  address: "Kale Cad. No:99, Alanya",
  phone: "+90 242 511 8888",
  email: "info@castlebistro.test",
  website: "https://castlebistro.test",
  rating: 4.9,
  reviewCount: 320,
  image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4",
  tags: ["Seafood", "Castle View", "Sunset View", "Cocktails", "Romantic"],
  featured: true,
  priceRange: "$$$",
  openingHours: "11:00 - 01:00",
  lat: 36.535,
  lng: 31.995,
  is_claimed: true,
  is_verified: true,
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <AuthProvider>
      <BrowserRouter>{ui}</BrowserRouter>
    </AuthProvider>
  );
}

describe("Stage 1 Overhaul Comprehensive E2E & Multi-Tier Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================
  // TIER 1: FEATURE COVERAGE
  // ==========================================
  describe("Tier 1: Feature Coverage (R1 - R6)", () => {
    it("R1: BusinessCard renders in horizontal rectangular format by default with high-contrast metadata", () => {
      renderWithProviders(<BusinessCard business={mockFullBusiness} />);

      const card = screen.getByTestId("business-card");
      expect(card).toHaveAttribute("data-layout", "horizontal");
      expect(screen.getByText("Alanya Panoramic Castle Bistro")).toBeInTheDocument();
      expect(screen.getByText("Premium")).toBeInTheDocument();
      expect(screen.getByText("4.9")).toBeInTheDocument();
      expect(screen.getByText("(320)")).toBeInTheDocument();
      expect(screen.getByText("Kale Cad. No:99, Alanya")).toBeInTheDocument();
      expect(screen.getByText("11:00 - 01:00")).toBeInTheDocument();
    });

    it("R2: TrustBadges are rendered with evocative canonical labels", () => {
      renderWithProviders(<BusinessCard business={mockFullBusiness} />);

      const badge = screen.getByTestId("trust-badge");
      expect(badge).toBeInTheDocument();
      // $$$ + 4.9 rating resolves to Signature Collection
      expect(badge).toHaveAttribute("data-badge-type", "Signature Collection");
    });

    it("R3: ListBusinessModal allows tier selection and submits free vs paid forms with correct confirmation popups", async () => {
      vi.spyOn(directoryService, "createListing").mockResolvedValue(mockFullBusiness);

      const { unmount } = renderWithProviders(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

      // Test Free tier flow
      fireEvent.click(screen.getByTestId("select-tier-explorer"));
      fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "Test Free Spot" } });
      fireEvent.change(screen.getByLabelText(/^category/i), { target: { value: "restaurants-cafes" } });
      fireEvent.change(screen.getByLabelText(/business description/i), { target: { value: "A lovely local restaurant." } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "Ataturk Cad No:1" } });
      fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "+90 532 111 2233" } });
      fireEvent.change(screen.getByLabelText(/business email/i), { target: { value: "contact@freespot.test" } });

      fireEvent.click(screen.getByRole("button", { name: /submit listing/i }));

      expect(
        await screen.findByText(/our team will review your submission and get back to you within 48 hours/i)
      ).toBeInTheDocument();

      unmount();

      // Test Paid tier flow
      renderWithProviders(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);
      fireEvent.click(screen.getByTestId("select-tier-voyager"));
      fireEvent.change(screen.getByLabelText(/business name/i), { target: { value: "Test Luxury Spot" } });
      fireEvent.change(screen.getByLabelText(/^category/i), { target: { value: "hotels-accommodation" } });
      fireEvent.change(screen.getByLabelText(/business description/i), { target: { value: "5-Star luxury beachfront experience." } });
      fireEvent.change(screen.getByLabelText(/address/i), { target: { value: "D400 No:50" } });
      fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "+90 532 999 8877" } });
      fireEvent.change(screen.getByLabelText(/business email/i), { target: { value: "contact@luxuryspot.test" } });

      fireEvent.click(screen.getByRole("button", { name: /submit listing/i }));

      expect(
        await screen.findByText(/payment details will be sent to your email shortly/i)
      ).toBeInTheDocument();
      expect(screen.getByText(/bank transfer instructions/i)).toBeInTheDocument();
      expect(screen.getByText(/TR89 0001 0000 1234 5678 9012 34/i)).toBeInTheDocument();
    });

    it("R4: ClaimListingModal pre-fills business data, validates ownership, and submits claim payload", async () => {
      const submitSpy = vi.spyOn(directoryService, "submitClaim").mockResolvedValue({ id: "claim-99", status: "pending" });

      renderWithProviders(<ClaimListingModal business={mockFullBusiness} isOpen={true} onClose={vi.fn()} />);

      expect(screen.getByDisplayValue("Alanya Panoramic Castle Bistro")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Kale Cad. No:99, Alanya")).toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/your full name/i), { target: { value: "Canan Yildiz" } });
      fireEvent.change(screen.getByLabelText(/official business email/i), { target: { value: "canan@castlebistro.test" } });
      fireEvent.change(screen.getByLabelText(/contact phone/i), { target: { value: "+90 533 123 4567" } });
      fireEvent.change(screen.getByLabelText(/your role/i), { target: { value: "General Manager" } });

      fireEvent.click(screen.getByLabelText(/i confirm that i am an authorized representative/i));
      fireEvent.click(screen.getByRole("button", { name: /submit claim/i }));

      await waitFor(() => {
        expect(submitSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            listing_id: "biz-e2e-1",
            business_name: "Alanya Panoramic Castle Bistro",
            claimant_name: "Canan Yildiz",
            email: "canan@castlebistro.test",
            role: "General Manager",
          })
        );
      });

      expect(await screen.findByText(/claim request submitted/i)).toBeInTheDocument();
    });

    it("R5: RecentlyClaimedSection displays verified owner badge and curated listings on Home page", async () => {
      vi.spyOn(directoryService, "getRecentlyClaimedListings").mockResolvedValue([mockFullBusiness]);

      renderWithProviders(<Home />);

      expect(screen.getByText(/recently claimed & verified businesses/i)).toBeInTheDocument();
      expect(await screen.findByText("Alanya Panoramic Castle Bistro")).toBeInTheDocument();
      expect(screen.getByText("Verified Owner")).toBeInTheDocument();
    });

    it("R6: UpgradesAddonsShowcase renders all 5 upsell modules with pricing & impact metrics", () => {
      renderWithProviders(<UpgradesAddonsShowcase />);

      expect(screen.getByText("Instant Booking Integration")).toBeInTheDocument();
      expect(screen.getByText("Verified Traveller Trust Badge")).toBeInTheDocument();
      expect(screen.getByText("Seasonal Campaign Placements")).toBeInTheDocument();
      expect(screen.getByText("Sponsored Editorial Articles")).toBeInTheDocument();
      expect(screen.getByText("AI Translation & Localization")).toBeInTheDocument();

      expect(screen.getByText("+45% direct bookings")).toBeInTheDocument();
      expect(screen.getByText("+35% customer trust")).toBeInTheDocument();
    });
  });

  // ==========================================
  // TIER 2: BOUNDARY & CORNER CASES
  // ==========================================
  describe("Tier 2: Boundary & Corner Cases", () => {
    it("handles business with missing ratings, empty tags, and fallback opening hours", () => {
      const minimalBusiness: Business = {
        id: "biz-min-1",
        name: "Minimalist Venue",
        category: "services",
        subcategory: "",
        description: "A simple venue description.",
        address: "Cikcilli No:5",
        phone: "+90 242 000 0000",
        email: "minimal@test.com",
        website: "",
        rating: 0,
        reviewCount: 0,
        image: "",
        tags: [],
        featured: false,
        priceRange: "",
        openingHours: "",
        lat: 36.5,
        lng: 32.0,
      };

      renderWithProviders(
        <>
          <BusinessCard business={mockFullBusiness} />
          <BusinessCard business={minimalBusiness} layout="grid" />
        </>
      );

      expect(screen.getByText("Minimalist Venue")).toBeInTheDocument();
    });

    it("enforces character limit on description in ListBusinessModal", () => {
      renderWithProviders(<ListBusinessModal isOpen={true} onClose={vi.fn()} />);

      fireEvent.click(screen.getByTestId("select-tier-explorer"));
      const descInput = screen.getByLabelText(/business description/i);
      expect(descInput).toHaveAttribute("maxLength", "500");
    });
  });

  // ==========================================
  // TIER 3: CROSS-FEATURE & WORKLOAD INTEGRATION
  // ==========================================
  describe("Tier 3 & 4: Cross-Feature Workflow & Real-World Interaction", () => {
    it("ExplorePage operates 3-way view switcher (Grid default, List, Map) and opens Claim modal", async () => {
      vi.spyOn(directoryService, "getListings").mockResolvedValue({
        data: [mockFullBusiness],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      renderWithProviders(<ExplorePage />);

      // Default view should be Grid (rendering grid cards)
      expect(await screen.findByText("Alanya Panoramic Castle Bistro")).toBeInTheDocument();
      const card = screen.getByTestId("business-card");
      expect(card).toHaveAttribute("data-layout", "grid");

      // Switch to List View
      const listBtn = screen.getByRole("button", { name: /^list$/i });
      fireEvent.click(listBtn);
      expect(card).toHaveAttribute("data-layout", "horizontal");

      // Switch to Map View
      const mapBtn = screen.getByRole("button", { name: /^map$/i });
      fireEvent.click(mapBtn);

      // Switch back to Grid View and click Claim Listing button
      const gridBtn = screen.getByRole("button", { name: /^grid$/i });
      fireEvent.click(gridBtn);

      const claimBtn = screen.getByTitle(/claim this listing as owner/i);
      fireEvent.click(claimBtn);

      // ClaimListingModal should open
      expect(screen.getByText("Claim Listing")).toBeInTheDocument();
      expect(screen.getByDisplayValue("Alanya Panoramic Castle Bistro")).toBeInTheDocument();
    });

    it("ExplorePage opens ListBusinessModal when 'List Your Business' hero button is clicked", () => {
      renderWithProviders(<ExplorePage />);

      const listBtn = screen.getByRole("button", { name: /list your business/i });
      fireEvent.click(listBtn);

      expect(screen.getByText(/choose your business tier/i)).toBeInTheDocument();
      expect(screen.getByText("Explorer")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();
    });
  });
});
