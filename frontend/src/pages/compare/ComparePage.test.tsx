import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import ComparePage from "./page";
import { directoryService } from "@/api-services/directory.service";

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: null,
    profile: null,
    loading: false,
    isAuthenticated: false,
    signOut: vi.fn(),
  }),
}));

vi.mock("@/api-services/directory.service", async () => {
  const actual = await vi.importActual<typeof import("@/api-services/directory.service")>(
    "@/api-services/directory.service"
  );
  return {
    ...actual,
    directoryService: {
      ...actual.directoryService,
      getListingById: vi.fn(),
    },
  };
});

describe("ComparePage Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no business IDs are in query params", () => {
    render(
      <MemoryRouter initialEntries={["/compare"]}>
        <ComparePage />
      </MemoryRouter>
    );

    expect(screen.getByText(/Nothing to compare yet/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Browse Directory/i })).toHaveAttribute("href", "/explore");
  });

  it("renders side-by-side comparison when 2 businesses are provided in query params", async () => {
    const mockBiz1 = {
      id: "biz-001",
      name: "Kale Panorama",
      category: "restaurants-cafes",
      subcategory: "Turkish Cuisine",
      description: "Castle view restaurant.",
      address: "Kale Yolu 42",
      phone: "+902425134421",
      email: "kale@test.com",
      website: "https://kalepanorama.com",
      rating: 4.8,
      reviewCount: 347,
      image: "https://example.com/kale.jpg",
      tags: ["Rooftop"],
      featured: true,
      priceRange: "$$$",
      openingHours: "12:00 - 23:30",
      lat: 36.53,
      lng: 31.99,
    };

    const mockBiz2 = {
      id: "biz-002",
      name: "Cleopatra Beach Bistro",
      category: "restaurants-cafes",
      subcategory: "Seafood & Grill",
      description: "Beachfront bistro.",
      address: "Cleopatra Beach No:10",
      phone: "+902425139988",
      email: "cleopatra@test.com",
      website: "https://cleopatrabeach.com",
      rating: 4.6,
      reviewCount: 215,
      image: "https://example.com/cleopatra.jpg",
      tags: ["Beachfront"],
      featured: false,
      priceRange: "$$",
      openingHours: "09:00 - 00:00",
      lat: 36.54,
      lng: 31.98,
    };

    vi.mocked(directoryService.getListingById).mockImplementation(async (id: string) => {
      if (id === "biz-001") return mockBiz1;
      if (id === "biz-002") return mockBiz2;
      return null;
    });

    render(
      <MemoryRouter initialEntries={["/compare?ids=biz-001,biz-002"]}>
        <ComparePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText("Kale Panorama").length).toBeGreaterThan(0);
      expect(screen.getAllByText("Cleopatra Beach Bistro").length).toBeGreaterThan(0);
    });

    expect(screen.getByText(/Comparing 2 businesses side by side/i)).toBeInTheDocument();
  });

  it("toggles highlight differences mode", async () => {
    const mockBiz1 = {
      id: "biz-001",
      name: "Kale Panorama",
      category: "restaurants-cafes",
      subcategory: "Turkish Cuisine",
      description: "Castle view restaurant.",
      address: "Kale Yolu 42",
      phone: "+902425134421",
      email: "kale@test.com",
      website: "https://kalepanorama.com",
      rating: 4.8,
      reviewCount: 347,
      image: "https://example.com/kale.jpg",
      tags: ["Rooftop"],
      featured: true,
      priceRange: "$$$",
      openingHours: "12:00 - 23:30",
      lat: 36.53,
      lng: 31.99,
    };

    const mockBiz2 = {
      id: "biz-002",
      name: "Cleopatra Beach Bistro",
      category: "restaurants-cafes",
      subcategory: "Seafood & Grill",
      description: "Beachfront bistro.",
      address: "Cleopatra Beach No:10",
      phone: "+902425139988",
      email: "cleopatra@test.com",
      website: "https://cleopatrabeach.com",
      rating: 4.6,
      reviewCount: 215,
      image: "https://example.com/cleopatra.jpg",
      tags: ["Beachfront"],
      featured: false,
      priceRange: "$$",
      openingHours: "09:00 - 00:00",
      lat: 36.54,
      lng: 31.98,
    };

    vi.mocked(directoryService.getListingById).mockImplementation(async (id: string) => {
      if (id === "biz-001") return mockBiz1;
      if (id === "biz-002") return mockBiz2;
      return null;
    });

    render(
      <MemoryRouter initialEntries={["/compare?ids=biz-001,biz-002"]}>
        <ComparePage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Highlight Differences/i })).toBeInTheDocument();
    });

    const highlightBtn = screen.getByRole("button", { name: /Highlight Differences/i });
    fireEvent.click(highlightBtn);

    expect(highlightBtn).toHaveClass("bg-accent-500");
  });
});
