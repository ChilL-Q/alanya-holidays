import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MerchantDashboardPage from "../page";
import { MerchantHero } from "../components/MerchantHero";
import { MyListingsTab } from "../components/MyListingsTab";
import { PerformanceAnalyticsTab } from "../components/PerformanceAnalyticsTab";
import { ClaimTrackerTab } from "../components/ClaimTrackerTab";
import { UpgradeModal } from "../components/UpgradeModal";
import { directoryService } from "@/api-services/directory.service";
import { billingService } from "@/api-services/billing.service";
import type { Business } from "@/mocks/businesses";
import type { DirectoryClaim, OwnerAnalyticsSummary } from "@/api-services/directory.service";

// Mock Auth Context
const mockUser = { id: "user-merchant-1", email: "merchant@alanya.test" };
const mockProfile = { id: "user-merchant-1", full_name: "Ali Merchant", role: "user" };

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockUser,
    profile: mockProfile,
    isAuthenticated: true,
    loading: false,
  }),
}));

const sampleListings: Business[] = [
  {
    id: "biz-1",
    name: "Alanya Sunset Cafe",
    category: "restaurants-cafes",
    description: "Great sea views",
    address: "Damlatas Cad. 12",
    phone: "+90 555 111 2233",
    email: "info@sunsetcafe.test",
    rating: 4.8,
    reviewCount: 42,
    image: "https://example.com/sunset.jpg",
    tags: ["Cafe", "Sunset"],
    featured: true,
    priceRange: "$$",
    status: "approved",
    tier: "signature",
  } as Business & { tier?: string },
  {
    id: "draft-1",
    name: "Draft Boutique Hotel",
    category: "hotels-accommodation",
    description: "Work in progress draft",
    address: "Kale Cad. 5",
    phone: "+90 555 999 8888",
    email: "draft@hotel.test",
    rating: 0,
    reviewCount: 0,
    image: "https://example.com/hotel.jpg",
    tags: ["Hotel", "Draft"],
    featured: false,
    priceRange: "$$$",
    status: "draft",
    tier: "explorer",
  } as Business & { tier?: string },
];

const sampleClaims: DirectoryClaim[] = [
  {
    id: "claim-1",
    listing_id: "biz-10",
    business_name: "Cleopatra Diving School",
    email: "diver@alanya.test",
    status: "pending",
    created_at: "2026-08-15T10:00:00Z",
  },
  {
    id: "claim-2",
    listing_id: "biz-20",
    business_name: "Dim Cave Rafting",
    email: "rafting@alanya.test",
    status: "rejected",
    rejection_reason: "Document signature mismatch",
    created_at: "2026-08-12T14:00:00Z",
  },
];

const sampleAnalytics: OwnerAnalyticsSummary = {
  total_views: 3200,
  total_whatsapp_clicks: 140,
  total_website_clicks: 210,
  total_map_clicks: 95,
  daily_data: [
    {
      date: "2026-08-18",
      views: 120,
      whatsapp_clicks: 5,
      website_clicks: 8,
      map_clicks: 3,
    },
    {
      date: "2026-08-19",
      views: 150,
      whatsapp_clicks: 7,
      website_clicks: 11,
      map_clicks: 4,
    },
  ],
};

