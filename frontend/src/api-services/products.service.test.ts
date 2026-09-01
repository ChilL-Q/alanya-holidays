import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  productsService,
  type CreateProductOrderPayload,
  type SellerProductDraft,
} from "./products.service";
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

    it("should surface catalog API failures so the shop can show an error state", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Service unavailable"));

      await expect(productsService.getShopCatalog()).rejects.toThrow("Service unavailable");
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

    it("should surface details API failures instead of reporting a missing product", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Not found"));

      await expect(productsService.getProductDetails(999)).rejects.toThrow("Not found");
    });

    it.each(["draft", "inactive"])(
      "does not expose a %s product through the public detail mapper",
      async (status) => {
        vi.spyOn(apiClient, "get").mockResolvedValueOnce({
          product: {
            id: 101,
            name: "Unpublished product",
            description: "Not public",
            price: 35,
            currency: "EUR",
            stock: 15,
            status,
          },
          variants: [],
          skus: [],
        });

        await expect(productsService.getProductDetails(101)).resolves.toEqual({
          product: null,
          variants: [],
          skus: [],
        });
      }
    );
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
          display_name: "Community member",
          category: "Travel Experiences",
          submitted_at: "2026-08-18T12:00:00Z",
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

  describe("seller products (My Products tab)", () => {
    it("getMyProducts should call GET /products/mine and return array", async () => {
      const mockProducts = [
        { id: 1, name: "Ceramic Bowl", price: 24.9, currency: "EUR", stock: 8, status: "active" },
      ];
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockProducts);

      const result = await productsService.getMyProducts();

      expect(getSpy).toHaveBeenCalledWith("/products/mine", undefined);
      expect(result).toEqual(mockProducts);
    });

    it("getMyProducts should unwrap { data: [...] } structure", async () => {
      const mockProducts = [{ id: 2, name: "Olive Soap", price: 6, currency: "EUR", stock: 40, status: "draft" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: mockProducts });

      const result = await productsService.getMyProducts();

      expect(result).toEqual(mockProducts);
    });

    it("getMyProducts should preserve explicit authorization errors", async () => {
      const error = new Error("Forbidden 403");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(error);

      await expect(productsService.getMyProducts()).rejects.toBe(error);
    });

    it("createMyProduct should POST /products/mine with the draft payload", async () => {
      const draft: SellerProductDraft = {
        name: "Handwoven Rug",
        description: "Natural wool",
        price: 149,
        stock: 3,
      };
      const mockCreated = { id: 10, ...draft, status: "active" };
      const postSpy = vi.spyOn(apiClient, "post").mockResolvedValueOnce(mockCreated);

      const result = await productsService.createMyProduct(draft);

      expect(postSpy).toHaveBeenCalledWith("/products/mine", draft);
      expect(result).toEqual(mockCreated);
    });

    it("updateMyProduct should PATCH /products/mine/:id with updates", async () => {
      const updates: SellerProductDraft = { price: 159, stock: 5 };
      const mockUpdated = { id: 10, name: "Handwoven Rug", price: 159, stock: 5 };
      const patchSpy = vi.spyOn(apiClient, "patch").mockResolvedValueOnce(mockUpdated);

      const result = await productsService.updateMyProduct(10, updates);

      expect(patchSpy).toHaveBeenCalledWith("/products/mine/10", updates);
      expect(result).toEqual(mockUpdated);
    });

    it("deleteMyProduct should DELETE only the merchant product endpoint", async () => {
      const deleteSpy = vi
        .spyOn(apiClient, "delete")
        .mockResolvedValueOnce({ success: true });

      await expect(productsService.deleteMyProduct(10)).resolves.toEqual({
        success: true,
      });
      expect(deleteSpy).toHaveBeenCalledWith("/products/mine/10");
    });
  });
});
