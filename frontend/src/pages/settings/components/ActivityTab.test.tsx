import "@testing-library/jest-dom";
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ActivityTab } from "./ActivityTab";
import { OrdersList } from "./OrdersList";
import { BookingsList } from "./BookingsList";
import { FavoritesList } from "./FavoritesList";
import { ForumActivityList } from "./ForumActivityList";
import { ordersService } from "@/api-services/orders.service";
import { bookingsService } from "@/api-services/bookings.service";
import { forumService } from "@/api-services/forum.service";
import { directoryService } from "@/api-services/directory.service";

// Mock API services
vi.mock("@/api-services/orders.service", () => ({
  ordersService: {
    getMyOrders: vi.fn(),
  },
  getMyOrders: vi.fn(),
}));

vi.mock("@/api-services/bookings.service", () => ({
  bookingsService: {
    getUserBookings: vi.fn(),
    cancelBooking: vi.fn(),
  },
  getUserBookings: vi.fn(),
  cancelBooking: vi.fn(),
}));

vi.mock("@/api-services/forum.service", () => ({
  forumService: {
    getThreads: vi.fn(),
  },
  getThreads: vi.fn(),
}));

vi.mock("@/api-services/directory.service", () => ({
  directoryService: {
    getListings: vi.fn(),
  },
}));

// Mock useFavorites hook
const mockToggleFavorite = vi.fn();
let mockFavoritesSet = new Set<string>();

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    favorites: mockFavoritesSet,
    isFavorite: (id: string) => mockFavoritesSet.has(id),
    toggleFavorite: mockToggleFavorite,
    favoriteCount: mockFavoritesSet.size,
  }),
}));

