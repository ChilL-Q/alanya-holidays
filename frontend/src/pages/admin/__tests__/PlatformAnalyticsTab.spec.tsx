import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import PlatformAnalyticsTab from "../components/PlatformAnalyticsTab";
import { adminService } from "@/api-services/admin.service";

// Mock Recharts responsive container and charts to prevent jsdom SVG layout errors
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

describe("PlatformAnalyticsTab", () => {
  const mockAnalyticsData = {
    kpiSummary: {
      totalViews: 15400,
      totalClicks: 2890,
      totalWhatsAppClicks: 1500,
      totalWebsiteClicks: 890,
      totalMapClicks: 500,
      activeListingsCount: 120,
      pendingListingsCount: 14,
      pendingClaimsCount: 6,
      totalClaimsCount: 25,
      approvedClaimsCount: 18,
      claimConversionRate: 72.0,
    },
    viewsTrend: [
      {
        date: "2026-08-10",
        views: 450,
        whatsappClicks: 40,
        websiteClicks: 25,
        mapClicks: 15,
        totalClicks: 80,
      },
      {
        date: "2026-08-11",
        views: 520,
        whatsappClicks: 55,
        websiteClicks: 30,
        mapClicks: 20,
        totalClicks: 105,
      },
    ],
    channelBreakdown: [
      { channel: "whatsapp" as const, label: "WhatsApp", clicks: 1500, percentage: 51.9 },
      { channel: "website" as const, label: "Website", clicks: 890, percentage: 30.8 },
      { channel: "map" as const, label: "Directions", clicks: 500, percentage: 17.3 },
    ],
    tierDistribution: {
      explorer: 60,
      voyager: 35,
      signature: 18,
      partner: 7,
    },
    statusDistribution: {
      approved: 120,
      pending: 14,
      rejected: 8,
      draft: 22,
    },
    topListings: [
      {
        id: "top-1",
        name: "Cleopatra Blue Beach Club",
        category: "restaurants",
        tier: "signature",
        views: 3200,
        clicks: 840,
      },
      {
        id: "top-2",
        name: "Alanya Yacht Excursions",
        category: "activities",
        tier: "partner",
        views: 2900,
        clicks: 760,
      },
    ],
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("fetches and renders KPI summary metrics and top listings", async () => {
    vi.spyOn(adminService, "getPlatformAnalytics").mockResolvedValue(mockAnalyticsData);

    render(<PlatformAnalyticsTab />);

    await waitFor(() => {
      expect(screen.getByText("15,400")).toBeInTheDocument(); // Total views
      expect(screen.getByText("2,890")).toBeInTheDocument();  // Total clicks / inquiries
      expect(screen.getByText("72.0%")).toBeInTheDocument();  // Claim conversion rate
      expect(screen.getByText("Cleopatra Blue Beach Club")).toBeInTheDocument();
      expect(screen.getByText("Alanya Yacht Excursions")).toBeInTheDocument();
    });

    expect(adminService.getPlatformAnalytics).toHaveBeenCalledWith(30);
  });

  it("switches timeframe when 7 Days and 90 Days buttons are clicked", async () => {
    vi.spyOn(adminService, "getPlatformAnalytics").mockResolvedValue(mockAnalyticsData);

    render(<PlatformAnalyticsTab />);

    await waitFor(() => {
      expect(adminService.getPlatformAnalytics).toHaveBeenCalledWith(30);
    });

    const sevenDaysBtn = screen.getByRole("button", { name: "7 Days" });
    fireEvent.click(sevenDaysBtn);

    await waitFor(() => {
      expect(adminService.getPlatformAnalytics).toHaveBeenCalledWith(7);
    });

    const ninetyDaysBtn = screen.getByRole("button", { name: "90 Days" });
    fireEvent.click(ninetyDaysBtn);

    await waitFor(() => {
      expect(adminService.getPlatformAnalytics).toHaveBeenCalledWith(90);
    });
  });

  it("renders graceful fallback message when service fails", async () => {
    vi.spyOn(adminService, "getPlatformAnalytics").mockRejectedValue(new Error("API Timeout"));

    render(<PlatformAnalyticsTab />);

    await waitFor(() => {
      expect(screen.getByText("API Timeout")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Retry" })).toBeInTheDocument();
    });
  });
});
