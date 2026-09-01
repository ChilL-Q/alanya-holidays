import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ConciergeService,
  conciergeService,
  getConciergeOfferings,
  getServiceById,
  getOfferingsByCategory,
  createEnquiry,
  submitConciergeEnquiry,
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
} from "./concierge.service";
import { apiClient, ApiError } from "@/lib/api-client";

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

    it("should propagate ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new ApiError("Network Error", 500, "Internal Server Error"));

      await expect(getConciergeOfferings("yacht")).rejects.toThrow(ApiError);
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

    it("should return null if service ID returns 404 ApiError", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new ApiError("Not found", 404, "Not Found"));

      const result = await getServiceById("non-existent-service-id-9999");
      expect(result).toBeNull();
    });

    it("should propagate ApiError on 500 error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new ApiError("Server Error", 500, "Internal Server Error"));

      await expect(getServiceById("err-id")).rejects.toThrow(ApiError);
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

    it("should propagate ApiError when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new ApiError("API error", 500, "Internal Server Error"));

      await expect(getOfferingsByCategory("yachts")).rejects.toThrow(ApiError);
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

    it("should propagate ApiError when enquiry API fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new ApiError("Server error", 500, "Internal Server Error"));

      const payload: ConciergeEnquiryPayload = {
        name: "Elena Rostova",
        email: "elena@example.com",
        experience_type: "Helicopter Tour",
      };

      await expect(submitConciergeEnquiry(payload)).rejects.toThrow(ApiError);
    });
  });


  describe("Category Convenience Getters", () => {
    it.each([
      ["private jets", getPrivateJets],
      ["helicopter tours", getHelicopterTours],
      ["wine tastings", getWineTastings],
      ["hammam experiences", getHammamSpaExperiences],
      ["photography excursions", getPhotographyExcursions],
      ["golf vacations", getGolfVacations],
      ["personal chefs", getPersonalChefs],
      ["personal drivers", getPersonalDrivers],
      ["personal shoppers", getPersonalShoppers],
    ])("does not publish curated %s as live when the services backend is empty", async (_name, getter) => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

      const items = await getter();

      expect(items).toEqual([]);
    });

    it.each([
      ["private jets", getPrivateJets],
      ["helicopter tours", getHelicopterTours],
      ["wine tastings", getWineTastings],
      ["hammam experiences", getHammamSpaExperiences],
      ["photography excursions", getPhotographyExcursions],
      ["golf vacations", getGolfVacations],
      ["personal chefs", getPersonalChefs],
      ["personal drivers", getPersonalDrivers],
      ["personal shoppers", getPersonalShoppers],
    ])("surfaces an unavailable %s backend instead of publishing curated offers", async (_name, getter) => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(
        new ApiError("Service unavailable", 503, "Service Unavailable")
      );

      await expect(getter()).rejects.toThrow("Service unavailable");
    });

    it("does not publish curated yachts when the live backend is empty", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

      await expect(getYachts()).resolves.toEqual([]);
    });

    it("getYachts should call API for yachts and filter by type if provided", async () => {
      const mockYachtsList = [
        { id: "y-1", name: "Gulet 1", type: "Gulet" },
        { id: "y-2", name: "Motor 1", type: "Motor Yacht" },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockYachtsList);

      const allYachts = await getYachts();
      expect(allYachts).toHaveLength(2);

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockYachtsList);
      const motorYachts = await getYachts("Motor Yacht");
      expect(motorYachts).toHaveLength(1);
      expect(motorYachts[0].id).toBe("y-2");
    });

    it("getPrivateJets should call API for private jets", async () => {
      const mockJetsList = [{ id: "j-1", name: "Jet 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockJetsList);

      const jets = await getPrivateJets();
      expect(jets).toHaveLength(1);
    });

    it("getHelicopterTours should call API for helicopter tours", async () => {
      const mockToursList = [{ id: "h-1", name: "Heli 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockToursList);

      const tours = await getHelicopterTours();
      expect(tours).toHaveLength(1);
    });

    it("getPersonalChefs should call API for personal chefs", async () => {
      const mockChefsList = [{ id: "c-1", name: "Chef 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockChefsList);

      const chefs = await getPersonalChefs();
      expect(chefs).toHaveLength(1);
    });

    it("getPersonalDrivers should call API for drivers", async () => {
      const mockDriversList = [{ id: "d-1", name: "Driver 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockDriversList);

      const drivers = await getPersonalDrivers();
      expect(drivers).toHaveLength(1);
    });

    it("getPersonalShoppers should call API for shoppers", async () => {
      const mockShoppersList = [{ id: "s-1", name: "Shopper 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockShoppersList);

      const shoppers = await getPersonalShoppers();
      expect(shoppers).toHaveLength(1);
    });

    it("getWineTastings should call API for wine tastings", async () => {
      const mockTastingsList = [{ id: "w-1", name: "Wine 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockTastingsList);

      const tastings = await getWineTastings();
      expect(tastings).toHaveLength(1);
    });

    it("getHammamSpaExperiences should call API for hammam spas", async () => {
      const mockSpaList = [{ id: "spa-1", name: "Hammam 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockSpaList);

      const spa = await getHammamSpaExperiences();
      expect(spa).toHaveLength(1);
    });

    it("getGolfVacations should call API for golf vacations", async () => {
      const mockGolfList = [{ id: "g-1", name: "Golf 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockGolfList);

      const golf = await getGolfVacations();
      expect(golf).toHaveLength(1);
    });

    it("getPhotographyExcursions should call API for photography excursions", async () => {
      const mockPhotoList = [{ id: "p-1", name: "Photo 1" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockPhotoList);

      const photo = await getPhotographyExcursions();
      expect(photo).toHaveLength(1);
    });

    it("getLuxuryExperiences should return luxury experiences list", () => {
      const list = getLuxuryExperiences();
      expect(list).toEqual(luxuryExperiences);
      expect(list.length).toBeGreaterThan(5);
    });
  });
});
