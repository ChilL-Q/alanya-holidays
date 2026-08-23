import {
  propertiesService,
  type PropertyItem,
  type Villa,
} from "./properties.service";
import {
  conciergeService,
  luxuryExperiences,
  type ConciergeServiceItem,
  type ConciergeEnquiryPayload,
  type ConciergeEnquiryResult,
  type LuxuryExperienceItem,
  type Yacht,
  type PrivateJet,
  type HelicopterTour,
  type PersonalChef,
  type PersonalDriver,
  type PersonalShopper,
  type WineTasting,
  type HammamSpa,
  type GolfVacation,
  type PhotographyExcursion,
} from "./concierge.service";
import {
  ordersService,
  type CreateOrderPayload,
  type CreateOrderResult,
} from "./orders.service";
import { apiClient, ApiError } from "@/lib/api-client";

export type {
  Villa,
  Yacht,
  HelicopterTour,
  WineTasting,
  HammamSpa,
  PhotographyExcursion,
  GolfVacation,
  PrivateJet,
  PersonalChef,
  PersonalDriver,
  PersonalShopper,
  PropertyItem,
  ConciergeEnquiryPayload,
  ConciergeEnquiryResult,
  CreateOrderPayload,
  CreateOrderResult,
  LuxuryExperienceItem,
};

export type ServiceItem = ConciergeServiceItem;

export interface CheckAvailabilityResult {
  has_conflict: boolean;
  message?: string;
  [key: string]: unknown;
}

export interface CreateBookingPayload {
  item_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  message?: string;
  payment_method?: string;
  item_type?: "property" | "service" | string;
  total_price?: number;
  [key: string]: unknown;
}

export interface CreateBookingResult {
  id?: string;
  data?: string;
  bookingId?: string;
  success: boolean;
  message?: string;
  [key: string]: unknown;
}

export { luxuryExperiences };

export class ServicesService {
  /**
   * Retrieves services filtered by category slug with optional parameters.
   * Delegated to conciergeService.
   */
  async getServices(
    categorySlug?: string,
    params?: Record<string, unknown>
  ): Promise<ServiceItem[]> {
    return conciergeService.getConciergeOfferings(categorySlug, params);
  }

  /**
   * Retrieves properties (villas/accommodations) with optional filters.
   * Delegated to propertiesService.
   */
  async getProperties(filters?: Record<string, unknown> | string): Promise<PropertyItem[]> {
    const params = filters
      ? typeof filters === "string"
        ? { filters }
        : { filters: JSON.stringify(filters) }
      : undefined;
    const res = await propertiesService.getProperties(params);
    return res.data;
  }

  /**
   * Retrieves a property by its ID.
   * Delegated to propertiesService.
   */
  async getPropertyById(id: string): Promise<PropertyItem | null> {
    return propertiesService.getProperty(id);
  }

  /**
   * Retrieves a service by its ID.
   * Delegated to conciergeService.
   */
  async getServiceById(id: string): Promise<ServiceItem | null> {
    return conciergeService.getServiceById(id);
  }

  /**
   * Checks availability and conflicts for a booking item.
   * Calls `/api/bookings/check-conflict` (or `/api/bookings/conflict`).
   */
  async checkAvailability(
    itemId: string,
    itemType: string = "property",
    checkIn: string,
    checkOut: string
  ): Promise<CheckAvailabilityResult> {
    try {
      return await apiClient.get<CheckAvailabilityResult>("/bookings/check-conflict", {
        params: { itemId, itemType, checkIn, checkOut },
      });
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        return await apiClient.get<CheckAvailabilityResult>("/bookings/conflict", {
          params: { itemId, itemType, checkIn, checkOut },
        });
      }
      throw err;
    }
  }

  /**
   * Creates a direct booking on the live backend.
   */
  async createBooking(payload: CreateBookingPayload): Promise<CreateBookingResult> {
    const requestBody = {
      item_id: payload.item_id,
      check_in: payload.check_in,
      check_out: payload.check_out,
      guests: payload.guests,
      message: payload.message,
      payment_method: payload.payment_method,
      item_type: payload.item_type || "service",
    };

    const res = await apiClient.post<{ id?: string; data?: string; booking_id?: string; bookingId?: string }>(
      "/bookings",
      requestBody
    );

    const bookingId = res.booking_id || res.bookingId || res.id || res.data;
    return {
      id: bookingId,
      bookingId,
      data: res.data || bookingId,
      success: true,
      message: "Booking created successfully",
    };
  }

  /**
   * Submits a concierge inquiry / custom booking request.
   * Delegated to conciergeService.
   */
  async submitConciergeEnquiry(
    payload: ConciergeEnquiryPayload
  ): Promise<ConciergeEnquiryResult> {
    return conciergeService.submitConciergeEnquiry(payload);
  }

  /**
   * Creates a checkout gift order.
   * Delegated to ordersService.
   */
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResult> {
    return ordersService.createOrder(payload);
  }

  // ============================================
  // Category-specific convenience getters
  // ============================================

  async getVillas(location?: string): Promise<Villa[]> {
    const res = await propertiesService.getProperties({
      type: "villa",
      location: location && location !== "all" ? location : undefined,
    });
    return res.data as unknown as Villa[];
  }

  async getYachts(type?: string): Promise<Yacht[]> {
    return conciergeService.getYachts(type);
  }

  async getHelicopterTours(): Promise<HelicopterTour[]> {
    return conciergeService.getHelicopterTours();
  }

  async getWineTastings(): Promise<WineTasting[]> {
    return conciergeService.getWineTastings();
  }

  async getHammamSpaExperiences(): Promise<HammamSpa[]> {
    return conciergeService.getHammamSpaExperiences();
  }

  async getPhotographyExcursions(): Promise<PhotographyExcursion[]> {
    return conciergeService.getPhotographyExcursions();
  }

  async getGolfVacations(): Promise<GolfVacation[]> {
    return conciergeService.getGolfVacations();
  }

  async getPrivateJets(): Promise<PrivateJet[]> {
    return conciergeService.getPrivateJets();
  }

  async getPersonalChefs(): Promise<PersonalChef[]> {
    return conciergeService.getPersonalChefs();
  }

  async getPersonalDrivers(): Promise<PersonalDriver[]> {
    return conciergeService.getPersonalDrivers();
  }

  async getPersonalShoppers(): Promise<PersonalShopper[]> {
    return conciergeService.getPersonalShoppers();
  }

  getLuxuryExperiences(): LuxuryExperienceItem[] {
    return conciergeService.getLuxuryExperiences();
  }
}

export const servicesService = new ServicesService();

export const getServices = (categorySlug?: string, params?: Record<string, unknown>) =>
  servicesService.getServices(categorySlug, params);
export const getProperties = (filters?: Record<string, unknown> | string) =>
  servicesService.getProperties(filters);
export const getPropertyById = (id: string) =>
  servicesService.getPropertyById(id);
export const getServiceById = (id: string) =>
  servicesService.getServiceById(id);
export const checkAvailability = (
  itemId: string,
  itemType: string,
  checkIn: string,
  checkOut: string
) => servicesService.checkAvailability(itemId, itemType, checkIn, checkOut);
export const createBooking = (payload: CreateBookingPayload) =>
  servicesService.createBooking(payload);
export const submitConciergeEnquiry = (payload: ConciergeEnquiryPayload) =>
  servicesService.submitConciergeEnquiry(payload);
export const createOrder = (payload: CreateOrderPayload) =>
  servicesService.createOrder(payload);
