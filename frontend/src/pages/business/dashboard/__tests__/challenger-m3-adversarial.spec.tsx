import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import MerchantDashboardPage from "../page";
import { MyListingsTab } from "../components/MyListingsTab";
import { PerformanceAnalyticsTab } from "../components/PerformanceAnalyticsTab";
import { ClaimTrackerTab } from "../components/ClaimTrackerTab";
import { UpgradeModal } from "../components/UpgradeModal";
import { SettingsHero } from "@/pages/settings/components/SettingsHero";
import { directoryService } from "@/api-services/directory.service";
import type { Business } from "@/mocks/businesses";
import type { DirectoryClaim, OwnerAnalyticsSummary } from "@/api-services/directory.service";
import type { UserProfile } from "@/context/AuthContext";

// Mock Auth Context
const mockAuthUser = { id: "merchant-usr-999", email: "boss@alanya.test" };
const mockAuthProfile = { id: "merchant-usr-999", full_name: "Boss Merchant", role: "user" };

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: mockAuthUser,
    profile: mockAuthProfile,
    isAuthenticated: true,
    loading: false,
  }),
}));

const testListings: (Business & { tier?: string })[] = [
  {
    id: "biz-live-1",
    name: "Alanya Panoramic Bistro",
    category: "restaurants-cafes",
    subcategory: "Fine Dining",
    description: "Fine dining overlooking the castle",
    address: "Castle Way 1",
    phone: "+90 555 111 0001",
    email: "bistro@alanya.test",
    website: "https://panoramicbistro.test",
    rating: 4.9,
    reviewCount: 88,
    image: "https://example.com/bistro.jpg",
    tags: ["Bistro", "Fine Dining"],
    featured: true,
    priceRange: "$$$",
    openingHours: "10:00 - 23:00",
    lat: 36.543,
    lng: 31.998,
    status: "approved",
    tier: "signature",
  },
  {
    id: "biz-pending-2",
    name: "Cleopatra Yacht Charters",
    category: "activities-tours",
    subcategory: "Boat Tours",
    description: "Exclusive Mediterranean yacht tours",
    address: "Harbor Pier 4",
    phone: "+90 555 111 0002",
    email: "yacht@alanya.test",
    website: "https://yachtcharters.test",
    rating: 0,
    reviewCount: 0,
    image: "https://example.com/yacht.jpg",
    tags: ["Yacht", "Tours"],
    featured: false,
    priceRange: "$$$$",
    openingHours: "08:00 - 20:00",
    lat: 36.539,
    lng: 31.992,
    status: "pending",
    tier: "voyager",
  },
  {
    id: "biz-draft-3",
    name: "Dim River Floating Spa",
    category: "spas-wellness",
    subcategory: "Wellness & Spa",
    description: "Natural mountain relaxation",
    address: "Dim River Rd 12",
    phone: "+90 555 111 0003",
    email: "spa@alanya.test",
    website: "https://floatingspa.test",
    rating: 0,
    reviewCount: 0,
    image: "https://example.com/spa.jpg",
    tags: ["Spa", "Draft"],
    featured: false,
    priceRange: "$$",
    openingHours: "09:00 - 19:00",
    lat: 36.56,
    lng: 32.05,
    status: "draft",
    tier: "explorer",
  },
  {
    id: "biz-rejected-4",
    name: "Unverified Quad Rental",
    category: "activities-tours",
    subcategory: "Vehicle Rental",
    description: "Safari quad rentals",
    address: "Mahmutlar 7",
    phone: "+90 555 111 0004",
    email: "quad@alanya.test",
    website: "https://quadsafari.test",
    rating: 0,
    reviewCount: 0,
    image: "https://example.com/quad.jpg",
    tags: ["Safari", "Rental"],
    featured: false,
    priceRange: "$$",
    openingHours: "08:00 - 18:00",
    lat: 36.49,
    lng: 32.09,
    status: "rejected",
    tier: "explorer",
  },
];