describe("Activity Hub (Milestone 4 — R3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFavoritesSet = new Set<string>();
    vi.spyOn(window, "confirm").mockReturnValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("OrdersList Component", () => {
    it("renders loading skeleton while orders are being fetched", () => {
      vi.mocked(ordersService.getMyOrders).mockReturnValue(new Promise(() => {}));

      render(
        <MemoryRouter>
          <OrdersList />
        </MemoryRouter>
      );

      expect(screen.getByTestId("orders-loading-skeleton")).toBeInTheDocument();
    });

    it("renders empty state with CTA to shop when no orders exist", async () => {
      vi.mocked(ordersService.getMyOrders).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <OrdersList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No orders placed yet/i)).toBeInTheDocument();
      });

      const ctaLink = screen.getByRole("link", { name: /Browse Shop & Gifts/i });
      expect(ctaLink).toHaveAttribute("href", "/shop");
    });

    it("renders fetched orders with status badges, items and total amounts", async () => {
      const mockOrders = [
        {
          id: "ORD-9901",
          status: "completed",
          currency: "EUR",
          total_price: 145.5,
          created_at: "2026-03-10T14:30:00Z",
          recipient_name: "Elena Rostova",
          items: [
            {
              productName: "Alanya Organic Olive Oil Hamper",
              quantity: 2,
              unitPrice: 45.0,
            },
            {
              productName: "Handmade Turkish Delight Gift Box",
              quantity: 1,
              unitPrice: 55.5,
            },
          ],
        },
        {
          id: "ORD-9902",
          status: "pending",
          currency: "EUR",
          total_price: 89.0,
          created_at: "2026-04-01T09:15:00Z",
          items: [
            {
              productName: "Sunset Boat Tour Voucher",
              quantity: 1,
              unitPrice: 89.0,
            },
          ],
        },
      ];

      vi.mocked(ordersService.getMyOrders).mockResolvedValue(mockOrders);

      render(
        <MemoryRouter>
          <OrdersList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/ORD-9901/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Alanya Organic Olive Oil Hamper/i)).toBeInTheDocument();
      expect(screen.getByText(/ORD-9902/i)).toBeInTheDocument();
      expect(screen.getByText(/Sunset Boat Tour Voucher/i)).toBeInTheDocument();
      expect(screen.getByText(/Completed/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
    });

    it("handles order fetch error gracefully and shows error alert", async () => {
      vi.mocked(ordersService.getMyOrders).mockRejectedValue(new Error("Network timeout"));

      render(
        <MemoryRouter>
          <OrdersList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Unable to load orders/i)).toBeInTheDocument();
      });
    });
  });

  describe("BookingsList Component", () => {
    it("renders loading skeleton while bookings are being fetched", () => {
      vi.mocked(bookingsService.getUserBookings).mockReturnValue(new Promise(() => {}));

      render(
        <MemoryRouter>
          <BookingsList />
        </MemoryRouter>
      );

      expect(screen.getByTestId("bookings-loading-skeleton")).toBeInTheDocument();
    });

    it("renders empty state with CTA to explore when no bookings exist", async () => {
      vi.mocked(bookingsService.getUserBookings).mockResolvedValue([]);

      render(
        <MemoryRouter>
          <BookingsList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No bookings or inquiries found/i)).toBeInTheDocument();
      });

      const ctaLink = screen.getByRole("link", { name: /Explore Villas & Experiences/i });
      expect(ctaLink).toHaveAttribute("href", "/explore");
    });

    it("renders bookings with status badges, dates, and cancel action", async () => {
      const mockBookings = [
        {
          id: "bk-101",
          item_type: "property",
          itemTitle: "Villa Sunset Cleopatra",
          check_in: "2026-06-01",
          check_out: "2026-06-08",
          total_price: 2400,
          guests: 4,
          status: "confirmed",
          property: {
            id: "prop-1",
            title: "Villa Sunset Cleopatra",
            location: "Cleopatra Beach, Alanya",
            price_per_night: 350,
          },
        },
        {
          id: "bk-102",
          item_type: "service",
          itemTitle: "Private Mediterranean Yacht Charter",
          check_in: "2026-06-15",
          check_out: "2026-06-15",
          total_price: 850,
          guests: 6,
          status: "pending",
        },
      ];

      vi.mocked(bookingsService.getUserBookings).mockResolvedValue(mockBookings);
      vi.mocked(bookingsService.cancelBooking).mockResolvedValue({
        success: true,
        message: "Booking cancelled",
      });

      render(
        <MemoryRouter>
          <BookingsList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Villa Sunset Cleopatra/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Private Mediterranean Yacht Charter/i)).toBeInTheDocument();
      expect(screen.getByText(/4 Guests/i)).toBeInTheDocument();

      // Test cancel action on confirmed/pending booking
      const cancelBtn = screen.getByTestId("cancel-booking-bk-101");
      expect(cancelBtn).toBeInTheDocument();
      fireEvent.click(cancelBtn);

      await waitFor(() => {
        expect(bookingsService.cancelBooking).toHaveBeenCalledWith("bk-101");
      });
    });
  });

  describe("FavoritesList Component", () => {
    it("renders empty state with CTA to explore when favorites set is empty", async () => {
      mockFavoritesSet = new Set<string>();

      render(
        <MemoryRouter>
          <FavoritesList />
        </MemoryRouter>
      );

      expect(screen.getByText(/No saved favorites yet/i)).toBeInTheDocument();
      const ctaLink = screen.getByRole("link", { name: /Discover Alanya Places/i });
      expect(ctaLink).toHaveAttribute("href", "/explore");
    });

    it("renders favorited items and allows removing them from favorites", async () => {
      mockFavoritesSet = new Set<string>(["biz-001"]);
      vi.mocked(directoryService.getListings).mockResolvedValue({
        data: [
          {
            id: "biz-001",
            name: "Kale Panorama Restaurant",
            category: "restaurants-cafes",
            subcategory: "Turkish Cuisine",
            description: "Authentic Ottoman cuisine with castle view.",
            address: "Hisariçi Mah. Alanya",
            phone: "+90 242 513 44 21",
            email: "reservations@kalepanorama.com",
            website: "https://kalepanorama.com",
            rating: 4.8,
            reviewCount: 347,
            image: "https://example.com/kale.jpg",
            tags: ["Turkish Cuisine"],
            featured: true,
            priceRange: "$$$",
            openingHours: "10:00 - 23:00",
            lat: 36.54,
            lng: 31.99,
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      });

      render(
        <MemoryRouter>
          <FavoritesList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Kale Panorama Restaurant/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/4.8/i)).toBeInTheDocument();

      const removeBtn = screen.getByTestId("remove-fav-biz-001");
      fireEvent.click(removeBtn);

      expect(mockToggleFavorite).toHaveBeenCalledWith("biz-001");
    });
  });

  describe("ForumActivityList Component", () => {
    it("renders loading skeleton while forum threads are loading", () => {
      vi.mocked(forumService.getThreads).mockReturnValue(new Promise(() => {}));

      render(
        <MemoryRouter>
          <ForumActivityList />
        </MemoryRouter>
      );

      expect(screen.getByTestId("forum-loading-skeleton")).toBeInTheDocument();
    });

    it("renders empty state with CTA to forum when no threads exist", async () => {
      vi.mocked(forumService.getThreads).mockResolvedValue({ threads: [], total: 0 });

      render(
        <MemoryRouter>
          <ForumActivityList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/No forum discussions yet/i)).toBeInTheDocument();
      });

      const ctaLink = screen.getByRole("link", { name: /Explore Community Forum/i });
      expect(ctaLink).toHaveAttribute("href", "/forum");
    });

    it("renders user forum threads with engagement metrics", async () => {
      vi.mocked(forumService.getThreads).mockResolvedValue({
        threads: [
          {
            id: "th-best-beaches",
            title: "Top 5 Hidden Beaches around Alanya Castle",
            category: "Beaches & Nature",
            categoryId: "beaches",
            author: "Elena Rostova",
            authorAvatar: "https://example.com/avatar.jpg",
            replies: 18,
            views: 420,
            likes: 35,
            postedAt: "2 days ago",
            isHot: true,
            isPinned: false,
            isVerified: false,
            excerpt: "Sharing my secret guide to quiet swimming spots away from the crowd...",
          },
        ],
        total: 1,
      });

      render(
        <MemoryRouter>
          <ForumActivityList />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Top 5 Hidden Beaches around Alanya Castle/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Beaches & Nature/i)).toBeInTheDocument();
      expect(screen.getByText(/420/i)).toBeInTheDocument();
      expect(screen.getByText(/35/i)).toBeInTheDocument();
      expect(screen.getByText(/18/i)).toBeInTheDocument();
    });
  });

  describe("ActivityTab Container Component", () => {
    it("renders all 4 subtab switcher buttons", () => {
      render(
        <MemoryRouter>
          <ActivityTab />
        </MemoryRouter>
      );

      expect(screen.getByRole("tab", { name: /orders/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /bookings/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /favorites/i })).toBeInTheDocument();
      expect(screen.getByRole("tab", { name: /forum/i })).toBeInTheDocument();
    });

    it("switches active subtab view upon clicking subtab buttons", async () => {
      vi.mocked(ordersService.getMyOrders).mockResolvedValue([]);
      vi.mocked(bookingsService.getUserBookings).mockResolvedValue([]);
      vi.mocked(forumService.getThreads).mockResolvedValue({ threads: [], total: 0 });

      render(
        <MemoryRouter>
          <ActivityTab />
        </MemoryRouter>
      );

      // Default is Orders
      await waitFor(() => {
        expect(screen.getByText(/No orders placed yet/i)).toBeInTheDocument();
      });

      // Switch to Bookings
      const bookingsTab = screen.getByRole("tab", { name: /bookings/i });
      fireEvent.click(bookingsTab);

      await waitFor(() => {
        expect(screen.getByText(/No bookings or inquiries found/i)).toBeInTheDocument();
      });

      // Switch to Favorites
      const favsTab = screen.getByRole("tab", { name: /favorites/i });
      fireEvent.click(favsTab);

      await waitFor(() => {
        expect(screen.getByText(/No saved favorites yet/i)).toBeInTheDocument();
      });

      // Switch to Forum
      const forumTab = screen.getByRole("tab", { name: /forum/i });
      fireEvent.click(forumTab);

      await waitFor(() => {
        expect(screen.getByText(/No forum discussions yet/i)).toBeInTheDocument();
      });
    });
  });
});
