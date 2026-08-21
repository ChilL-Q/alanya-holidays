import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import AdminDashboardPage from "../page";
import ListingsModerationTab from "../components/ListingsModerationTab";
import ClaimsQueueTab from "../components/ClaimsQueueTab";
import PlatformAnalyticsTab from "../components/PlatformAnalyticsTab";
import { adminService } from "@/api-services/admin.service";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@test.local", role: "admin" },
    profile: { role: "admin", full_name: "Super Admin" },
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div data-testid="navbar">Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div data-testid="footer">Footer</div>,
}));

// Mock Recharts responsive container
vi.mock("recharts", async () => {
  const actual = await vi.importActual("recharts");
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="responsive-container" style={{ width: 800, height: 400 }}>
        {children}
      </div>
    ),
  };
});

// Helper component to track URL params during test
function LocationSpy() {
  const location = useLocation();
  return <div data-testid="current-search">{location.search}</div>;
}

describe("Challenger M2: Frontend Empirical & UI Stress Suite", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("1. URL Query Param Synchronization & Tab Navigation", () => {
    it("updates ?tab in URL query string when switching tabs", async () => {
      vi.spyOn(adminService, "getModerationListings").mockResolvedValue([]);
      vi.spyOn(adminService, "getClaimsQueue").mockResolvedValue([]);
      vi.spyOn(adminService, "getPlatformAnalytics").mockResolvedValue({
        kpiSummary: {
          totalViews: 0,
          totalClicks: 0,
          totalWhatsAppClicks: 0,
          totalWebsiteClicks: 0,
          totalMapClicks: 0,
          activeListingsCount: 0,
          pendingListingsCount: 0,
          pendingClaimsCount: 0,
          totalClaimsCount: 0,
          approvedClaimsCount: 0,
          claimConversionRate: 0,
        },
        viewsTrend: [],
        channelBreakdown: [],
        tierDistribution: { explorer: 0, voyager: 0, signature: 0, partner: 0 },
        statusDistribution: { approved: 0, pending: 0, rejected: 0, draft: 0 },
        topListings: [],
      });
      vi.spyOn(adminService, "getEnquiries").mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={["/admin"]}>
          <LocationSpy />
          <AdminDashboardPage />
        </MemoryRouter>
      );

      // Initially active: listings
      expect(screen.getByRole("tab", { name: /Listings Moderation/i })).toHaveAttribute(
        "aria-selected",
        "true"
      );

      // Switch to Claims Queue tab
      const claimsTab = screen.getByRole("tab", { name: /Claims Queue/i });
      fireEvent.click(claimsTab);

      await waitFor(() => {
        expect(screen.getByTestId("current-search").textContent).toBe("?tab=claims");
      });

      // Switch to Platform Analytics tab
      const analyticsTab = screen.getByRole("tab", { name: /Platform Analytics/i });
      fireEvent.click(analyticsTab);

      await waitFor(() => {
        expect(screen.getByTestId("current-search").textContent).toBe("?tab=analytics");
      });
    });

    it("respects initial ?tab=concierge query param directly from URL", async () => {
      vi.spyOn(adminService, "getEnquiries").mockResolvedValue([
        {
          id: 1,
          name: "James Bond",
          email: "007@mi6.gov.uk",
          subject: "VIP Helicopter",
          message: "Helicopter transfer from AYT",
          status: "new",
          enquiry_type: "transport",
          created_at: "2026-08-20T10:00:00Z",
        },
      ]);
      vi.spyOn(adminService, "getModerationListings").mockResolvedValue([]);
      vi.spyOn(adminService, "getClaimsQueue").mockResolvedValue([]);

      render(
        <MemoryRouter initialEntries={["/admin?tab=concierge"]}>
          <AdminDashboardPage />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("James Bond")).toBeInTheDocument();
        expect(screen.getByText("VIP Helicopter")).toBeInTheDocument();
      });
    });
  });

  describe("2. Empty State Handling", () => {
    it("renders empty state placeholder when listings list is empty", async () => {
      vi.spyOn(adminService, "getModerationListings").mockResolvedValue([]);

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("No listings found")).toBeInTheDocument();
      });
    });

    it("renders empty state placeholder when claims queue is empty", async () => {
      vi.spyOn(adminService, "getClaimsQueue").mockResolvedValue([]);

      render(<ClaimsQueueTab />);

      await waitFor(() => {
        expect(screen.getByText("No ownership claims")).toBeInTheDocument();
      });
    });

    it("renders empty state placeholder for Recharts when viewsTrend is empty", async () => {
      vi.spyOn(adminService, "getPlatformAnalytics").mockResolvedValue({
        kpiSummary: {
          totalViews: 0,
          totalClicks: 0,
          totalWhatsAppClicks: 0,
          totalWebsiteClicks: 0,
          totalMapClicks: 0,
          activeListingsCount: 0,
          pendingListingsCount: 0,
          pendingClaimsCount: 0,
          totalClaimsCount: 0,
          approvedClaimsCount: 0,
          claimConversionRate: 0,
        },
        viewsTrend: [],
        channelBreakdown: [],
        tierDistribution: { explorer: 0, voyager: 0, signature: 0, partner: 0 },
        statusDistribution: { approved: 0, pending: 0, rejected: 0, draft: 0 },
        topListings: [],
      });

      render(<PlatformAnalyticsTab />);

      await waitFor(() => {
        expect(
          screen.getByText("No time-series analytics recorded yet in this timeframe.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("3. Filter Matrix Interactions in Listings Moderation", () => {
    const mockMultiListings = [
      {
        id: "l1",
        name: "Cleopatra Seafood",
        slug: "cleopatra-seafood",
        category_id: "restaurants",
        category: "restaurants",
        status: "approved",
        tier: "signature",
        location: "Cleopatra Beach",
        created_at: "2026-08-20T10:00:00Z",
      },
      {
        id: "l2",
        name: "Taurus Quad Safari",
        slug: "taurus-quad-safari",
        category_id: "activities",
        category: "activities",
        status: "pending",
        tier: "voyager",
        location: "Taurus Mountains",
        created_at: "2026-08-20T11:00:00Z",
      },
    ];

    it("filters by search query and category", async () => {
      const getSpy = vi
        .spyOn(adminService, "getModerationListings")
        .mockImplementation(async (params) => {
          let list = mockMultiListings;
          if (params?.category && params.category !== "all") {
            list = list.filter((l) => l.category_id === params.category);
          }
          if (params?.query) {
            list = list.filter((l) =>
              l.name.toLowerCase().includes(params.query!.toLowerCase())
            );
          }
          return list;
        });

      render(<ListingsModerationTab />);

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Seafood")).toBeInTheDocument();
        expect(screen.getByText("Taurus Quad Safari")).toBeInTheDocument();
      });

      // Filter by search input
      const searchInput = screen.getByPlaceholderText(/Search by business name/i);
      fireEvent.change(searchInput, { target: { value: "Cleopatra" } });

      await waitFor(() => {
        expect(screen.getByText("Cleopatra Seafood")).toBeInTheDocument();
        expect(screen.queryByText("Taurus Quad Safari")).not.toBeInTheDocument();
      });

      // Clear search
      fireEvent.change(searchInput, { target: { value: "" } });

      await waitFor(() => {
        expect(screen.getByText("Taurus Quad Safari")).toBeInTheDocument();
      });

      // Filter by category
      const select = screen.getByRole("combobox");
      fireEvent.change(select, { target: { value: "activities" } });

      await waitFor(() => {
        expect(screen.queryByText("Cleopatra Seafood")).not.toBeInTheDocument();
        expect(screen.getByText("Taurus Quad Safari")).toBeInTheDocument();
      });

      expect(getSpy).toHaveBeenCalled();
    });
  });
});
