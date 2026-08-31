import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BusinessDetailPage from "./page";
import { directoryService, type Business } from "@/api-services/directory.service";

const authState = vi.hoisted(() => ({
  isAuthenticated: false,
  loading: false,
}));
const favoritesState = vi.hoisted(() => ({
  isFavorite: vi.fn(() => false),
  toggleFavorite: vi.fn(),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => favoritesState,
}));

vi.mock("@/api-services/directory.service", () => ({
  businessCategories: [{ id: "cafes", icon: "ri-cup-line" }],
  directoryService: {
    getListingById: vi.fn(),
    getListingReviews: vi.fn(),
    getListings: vi.fn(),
    submitReview: vi.fn(),
  },
}));

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div>Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div>Footer</div>,
}));

vi.mock("@/components/common/TrustBadge", () => ({
  default: () => <div>Trust badge</div>,
}));

vi.mock("@/components/feature/ClaimListingModal", () => ({
  default: () => null,
}));

const business = {
  id: "business-123",
  name: "Craft Coffee",
  category: "cafes",
  subcategory: "Coffee Shop",
  priceRange: "$$",
  rating: 4.8,
  reviewCount: 12,
  image: "/images/craft-coffee.jpg",
  phone: "+90 555 123 45 67",
  website: "https://example.com",
  address: "Alanya",
  openingHours: "09:00 – 18:00",
  description: "Specialty coffee in Alanya.",
  email: "coffee@example.com",
  tags: [],
  trustBadge: "Recommended by Travellers",
  featured: false,
  lat: 36.5444,
  lng: 31.9954,
} as Business;

function RegistrationDestination() {
  const location = useLocation();
  const returnPath = (
    location.state as { from?: { pathname?: string } } | null
  )?.from?.pathname;

  return <div>Register destination: {returnPath}</div>;
}

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/business/business-123"]}>
      <Routes>
        <Route path="/business/:businessId" element={<BusinessDetailPage />} />
        <Route path="/register" element={<RegistrationDestination />} />
      </Routes>
    </MemoryRouter>
  );

describe("BusinessDetailPage favorites authentication", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authState.isAuthenticated = false;
    authState.loading = false;
    favoritesState.isFavorite.mockReturnValue(false);
    vi.mocked(directoryService.getListingById).mockResolvedValue(business);
    vi.mocked(directoryService.getListingReviews).mockResolvedValue([]);
    vi.mocked(directoryService.getListings).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 5,
      totalPages: 0,
    });
  });

  it("sends a guest to registration and preserves the business return path", async () => {
    renderPage();

    const favoriteButton = await screen.findByRole("button", {
      name: /save to favorites/i,
    });
    fireEvent.click(favoriteButton);

    expect(
      screen.getByText("Register destination: /business/business-123")
    ).toBeInTheDocument();
    expect(favoritesState.toggleFavorite).not.toHaveBeenCalled();
  });

  it("toggles the favorite immediately for an authenticated user", async () => {
    authState.isAuthenticated = true;
    renderPage();

    fireEvent.click(
      await screen.findByRole("button", { name: /save to favorites/i })
    );

    await waitFor(() => {
      expect(favoritesState.toggleFavorite).toHaveBeenCalledWith("business-123");
    });
  });
});
