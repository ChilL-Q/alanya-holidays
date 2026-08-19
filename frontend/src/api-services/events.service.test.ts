import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  eventsService,
  getEvents,
  getEventBySlug,
  createEvent,
  toggleRsvp,
  getAttendees,
  formatEventDateParts,
} from "./events.service";
import { apiClient } from "@/lib/api-client";
import { events as mockEvents } from "@/mocks/events";

describe("events.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatEventDateParts", () => {
    it("should format date parts correctly from ISO date", () => {
      const parts = formatEventDateParts("2026-06-15T18:30:00Z");
      expect(parts.date).toBe("2026-06-15");
      expect(parts.day).toBe("15");
      expect(parts.month).toBe("JUN");
      expect(parts.time).toBeDefined();
    });

    it("should handle YYYY-MM-DD format", () => {
      const parts = formatEventDateParts("2026-07-02");
      expect(parts.date).toBe("2026-07-02");
      expect(parts.day).toBe("02");
      expect(parts.month).toBe("JUL");
    });

    it("should fallback gracefully on invalid date string", () => {
      const parts = formatEventDateParts("invalid-date");
      expect(parts.date).toBe("invalid-date");
      expect(parts.day).toBe("01");
      expect(parts.month).toBe("JAN");
    });
  });

  describe("getEvents", () => {
    it("should return mapped events when API returns data", async () => {
      const mockBackendEvents = [
        {
          id: "ev-1",
          title: "Beach Yoga Sunrise",
          slug: "beach-yoga-sunrise",
          description: "Relaxing yoga session",
          location: "Cleopatra Beach",
          event_date: "2026-06-10T08:00:00Z",
          image_url: "https://example.com/yoga.jpg",
          is_published: true,
          attendees_count: 15,
          max_attendees: 30,
          going_by_me: true,
          host: {
            full_name: "Elena Kowalski",
            avatar_url: "https://example.com/elena.jpg",
          },
          category: {
            id: "cat-1",
            name: "Sports Activities",
            slug: "sports-activities",
          },
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendEvents);

      const result = await eventsService.getEvents({ upcomingOnly: true, limit: 10 });
      expect(apiClient.get).toHaveBeenCalledWith("/forum/events", {
        params: { upcomingOnly: true, limit: 10 },
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("ev-1");
      expect(result[0].title).toBe("Beach Yoga Sunrise");
      expect(result[0].category).toBe("Sports Activities");
      expect(result[0].attendees).toBe(15);
      expect(result[0].maxAttendees).toBe(30);
      expect(result[0].host).toBe("Elena Kowalski");
      expect(result[0].hostAvatar).toBe("https://example.com/elena.jpg");
      expect(result[0].going_by_me).toBe(true);
    });

    it("should fall back to mock events when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network error"));

      const result = await getEvents();
      expect(result).toHaveLength(mockEvents.length);
      expect(result[0].id).toBe(mockEvents[0].id);
    });

    it("should respect upcomingOnly and limit in mock fallback", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network error"));

      const result = await getEvents({ limit: 3 });
      expect(result).toHaveLength(3);
    });
  });

  describe("getEventBySlug", () => {
    it("should return mapped event when API returns data", async () => {
      const mockBackendEvent = {
        id: "ev-2",
        title: "Sunset Boat Tour",
        slug: "sunset-boat-tour",
        description: "Boat tour around Alanya Castle",
        location: "Alanya Harbor",
        event_date: "2026-06-15T18:30:00Z",
        image_url: "https://example.com/boat.jpg",
        is_published: true,
        attendees_count: 20,
        max_attendees: 25,
        going_by_me: false,
        host: {
          full_name: "Mark Stevenson",
          avatar_url: "https://example.com/mark.jpg",
        },
        category: {
          id: "cat-2",
          name: "Beach Gatherings",
          slug: "beach-gatherings",
        },
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBackendEvent);

      const result = await eventsService.getEventBySlug("sunset-boat-tour");
      expect(apiClient.get).toHaveBeenCalledWith("/forum/events/slug/sunset-boat-tour");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("ev-2");
      expect(result?.title).toBe("Sunset Boat Tour");
      expect(result?.host).toBe("Mark Stevenson");
    });

    it("should fall back to mock event by ID or slug when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getEventBySlug("e1");
      expect(result).not.toBeNull();
      expect(result?.id).toBe("e1");
      expect(result?.title).toBe(mockEvents[0].title);
    });
  });

  describe("createEvent", () => {
    it("should call POST /forum/events and return created event", async () => {
      const mockCreated = {
        id: "ev-new-1",
        title: "Sunset Kayak Meetup",
        slug: "sunset-kayak-meetup",
        description: "Kayaking along Cleopatra Beach at dusk.",
        location: "Cleopatra Beach",
        event_date: "2026-07-10T17:00:00Z",
        image_url: "https://example.com/kayak.jpg",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockCreated);

      const payload = {
        title: "Sunset Kayak Meetup",
        category: "Sports Activities",
        eventDate: "2026-07-10",
        eventTime: "17:00",
        location: "Cleopatra Beach",
        description: "Kayaking along Cleopatra Beach at dusk.",
        maxAttendees: 20,
        hostName: "Captain Jack",
      };

      const result = await createEvent(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/forum/events", expect.objectContaining({
        title: "Sunset Kayak Meetup",
        location: "Cleopatra Beach",
        description: "Kayaking along Cleopatra Beach at dusk.",
      }));
      expect(result).not.toBeNull();
      expect(result.title).toBe("Sunset Kayak Meetup");
    });

    it("should return fallback event when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("API offline"));

      const payload = {
        title: "Fallback Event",
        category: "Expat Socials",
        eventDate: "2026-08-01",
        eventTime: "19:00",
        location: "Alanya Center",
        description: "A fun gathering for expats.",
        maxAttendees: 15,
        hostName: "Sarah",
      };

      const result = await createEvent(payload);
      expect(result.title).toBe("Fallback Event");
      expect(result.id).toBeDefined();
      expect(result.day).toBe("01");
      expect(result.month).toBe("AUG");
    });
  });

  describe("toggleRsvp", () => {
    it("should call POST /forum/events/:id/rsvp with contactPhone", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ going: true });

      const result = await toggleRsvp("ev-1", "+905551234567");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/events/ev-1/rsvp", {
        contactPhone: "+905551234567",
      });
      expect(result.going).toBe(true);
    });

    it("should return fallback response when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Offline"));

      const result = await toggleRsvp("ev-1");
      expect(result.going).toBe(true);
    });
  });

  describe("getAttendees", () => {
    it("should call GET /forum/events/:id/attendees", async () => {
      const mockAttendees = [
        {
          id: "u-1",
          full_name: "Alice Smith",
          avatar_url: "https://example.com/alice.jpg",
          rsvp_at: "2026-06-01T10:00:00Z",
          contact_phone: "+905551112233",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAttendees);

      const result = await getAttendees("ev-1");
      expect(apiClient.get).toHaveBeenCalledWith("/forum/events/ev-1/attendees");
      expect(result).toHaveLength(1);
      expect(result[0].full_name).toBe("Alice Smith");
    });

    it("should return empty array or fallback when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Offline"));

      const result = await getAttendees("ev-1");
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
