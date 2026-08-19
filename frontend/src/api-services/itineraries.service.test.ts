import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  itinerariesService,
  saveItinerary,
  getMyItineraries,
  getItineraryById,
  updateItinerary,
  deleteItinerary,
  getCommunityItineraries,
  type SavedItinerary,
  type CreateItineraryInput,
} from "./itineraries.service";
import { apiClient } from "@/lib/api-client";
import type { PlanItem } from "@/hooks/usePlanner";

describe("itineraries.service", () => {
  const sampleItems: PlanItem[] = [
    {
      id: "item-1",
      type: "custom",
      customName: "Cleopatra Beach Morning",
      customDescription: "Swimming and relaxing at Cleopatra Beach",
      dayLabel: "Day 1",
      timeSlot: "Morning (8AM - 12PM)",
      notes: "Bring sunscreen",
      completed: false,
      order: 1,
    },
  ];

  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  describe("saveItinerary", () => {
    it("should send POST request to /itineraries when API succeeds", async () => {
      const input: CreateItineraryInput = {
        title: "3 Days in Alanya",
        params: { days: 3, district: "Alanya", pace: "moderate" },
        itinerary: sampleItems,
      };

      const mockSaved: SavedItinerary = {
        id: "itin-123",
        user_id: "user-abc",
        title: "3 Days in Alanya",
        params: { days: 3, district: "Alanya", pace: "moderate" },
        itinerary: sampleItems,
        created_at: "2026-08-19T00:00:00.000Z",
      };

      vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockSaved);

      const result = await itinerariesService.saveItinerary(input);

      expect(apiClient.post).toHaveBeenCalledWith("/itineraries", input);
      expect(result.id).toBe("itin-123");
      expect(result.title).toBe("3 Days in Alanya");
      expect(result.itinerary).toEqual(sampleItems);
    });

    it("should fall back gracefully to local storage generation when API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network offline"));

      const input: CreateItineraryInput = {
        title: "Offline Trip",
        params: { days: 2 },
        itinerary: sampleItems,
      };

      const result = await saveItinerary(input);

      expect(result.title).toBe("Offline Trip");
      expect(result.id).toBeDefined();
      expect(result.itinerary).toEqual(sampleItems);
      expect(result.created_at).toBeDefined();
    });
  });

  describe("getMyItineraries", () => {
    it("should send GET request to /itineraries/me when API succeeds", async () => {
      const mockList: SavedItinerary[] = [
        {
          id: "itin-1",
          user_id: "user-abc",
          title: "My Alanya Vacation",
          params: { days: 4 },
          itinerary: sampleItems,
          created_at: "2026-08-19T00:00:00.000Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockList);

      const result = await itinerariesService.getMyItineraries();

      expect(apiClient.get).toHaveBeenCalledWith("/itineraries/me");
      expect(result).toEqual(mockList);
      expect(result).toHaveLength(1);
    });

    it("should fall back to localStorage plans when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Server error"));

      const localPlans = [
        {
          id: "plan-local-1",
          name: "Local Saved Plan",
          description: "A local plan description",
          createdAt: "2026-08-19T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
          items: sampleItems,
        },
      ];
      localStorage.setItem("alanya-planner-plans", JSON.stringify(localPlans));

      const result = await getMyItineraries();

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("plan-local-1");
      expect(result[0].title).toBe("Local Saved Plan");
      expect(result[0].itinerary).toEqual(sampleItems);
    });
  });

  describe("getItineraryById", () => {
    it("should fetch single itinerary by ID via /itineraries/:id", async () => {
      const mockItin: SavedItinerary = {
        id: "itin-99",
        title: "Historical Alanya Tour",
        params: { district: "Castle" },
        itinerary: sampleItems,
        created_at: "2026-08-19T00:00:00.000Z",
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockItin);

      const result = await getItineraryById("itin-99");

      expect(apiClient.get).toHaveBeenCalledWith("/itineraries/itin-99");
      expect(result).toEqual(mockItin);
      expect(result?.title).toBe("Historical Alanya Tour");
    });

    it("should fall back to local plans by ID if API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found on cloud"));

      const localPlans = [
        {
          id: "plan-local-2",
          name: "Fallback Plan",
          description: "Fallback description",
          createdAt: "2026-08-19T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
          items: sampleItems,
        },
      ];
      localStorage.setItem("alanya-planner-plans", JSON.stringify(localPlans));

      const result = await getItineraryById("plan-local-2");

      expect(result).not.toBeNull();
      expect(result?.id).toBe("plan-local-2");
      expect(result?.title).toBe("Fallback Plan");
    });

    it("should return null if itinerary not found on API or fallback", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("404"));

      const result = await getItineraryById("non-existent-id");
      expect(result).toBeNull();
    });
  });

  describe("updateItinerary", () => {
    it("should send PUT request to /itineraries/:id when API succeeds", async () => {
      const updatedMock: SavedItinerary = {
        id: "itin-1",
        title: "Updated Title",
        params: { days: 5 },
        itinerary: sampleItems,
        created_at: "2026-08-19T00:00:00.000Z",
        updated_at: "2026-08-19T01:00:00.000Z",
      };

      vi.spyOn(apiClient, "put").mockResolvedValueOnce(updatedMock);

      const result = await updateItinerary("itin-1", {
        title: "Updated Title",
        params: { days: 5 },
      });

      expect(apiClient.put).toHaveBeenCalledWith("/itineraries/itin-1", {
        title: "Updated Title",
        params: { days: 5 },
      });
      expect(result?.title).toBe("Updated Title");
    });

    it("should fall back to updating localStorage when API fails", async () => {
      vi.spyOn(apiClient, "put").mockRejectedValueOnce(new Error("Offline"));

      const localPlans = [
        {
          id: "plan-local-3",
          name: "Original Name",
          description: "Original Desc",
          createdAt: "2026-08-19T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
          items: sampleItems,
        },
      ];
      localStorage.setItem("alanya-planner-plans", JSON.stringify(localPlans));

      const result = await updateItinerary("plan-local-3", {
        title: "New Local Name",
      });

      expect(result?.title).toBe("New Local Name");
      const stored = JSON.parse(localStorage.getItem("alanya-planner-plans") || "[]");
      expect(stored[0].name).toBe("New Local Name");
    });
  });

  describe("deleteItinerary", () => {
    it("should send DELETE request to /itineraries/:id when API succeeds", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const result = await deleteItinerary("itin-to-del");

      expect(apiClient.delete).toHaveBeenCalledWith("/itineraries/itin-to-del");
      expect(result).toBe(true);
    });

    it("should fall back to removing from localStorage when API fails", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(new Error("Offline"));

      const localPlans = [
        {
          id: "plan-del-1",
          name: "To Delete",
          description: "",
          createdAt: "2026-08-19T00:00:00.000Z",
          updatedAt: "2026-08-19T00:00:00.000Z",
          items: [],
        },
      ];
      localStorage.setItem("alanya-planner-plans", JSON.stringify(localPlans));

      const result = await deleteItinerary("plan-del-1");

      expect(result).toBe(true);
      const stored = JSON.parse(localStorage.getItem("alanya-planner-plans") || "[]");
      expect(stored).toHaveLength(0);
    });
  });

  describe("getCommunityItineraries", () => {
    it("should fetch community itineraries from /itineraries/community", async () => {
      const mockCommunity: SavedItinerary[] = [
        {
          id: "comm-1",
          title: "Sunset & Seafood",
          params: { category: "Food & Nightlife", authorName: "Marco" },
          itinerary: sampleItems,
          created_at: "2026-08-19T00:00:00.000Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockCommunity);

      const result = await getCommunityItineraries({ category: "Food & Nightlife", limit: 10 });

      expect(apiClient.get).toHaveBeenCalledWith("/itineraries/community", {
        params: { category: "Food & Nightlife", limit: 10 },
      });
      expect(result).toEqual(mockCommunity);
      expect(result[0].title).toBe("Sunset & Seafood");
    });

    it("should fall back to seeded community templates when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Offline"));

      const result = await getCommunityItineraries();

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBeDefined();
      expect(result[0].itinerary.length).toBeGreaterThan(0);
    });
  });
});
