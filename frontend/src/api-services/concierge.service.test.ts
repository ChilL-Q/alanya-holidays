import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ConciergeService,
  conciergeService,
  getConciergeOfferings,
  getServiceById,
  getOfferingsByCategory,
  createEnquiry,
  submitConciergeEnquiry,
  createBooking,
  getYachts,
  getPrivateJets,
  getHelicopterTours,
  getPersonalChefs,
  getPersonalDrivers,
  getPersonalShoppers,
  getWineTastings,
  getHammamSpaExperiences,
  getGolfVacations,
  getPhotographyExcursions,
  getLuxuryExperiences,
  luxuryExperiences,
  type ConciergeServiceItem,
  type ConciergeEnquiryPayload,
  type CreateConciergeBookingPayload,
} from "./concierge.service";
import { apiClient } from "@/lib/api-client";
import { yachts as mockYachts } from "@/mocks/yachts";
import { privateJets as mockJets } from "@/mocks/private-jets";
import { helicopterTours as mockHelicopterTours } from "@/mocks/helicopter-tours";
import { personalChefs as mockChefs } from "@/mocks/personal-chefs";
import { personalDrivers as mockDrivers } from "@/mocks/personal-drivers";
import { personalShoppers as mockShoppers } from "@/mocks/personal-shoppers";
import { wineTastings as mockWineTastings } from "@/mocks/wine-tastings";
import { hammamSpaExperiences as mockHammamSpa } from "@/mocks/hammam-spa";
import { golfVacations as mockGolf } from "@/mocks/golf-vacations";
import { photographyExcursions as mockPhotography } from "@/mocks/photography-excursions";