const testClaims: DirectoryClaim[] = [
  {
    id: "claim-101",
    listing_id: "biz-live-1",
    business_name: "Alanya Panoramic Bistro",
    email: "boss@alanya.test",
    phone: "+90 555 111 0001",
    role: "General Manager",
    status: "approved",
    created_at: "2026-08-10T12:00:00Z",
  },
  {
    id: "claim-102",
    listing_id: "biz-pending-2",
    business_name: "Cleopatra Yacht Charters",
    email: "boss@alanya.test",
    phone: "+90 555 111 0002",
    role: "Owner",
    status: "verified",
    created_at: "2026-08-15T09:30:00Z",
  },
  {
    id: "claim-103",
    listing_id: "biz-draft-3",
    business_name: "Dim River Floating Spa",
    email: "boss@alanya.test",
    role: "Managing Partner",
    status: "pending",
    created_at: "2026-08-18T14:00:00Z",
  },
  {
    id: "claim-104",
    listing_id: "biz-rejected-4",
    business_name: "Unverified Quad Rental",
    email: "boss@alanya.test",
    role: "Representative",
    status: "rejected",
    rejection_reason: "Official municipality license expired or illegible.",
    created_at: "2026-08-19T16:45:00Z",
  },
];

const testAnalytics: OwnerAnalyticsSummary = {
  total_views: 12500,
  total_whatsapp_clicks: 620,
  total_website_clicks: 430,
  total_map_clicks: 200,
  daily_data: [
    { date: "2026-08-14", views: 400, whatsapp_clicks: 20, website_clicks: 15, map_clicks: 8 },
    { date: "2026-08-15", views: 550, whatsapp_clicks: 28, website_clicks: 20, map_clicks: 10 },
  ],
};

const fullTestProfile: UserProfile = {
  id: "usr-1",
  email: "merchant@alanya.test",
  full_name: "Ali Merchant",
  avatar_url: "https://example.com/avatar.jpg",
  bio: "Experienced Alanya merchant",
  phone: "+90 555 000 1122",
  company_name: "Alanya Merchant Group",
  role: "user",
  iban: null,
  bank_name: null,
  bank_account_holder_name: null,
  crypto_wallet: null,
  social_links: {},
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
};

