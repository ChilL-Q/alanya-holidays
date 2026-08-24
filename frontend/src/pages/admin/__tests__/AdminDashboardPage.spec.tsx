import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import AdminDashboardPage from "../page";
import { adminService } from "@/api-services/admin.service";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "admin-1", email: "admin@alanyaholidays.com", role: "admin" },
    profile: { role: "admin", full_name: "Admin User" },
    loading: false,
    isAuthenticated: true,
    signOut: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div data-testid="navbar">Mock Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div data-testid="footer">Mock Footer</div>,
}));

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

describe("AdminDashboardPage (4-Tab Control Center)", () => {
  const mockListings = [
    {
      id: "l-101",
      name: "Panorama Sky Lounge",
      slug: "panorama-sky-lounge",
      category_id: "restaurants",
      category: "Restaurants",
      status: "pending",
      tier: "signature",
      location: "Alanya Castle",
      email: "info@skylounge.test",
      phone: "+90 555 123 0000",
      description: "Fine dining with castle views",
      gallery: ["https://example.com/sky.jpg"],
      created_at: "2026-08-20T12:00:00Z",
    },
    {
      id: "l-102",
      name: "Kleopatra Parasailing",
      slug: "kleopatra-parasailing",
      category_id: "activities",
      category: "Activities",
      status: "approved",
      tier: "voyager",
      location: "Kleopatra Beach",
      email: "fly@kleopatra.test",
      gallery: ["https://example.com/fly.jpg"],
      created_at: "2026-08-19T12:00:00Z",
    },
    {
      id: "l-103",
      name: "Draft Turkish Bath",
      slug: "draft-turkish-bath",
      category_id: "wellness",
      category: "Wellness",
      status: "draft",
      tier: "explorer",
      location: "Damlatas",
      gallery: [],
      created_at: "2026-08-18T12:00:00Z",
    },
  ];

  const mockClaims = [
    {
      id: "claim-101",
      listing_id: "l-101",
      user_id: "claimant-uuid-1",
      email: "claimant@skylounge.test",
      phone: "+90 555 999 8888",
      role: "Owner",
      business_name: "Panorama Sky Lounge",
      contact_phone: "+90 555 999 8888",
      status: "pending",
      verification_token: "tok-abc-123",
      directory_listing: {
        id: "l-101",
        name: "Panorama Sky Lounge",
        category_id: "restaurants",
        tier: "signature",
      },
      created_at: "2026-08-20T14:00:00Z",
    },
  ];

  const mockAnalytics = {
    kpiSummary: {
      totalViews: 8420,
      totalClicks: 1450,
      totalWhatsAppClicks: 780,
      totalWebsiteClicks: 420,
      totalMapClicks: 250,
      activeListingsCount: 65,
      pendingListingsCount: 5,
      pendingClaimsCount: 3,
      totalClaimsCount: 15,
      approvedClaimsCount: 9,
      claimConversionRate: 60.0,
    },
    viewsTrend: [
      {
        date: "2026-08-01",
        views: 280,
        whatsappClicks: 25,
        websiteClicks: 15,
        mapClicks: 8,
        totalClicks: 48,
      },
      {
        date: "2026-08-02",
        views: 310,
        whatsappClicks: 30,
        websiteClicks: 18,
        mapClicks: 10,
        totalClicks: 58,
      },
    ],
    channelBreakdown: [
      { channel: "whatsapp" as const, label: "WhatsApp", clicks: 780, percentage: 53.79 },
      { channel: "website" as const, label: "Website", clicks: 420, percentage: 28.97 },
      { channel: "map" as const, label: "Directions", clicks: 250, percentage: 17.24 },
    ],
    tierDistribution: {
      explorer: 35,
      voyager: 18,
      signature: 8,
      partner: 4,
    },
    statusDistribution: {
      approved: 65,
      pending: 5,
      rejected: 4,
      draft: 8,
    },
    topListings: [
      {
        id: "l-101",
        name: "Panorama Sky Lounge",
        category: "restaurants",
        tier: "signature",
        views: 1200,
        clicks: 340,
      },
    ],
  };

  const mockEnquiries = [
    {
      id: 1,
      name: "Sarah Connor",
      email: "sarah@example.com",
      subject: "Yacht Charter",
      message: "Sunset trip for 4 people",
      status: "new",
      enquiry_type: "yacht_charter",
      created_at: "2026-08-20T10:00:00Z",
    },
  ];

  const mockContentSubmissions = [
    {
      id: "sub-101",
      user_id: "creator-1",
      title: "Secret Sunset Spot in Mahmutlar",
      content: "A wonderful quiet beach area with limestone rocks.",
      author_name: "Elena Rostova",
      author_email: "elena@example.com",
      category: "Beaches",
      status: "pending_review",
      payment_details: { method: "crypto", handle: "TRX123", acceptedTerms: true },
      created_at: "2026-08-20T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.spyOn(adminService, "getModerationListings").mockResolvedValue(mockListings);
    vi.spyOn(adminService, "getClaimsQueue").mockResolvedValue(mockClaims);
    vi.spyOn(adminService, "getContentSubmissions").mockResolvedValue(mockContentSubmissions);
    vi.spyOn(adminService, "getPlatformAnalytics").mockResolvedValue(mockAnalytics);
    vi.spyOn(adminService, "getEnquiries").mockResolvedValue(mockEnquiries);
    vi.spyOn(adminService, "getAuditLogs").mockResolvedValue({
      data: [
        {
          id: "audit-1",
          entity_type: "listing",
          entity_id: "l-101",
          action: "approve",
          admin_id: "admin-1",
          created_at: "2026-08-24T12:00:00Z",
        },
      ],
      total: 1,
      page: 1,
      limit: 20,
      totalPages: 1,
    });
    vi.spyOn(adminService, "approveListing").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectListing").mockResolvedValue(true);
    vi.spyOn(adminService, "deleteListing").mockResolvedValue(true);
    vi.spyOn(adminService, "approveClaim").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectClaim").mockResolvedValue(true);
    vi.spyOn(adminService, "updateEnquiryStatus").mockResolvedValue(true);
  });

  it("renders the 7-tab control navigation with count badges", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=listings"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /Listings Moderation/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Claims Queue/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Content Moderation/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Forum Moderation/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Audit Log/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Platform Analytics/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /Concierge Enquiries/i })).toBeInTheDocument();
    });
  });

  it("switches to Audit Log tab and displays audit history", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=audit"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText(/Universal Moderation Audit Log/i)).toBeInTheDocument();
      expect(screen.getByText("l-101")).toBeInTheDocument();
    });
  });

  it("switches to Content Moderation tab and displays creator submissions", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=content"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );


    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
      expect(screen.getByText("Elena Rostova")).toBeInTheDocument();
    });
  });

  it("displays Listings Moderation tab with filter matrix and allows approving a listing", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=listings"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Panorama Sky Lounge")).toBeInTheDocument();
    });

    // Check filter pills exist
    expect(screen.getByRole("button", { name: /^All/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Pending/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Approved/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Draft/i })).toBeInTheDocument();

    // Click Approve on the pending listing
    const approveBtn = screen.getByTestId("approve-listing-l-101");
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminService.approveListing).toHaveBeenCalledWith("l-101");
    });
  });

  it("switches to Claims Queue tab and allows approving claim", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=claims"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Panorama Sky Lounge")).toBeInTheDocument();
      expect(screen.getByText("claimant@skylounge.test")).toBeInTheDocument();
    });

    const approveClaimBtn = screen.getByTestId("approve-claim-claim-101");
    fireEvent.click(approveClaimBtn);

    await waitFor(() => {
      expect(adminService.approveClaim).toHaveBeenCalledWith("claim-101");
    });
  });

  it("switches to Platform Analytics tab and renders KPI cards and charts", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=analytics"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("8,420")).toBeInTheDocument(); // Total Views
      expect(screen.getByText("1,450")).toBeInTheDocument(); // Total Clicks / Inquiries
      expect(screen.getByText("60.0%")).toBeInTheDocument(); // Claim Conversion Rate
    });

    // Timeframe selector buttons
    expect(screen.getByRole("button", { name: "7 Days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "30 Days" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "90 Days" })).toBeInTheDocument();
  });

  it("switches to Concierge tab and displays enquiries triage", async () => {
    render(
      <MemoryRouter initialEntries={["/admin?tab=concierge"]}>
        <AdminDashboardPage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Sarah Connor")).toBeInTheDocument();
      expect(screen.getByText("Sunset trip for 4 people")).toBeInTheDocument();
    });
  });
});