describe("ConciergeService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("ConciergeService instance", () => {
    it("should instantiate a separate ConciergeService instance", () => {
      const customService = new ConciergeService();
      expect(customService).toBeInstanceOf(ConciergeService);
    });
  });

  describe("getConciergeOfferings", () => {
    it("should return offerings from API when successful", async () => {
      const mockItems: ConciergeServiceItem[] = [
        {
          id: "srv-yacht-1",
          title: "Azure 50ft Yacht",
          type: "yacht",
          price: 1500,
          currency: "EUR",
          rating: 4.9,
          reviewCount: 12,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockItems);

      const result = await conciergeService.getConciergeOfferings("yacht");
      expect(apiClient.get).toHaveBeenCalledWith("/services", {
        params: { type: "yacht" },
      });
      expect(result).toEqual(mockItems);
    });

    it("should handle { data: [...] } format from API", async () => {
      const mockResponse = {
        data: [
          {
            id: "srv-jet-1",
            title: "Gulfstream G650",
            type: "private-jet",
            price: 6000,
            currency: "EUR",
          },
        ],
        count: 1,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockResponse);

      const result = await getConciergeOfferings("private-jet");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("srv-jet-1");
    });

    it("should fall back to category mock items when API fails for yacht", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("yacht-charters");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockYachts[0].name);
      expect(result[0].type).toBe("yacht");
    });

    it("should fall back to category mock items when API fails for private-jet", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("private-jets");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockJets[0].name);
      expect(result[0].type).toBe("private-jet");
    });

    it("should fall back to category mock items for helicopter tours", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("helicopter-tours");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockHelicopterTours[0].name);
      expect(result[0].type).toBe("helicopter");
    });

    it("should fall back to category mock items for personal chefs", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("personal-chefs");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockChefs[0].name);
      expect(result[0].type).toBe("personal-chef");
    });

    it("should fall back to category mock items for personal drivers", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("personal-driver");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockDrivers[0].name);
      expect(result[0].type).toBe("personal-driver");
    });

    it("should fall back to category mock items for personal shoppers", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("personal-shopper");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockShoppers[0].name);
      expect(result[0].type).toBe("personal-shopper");
    });

    it("should fall back to category mock items for wine tastings", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("wine-tastings");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockWineTastings[0].name);
      expect(result[0].type).toBe("wine-tasting");
    });

    it("should fall back to category mock items for hammam spa", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("hammam-spa");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockHammamSpa[0].name);
      expect(result[0].type).toBe("hammam-spa");
    });

    it("should fall back to category mock items for golf vacations", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("golf-vacations");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockGolf[0].name);
      expect(result[0].type).toBe("golf");
    });

    it("should fall back to category mock items for photography", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings("photography-excursions");
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].title).toBe(mockPhotography[0].name);
      expect(result[0].type).toBe("photography");
    });

    it("should return all combined mock items when category is empty or undefined", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getConciergeOfferings();
      expect(result.length).toBeGreaterThan(20);
    });
  });

  describe("getServiceById", () => {
    it("should return service from API when found", async () => {
      const mockService: ConciergeServiceItem = {
        id: "yacht-001",
        title: "Alanya Princess",
        type: "yacht",
        price: 850,
      };

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockService);

      const result = await conciergeService.getServiceById("yacht-001");
      expect(apiClient.get).toHaveBeenCalledWith("/services/yacht-001");
      expect(result).toEqual(mockService);
    });

    it("should fall back to mock item if API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const targetYacht = mockYachts[0];
      const result = await getServiceById(targetYacht.id);
      expect(result).not.toBeNull();
      expect(result?.title).toBe(targetYacht.name);
      expect(result?.type).toBe("yacht");
    });

    it("should find mock item with categoryHint", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const targetJet = mockJets[0];
      const result = await getServiceById(targetJet.id, "private-jet");
      expect(result).not.toBeNull();
      expect(result?.title).toBe(targetJet.name);
      expect(result?.type).toBe("private-jet");
    });

    it("should return null if service ID is not found in API or mock data", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await getServiceById("non-existent-service-id-9999");
      expect(result).toBeNull();
    });
  });

  describe("getOfferingsByCategory", () => {
    it("should return typed category array from API if successful", async () => {
      const mockCustomJets = [{ id: "j-1", name: "Custom Jet" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockCustomJets);

      const result = await conciergeService.getOfferingsByCategory<typeof mockCustomJets[0]>("private-jets");
      expect(apiClient.get).toHaveBeenCalledWith("/services", {
        params: { type: "private-jets" },
      });
      expect(result).toEqual(mockCustomJets);
    });

    it("should fall back to specific mock category arrays when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API error"));

      const yachts = await getOfferingsByCategory("yachts");
      expect(yachts).toEqual(mockYachts);
    });

    it("should fall back to jet mock array for private jets", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API error"));

      const jets = await getOfferingsByCategory("private-jets");
      expect(jets).toEqual(mockJets);
    });
  });

  describe("createEnquiry and submitConciergeEnquiry", () => {
    it("should send POST to /enquiries and return successful result", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        success: true,
        id: "enq-12345",
        message: "Enquiry submitted successfully",
      });

      const payload: ConciergeEnquiryPayload = {
        name: "James Bond",
        email: "james@mi6.gov.uk",
        phone: "5551234567",
        country_code: "+44",
        preferred_contact: "whatsapp",
        experience_type: "Private Yacht",
        item_name: "Azure 50ft Yacht",
        guests: 4,
        dates: "2026-09-01",
        notes: "Champagne on arrival please",
      };

      const result = await createEnquiry(payload);
      expect(apiClient.post).toHaveBeenCalledWith(
        "/enquiries",
        expect.objectContaining({
          name: "James Bond",
          email: "james@mi6.gov.uk",
          phone: "+44 5551234567",
          enquiry_type: "Private Yacht",
          party_size: 4,
        })
      );
      expect(result.success).toBe(true);
      expect(result.id).toBe("enq-12345");
    });

    it("should fall back gracefully if API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network down"));

      const payload: ConciergeEnquiryPayload = {
        name: "Elena Rostova",
        email: "elena@example.com",
        experience_type: "Helicopter Tour",
      };

      const result = await submitConciergeEnquiry(payload);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });

    it("should post to form_endpoint fallback if provided and API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("API down"));
      const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(new Response("OK"));

      const payload: ConciergeEnquiryPayload = {
        name: "Test User",
        email: "test@example.com",
        form_endpoint: "https://formspree.io/f/example",
      };

      const result = await createEnquiry(payload);
      expect(fetchSpy).toHaveBeenCalledWith(
        "https://formspree.io/f/example",
        expect.objectContaining({
          method: "POST",
        })
      );
      expect(result.success).toBe(true);
    });
  });

  describe("createBooking", () => {
    it("should send POST to /bookings and return confirmation", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        id: "bk-999",
        data: "bk-999",
        success: true,
      });

      const payload: CreateConciergeBookingPayload = {
        item_id: "yacht-001",
        user_id: "usr-42",
        service_type: "yacht",
        total_price: 1500,
        currency: "EUR",
        guests: 6,
        date: "2026-09-10",
      };

      const result = await createBooking(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/bookings", payload);
      expect(result.success).toBe(true);
      expect(result.bookingId).toBe("bk-999");
      expect(result.id).toBe("bk-999");
    });

    it("should fall back gracefully on API error and generate a booking ID", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Booking service unavailable"));

      const payload: CreateConciergeBookingPayload = {
        item_id: "jet-001",
        total_price: 5000,
      };

      const result = await createBooking(payload);
      expect(result.success).toBe(true);
      expect(result.bookingId).toMatch(/^bk-/);
    });
  });

  describe("Category Convenience Getters", () => {
    it("getYachts should return mock yachts and filter by type if provided", async () => {
      const allYachts = await getYachts();
      expect(allYachts.length).toBe(mockYachts.length);

      const motorYachts = await getYachts("Motor Yacht");
      expect(motorYachts.every((y) => y.type.toLowerCase() === "motor yacht")).toBe(true);
    });

    it("getPrivateJets should return mock jets", async () => {
      const jets = await getPrivateJets();
      expect(jets).toEqual(mockJets);
    });

    it("getHelicopterTours should return mock helicopter tours", async () => {
      const tours = await getHelicopterTours();
      expect(tours).toEqual(mockHelicopterTours);
    });

    it("getPersonalChefs should return mock chefs", async () => {
      const chefs = await getPersonalChefs();
      expect(chefs).toEqual(mockChefs);
    });

    it("getPersonalDrivers should return mock drivers", async () => {
      const drivers = await getPersonalDrivers();
      expect(drivers).toEqual(mockDrivers);
    });

    it("getPersonalShoppers should return mock shoppers", async () => {
      const shoppers = await getPersonalShoppers();
      expect(shoppers).toEqual(mockShoppers);
    });

    it("getWineTastings should return mock wine tastings", async () => {
      const tastings = await getWineTastings();
      expect(tastings).toEqual(mockWineTastings);
    });

    it("getHammamSpaExperiences should return mock hammam spas", async () => {
      const spa = await getHammamSpaExperiences();
      expect(spa).toEqual(mockHammamSpa);
    });

    it("getGolfVacations should return mock golf vacations", async () => {
      const golf = await getGolfVacations();
      expect(golf).toEqual(mockGolf);
    });

    it("getPhotographyExcursions should return mock photography excursions", async () => {
      const photo = await getPhotographyExcursions();
      expect(photo).toEqual(mockPhotography);
    });

    it("getLuxuryExperiences should return luxury experiences list", () => {
      const list = getLuxuryExperiences();
      expect(list).toEqual(luxuryExperiences);
      expect(list.length).toBeGreaterThan(5);
    });
  });
});
