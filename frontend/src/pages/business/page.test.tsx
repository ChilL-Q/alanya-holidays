import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import BusinessDetailPage from "./page";
import { directoryService, type Business } from "@/api-services/directory.service";
import type { BusinessReview } from "@/api-services/directory.service";
import i18n from "@/i18n";

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
  googleRating: 4.8,
  googleReviewCount: 12,
  image: "/images/craft-coffee.jpg",
  phone: "+90 555 123 45 67",
  website: "https://example.com",
  address: "Alanya",
  openingHours: "09:00 – 18:00",
  description: "Specialty coffee in Alanya.",
  email: "coffee@example.com",
  tags: ["Sea view"],
  trustBadge: "Recommended by Travellers",
  featured: false,
  lat: 36.5444,
  lng: 31.9954,
  can_claim: true,
} as Business;

const reviews: BusinessReview[] = Array.from({ length: 5 }, (_, index) => ({
  id: `review-${index + 1}`,
  businessId: business.id,
  reviewerName: `Guest ${index + 1}`,
  reviewerAvatar: "/images/avatar.svg",
  rating: 5,
  date: "2026-09-01",
  title: `Guest review ${index + 1}`,
  content: `Untranslated review content ${index + 1}`,
  visitType: "Couple",
}));

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
  beforeEach(async () => {
    await i18n.changeLanguage("en");
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

  afterEach(async () => {
    await i18n.changeLanguage("en");
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

  it("separates Google rating provenance from Alanya Holidays community reviews", async () => {
    renderPage();

    expect(
      await screen.findByText("Google rating: 4.8 · 12 Google reviews")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Alanya Holidays reviews" })
    ).toBeInTheDocument();
    expect(screen.getByText("No community reviews yet")).toBeInTheDocument();
    expect(screen.queryByText("0.0")).not.toBeInTheDocument();
  });

  it.each([
    [
      "ru",
      "Рейтинг Google: 4.8 · Отзывов в Google: 12",
      "Отзывы Alanya Holidays",
      "Отзывов сообщества пока нет",
    ],
    [
      "tr",
      "Google puanı: 4.8 · 12 Google yorumu",
      "Alanya Holidays yorumları",
      "Henüz topluluk yorumu yok",
    ],
  ])(
    "localizes rating provenance and community review copy in %s",
    async (language, googleSummary, communityHeading, emptyCommunityCopy) => {
      await i18n.changeLanguage(language);
      renderPage();

      expect(await screen.findByText(googleSummary)).toBeInTheDocument();
      expect(
        screen.getByRole("heading", { name: communityHeading })
      ).toBeInTheDocument();
      expect(screen.getByText(emptyCommunityCopy)).toBeInTheDocument();
    }
  );

  it.each([
    [
      "ru",
      {
        call: "Позвонить",
        website: "Перейти на сайт",
        highlights: "Особенности",
        claim: "Заявить права",
        writeReview: "Оставить отзыв",
        directions: "Получить маршрут",
        submitReview: "Отправить отзыв",
        cancel: "Отмена",
        selectRating: "Выберите оценку.",
        ready: "Готовы открыть для себя Аланью?",
      },
    ],
    [
      "tr",
      {
        call: "Hemen Ara",
        website: "Web Sitesini Ziyaret Et",
        highlights: "Öne Çıkanlar",
        claim: "İşletmeyi Sahiplen",
        writeReview: "Yorum Yaz",
        directions: "Yol Tarifi Al",
        submitReview: "Yorumu Gönder",
        cancel: "İptal",
        selectRating: "Lütfen bir puan seçin.",
        ready: "Alanya'yı Keşfetmeye Hazır mısınız?",
      },
    ],
  ])("localizes major business controls in %s while preserving business content", async (language, labels) => {
    await i18n.changeLanguage(language);
    renderPage();

    expect(await screen.findByRole("heading", { name: "Craft Coffee" })).toBeInTheDocument();
    expect(screen.getByText("Specialty coffee in Alanya.")).toBeInTheDocument();
    expect(screen.getByText("Sea view")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.call })).toHaveAttribute("href", `tel:${business.phone}`);
    expect(screen.getByRole("link", { name: labels.website })).toHaveAttribute("href", business.website);
    expect(screen.getByRole("heading", { name: labels.highlights })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.claim })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: labels.directions })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: labels.ready })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: labels.writeReview }));
    expect(screen.getByRole("button", { name: labels.submitReview })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: labels.cancel })).toBeInTheDocument();
    fireEvent.submit(document.getElementById("business-review-form")!);
    expect(screen.getByText(labels.selectRating)).toBeInTheDocument();

    expect(screen.queryByText("Call Now")).not.toBeInTheDocument();
    expect(screen.queryByText("Visit Website")).not.toBeInTheDocument();
    expect(screen.queryByText("Highlights")).not.toBeInTheDocument();
  });

  it("localizes review expansion controls without translating reviewer content", async () => {
    await i18n.changeLanguage("ru");
    vi.mocked(directoryService.getListingReviews).mockResolvedValue(reviews);
    renderPage();

    const showAll = await screen.findByRole("button", { name: "Показать все 5 отзывов" });
    expect(screen.getByText("Untranslated review content 1")).toBeInTheDocument();
    fireEvent.click(showAll);
    expect(screen.getByRole("button", { name: "Показать меньше" })).toBeInTheDocument();
    expect(screen.getByText("Untranslated review content 5")).toBeInTheDocument();
  });
});
