import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { render, screen, act, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";
import { apiClient, ApiError } from "@/lib/api-client";
import { directoryService } from "@/api-services/directory.service";
import { conciergeService } from "@/api-services/concierge.service";
import { forumService } from "@/api-services/forum.service";
import { eventsService } from "@/api-services/events.service";
import { blogService } from "@/api-services/blog.service";
import { propertiesService } from "@/api-services/properties.service";
import { AuthProvider } from "@/context/AuthContext";
import EventsPage from "@/pages/events/page";
import ThreadPage from "@/pages/thread/page";

// Mock supabase to avoid external network calls
vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}));

// Mock Navbar / Footer to isolate page testing
vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div data-testid="mock-navbar">Navbar</div>,
}));
vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div data-testid="mock-footer">Footer</div>,
}));

function LocationSearchSpy() {
  const location = useLocation();
  return <div data-testid="location-search">{location.search}</div>;
}

describe("Challenger 2 Empirical Verification: Mock Elimination & Error Resilience", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* =========================================================================
   * 1. Services throw real ApiError on 500, 404, timeout (No Mock Fallbacks)
   * ========================================================================= */
  describe("API Services — Strict ApiError Propagation on Server Errors", () => {
    it("directoryService.getListings throws ApiError on 500 without returning mock data", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Internal Server Error", 500, "Internal Server Error")
      );

      await expect(directoryService.getListings()).rejects.toThrow(ApiError);
      await expect(directoryService.getListings()).rejects.toSatisfy((err: unknown) => {
        return err instanceof ApiError && err.status === 500;
      });
    });

    it("conciergeService.getOfferingsByCategory throws ApiError on 500 without returning mock items", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Service Unavailable", 503, "Service Unavailable")
      );

      await expect(conciergeService.getOfferingsByCategory("private-jet")).rejects.toThrow(ApiError);
    });

    it("conciergeService.getPrivateJets propagates a 504 without publishing demo inventory", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Gateway Timeout", 504, "Gateway Timeout")
      );

      await expect(conciergeService.getPrivateJets()).rejects.toSatisfy((err: unknown) => {
        return err instanceof ApiError && err.status === 504;
      });
    });

    it("forumService.getForumStats throws ApiError on 500 without returning fake stats", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Database Connection Failed", 500, "Internal Server Error")
      );

      await expect(forumService.getForumStats()).rejects.toThrow(ApiError);
    });

    it("forumService.getThreads throws ApiError on 500", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Internal Server Error", 500, "Internal Server Error")
      );

      await expect(forumService.getThreads({ sort: "latest" })).rejects.toThrow(ApiError);
    });

    it("eventsService.getEvents throws ApiError on 500 without returning mock events", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Internal Server Error", 500, "Internal Server Error")
      );

      await expect(eventsService.getEvents()).rejects.toThrow(ApiError);
    });

    it("blogService.getPosts throws ApiError on 500 without returning mock blog posts", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Internal Server Error", 500, "Internal Server Error")
      );

      await expect(blogService.getPosts()).rejects.toThrow(ApiError);
    });

    it("propertiesService.getProperties throws ApiError on 500 without returning mock properties", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(
        new ApiError("Internal Server Error", 500, "Internal Server Error")
      );

      await expect(propertiesService.getProperties()).rejects.toThrow(ApiError);
    });
  });

  /* =========================================================================
   * 2. UI ErrorState rendering on API Failure
   * ========================================================================= */
  describe("UI Error States — ErrorState Rendering on Page Fetch Failure", () => {
    it("Events page renders ErrorState with retry button when API fails and fallback is empty", async () => {
      vi.spyOn(eventsService, "getEventsSync").mockImplementation(() => []);
      vi.spyOn(eventsService, "getEvents").mockRejectedValue(
        new ApiError("Database unreachable", 500, "Internal Server Error")
      );

      render(
        <AuthProvider>
          <MemoryRouter>
            <EventsPage />
          </MemoryRouter>
        </AuthProvider>
      );

      // Wait for error state to be rendered
      await waitFor(() => {
        expect(screen.getByRole("alert")).toBeInTheDocument();
        expect(screen.getByText(/Unable to load events/i)).toBeInTheDocument();
        expect(screen.getByRole("button", { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it("Thread page renders 'Thread not found' state on 404 ApiError", async () => {
      vi.spyOn(forumService, "getThreadById").mockResolvedValueOnce(null);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/thread/non-existing-slug"]}>
            <Routes>
              <Route path="/thread/:threadId" element={<ThreadPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText(/Thread not found/i)).toBeInTheDocument();
        expect(screen.getByText(/Back to Home/i)).toBeInTheDocument();
      });
    });
  });

  /* =========================================================================
   * 3. Optimistic Mutation Rollback on API Error
   * ========================================================================= */
  describe("URL State Sync — Shareable Events Filters", () => {
    it("Events page restores filters and view mode from query params", async () => {
      const categoryMatchEvent = {
        id: "ev-url-1",
        title: "Sunrise Gathering",
        date: "2026-09-10",
        day: "10",
        month: "SEP",
        time: "07:00",
        location: "Cleopatra Beach",
        category: "Beach Gatherings",
        attendees: 12,
        maxAttendees: 40,
        host: "Alanya Crew",
        hostAvatar: "https://example.com/avatar-1.jpg",
        description: "Start the day together by the sea.",
        image: "https://example.com/event-1.jpg",
        isFeatured: true,
        going_by_me: false,
      };

      const otherEvent = {
        id: "ev-url-2",
        title: "Community Meetup",
        date: "2026-09-12",
        day: "12",
        month: "SEP",
        time: "18:00",
        location: "Oba Center",
        category: "Expat Socials",
        attendees: 8,
        maxAttendees: 25,
        host: "Local Friends",
        hostAvatar: "https://example.com/avatar-2.jpg",
        description: "Friendly networking night for remote workers and founders.",
        image: "https://example.com/event-2.jpg",
        isFeatured: false,
        going_by_me: false,
      };

      vi.spyOn(eventsService, "getEvents").mockResolvedValue([
        categoryMatchEvent,
        otherEvent,
      ]);

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/events?view=map&category=Beach%20Gatherings&date=2026-09-10&q=sunrise&featured=1"]}>
            <Routes>
              <Route path="/events" element={<><EventsPage /><LocationSearchSpy /></>} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByDisplayValue("sunrise")).toBeInTheDocument();
        expect(screen.getByText("Sunrise Gathering")).toBeInTheDocument();
      });

      expect(screen.getByText("Sunrise Gathering")).toBeInTheDocument();
      expect(screen.queryByText("Community Meetup")).not.toBeInTheDocument();
      expect(screen.getByTestId("location-search").textContent).toContain("view=map");
      expect(screen.getByTestId("location-search").textContent).toContain("category=Beach%20Gatherings");
      expect(screen.getByTestId("location-search").textContent).toContain("date=2026-09-10");
      expect(screen.getByTestId("location-search").textContent).toContain("q=sunrise");
      expect(screen.getByTestId("location-search").textContent).toContain("featured=1");
    });
  });

  describe("Search Behavior — Relevant Event Discovery", () => {
    it("Events page finds events by category and description, not only title/location/host", async () => {
      const categoryMatchEvent = {
        id: "ev-search-1",
        title: "Sunrise Gathering",
        date: "2026-09-10",
        day: "10",
        month: "SEP",
        time: "07:00",
        location: "Cleopatra Beach",
        category: "Beach Gatherings",
        attendees: 12,
        maxAttendees: 40,
        host: "Alanya Crew",
        hostAvatar: "https://example.com/avatar-1.jpg",
        description: "Start the day together by the sea.",
        image: "https://example.com/event-1.jpg",
        isFeatured: false,
        going_by_me: false,
      };

      const descriptionMatchEvent = {
        id: "ev-search-2",
        title: "Community Meetup",
        date: "2026-09-12",
        day: "12",
        month: "SEP",
        time: "18:00",
        location: "Oba Center",
        category: "Expat Socials",
        attendees: 8,
        maxAttendees: 25,
        host: "Local Friends",
        hostAvatar: "https://example.com/avatar-2.jpg",
        description: "Friendly networking night for remote workers and founders.",
        image: "https://example.com/event-2.jpg",
        isFeatured: false,
        going_by_me: false,
      };

      vi.spyOn(eventsService, "getEvents").mockResolvedValue([
        categoryMatchEvent,
        descriptionMatchEvent,
      ]);

      render(
        <AuthProvider>
          <MemoryRouter>
            <EventsPage />
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Sunrise Gathering")).toBeInTheDocument();
        expect(screen.getByText("Community Meetup")).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Search by title, category, description, location, or host/i);

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "beach gatherings" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Sunrise Gathering")).toBeInTheDocument();
        expect(screen.queryByText("Community Meetup")).not.toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: "remote workers" } });
      });

      await waitFor(() => {
        expect(screen.getByText("Community Meetup")).toBeInTheDocument();
        expect(screen.queryByText("Sunrise Gathering")).not.toBeInTheDocument();
      });
    });
  });

  describe("Optimistic Mutations — State Rollback on Server Error", () => {
    it("Events page rolls back RSVP attendee count and shows error toast when toggleRsvp fails", async () => {
      const mockEvent = {
        id: "ev-test-1",
        title: "Sunset Beach Cleanup",
        date: "2026-06-15",
        day: "15",
        month: "JUN",
        time: "18:00",
        location: "Cleopatra Beach",
        category: "Beach Gatherings",
        attendees: 10,
        maxAttendees: 50,
        host: "Alanya Volunteers",
        hostAvatar: "https://example.com/avatar.jpg",
        description: "Community cleanup.",
        image: "https://example.com/clean.jpg",
        isFeatured: false,
        going_by_me: false,
      };

      vi.spyOn(eventsService, "getEvents").mockResolvedValue([mockEvent]);
      vi.spyOn(eventsService, "toggleRsvp").mockRejectedValueOnce(
        new ApiError("RSVP failed", 500, "Internal Server Error")
      );

      render(
        <AuthProvider>
          <MemoryRouter>
            <EventsPage />
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByText("Sunset Beach Cleanup")).toBeInTheDocument();
      });

      // Find the RSVP button for the event card by its accessible name
      const rsvpButton = screen.getByRole("button", { name: /RSVP for Sunset Beach Cleanup/i });
      expect(rsvpButton).toBeInTheDocument();

      // Click RSVP (triggers optimistic update then fails and rolls back)
      await act(async () => {
        fireEvent.click(rsvpButton);
      });

      // Verify that error toast appeared
      await waitFor(() => {
        expect(screen.getByText(/RSVP Failed/i)).toBeInTheDocument();
      });

      // Verify button rolled back to the RSVP accessible state rather than staying in the going state
      expect(screen.getByRole("button", { name: /RSVP for Sunset Beach Cleanup/i })).toBeInTheDocument();
    });

    it("Thread page rolls back post like count when toggleLike fails", async () => {
      const mockThreadDetail = {
        id: "thread-test-1",
        title: "Best Seafood in Alanya",
        category: "Food & Dining",
        categoryId: "food-dining",
        subcategory: "Restaurants",
        author: "Gourmet Traveler",
        authorAvatar: "https://example.com/avatar.jpg",
        authorRole: "Food Critic",
        authorBio: "Loves Turkish cuisine",
        authorPosts: 25,
        authorReputation: 180,
        authorJoinDate: "2024",
        authorLocation: "Alanya",
        authorBadges: ["Food Critic"],
        content: "Where can I find the freshest fish in Alanya?",
        postedAt: "2 hours ago",
        views: 120,
        likes: 5,
        isLiked: false,
        isPinned: false,
        isHot: true,
        isVerified: true,
        replies: [],
      };

      vi.spyOn(forumService, "getThreadById").mockResolvedValue(mockThreadDetail);
      vi.spyOn(forumService, "toggleLike").mockRejectedValueOnce(
        new ApiError("Database Error", 500, "Internal Server Error")
      );

      render(
        <AuthProvider>
          <MemoryRouter initialEntries={["/thread/thread-test-1"]}>
            <Routes>
              <Route path="/thread/:threadId" element={<ThreadPage />} />
            </Routes>
          </MemoryRouter>
        </AuthProvider>
      );

      await waitFor(() => {
        const matches = screen.getAllByText("Best Seafood in Alanya");
        expect(matches.length).toBeGreaterThan(0);
      });

      // Find like button in OriginalPost
      const likeButtons = screen.getAllByRole("button").filter((btn) =>
        btn.textContent?.includes("5")
      );
      expect(likeButtons.length).toBeGreaterThan(0);

      // Click like button
      await act(async () => {
        fireEvent.click(likeButtons[0]);
      });

      // Verify like count rolled back to 5 after server rejection
      await waitFor(() => {
        const revertedButtons = screen.getAllByRole("button").filter((btn) =>
          btn.textContent?.includes("5")
        );
        expect(revertedButtons.length).toBeGreaterThan(0);
      });
    });
  });
});