describe("Merchant Dashboard Unit & Component Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("MerchantHero", () => {
    it("renders merchant info, stats, tier badge, and action buttons", () => {
      const onListNew = vi.fn();
      const onFilterActive = vi.fn();
      const onFilterDrafts = vi.fn();
      const onSelectAnalytics = vi.fn();

      render(
        <MemoryRouter>
          <MerchantHero
            merchantName="Ali Merchant"
            email="merchant@alanya.test"
            activeListingsCount={2}
            draftsCount={1}
            tier="signature"
            onListNewBusiness={onListNew}
            onFilterActive={onFilterActive}
            onFilterDrafts={onFilterDrafts}
            onSelectAnalytics={onSelectAnalytics}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Ali Merchant")).toBeInTheDocument();
      expect(screen.getByText("merchant@alanya.test")).toBeInTheDocument();
      expect(screen.getByText("Verified Business Owner")).toBeInTheDocument();
      expect(screen.getByText(/Tier: Signature/i)).toBeInTheDocument();

      // Trigger metric pills
      fireEvent.click(screen.getByRole("button", { name: /View 2 Active Listings/i }));
      expect(onFilterActive).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /View 1 Draft Listings/i }));
      expect(onFilterDrafts).toHaveBeenCalledTimes(1);

      fireEvent.click(screen.getByRole("button", { name: /View Performance Analytics/i }));
      expect(onSelectAnalytics).toHaveBeenCalledTimes(1);

      // Primary & Secondary Actions
      const listBtn = screen.getByRole("button", { name: /List New Business/i });
      fireEvent.click(listBtn);
      expect(onListNew).toHaveBeenCalledTimes(1);

      const browseLink = screen.getByRole("link", { name: /Browse Directory/i });
      expect(browseLink).toBeInTheDocument();
      expect(browseLink).toHaveAttribute("href", "/explore");
    });
  });

  describe("MyListingsTab", () => {
    it("renders listings and drafts with status badges and action buttons", () => {
      const onEdit = vi.fn();
      const onResumeDraft = vi.fn();
      const onDelete = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={sampleListings}
            loading={false}
            onEditListing={onEdit}
            onResumeDraft={onResumeDraft}
            onDeleteListing={onDelete}
            onUpgradeTier={onUpgrade}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Alanya Sunset Cafe")).toBeInTheDocument();
      expect(screen.getByText("Draft Boutique Hotel")).toBeInTheDocument();
      expect(screen.getByText("Resume Draft")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Resume Draft"));
      expect(onResumeDraft).toHaveBeenCalledWith(sampleListings[1]);
    });

    it("performs live instant search by title and category", () => {
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={sampleListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search listings by title or category/i);

      // Search for "Sunset"
      fireEvent.change(searchInput, { target: { value: "Sunset" } });
      expect(screen.getByText("Alanya Sunset Cafe")).toBeInTheDocument();
      expect(screen.queryByText("Draft Boutique Hotel")).not.toBeInTheDocument();

      // Search for "hotels-accommodation"
      fireEvent.change(searchInput, { target: { value: "accommodation" } });
      expect(screen.getByText("Draft Boutique Hotel")).toBeInTheDocument();
      expect(screen.queryByText("Alanya Sunset Cafe")).not.toBeInTheDocument();

      // Clear search
      const clearBtn = screen.getByRole("button", { name: /Clear search/i });
      fireEvent.click(clearBtn);
      expect(screen.getByText("Alanya Sunset Cafe")).toBeInTheDocument();
      expect(screen.getByText("Draft Boutique Hotel")).toBeInTheDocument();
    });

    it("renders 3-step rich onboarding empty state when no listings or drafts exist", () => {
      const onListNew = vi.fn();
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={[]}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
            onListNewBusiness={onListNew}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Start Listing Your Alanya Business")).toBeInTheDocument();
      expect(screen.getByText("1. Business Details")).toBeInTheDocument();
      expect(screen.getByText("2. Photos & Tier Perks")).toBeInTheDocument();
      expect(screen.getByText("3. Publish & Receive Leads")).toBeInTheDocument();

      // Dual CTAs
      const listNowBtn = screen.getByRole("button", { name: /\+ List Your Business Now/i });
      expect(listNowBtn).toBeInTheDocument();
      fireEvent.click(listNowBtn);
      expect(onListNew).toHaveBeenCalledTimes(1);

      const exploreLink = screen.getByRole("link", { name: /Explore Directory/i });
      expect(exploreLink).toBeInTheDocument();
      expect(exploreLink).toHaveAttribute("href", "/explore");
    });

    it("renders filtered empty state with reset button when search yields no matches", () => {
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={sampleListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search listings by title or category/i);
      fireEvent.change(searchInput, { target: { value: "nonexistent query xyz" } });

      expect(screen.getByText("No businesses or drafts found")).toBeInTheDocument();
      expect(screen.getByText(/No listings match your search for "nonexistent query xyz"/i)).toBeInTheDocument();

      const clearFiltersBtn = screen.getByRole("button", { name: /Clear Search & Filters/i });
      fireEvent.click(clearFiltersBtn);

      expect(screen.getByText("Alanya Sunset Cafe")).toBeInTheDocument();
    });
  });

  describe("PerformanceAnalyticsTab", () => {
    it("renders interactive charts for paid tier listings", () => {
      render(
        <PerformanceAnalyticsTab
          analytics={sampleAnalytics}
          userListings={sampleListings}
          highestTier="signature"
          loading={false}
          days={30}
          onDaysChange={vi.fn()}
          onOpenUpgradeModal={vi.fn()}
        />
      );

      expect(screen.getByText("Performance & Engagement Analytics")).toBeInTheDocument();
      expect(screen.getByText("3,200")).toBeInTheDocument(); // total views
      expect(screen.getByText("140")).toBeInTheDocument(); // total whatsapp
    });

    it("renders promotional lock banner when user only has free explorer tier", () => {
      const onUpgrade = vi.fn();
      render(
        <PerformanceAnalyticsTab
          analytics={sampleAnalytics}
          userListings={[{ ...sampleListings[1], tier: "explorer" }]}
          highestTier="explorer"
          loading={false}
          days={30}
          onDaysChange={vi.fn()}
          onOpenUpgradeModal={onUpgrade}
        />
      );

      expect(screen.getByText(/Unlock Premium Performance Analytics/i)).toBeInTheDocument();
      expect(screen.getByText("Upgrade Subscription")).toBeInTheDocument();

      fireEvent.click(screen.getByText("Upgrade Subscription"));
      expect(onUpgrade).toHaveBeenCalled();
    });
  });

  describe("ClaimTrackerTab", () => {
    it("renders submitted claims with status and rejection reason", () => {
      render(
        <MemoryRouter>
          <ClaimTrackerTab claims={sampleClaims} loading={false} />
        </MemoryRouter>
      );

      expect(screen.getByText("Cleopatra Diving School")).toBeInTheDocument();
      expect(screen.getByText("Dim Cave Rafting")).toBeInTheDocument();
      expect(screen.getByText("Document signature mismatch")).toBeInTheDocument();
    });

    it("renders empty state when no claims submitted", () => {
      render(
        <MemoryRouter>
          <ClaimTrackerTab claims={[]} loading={false} />
        </MemoryRouter>
      );

      expect(screen.getByText("No submitted ownership claims yet")).toBeInTheDocument();
    });
  });

  describe("UpgradeModal", () => {
    it("renders Voyager and Custom plans and starts Stripe checkout", async () => {
      const onClose = vi.fn();
      const locationStub = { href: "" };
      vi.stubGlobal("location", locationStub);
      const checkoutSpy = vi
        .spyOn(billingService, "createSubscriptionCheckout")
        .mockResolvedValue({ url: "https://checkout.stripe.com/test" });

      render(
        <UpgradeModal
          isOpen={true}
          onClose={onClose}
          businessName="Alanya Sunset Cafe"
        />
      );

      expect(screen.getByText(/Choose a Plan for/i)).toBeInTheDocument();
      expect(screen.getByText("Voyager")).toBeInTheDocument();
      expect(screen.getByText("Custom")).toBeInTheDocument();
      expect(screen.queryByText("Signature")).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Subscribe/i }));

      await waitFor(() => {
        expect(checkoutSpy).toHaveBeenCalledWith("monthly");
        expect(locationStub.href).toBe("https://checkout.stripe.com/test");
      });
      vi.unstubAllGlobals();
    });
  });

  describe("MerchantDashboardPage Integration", () => {
    it("renders standalone top bar with return navigation, breadcrumbs, and live directory preview", async () => {
      vi.spyOn(directoryService, "getMyListings").mockResolvedValue(sampleListings);
      vi.spyOn(directoryService, "getMyClaims").mockResolvedValue(sampleClaims);
      vi.spyOn(directoryService, "getOwnerAnalytics").mockResolvedValue(sampleAnalytics);

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      // R1. Return link
      const returnLink = screen.getByRole("link", { name: /Return to Main Site/i });
      expect(returnLink).toBeInTheDocument();
      expect(returnLink).toHaveAttribute("href", "/");

      // R1. Breadcrumbs
      expect(screen.getByText("Merchant Portal")).toBeInTheDocument();
      expect(screen.getByText("Dashboard")).toBeInTheDocument();

      // R1. Browse Live Directory
      const browseLiveLink = screen.getByRole("link", { name: /Browse Live Directory/i });
      expect(browseLiveLink).toBeInTheDocument();
      expect(browseLiveLink).toHaveAttribute("href", "/explore");

      // R2. Hero interactive triggers
      await waitFor(() => {
        expect(screen.getByText("Alanya Sunset Cafe")).toBeInTheDocument();
      });

      // Quick jump to drafts via hero metric pill
      const draftsHeroPill = screen.getByRole("button", { name: /View 1 Draft Listings/i });
      fireEvent.click(draftsHeroPill);

      await waitFor(() => {
        expect(screen.getByText("Draft Boutique Hotel")).toBeInTheDocument();
        expect(screen.queryByText("Alanya Sunset Cafe")).not.toBeInTheDocument();
      });

      // Switch to Analytics tab
      const analyticsTabButton = screen.getByRole("tab", { name: /Analytics|Performance/i });
      fireEvent.click(analyticsTabButton);

      await waitFor(() => {
        expect(screen.getByText("Performance & Engagement Analytics")).toBeInTheDocument();
      });

      // Switch to Claims tab
      const claimsTabButton = screen.getByRole("tab", { name: /Claims|Ownership/i });
      fireEvent.click(claimsTabButton);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Diving School")).toBeInTheDocument();
      });
    });
  });
});

