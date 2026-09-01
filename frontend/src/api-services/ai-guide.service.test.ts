import { describe, it, expect, vi, beforeEach } from "vitest";
import { aiGuideService, type GenerateItineraryParams } from "./ai-guide.service";
import { apiClient } from "@/lib/api-client";

vi.mock("@/lib/api-client", () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("AiGuideService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("askGuide", () => {
    it("should call /ai/guide endpoint and return successful response", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        answer: "Cleopatra beach is the best sandy beach in central Alanya.",
        cached: false,
      });

      const response = await aiGuideService.askGuide({
        userQuestion: "Where is the best beach?",
        location: "Kleopatra",
      });

      expect(apiClient.post).toHaveBeenCalledWith("/ai/guide", {
        userQuestion: "Where is the best beach?",
        location: "Kleopatra",
      });
      expect(response.answer).toBe("Cleopatra beach is the best sandy beach in central Alanya.");
      expect(response.cached).toBe(false);
    });

    it("should return curated fallback response if API fails", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Network Error"));

      const response = await aiGuideService.askGuide({
        userQuestion: "Tell me about Cleopatra beach",
      });

      expect(response.cached).toBe(false);
      expect(response.answer).toContain("Cleopatra");
    });
  });

  describe("generateItinerary", () => {
    it("should call /ai/itinerary endpoint and return structured normalized result", async () => {
      vi.mocked(apiClient.post).mockResolvedValueOnce({
        title: "2-Day Dream Vacation",
        description: "Highlights of Alanya",
        district: "Alanya",
        days: [
          {
            dayLabel: "Day 1",
            theme: "Castle & Beaches",
            items: [
              {
                name: "Alanya Castle",
                description: "Visit the citadel",
                timeSlot: "Morning (8AM - 12PM)",
              },
            ],
          },
          {
            dayLabel: "Day 2",
            theme: "Dim River",
            items: [
              {
                name: "Dim Cave",
                description: "Stalactites",
                timeSlot: "Morning (8AM - 12PM)",
              },
            ],
          },
        ],
      });

      const params: GenerateItineraryParams = {
        days: 2,
        district: "Alanya",
        interests: ["castle", "river"],
      };

      const result = await aiGuideService.generateItinerary(params);

      expect(apiClient.post).toHaveBeenCalledWith("/ai/itinerary", {
        days: 2,
        district: "Alanya",
        interests: ["castle", "river"],
        pace: undefined,
      });
      expect(result.title).toBe("2-Day Dream Vacation");
      expect(result.days).toHaveLength(2);
      expect(result.days[0].items[0].name).toBe("Alanya Castle");
    });

    it("should fallback to curated multi-day template if backend call fails", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Service Unavailable"));

      const params: GenerateItineraryParams = {
        days: 3,
        district: "Kleopatra",
      };

      const result = await aiGuideService.generateItinerary(params);

      expect(result.title).toContain("3-Day Curated Kleopatra Itinerary");
      expect(result.days).toHaveLength(3);
      expect(result.days[0].items.length).toBeGreaterThan(0);
    });

    it("should clamp days between 1 and 14", async () => {
      vi.mocked(apiClient.post).mockRejectedValueOnce(new Error("Offline"));

      const result = await aiGuideService.generateItinerary({
        days: 25,
      });

      expect(result.days).toHaveLength(14);
    });
  });
});
