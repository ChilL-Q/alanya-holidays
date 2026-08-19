import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  ordersService,
  createOrder,
  getOrder,
  getMyOrders,
  type CreateOrderPayload,
  type OrderDetailsResponse,
} from "./orders.service";
import { apiClient } from "@/lib/api-client";

describe("orders.service (Clean Architecture)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createOrder", () => {
    const payload: CreateOrderPayload = {
      recipientName: "Fatma Demir",
      recipientEmail: "fatma@example.com",
      senderName: "Ahmet Yilmaz",
      senderEmail: "ahmet@example.com",
      giftMessage: "Enjoy your luxury experience!",
      subtotal: 250,
      currency: "EUR",
      items: [
        {
          productName: "Traditional Hammam Spa Voucher",
          quantity: 2,
          price: "€125",
        },
      ],
    };

    it("should send POST /products/orders and return order ID from response", async () => {
      const mockApiResponse = {
        success: true,
        orderId: 78901,
        message: "Order placed successfully",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockApiResponse);

      const result = await ordersService.createOrder(payload);

      expect(postSpy).toHaveBeenCalledWith("/products/orders", payload);
      expect(result).toEqual({
        success: true,
        orderId: 78901,
        message: "Order placed successfully",
      });
    });

    it("should handle alternative id/order_id response fields", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        id: "ord-abc-123",
      });

      const result = await createOrder(payload);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe("ord-abc-123");
    });

    it("should handle order_id property in response", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({
        order_id: 45678,
      });

      const result = await createOrder(payload);

      expect(result.success).toBe(true);
      expect(result.orderId).toBe(45678);
    });

    it("should generate a fallback orderId when API request fails", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network offline"));

      const result = await ordersService.createOrder(payload);

      expect(result.success).toBe(true);
      expect(typeof result.orderId === "number" || typeof result.orderId === "string").toBe(true);
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("getOrder", () => {
    it("should fetch single order details by id via GET /products/orders/:id", async () => {
      const mockOrder: OrderDetailsResponse = {
        id: 1001,
        status: "confirmed",
        currency: "EUR",
        subtotal: 350,
        total_price: 350,
        recipient_name: "Fatma Demir",
        recipient_email: "fatma@example.com",
        sender_name: "Ahmet Yilmaz",
        sender_email: "ahmet@example.com",
        items: [
          {
            productName: "Yacht Charter Voucher",
            quantity: 1,
            price: 350,
          },
        ],
        created_at: "2026-08-19T00:00:00.000Z",
      };

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockOrder);

      const result = await ordersService.getOrder(1001);

      expect(getSpy).toHaveBeenCalledWith("/products/orders/1001");
      expect(result).toEqual(mockOrder);
    });

    it("should return null and warn when order lookup fails", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Order not found (404)"));

      const result = await getOrder("missing-id-999");

      expect(result).toBeNull();
      expect(warnSpy).toHaveBeenCalled();
    });
  });

  describe("getMyOrders", () => {
    it("should fetch order history via GET /products/orders/my-orders array", async () => {
      const mockOrders: OrderDetailsResponse[] = [
        {
          id: 1,
          status: "completed",
          total_price: 150,
          currency: "EUR",
          recipient_name: "Ayse",
        },
        {
          id: 2,
          status: "pending",
          total_price: 80,
          currency: "EUR",
          recipient_name: "Mehmet",
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockOrders);

      const result = await ordersService.getMyOrders();

      expect(getSpy).toHaveBeenCalledWith("/products/orders/my-orders");
      expect(result).toEqual(mockOrders);
    });

    it("should unwrap { data: [...] } structure if returned by API", async () => {
      const mockOrders: OrderDetailsResponse[] = [
        {
          id: 10,
          status: "confirmed",
          total_price: 200,
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: mockOrders,
      });

      const result = await getMyOrders();

      expect(result).toEqual(mockOrders);
    });

    it("should return empty array on API error", async () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Unauthorized 401"));

      const result = await ordersService.getMyOrders();

      expect(result).toEqual([]);
      expect(warnSpy).toHaveBeenCalled();
    });
  });
});