describe("Empirical Challenger M3 Adversarial Stress Tests", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. MyListingsTab Exhaustive Status, Filtering & Action Tests", () => {
    it("renders all 4 status badges accurately (Live & Active, Pending Review, Draft, Needs Revision)", () => {
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      expect(screen.getByText("Live & Active")).toBeInTheDocument();
      expect(screen.getByText("Pending Review")).toBeInTheDocument();
      expect(screen.getByText("Draft")).toBeInTheDocument();
      expect(screen.getByText("Needs Revision")).toBeInTheDocument();
    });

    it("filters listings matrix by tab pills (Active, In Review, Drafts, Rejected)", () => {
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      // Filter: Drafts
      const draftsFilterBtn = screen.getByRole("button", { name: /Drafts/i });
      fireEvent.click(draftsFilterBtn);
      expect(screen.getByText("Dim River Floating Spa")).toBeInTheDocument();
      expect(screen.queryByText("Alanya Panoramic Bistro")).not.toBeInTheDocument();

      // Filter: Rejected
      const rejectedFilterBtn = screen.getByRole("button", { name: /Rejected/i });
      fireEvent.click(rejectedFilterBtn);
      expect(screen.getByText("Unverified Quad Rental")).toBeInTheDocument();
      expect(screen.queryByText("Dim River Floating Spa")).not.toBeInTheDocument();

      // Filter: Active
      const activeFilterBtn = screen.getByRole("button", { name: /Active/i });
      fireEvent.click(activeFilterBtn);
      expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
      expect(screen.queryByText("Unverified Quad Rental")).not.toBeInTheDocument();
    });

    it("triggers onResumeDraft on draft items and onEditListing on active items", () => {
      const onEdit = vi.fn();
      const onResumeDraft = vi.fn();
      const onUpgrade = vi.fn();

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            onEditListing={onEdit}
            onResumeDraft={onResumeDraft}
            onDeleteListing={vi.fn()}
            onUpgradeTier={onUpgrade}
          />
        </MemoryRouter>
      );

      const resumeBtn = screen.getByRole("button", { name: /Resume Draft/i });
      fireEvent.click(resumeBtn);
      expect(onResumeDraft).toHaveBeenCalledWith(testListings[2]);

      const editButtons = screen.getAllByRole("button", { name: /Edit/i });
      fireEvent.click(editButtons[0]);
      expect(onEdit).toHaveBeenCalledWith(testListings[0]);
    });

    it("triggers onDeleteListing when confirmed by user", () => {
      const onDelete = vi.fn();
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={onDelete}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      const deleteBtns = screen.getAllByRole("button", { name: /Delete/i });
      fireEvent.click(deleteBtns[0]);
      expect(onDelete).toHaveBeenCalledWith(testListings[0].id);
    });
  });

  describe("2. PerformanceAnalyticsTab Timeframe & Calculation Stress Tests", () => {
    it("handles timeframe selection changes (7d, 30d, 90d)", () => {
      const onDaysChange = vi.fn();

      render(
        <PerformanceAnalyticsTab
          analytics={testAnalytics}
          userListings={testListings}
          highestTier="signature"
          loading={false}
          days={30}
          onDaysChange={onDaysChange}
          onOpenUpgradeModal={vi.fn()}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "7 Days" }));
      expect(onDaysChange).toHaveBeenCalledWith(7);

      fireEvent.click(screen.getByRole("button", { name: "90 Days" }));
      expect(onDaysChange).toHaveBeenCalledWith(90);
    });

    it("correctly calculates CTR and total interactions without NaN or division by zero", () => {
      const zeroAnalytics: OwnerAnalyticsSummary = {
        total_views: 0,
        total_whatsapp_clicks: 0,
        total_website_clicks: 0,
        total_map_clicks: 0,
        daily_data: [],
      };

      render(
        <PerformanceAnalyticsTab
          analytics={zeroAnalytics}
          userListings={testListings}
          highestTier="signature"
          loading={false}
          days={30}
          onDaysChange={vi.fn()}
          onOpenUpgradeModal={vi.fn()}
        />
      );

      expect(screen.getByText("0.0%")).toBeInTheDocument();
      expect(screen.getByText("0 total interactions")).toBeInTheDocument();
    });

    it("displays promotional tier lock banner when user has only explorer tier", () => {
      const onUpgrade = vi.fn();

      render(
        <PerformanceAnalyticsTab
          analytics={testAnalytics}
          userListings={[testListings[2], testListings[3]]}
          highestTier="explorer"
          loading={false}
          days={30}
          onDaysChange={vi.fn()}
          onOpenUpgradeModal={onUpgrade}
        />
      );

      expect(screen.getByText(/Unlock Premium Performance Analytics/i)).toBeInTheDocument();
      expect(screen.getByText(/Merchant Analytics Tier Gating/i)).toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: /Upgrade Subscription/i }));
      expect(onUpgrade).toHaveBeenCalled();
    });
  });

  describe("3. ClaimTrackerTab Multi-State & Rejection Details", () => {
    it("displays all claims with appropriate status badges and rejection reasons", () => {
      render(
        <MemoryRouter>
          <ClaimTrackerTab claims={testClaims} loading={false} />
        </MemoryRouter>
      );

      expect(screen.getByText("Approved & Ownership Transferred")).toBeInTheDocument();
      expect(screen.getByText("Email Verified & In Review")).toBeInTheDocument();
      expect(screen.getByText("Pending Moderation")).toBeInTheDocument();
      expect(screen.getByText("Claim Rejected")).toBeInTheDocument();
      expect(
        screen.getByText("Official municipality license expired or illegible.")
      ).toBeInTheDocument();
    });
  });

  describe("4. UpgradeModal Tier Showcase & Payment Flow", () => {
    it("renders all 3 paid tiers (Voyager, Signature, Partner) with full perk lists", () => {
      render(
        <UpgradeModal
          isOpen={true}
          onClose={vi.fn()}
          businessName="Alanya Panoramic Bistro"
          currentTier="explorer"
        />
      );

      expect(screen.getByText("Voyager")).toBeInTheDocument();
      expect(screen.getByText("Signature")).toBeInTheDocument();
      expect(screen.getByText("Partner")).toBeInTheDocument();

      expect(screen.getByText("Priority directory search placement")).toBeInTheDocument();
      expect(screen.getByText("Top-of-category placement & search boost")).toBeInTheDocument();
      expect(screen.getByText("AI translation & localization (8 languages)")).toBeInTheDocument();
    });

    it("triggers sendPaymentInstructions and shows confirmation view", async () => {
      vi.spyOn(directoryService, "sendPaymentInstructions").mockResolvedValueOnce({ success: true });

      render(
        <UpgradeModal
          isOpen={true}
          onClose={vi.fn()}
          businessName="Alanya Panoramic Bistro"
          currentTier="explorer"
        />
      );

      const chooseVoyagerBtn = screen.getByRole("button", { name: /Choose Voyager/i });
      fireEvent.click(chooseVoyagerBtn);

      await waitFor(() => {
        expect(directoryService.sendPaymentInstructions).toHaveBeenCalledWith(
          "Alanya Panoramic Bistro",
          "voyager"
        );
        expect(screen.getByText("Upgrade Request Submitted")).toBeInTheDocument();
      });
    });
  });

  describe("5. SettingsHero Quick Access Link", () => {
    it("renders a direct link to /business/dashboard with Merchant Dashboard label", () => {
      render(
        <MemoryRouter>
          <SettingsHero
            user={{ id: "usr-1", email: "merchant@alanya.test" }}
            profile={fullTestProfile}
            activeTab="profile"
            onTabChange={vi.fn()}
          />
        </MemoryRouter>
      );

      const dashboardLink = screen.getByRole("link", { name: /Merchant Dashboard/i });
      expect(dashboardLink).toBeInTheDocument();
      expect(dashboardLink).toHaveAttribute("href", "/business/dashboard");
    });
  });

  describe("6. Full MerchantDashboardPage Integration & Modals Workflow", () => {
    it("loads data and allows opening ListBusinessModal in resume and create modes", async () => {
      vi.spyOn(directoryService, "getMyListings").mockResolvedValue(testListings);
      vi.spyOn(directoryService, "getMyClaims").mockResolvedValue(testClaims);
      vi.spyOn(directoryService, "getOwnerAnalytics").mockResolvedValue(testAnalytics);

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
      });

      // Click "List New Business" in hero
      const listNewBtn = screen.getByRole("button", { name: /List New Business/i });
      fireEvent.click(listNewBtn);

      // Verify ListBusinessModal opened
      await waitFor(() => {
        expect(screen.getByRole("dialog")).toBeInTheDocument();
      });
    });
  });

  describe("7. Adversarial & Edge Case Robustness Tests", () => {
    it("handles regex special characters in search input without crashing or throwing", () => {
      const specialListings: Business[] = [
        {
          id: "special-1",
          name: "Cafe (Old Town) [5*] + More",
          category: "restaurants-cafes",
          subcategory: "Cafe",
          description: "Special regex characters in title (.*+?[])",
          address: "Damlatas Cad. 10",
          phone: "+90 555 111 2233",
          email: "cafe@test.com",
          website: "https://cafe.test",
          rating: 5.0,
          reviewCount: 10,
          image: "https://example.com/cafe.jpg",
          tags: ["Cafe"],
          featured: false,
          priceRange: "$$",
          openingHours: "08:00 - 23:00",
          lat: 36.54,
          lng: 31.99,
          status: "approved",
        },
        {
          id: "special-2",
          name: "Standard Bistro",
          category: "restaurants-cafes",
          subcategory: "Bistro",
          description: "No special chars",
          address: "Ataturk Cad. 20",
          phone: "+90 555 222 3344",
          email: "bistro@test.com",
          website: "https://bistro.test",
          rating: 4.5,
          reviewCount: 5,
          image: "https://example.com/bistro.jpg",
          tags: ["Bistro"],
          featured: false,
          priceRange: "$$$",
          openingHours: "09:00 - 22:00",
          lat: 36.55,
          lng: 32.0,
          status: "approved",
        },
      ];

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={specialListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search listings by title or category/i);

      // Test typing special regex characters: (Old Town)
      fireEvent.change(searchInput, { target: { value: "(Old Town)" } });
      expect(screen.getByText("Cafe (Old Town) [5*] + More")).toBeInTheDocument();
      expect(screen.queryByText("Standard Bistro")).not.toBeInTheDocument();

      // Test typing brackets and symbols: [5*] +
      fireEvent.change(searchInput, { target: { value: "[5*] +" } });
      expect(screen.getByText("Cafe (Old Town) [5*] + More")).toBeInTheDocument();
      expect(screen.queryByText("Standard Bistro")).not.toBeInTheDocument();

      // Test regex operators that don't match: ^.*+?[^$]
      fireEvent.change(searchInput, { target: { value: "^.*+?[^$]XYZ" } });
      expect(screen.getByText("No businesses or drafts found")).toBeInTheDocument();
    });

    it("correctly recognizes and normalizes status aliases (active, verified, in_review, published)", () => {
      const aliasListings: Business[] = [
        {
          id: "alias-1",
          name: "Active Listing",
          category: "restaurants-cafes",
          subcategory: "Cafe",
          description: "Status active",
          address: "Alanya 1",
          phone: "+90 555 111 0001",
          email: "active@test.com",
          website: "https://active.test",
          rating: 5.0,
          reviewCount: 1,
          image: "https://example.com/1.jpg",
          tags: ["Active"],
          featured: false,
          priceRange: "$$",
          openingHours: "08:00 - 22:00",
          lat: 36.54,
          lng: 31.99,
          status: "active",
        },
        {
          id: "alias-2",
          name: "Verified Listing",
          category: "hotels-accommodation",
          subcategory: "Hotel",
          description: "Status verified",
          address: "Alanya 2",
          phone: "+90 555 111 0002",
          email: "verified@test.com",
          website: "https://verified.test",
          rating: 4.8,
          reviewCount: 2,
          image: "https://example.com/2.jpg",
          tags: ["Verified"],
          featured: false,
          priceRange: "$$$",
          openingHours: "24/7",
          lat: 36.55,
          lng: 32.0,
          status: "verified",
        },
        {
          id: "alias-3",
          name: "In Review Listing",
          category: "activities-tours",
          subcategory: "Tours",
          description: "Status in_review",
          address: "Alanya 3",
          phone: "+90 555 111 0003",
          email: "review@test.com",
          website: "https://review.test",
          rating: 0,
          reviewCount: 0,
          image: "https://example.com/3.jpg",
          tags: ["Tour"],
          featured: false,
          priceRange: "$$",
          openingHours: "09:00 - 18:00",
          lat: 36.56,
          lng: 32.01,
          status: "in_review",
        },
      ];

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={aliasListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      // Both 'active' and 'verified' show 'Live & Active'
      const liveBadges = screen.getAllByText("Live & Active");
      expect(liveBadges).toHaveLength(2);

      // 'in_review' shows 'Pending Review'
      expect(screen.getByText("Pending Review")).toBeInTheDocument();

      // Test active filter matches active & verified
      const activeFilterBtn = screen.getByRole("button", { name: /^Active/ });
      fireEvent.click(activeFilterBtn);
      expect(screen.getByText("Active Listing")).toBeInTheDocument();
      expect(screen.getByText("Verified Listing")).toBeInTheDocument();
      expect(screen.queryByText("In Review Listing")).not.toBeInTheDocument();

      // Test in review filter matches in_review
      const inReviewFilterBtn = screen.getByRole("button", { name: /^In Review/ });
      fireEvent.click(inReviewFilterBtn);
      expect(screen.getByText("In Review Listing")).toBeInTheDocument();
      expect(screen.queryByText("Active Listing")).not.toBeInTheDocument();
    });

    it("seamlessly handles quick jumps across tabs and filter states via MerchantHero pills", async () => {
      vi.spyOn(directoryService, "getMyListings").mockResolvedValue(testListings);
      vi.spyOn(directoryService, "getMyClaims").mockResolvedValue(testClaims);
      vi.spyOn(directoryService, "getOwnerAnalytics").mockResolvedValue(testAnalytics);

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
      });

      // 1. Switch to Claims tab
      const claimsTab = screen.getByRole("tab", { name: /Claims|Ownership/i });
      fireEvent.click(claimsTab);
      await waitFor(() => {
        expect(screen.getByText("Claim Verification Process")).toBeInTheDocument();
      });

      // 2. Click "Drafts" metric pill in Hero while in Claims tab
      const draftsPill = screen.getByRole("button", { name: /View \d+ Draft Listings/i });
      fireEvent.click(draftsPill);

      // Should jump to listings tab and show only drafts
      await waitFor(() => {
        expect(screen.getByText("Dim River Floating Spa")).toBeInTheDocument();
        expect(screen.queryByText("Alanya Panoramic Bistro")).not.toBeInTheDocument();
        expect(screen.queryByText("Claim Verification Process")).not.toBeInTheDocument();
      });

      // 3. Click "Analytics Ready" metric pill in Hero
      const analyticsPill = screen.getByRole("button", { name: /View Performance Analytics/i });
      fireEvent.click(analyticsPill);

      await waitFor(() => {
        expect(screen.getByText("Performance & Engagement Analytics")).toBeInTheDocument();
      });

      // 4. Click "Active" metric pill in Hero while in Analytics tab
      const activePill = screen.getByRole("button", { name: /View \d+ Active Listings/i });
      fireEvent.click(activePill);

      await waitFor(() => {
        expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
        expect(screen.queryByText("Dim River Floating Spa")).not.toBeInTheDocument();
      });
    });
  });

  describe("8. Upstream API Missing/Nullish/Non-String Field Resilience", () => {
    it("handles listings with nullish/non-string properties during live search without throwing", () => {
      const corruptListings: unknown[] = [
        {
          id: "corrupt-1",
          name: undefined,
          title: "Corrupt Object Listing",
          category: { nested: true },
          subcategory: 12345,
          description: null,
          address: undefined,
          status: "approved",
          tier: "explorer",
        },
        {
          id: "corrupt-2",
          name: "Second Faulty Listing",
          category: null,
          subcategory: undefined,
          description: "Exclusive terrace with castle view",
          address: 9999,
          status: "approved",
          tier: "voyager",
        },
      ];

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={corruptListings as Business[]}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search listings by title or category/i);

      // Search by title fallback for item with name=undefined
      fireEvent.change(searchInput, { target: { value: "Corrupt Object" } });
      expect(screen.getByText("Corrupt Object Listing")).toBeInTheDocument();
      expect(screen.queryByText("Second Faulty Listing")).not.toBeInTheDocument();

      // Search by description keyword
      fireEvent.change(searchInput, { target: { value: "castle view" } });
      expect(screen.getByText("Second Faulty Listing")).toBeInTheDocument();
      expect(screen.queryByText("Corrupt Object Listing")).not.toBeInTheDocument();
    });
  });

  describe("9. Card Actions & Filter Chips ARIA Accessibility", () => {
    it("provides accessible aria-label, title, aria-pressed, and keyboard focus attributes", () => {
      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      // Filter chips have aria-pressed
      const allFilterChip = screen.getByRole("button", { name: /All Items/i });
      expect(allFilterChip).toHaveAttribute("aria-pressed", "true");

      const draftsFilterChip = screen.getByRole("button", { name: /Drafts/i });
      expect(draftsFilterChip).toHaveAttribute("aria-pressed", "false");

      fireEvent.click(draftsFilterChip);
      expect(draftsFilterChip).toHaveAttribute("aria-pressed", "true");

      // Listing actions have specific aria-labels and titles
      const resumeDraftBtn = screen.getByRole("button", {
        name: "Resume draft for Dim River Floating Spa",
      });
      expect(resumeDraftBtn).toBeInTheDocument();
      expect(resumeDraftBtn).toHaveAttribute(
        "title",
        "Resume draft for Dim River Floating Spa"
      );

      // Switch back to all to inspect other buttons
      fireEvent.click(allFilterChip);

      const editBtn = screen.getByRole("button", {
        name: "Edit Alanya Panoramic Bistro",
      });
      expect(editBtn).toBeInTheDocument();
      expect(editBtn).toHaveAttribute("title", "Edit Alanya Panoramic Bistro");

      const viewLink = screen.getByRole("link", {
        name: "View live listing for Alanya Panoramic Bistro",
      });
      expect(viewLink).toBeInTheDocument();
      expect(viewLink).toHaveAttribute(
        "title",
        "View live listing for Alanya Panoramic Bistro"
      );

      const upgradeBtn = screen.getByRole("button", {
        name: "Upgrade tier for Cleopatra Yacht Charters",
      });
      expect(upgradeBtn).toBeInTheDocument();
      expect(upgradeBtn).toHaveAttribute(
        "title",
        "Upgrade tier for Cleopatra Yacht Charters"
      );

      const deleteBtn = screen.getByRole("button", {
        name: "Delete Alanya Panoramic Bistro",
      });
      expect(deleteBtn).toBeInTheDocument();
      expect(deleteBtn).toHaveAttribute("title", "Delete Alanya Panoramic Bistro");
    });
  });

  describe("10. Case-Insensitive Tier Matching & Analytics Gating", () => {
    it("handles uppercase or mixed-case tier names in PerformanceAnalyticsTab", () => {
      render(
        <PerformanceAnalyticsTab
          analytics={testAnalytics}
          userListings={[{ ...testListings[0], tier: "SIGNATURE" } as unknown as Business]}
          highestTier="Signature"
          loading={false}
          days={30}
          onDaysChange={vi.fn()}
          onOpenUpgradeModal={vi.fn()}
        />
      );

      // Should unlock analytics without displaying lock banner
      expect(screen.getByText("Performance & Engagement Analytics")).toBeInTheDocument();
      expect(screen.queryByText(/Unlock Premium Performance Analytics/i)).not.toBeInTheDocument();
    });
  });

  describe("11. Filter Reset Interaction Stress Test", () => {
    it("clears both search query and active filter back to 'all' on clicking 'Clear Search & Filters'", () => {
      const onFilterChange = vi.fn();

      render(
        <MemoryRouter>
          <MyListingsTab
            listings={testListings}
            loading={false}
            filter="draft"
            onFilterChange={onFilterChange}
            onEditListing={vi.fn()}
            onResumeDraft={vi.fn()}
            onDeleteListing={vi.fn()}
            onUpgradeTier={vi.fn()}
          />
        </MemoryRouter>
      );

      // Currently showing drafts only
      expect(screen.getByText("Dim River Floating Spa")).toBeInTheDocument();

      // Type a search query that produces 0 results
      const searchInput = screen.getByPlaceholderText(/Search listings by title or category/i);
      fireEvent.change(searchInput, { target: { value: "nonexistent restaurant" } });

      expect(screen.getByText("No businesses or drafts found")).toBeInTheDocument();

      // Click "Clear Search & Filters"
      const clearBtn = screen.getByRole("button", { name: /Clear Search & Filters/i });
      fireEvent.click(clearBtn);

      expect(onFilterChange).toHaveBeenCalledWith("all");
      expect(searchInput).toHaveValue("");
    });
  });

  describe("12. Review Round 3: Comprehensive Navigation Links & Card Action Workflows", () => {
    it("verifies all return navigation links and routing targets across the dashboard", async () => {
      vi.spyOn(directoryService, "getMyListings").mockResolvedValue(testListings);
      vi.spyOn(directoryService, "getMyClaims").mockResolvedValue(testClaims);
      vi.spyOn(directoryService, "getOwnerAnalytics").mockResolvedValue(testAnalytics);

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
      });

      // 1. Standalone Top Bar Return link -> /
      const returnMainLink = screen.getByRole("link", { name: /Return to Main Site/i });
      expect(returnMainLink).toHaveAttribute("href", "/");

      // 2. Breadcrumb links
      const breadcrumbNav = screen.getByRole("navigation", { name: /breadcrumb/i });
      expect(breadcrumbNav).toBeInTheDocument();
      const breadcrumbHome = breadcrumbNav.querySelector('a[href="/"]');
      expect(breadcrumbHome).toBeInTheDocument();
      const breadcrumbPortal = breadcrumbNav.querySelector('a[href="/business/dashboard"]');
      expect(breadcrumbPortal).toBeInTheDocument();

      // 3. Top bar Live Directory Preview link -> /explore
      const liveDirTopLink = screen.getByRole("link", { name: /Browse Live Directory/i });
      expect(liveDirTopLink).toHaveAttribute("href", "/explore");

      // 4. Merchant Hero Secondary Explore link -> /explore
      const heroExploreLink = screen.getByRole("link", { name: /Browse Directory/i });
      expect(heroExploreLink).toHaveAttribute("href", "/explore");
    });

    it("handles card action flows: edit, resume draft, upgrade, and deletion in page context", async () => {
      vi.spyOn(directoryService, "getMyListings").mockResolvedValue(testListings);
      vi.spyOn(directoryService, "getMyClaims").mockResolvedValue(testClaims);
      vi.spyOn(directoryService, "getOwnerAnalytics").mockResolvedValue(testAnalytics);
      const deleteListingSpy = vi.spyOn(directoryService, "deleteListing").mockResolvedValue({ success: true });
      vi.spyOn(window, "confirm").mockReturnValue(true);

      render(
        <MemoryRouter>
          <MerchantDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("Alanya Panoramic Bistro")).toBeInTheDocument();
      });

      // 1. Upgrade Tier action on Cleopatra Yacht Charters (tier: voyager)
      const upgradeBtn = screen.getByRole("button", {
        name: "Upgrade tier for Cleopatra Yacht Charters",
      });
      fireEvent.click(upgradeBtn);

      await waitFor(() => {
        expect(
          screen.getByText("Upgrade Your Business Listing: Cleopatra Yacht Charters")
        ).toBeInTheDocument();
      });

      // Close upgrade modal
      const closeUpgradeBtn = screen.getByRole("button", { name: /Close modal/i });
      fireEvent.click(closeUpgradeBtn);

      await waitFor(() => {
        expect(
          screen.queryByText("Upgrade Your Business Listing: Cleopatra Yacht Charters")
        ).not.toBeInTheDocument();
      });

      // 2. Delete Listing action on Alanya Panoramic Bistro
      const deleteBtn = screen.getByRole("button", {
        name: "Delete Alanya Panoramic Bistro",
      });
      fireEvent.click(deleteBtn);

      await waitFor(() => {
        expect(deleteListingSpy).toHaveBeenCalledWith("biz-live-1");
        expect(screen.queryByText("Alanya Panoramic Bistro")).not.toBeInTheDocument();
      });
    });
  });
});

