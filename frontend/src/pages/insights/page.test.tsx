import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import InsightsPage from "./page";
import InsightsHero from "./components/InsightsHero";
import HeadlineStatsGrid from "./components/HeadlineStatsGrid";
import DemographicCharts from "./components/DemographicCharts";
import TourismCharts from "./components/TourismCharts";
import DistrictProfilesGrid from "./components/DistrictProfilesGrid";
import OfficialSourcesFooter from "./components/OfficialSourcesFooter";
import {
  PROVINCE_HEADLINE_METRICS,
  NATIONALITY_DISTRIBUTION,
  DISTRICT_FOREIGN_POPULATION,
  TOURISM_SEASONALITY_DATA,
  SOURCE_COUNTRIES_DATA,
  DISTRICT_PROFILES,
  OFFICIAL_DATA_SOURCES,
  TOTAL_FOREIGN_POPULATION,
  TOTAL_ANNUAL_TOURISTS,
  PEAK_SEASON_PERCENTAGE,
} from "./data/regionalData";

// Mock useCart hook for Navbar
vi.mock("@/hooks/useCart", () => ({
  useCart: () => ({
    items: [],
    addToCart: vi.fn(),
    removeFromCart: vi.fn(),
    updateQuantity: vi.fn(),
    clearCart: vi.fn(),
    itemCount: 0,
    totalItems: 0,
  }),
}));

// Mock AuthContext for Navbar
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
}));

// Mock notifications service for Navbar
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

