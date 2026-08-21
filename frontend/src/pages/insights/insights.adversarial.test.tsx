import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DistrictProfilesGrid from "./components/DistrictProfilesGrid";
import OfficialSourcesFooter from "./components/OfficialSourcesFooter";
import TourismCharts from "./components/TourismCharts";
import DemographicCharts from "./components/DemographicCharts";
import HeadlineStatsGrid from "./components/HeadlineStatsGrid";
import InsightsHero from "./components/InsightsHero";
import InsightsPage from "./page";
import {
  TOURISM_SEASONALITY_DATA,
  NATIONALITY_DISTRIBUTION,
  DISTRICT_FOREIGN_POPULATION,
  TOTAL_FOREIGN_POPULATION,
  TOTAL_ANNUAL_TOURISTS,
  PEAK_SEASON_TOURISTS,
  PEAK_SEASON_PERCENTAGE,
} from "./data/regionalData";

// Mock dependencies
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

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
}));

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

describe("Adversarial Stress Testing: /insights Regional Dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("1. District Search & Filtering Adversarial Stress Tests", () => {
    it("handles search queries with leading, trailing, and mixed whitespace", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);
      
      // Whitespace only should return all 8
      fireEvent.change(searchInput, { target: { value: "     " } });
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");

      // Padded search string
      fireEvent.change(searchInput, { target: { value: "   Alanya   " } });
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");
      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
    });

    it("successfully matches Turkish district names using English ASCII search queries (e.g. KONYAALTI, kas, muratpasa)", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);

      // Searching ASCII "konyaalti" or "KONYAALTI" matches "Konyaaltı"
      fireEvent.change(searchInput, { target: { value: "KONYAALTI" } });
      expect(screen.getByTestId("district-card-konyaalti")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // Searching ASCII "kas" or "KAS" matches "Kaş & Kalkan"
      fireEvent.change(searchInput, { target: { value: "kas" } });
      expect(screen.getByTestId("district-card-kas")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // Searching ASCII "muratpasa" matches "Muratpaşa"
      fireEvent.change(searchInput, { target: { value: "muratpasa" } });
      expect(screen.getByTestId("district-card-muratpasa")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");
    });

    it("handles exact Turkish characters in case variations", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);

      // Mixed Case with Turkish characters
      fireEvent.change(searchInput, { target: { value: "mUrAtPaŞa" } });
      expect(screen.getByTestId("district-card-muratpasa")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // Exact Turkish diacritic
      fireEvent.change(searchInput, { target: { value: "Konyaaltı" } });
      expect(screen.getByTestId("district-card-konyaalti")).toBeInTheDocument();
    });

    it("handles adversarial characters and regex syntax characters without throwing", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);

      const dangerousInputs = [
        "^[a-z]+$",
        "[0-9]{3}",
        "(.*)",
        "?+*",
        "\\d+\\w+",
        "<script>alert(1)</script>",
        "'; DROP TABLE users; --",
        "${process.env.SECRET}",
        "\"'``",
        "& < > / \\ |",
        "🎉🏖️🇹🇷",
      ];

      dangerousInputs.forEach((input) => {
        expect(() => {
          fireEvent.change(searchInput, { target: { value: input } });
        }).not.toThrow();

        const count = screen.getByTestId("district-count");
        expect(count).toBeInTheDocument();
      });
    });

    it("verifies multi-field search coverage (highlights, vibeSummary, topExpats, tagline)", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);

      // 1. Search by highlight: "Damlataş" -> Alanya
      fireEvent.change(searchInput, { target: { value: "Damlataş" } });
      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");

      // 2. Search by highlight: "Hadrian" -> Muratpaşa
      fireEvent.change(searchInput, { target: { value: "Hadrian" } });
      expect(screen.getByTestId("district-card-muratpasa")).toBeInTheDocument();

      // 3. Search by highlight: "Kaputaş" -> Kaş & Kalkan
      fireEvent.change(searchInput, { target: { value: "Kaputaş" } });
      expect(screen.getByTestId("district-card-kas")).toBeInTheDocument();

      // 4. Search by highlight: "Aspendos" -> Serik & Belek
      fireEvent.change(searchInput, { target: { value: "Aspendos" } });
      expect(screen.getByTestId("district-card-serik")).toBeInTheDocument();

      // 5. Search by highlight: "DokumaPark" -> Kepez
      fireEvent.change(searchInput, { target: { value: "DokumaPark" } });
      expect(screen.getByTestId("district-card-kepez")).toBeInTheDocument();

      // 6. Search by topExpats: "Finns" -> Serik & Belek
      fireEvent.change(searchInput, { target: { value: "Finns" } });
      expect(screen.getByTestId("district-card-serik")).toBeInTheDocument();

      // 7. Search by topExpats: "Kazakhs" -> Alanya and Kemer
      fireEvent.change(searchInput, { target: { value: "Kazakhs" } });
      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
      expect(screen.getByTestId("district-card-kemer")).toBeInTheDocument();
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 2 of 8 districts");

      // 8. Search by vibeSummary: "Ottoman-era" -> Muratpaşa
      fireEvent.change(searchInput, { target: { value: "Ottoman-era" } });
      expect(screen.getByTestId("district-card-muratpasa")).toBeInTheDocument();
    });

    it("verifies category filter AND search query orthogonal intersection", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      // Select "Nature & Adventure" (Manavgat & Side, Kaş & Kalkan)
      const natureBtn = screen.getByRole("button", { name: "Nature & Adventure" });
      fireEvent.click(natureBtn);
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 2 of 8 districts");
      expect(screen.getByTestId("district-card-manavgat")).toBeInTheDocument();
      expect(screen.getByTestId("district-card-kas")).toBeInTheDocument();

      // Search for "Side" while category is "Nature & Adventure" -> 1 match
      const searchInput = screen.getByPlaceholderText(/Search district, vibe, beach/i);
      fireEvent.change(searchInput, { target: { value: "Side" } });
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 1 of 8 districts");
      expect(screen.getByTestId("district-card-manavgat")).toBeInTheDocument();

      // Search for "Alanya" while category is "Nature & Adventure" -> 0 match (Alanya is in Riviera & Beach)
      fireEvent.change(searchInput, { target: { value: "Alanya" } });
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 0 of 8 districts");
      expect(screen.getByText("No districts match your search")).toBeInTheDocument();

      // Click "Reset Filters" -> recovers All + clears query
      const resetBtn = screen.getByRole("button", { name: "Reset Filters" });
      fireEvent.click(resetBtn);
      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 8 of 8 districts");
      expect(screen.getByTestId("district-card-alanya")).toBeInTheDocument();
      expect((searchInput as HTMLInputElement).value).toBe("");
    });

    it("handles boundary condition: empty profiles array prop gracefully", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid profiles={[]} />
        </MemoryRouter>
      );

      expect(screen.getByTestId("district-count")).toHaveTextContent("Showing 0 of 0 districts");
      expect(screen.getByText("No districts match your search")).toBeInTheDocument();
    });
  });

  describe("2. Expand / Collapse Toggles & Interactive State Isolation", () => {
    it("correctly manages isolated expansion state across cards", () => {
      render(
        <MemoryRouter>
          <DistrictProfilesGrid />
        </MemoryRouter>
      );

      // Alanya is expanded by default (shows "Less info")
      const alanyaCard = screen.getByTestId("district-card-alanya");
      const alanyaToggle = within(alanyaCard).getByRole("button", { name: "Less info" });
      expect(alanyaToggle).toBeInTheDocument();

      // Kemer card has "Details"
      const kemerCard = screen.getByTestId("district-card-kemer");
      const kemerToggle = within(kemerCard).getByRole("button", { name: "Details" });
      expect(kemerToggle).toBeInTheDocument();

      // Click Kemer "Details" -> Kemer becomes "Less info", Alanya becomes "Details"
      fireEvent.click(kemerToggle);
      expect(within(kemerCard).getByRole("button", { name: "Less info" })).toBeInTheDocument();
      expect(within(alanyaCard).getByRole("button", { name: "Details" })).toBeInTheDocument();

      // Click Kemer "Less info" again -> Kemer collapses, all show "Details"
      fireEvent.click(within(kemerCard).getByRole("button", { name: "Less info" }));
      expect(within(kemerCard).getByRole("button", { name: "Details" })).toBeInTheDocument();
      expect(within(alanyaCard).getByRole("button", { name: "Details" })).toBeInTheDocument();
    });
  });

  describe("3. Official Citations & External Links Security", () => {
    it("ensures all official source citations have secure HTTPS URLs and window isolation", () => {
      render(<OfficialSourcesFooter />);

      const citationLinks = screen.getAllByRole("link");
      expect(citationLinks.length).toBe(4);

      const expectedDomains = [
        "https://www.tuik.gov.tr",
        "https://yigm.ktb.gov.tr",
        "https://www.goc.gov.tr",
        "https://www.turcev.org.tr",
      ];

      citationLinks.forEach((link, idx) => {
        expect(link).toHaveAttribute("href", expectedDomains[idx]);
        expect(link).toHaveAttribute("target", "_blank");
        expect(link).toHaveAttribute("rel", "noopener noreferrer");
        expect(link.querySelector("i")).toBeInTheDocument();
      });
    });

    it("handles boundary condition: empty sources array prop gracefully", () => {
      render(<OfficialSourcesFooter sources={[]} />);
      expect(screen.getByText("Official Data Sources & Registry Citations")).toBeInTheDocument();
      expect(screen.queryByTestId(/source-citation-/)).not.toBeInTheDocument();
    });
  });

  describe("4. Tourism Seasonality & Source Country Calculations", () => {
    it("verifies mathematical consistency between seasonality data and headline totals", () => {
      const calculatedTotalTourists = TOURISM_SEASONALITY_DATA.reduce((acc, m) => acc + m.tourists, 0);
      expect(calculatedTotalTourists).toBe(TOTAL_ANNUAL_TOURISTS);
      expect(calculatedTotalTourists).toBe(16900000);

      // Verify peak season calculations
      const peakMonths = TOURISM_SEASONALITY_DATA.filter((m) => m.season === "Peak");
      const peakSum = peakMonths.reduce((acc, m) => acc + m.tourists, 0);
      expect(peakSum).toBe(PEAK_SEASON_TOURISTS);
      expect(peakSum).toBe(12780000);

      const expectedPeakPct = ((12780000 / 16900000) * 100).toFixed(1);
      expect(PEAK_SEASON_PERCENTAGE).toBe(expectedPeakPct);
      expect(PEAK_SEASON_PERCENTAGE).toBe("75.6");
    });

    it("verifies seasonal filter pill transitions (All -> Peak -> Shoulder -> Low -> All)", () => {
      render(<TourismCharts />);

      const peakBtn = screen.getByRole("button", { name: "Peak" });
      const shoulderBtn = screen.getByRole("button", { name: "Shoulder" });
      const lowBtn = screen.getByRole("button", { name: "Low" });
      const allBtn = screen.getByRole("button", { name: "All" });

      // Peak
      fireEvent.click(peakBtn);
      expect(peakBtn).toHaveClass("bg-white", "dark:bg-background-700");

      // Shoulder
      fireEvent.click(shoulderBtn);
      expect(shoulderBtn).toHaveClass("bg-white", "dark:bg-background-700");

      // Low
      fireEvent.click(lowBtn);
      expect(lowBtn).toHaveClass("bg-white", "dark:bg-background-700");

      // All
      fireEvent.click(allBtn);
      expect(allBtn).toHaveClass("bg-white", "dark:bg-background-700");
    });
  });

  describe("5. Demographics Nationality & District Hub Calculations", () => {
    it("verifies mathematical consistency of foreign population sums", () => {
      const natSum = NATIONALITY_DISTRIBUTION.reduce((acc, n) => acc + n.count, 0);
      expect(natSum).toBe(TOTAL_FOREIGN_POPULATION);
      expect(natSum).toBe(185000);

      const pctSum = NATIONALITY_DISTRIBUTION.reduce((acc, n) => acc + n.percentage, 0);
      expect(Math.round(pctSum)).toBe(100);

      const alanyaHub = DISTRICT_FOREIGN_POPULATION.find((d) => d.district === "Alanya");
      expect(alanyaHub).toBeDefined();
      expect(alanyaHub?.isMainHub).toBe(true);
      expect(alanyaHub?.count).toBe(58500);
      expect(alanyaHub?.percentage).toBe(31.6);
    });

    it("handles nationality selection toggles", () => {
      render(<DemographicCharts />);

      const germanyBtn = screen.getByText((c) => c.includes("Germany")).closest("button");
      expect(germanyBtn).toBeInTheDocument();

      if (germanyBtn) {
        fireEvent.click(germanyBtn);
        expect(germanyBtn).toHaveClass("bg-primary-50", "dark:bg-primary-950/70");

        const ukBtn = screen.getByText((c) => c.includes("United Kingdom")).closest("button");
        if (ukBtn) {
          fireEvent.click(ukBtn);
          expect(ukBtn).toHaveClass("bg-primary-50", "dark:bg-primary-950/70");
          expect(germanyBtn).not.toHaveClass("border-primary-300");
        }
      }
    });
  });

  describe("6. Headline Stats & Hero Robustness", () => {
    it("handles boundary condition: empty metrics array prop gracefully", () => {
      render(<HeadlineStatsGrid metrics={[]} />);
      expect(screen.getByText("Antalya Province at a Glance")).toBeInTheDocument();
      expect(screen.queryByTestId(/metric-card-/)).not.toBeInTheDocument();
    });

    it("verifies Hero anchor scroll triggers smoothly with fallback", () => {
      const scrollMock = vi.fn();
      const originalGetElementById = document.getElementById;
      document.getElementById = vi.fn().mockReturnValue({
        scrollIntoView: scrollMock,
      });

      render(<InsightsHero />);

      const demoBtn = screen.getByRole("button", { name: /Demographics/i });
      fireEvent.click(demoBtn);

      expect(document.getElementById).toHaveBeenCalledWith("demographics");
      expect(scrollMock).toHaveBeenCalledWith({ behavior: "smooth" });

      document.getElementById = originalGetElementById;
    });
  });

  describe("7. Full Page Integration & Semantic Accessibility", () => {
    it("renders page without accessibility tree violations or broken components", () => {
      render(
        <MemoryRouter>
          <InsightsPage />
        </MemoryRouter>
      );

      expect(screen.getByRole("main")).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(/Antalya & Alanya/i);
      
      const level2Headings = screen.getAllByRole("heading", { level: 2 });
      expect(level2Headings.length).toBeGreaterThanOrEqual(4);
    });
  });
});
