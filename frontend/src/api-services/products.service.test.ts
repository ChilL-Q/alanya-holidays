import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { productsService, type CreateProductOrderPayload } from "./products.service";
import { apiClient } from "@/lib/api-client";

describe("products.service (Clean Architecture)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getFeaturedProducts", () => {
    it("should fetch featured products via apiClient.get", async () => {
      const mockProducts = [
        {
          id: 1,
          name: "Alanya Gift Card",
          description: "Exclusive gift card",
          price: 50,
          currency: "EUR",
          stock: 10,
          media: [{ url: "/img.jpg", type: "image" }],
          category_id: 7,
          product_categories: { name: "Gift Cards" },
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProducts);

      const result = await productsService.getFeaturedProducts();
      expect(result).toEqual(mockProducts);
      expect(getSpy).toHaveBeenCalledWith("/products/featured");
    });

    it("should return empty array gracefully when API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValue(new Error("Network connection lost"));

      const result = await productsService.getFeaturedProducts();
      expect(result).toEqual([]);
    });
  });

  describe("getShopCatalog", () => {
    it("should fetch catalog from /products/catalog via apiClient.get", async () => {
      const mockCatalog = {
        products: [
          {
            id: 101,
            name: "Alanya Silk Scarf",
            description: "Handcrafted pure silk",
            price: 45,
            currency: "EUR",
            stock: 20,
            media: [{ url: "/scarf.jpg", type: "image" }],
            category_id: 1,
            product_categories: { id: 1, name: "Textiles" },
            variant_count: 3,
          },
        ],
        categories: [
          { id: 1, name: "Textiles", sort_order: 1 },
          { id: 2, name: "Ceramics", sort_order: 2 },
        ],
      };

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockCatalog);

      const result = await productsService.getShopCatalog();
      expect(result).toEqual(mockCatalog);
      expect(getSpy).toHaveBeenCalledWith("/products/catalog");
    });

    it("should fallback gracefully to empty lists when catalog API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Service unavailable"));

      const result = await productsService.getShopCatalog();
      expect(result).toEqual({ products: [], categories: [] });
    });
  });

  describe("getProductCategories", () => {
    it("should fetch product categories via /products/categories", async () => {
      const mockCategories = [
        { id: 1, name: "Textiles", sort_order: 1 },
        { id: 2, name: "Food & Spices", sort_order: 2 },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockCategories);

      const result = await productsService.getProductCategories();
      expect(result).toEqual(mockCategories);
      expect(getSpy).toHaveBeenCalledWith("/products/categories");
    });

    it("should return empty array when categories API fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await productsService.getProductCategories();
      expect(result).toEqual([]);
    });
  });

  describe("getProductDetails", () => {
    it("should fetch product details, variants, and skus via /products/items/:id", async () => {
      const mockDetail = {
        product: {
          id: 101,
          name: "Handmade Ceramic Plate",
          description: "Traditional Seljuk pattern",
          price: 35,
          currency: "EUR",
          stock: 15,
          media: [{ url: "/plate.jpg", type: "image" }],
          category_id: 2,
          product_categories: { id: 2, name: "Ceramics" },
        },
        variants: [
          { id: 1, product_id: 101, name: "Diameter", options: ["20cm", "30cm"], sort_order: 1 },
        ],
        skus: [
          { id: 201, product_id: 101, label: "20cm", options: { size: "20cm" }, price: 35, stock: 10 },
          { id: 202, product_id: 101, label: "30cm", options: { size: "30cm" }, price: 50, stock: 5 },
        ],
      };

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockDetail);

      const result = await productsService.getProductDetails(101);
      expect(result).toEqual(mockDetail);
      expect(getSpy).toHaveBeenCalledWith("/products/items/101");
    });

    it("should return null product and empty lists on details API error", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      const result = await productsService.getProductDetails(999);
      expect(result).toEqual({ product: null, variants: [], skus: [] });
    });
  });

  describe("createProductOrder", () => {
    it("should post order to /products/orders and return confirmation", async () => {
      const payload: CreateProductOrderPayload = {
        currency: "EUR",
        subtotal: 70,
        customerNotes: "Deliver after 5 PM",
        recipient: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+905551234567",
          contact_method: "whatsapp",
        },
        items: [
          {
            productId: 101,
            productName: "Handmade Ceramic Plate",
            skuId: "201",
            skuLabel: "20cm",
            quantity: 2,
            unitPrice: 35,
            finalPrice: 35,
            subtotal: 70,
          },
        ],
      };

      const mockResponse = {
        success: true,
        orderId: 5001,
        message: "Order placed successfully",
      };

      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockResponse);

      const result = await productsService.createProductOrder(payload);
      expect(result).toEqual(mockResponse);
      expect(postSpy).toHaveBeenCalledWith("/products/orders", payload);
    });

    it("should rethrow error when order submission fails", async () => {
      const payload: CreateProductOrderPayload = {
        currency: "EUR",
        subtotal: 70,
        recipient: {
          name: "John Doe",
          email: "john@example.com",
          phone: "+905551234567",
          contact_method: "whatsapp",
        },
        items: [],
      };

      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Database write failed"));

      await expect(productsService.createProductOrder(payload)).rejects.toThrow("Database write failed");
    });
  });

  describe("getRecentEnquiries", () => {
    it("should fetch recent enquiries via /enquiries/recent with limit param", async () => {
      const mockEnquiries = [
        {
          id: 1,
          name: "Alice Smith",
          email: "alice@example.com",
          subject: "Private Yacht Tour",
          created_at: "2026-08-18T12:00:00Z",
        },
      ];

      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockEnquiries);

      const result = await productsService.getRecentEnquiries(5);
      expect(result).toEqual(mockEnquiries);
      expect(getSpy).toHaveBeenCalledWith("/enquiries/recent", {
        params: { limit: 5 },
      });
    });

    it("should return empty array on enquiries API failure", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API timeout"));

      const result = await productsService.getRecentEnquiries();
      expect(result).toEqual([]);
    });
  });
});