describe("Public Regional Insights Dashboard (/insights)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. Data Model & Constants Verification (regionalData.ts)", () => {
    it("should calculate total foreign population as 185,000", () => {
      expect(TOTAL_FOREIGN_POPULATION).toBe(185000);
    });

    it("should calculate total annual tourists as 16,900,000", () => {
      expect(TOTAL_ANNUAL_TOURISTS).toBe(16900000);
    });

    it("should have valid peak season percentage above 70%", () => {
      expect(parseFloat(PEAK_SEASON_PERCENTAGE)).toBeGreaterThan(70);
    });

    it("should contain 6 headline province metrics", () => {
      expect(PROVINCE_HEADLINE_METRICS).toHaveLength(6);
      const ids = PROVINCE_HEADLINE_METRICS.map((m) => m.id);
      expect(ids).toContain("population");
      expect(ids).toContain("foreign_residents");
      expect(ids).toContain("annual_tourists");
      expect(ids).toContain("coastline");
      expect(ids).toContain("districts");
      expect(ids).toContain("blue_flag_beaches");
    });

    it("should contain 8 district profiles including Alanya, Konyaaltı, Kaş, etc.", () => {
      expect(DISTRICT_PROFILES).toHaveLength(8);
      const districtIds = DISTRICT_PROFILES.map((d) => d.id);
      expect(districtIds).toContain("alanya");
      expect(districtIds).toContain("konyaalti");
      expect(districtIds).toContain("muratpasa");
      expect(districtIds).toContain("manavgat");
      expect(districtIds).toContain("kemer");
      expect(districtIds).toContain("kas");
      expect(districtIds).toContain("serik");
      expect(districtIds).toContain("kepez");
    });

    it("should contain 8 district foreign population hubs with Alanya as main hub", () => {
      expect(DISTRICT_FOREIGN_POPULATION).toHaveLength(8);
      const alanya = DISTRICT_FOREIGN_POPULATION.find((d) => d.district === "Alanya");
      expect(alanya?.isMainHub).toBe(true);
      expect(alanya?.count).toBe(58500);
    });

    it("should contain 12 months of tourism seasonality data", () => {
      expect(TOURISM_SEASONALITY_DATA).toHaveLength(12);
      const months = TOURISM_SEASONALITY_DATA.map((m) => m.shortMonth);
      expect(months).toEqual([
        "Jan", "Feb", "Mar", "Apr", "May", "Jun",
        "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
      ]);
    });

    it("should contain 4 primary official data sources", () => {
      expect(OFFICIAL_DATA_SOURCES).toHaveLength(4);
      const sourceIds = OFFICIAL_DATA_SOURCES.map((s) => s.id);
      expect(sourceIds).toContain("tuik");
      expect(sourceIds).toContain("ktb");
      expect(sourceIds).toContain("goc");
      expect(sourceIds).toContain("turcev");
    });
  });

  describe("2. InsightsHero Component", () => {
    it("renders hero title, badges, and description", () => {
      render(
        <MemoryRouter>
          <InsightsHero />
        </MemoryRouter>
      );

      expect(screen.getByRole("heading", { level: 1, name: /Antalya & Alanya/i })).toBeInTheDocument();
      expect(screen.getByText(/Regional Insights/i)).toBeInTheDocument();
      expect(screen.getByText(/Official Regional Data & Demographics/i)).toBeInTheDocument();
      expect(screen.getByText(/Explore comprehensive public demographic data/i)).toBeInTheDocument();
    });

    it("renders navigation buttons and triggers onScrollToSection callback", () => {
      const mockScroll = vi.fn();
      render(
        <MemoryRouter>
          <InsightsHero onScrollToSection={mockScroll} />
        </MemoryRouter>
      );

      const demoBtn = screen.getByRole("button", { name: /Demographics/i });
      const tourismBtn = screen.getByRole("button", { name: /Tourism Trends/i });
      const districtsBtn = screen.getByRole("button", { name: /8 District Profiles/i });
      const sourcesBtn = screen.getByRole("button", { name: /Official Sources/i });

      expect(demoBtn).toBeInTheDocument();
      expect(tourismBtn).toBeInTheDocument();
      expect(districtsBtn).toBeInTheDocument();
      expect(sourcesBtn).toBeInTheDocument();

      fireEvent.click(demoBtn);
      expect(mockScroll).toHaveBeenCalledWith("demographics");

      fireEvent.click(tourismBtn);
      expect(mockScroll).toHaveBeenCalledWith("tourism");

      fireEvent.click(districtsBtn);
      expect(mockScroll).toHaveBeenCalledWith("districts");

      fireEvent.click(sourcesBtn);
      expect(mockScroll).toHaveBeenCalledWith("sources");
    });
  });

  describe("3. HeadlineStatsGrid Component", () => {
    it("renders all 6 headline metric cards with formatted values and labels", () => {
      render(<HeadlineStatsGrid />);

      expect(screen.getByText("Antalya Province at a Glance")).toBeInTheDocument();

      // Check all 6 formatted values
      expect(screen.getByText("2.72M")).toBeInTheDocument();
      expect(screen.getByText("Province Population")).toBeInTheDocument();

      expect(screen.getByText("185K+")).toBeInTheDocument();
      expect(screen.getByText("Foreign Residents")).toBeInTheDocument();

      expect(screen.getByText("16.9M")).toBeInTheDocument();
      expect(screen.getByText("Annual Tourists")).toBeInTheDocument();

      expect(screen.getByText("640 km")).toBeInTheDocument();
      expect(screen.getByText("Mediterranean Coastline")).toBeInTheDocument();

      expect(screen.getByText("19 Districts")).toBeInTheDocument();
      expect(screen.getByText("Municipal Districts")).toBeInTheDocument();

      expect(screen.getByText("233")).toBeInTheDocument();
      expect(screen.getByText("Blue Flag Beaches")).toBeInTheDocument();
    });

    it("renders trend badges for highlighted metrics", () => {
      render(<HeadlineStatsGrid />);

      expect(screen.getByText("#1 Expat Coast in TR")).toBeInTheDocument();
      expect(screen.getByText("+8.4% YoY")).toBeInTheDocument();
      expect(screen.getByText("Global Eco Benchmark")).toBeInTheDocument();
    });
  });

  describe("4. DemographicCharts Component", () => {
    it("renders nationality breakdown and district chart containers", () => {
      render(<DemographicCharts />);

      expect(screen.getByText("International Communities in Antalya & Alanya")).toBeInTheDocument();
      expect(screen.getByText("Foreign Residents by Nationality")).toBeInTheDocument();
      expect(screen.getByText("Foreign Residents by District")).toBeInTheDocument();

      // Verify container testids
      expect(screen.getByTestId("nationality-chart-container")).toBeInTheDocument();
      expect(screen.getByTestId("district-chart-container")).toBeInTheDocument();
    });

    it("renders all top expat nationalities in breakdown list", () => {
      render(<DemographicCharts />);

      NATIONALITY_DISTRIBUTION.forEach((item) => {
        expect(screen.getByText((content) => content.includes(item.nationality))).toBeInTheDocument();
      });
    });

    it("highlights Alanya as the premier expat hub", () => {
      render(<DemographicCharts />);

      expect(
        screen.getByText(/Alanya: The Epicenter of Mediterranean Expat Living/i)
      ).toBeInTheDocument();
    });

    it("allows clicking a nationality item to toggle selection", () => {
      render(<DemographicCharts />);

      const russianBtn = screen.getByText((content) => content.includes("Russian Federation")).closest("button");
      expect(russianBtn).toBeInTheDocument();

      if (russianBtn) {
        fireEvent.click(russianBtn);
        // Clicking again toggles off
        fireEvent.click(russianBtn);
      }
    });
  });

  describe("5. TourismCharts Component", () => {
    it("renders tourism volume header and chart containers", () => {
      render(<TourismCharts />);

      expect(screen.getByText("16.9M Annual Mediterranean Visitors")).toBeInTheDocument();
      expect(screen.getByText("Monthly Tourist Arrivals Seasonality")).toBeInTheDocument();
      expect(screen.getByText("Top Source Countries for Tourism")).toBeInTheDocument();

      expect(screen.getByTestId("seasonality-chart-container")).toBeInTheDocument();
      expect(screen.getByTestId("source-countries-chart-container")).toBeInTheDocument();
    });

    it("renders seasonal filter pills and supports filtering", () => {
      render(<TourismCharts />);

      const peakBtn = screen.getByRole("button", { name: "Peak" });
      const shoulderBtn = screen.getByRole("button", { name: "Shoulder" });
      const lowBtn = screen.getByRole("button", { name: "Low" });
      const allBtn = screen.getByRole("button", { name: "All" });

      expect(peakBtn).toBeInTheDocument();
      expect(shoulderBtn).toBeInTheDocument();
      expect(lowBtn).toBeInTheDocument();
      expect(allBtn).toBeInTheDocument();

      fireEvent.click(peakBtn);
      fireEvent.click(shoulderBtn);
      fireEvent.click(lowBtn);
      fireEvent.click(allBtn);
    });

    it("renders top source countries", () => {
      render(<TourismCharts />);

      SOURCE_COUNTRIES_DATA.slice(0, 4).forEach((country) => {
        expect(screen.getAllByText((content) => content.includes(country.country)).length).toBeGreaterThan(0);
      });
    });

    it("renders seasonality breakdown footer summary cards", () => {
      render(<TourismCharts />);

      expect(screen.getByText(/Peak \(May–Sep\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Shoulder \(Mar, Apr, Oct\)/i)).toBeInTheDocument();
      expect(screen.getByText(/Winter Sun \(Nov–Feb\)/i)).toBeInTheDocument();
    });
  });

  describe("6. DistrictProfilesGrid Component", () => {
    it("renders all 8 district profile cards by default", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      expect(screen.getByText("Explore 8 Key Municipal Districts")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");

      DISTRICT_PROFILES.forEach((district) => {
        const card = screen.getByTestId(`district-card-${district.id}`);
        expect(card).toBeInTheDocument();
        expect(within(card).getByRole("heading", { level: 3, name: district.name })).toBeInTheDocument();
      });
    });

    it("filters district cards by category tab", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      // Filter by "Luxury & Golf" -> Serik
      const golfBtn = screen.getByRole("button", { name: "Luxury & Golf" });
      fireEvent.click(golfBtn);

      expect(screen.getByTestId("district-card-serik")).toBeInTheDocument();
      expect(screen.queryByTestId("district-card-konyaalti")).not.toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // Filter back to "All"
      const allBtn = screen.getByRole("button", { name: "All" });
      fireEvent.click(allBtn);
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");
    });

    it("filters district cards by search query", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);
      fireEvent.change(searchInput, { target: { value: "Cleopatra" } });

      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
      expect(screen.queryByTestId("district-card-kas")).not.toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // Clear search
      const clearBtn = screen.getByLabelText("Clear search");
      fireEvent.click(clearBtn);
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");
    });

    it("shows empty state and allows filter reset when no results match", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);
      fireEvent.change(searchInput, { target: { value: "NonExistentLocationXYZ" } });

      expect(screen.getByText("No districts match your search")).toBeInTheDocument();

      const resetBtn = screen.getByRole("button", { name: "Reset Filters" });
      fireEvent.click(resetBtn);

      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");
    });

    it("supports toggling details button on district cards", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const detailsBtns = screen.getAllByRole("button", { name: /Details|Less info/i });
      expect(detailsBtns.length).toBeGreaterThan(0);

      fireEvent.click(detailsBtns[0]);
    });
  });

  describe("7. OfficialSourcesFooter Component", () => {
    it("renders all 4 official governmental and environmental citations", () => {
      render(<OfficialSourcesFooter />);

      expect(screen.getByText("Official Data Sources & Registry Citations")).toBeInTheDocument();

      OFFICIAL_DATA_SOURCES.forEach((source) => {
        expect(screen.getByTestId(`source-citation-${source.id}`)).toBeInTheDocument();
        expect(screen.getByText(source.institution)).toBeInTheDocument();
        expect(screen.getByText(source.institutionTr)).toBeInTheDocument();
      });
    });

    it("renders external links with target=_blank and rel=noopener noreferrer", () => {
      render(<OfficialSourcesFooter />);

      const links = screen.getAllByRole("link");
      expect(links.length).toBe(4);

      links.forEach((link) => {
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
      });
    });

    it("renders methodological governance note", () => {
      render(<OfficialSourcesFooter />);

      expect(screen.getByText(/Methodological Note & Data Integrity/i)).toBeInTheDocument();
      expect(screen.getByText(/Population figures are governed by/i)).toBeInTheDocument();
    });
  });

  describe("8. Full Page Integration (InsightsPage)", () => {
    it("renders entire page hierarchy with Navbar, Hero, Stats, Charts, Districts, and Footer", () => {
      render(
        <MemoryRouter>
          <InsightsPage />
        </MemoryRouter>
      );

      expect(screen.getAllByText(/Antalya & Alanya/i).length).toBeGreaterThan(0);
      expect(screen.getByText("Antalya Province at a Glance")).toBeInTheDocument();
      expect(screen.getByText("International Communities in Antalya & Alanya")).toBeInTheDocument();
      expect(screen.getByText("16.9M Annual Mediterranean Visitors")).toBeInTheDocument();
      expect(screen.getByText("Explore 8 Key Municipal Districts")).toBeInTheDocument();
      expect(screen.getByText("Official Data Sources & Registry Citations")).toBeInTheDocument();
    });
  });
});
