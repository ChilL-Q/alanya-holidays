import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { adminService } from "./admin.service";
import { apiClient } from "@/lib/api-client";

describe("admin.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getEnquiries", () => {
    it("should fetch enquiries from API when available", async () => {
      const mockEnquiries = [
        {
          id: 1,
          name: "John Doe",
          email: "john@example.com",
          subject: "Villa Booking",
          message: "Looking for villa",
          status: "new",
          enquiry_type: "villa",
          created_at: "2026-08-18T10:00:00Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockEnquiries);

      const result = await adminService.getEnquiries();
      expect(apiClient.get).toHaveBeenCalledWith("/admin/enquiries");
      expect(result).toEqual(mockEnquiries);
    });

    it("should return empty array when API fails without querying Supabase directly", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("API offline"));

      const result = await adminService.getEnquiries();
      expect(result).toEqual([]);
    });
  });

  describe("updateEnquiryStatus", () => {
    it("should call API endpoint to update status", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const success = await adminService.updateEnquiryStatus(1, "responded");
      expect(success).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith("/admin/enquiries/1/status", {
        status: "responded",
      });
    });

    it("should return false when update status API fails", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValueOnce(new Error("Update failed"));

      const success = await adminService.updateEnquiryStatus(1, "responded");
      expect(success).toBe(false);
    });
  });

  describe("assignEnquiry", () => {
    it("should call API endpoint to assign enquiry", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const success = await adminService.assignEnquiry(42, "user-uuid-123");
      expect(success).toBe(true);
      expect(apiClient.patch).toHaveBeenCalledWith("/admin/enquiries/42/assign", {
        assigned_to: "user-uuid-123",
      });
    });

    it("should handle assigning to null and return false on failure", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValueOnce(new Error("Assign failed"));

      const success = await adminService.assignEnquiry(42, null);
      expect(success).toBe(false);
      expect(apiClient.patch).toHaveBeenCalledWith("/admin/enquiries/42/assign", {
        assigned_to: null,
      });
    });
  });

  describe("submitEnquiry", () => {
    it("should submit enquiry to /enquiries via apiClient", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, id: 99 });

      const payload = {
        name: "Alice Smith",
        email: "alice@example.com",
        phone: "+90 555 123 4567",
        subject: "Yacht Inquiry",
        message: "Interested in sunset yacht trip",
        enquiry_type: "yacht",
      };

      const result = await adminService.submitEnquiry(payload);
      expect(apiClient.post).toHaveBeenCalledWith("/enquiries", expect.objectContaining({
        name: "Alice Smith",
        email: "alice@example.com",
        subject: "Yacht Inquiry",
        message: "Interested in sunset yacht trip",
        enquiry_type: "yacht",
      }));
      expect(result.success).toBe(true);
      expect(result.id).toBe(99);
    });

    it("should provide fallback when apiClient.post fails", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Network down"));

      const payload = {
        name: "Bob Jones",
        email: "bob@example.com",
        message: "Need transfers",
      };

      const result = await adminService.submitEnquiry(payload);
      expect(result.success).toBe(true);
      expect(result.id).toBeDefined();
    });
  });

  describe("getModerationListings", () => {
    it("should call /directory/admin/listings with status, category, and query filters", async () => {
      const mockListings = [
        { id: "l1", name: "Beach Club", status: "pending", category_id: "activities" },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockListings);

      const result = await adminService.getModerationListings({
        status: "pending",
        category: "activities",
        query: "beach",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/directory/admin/listings", {
        params: { status: "pending", category: "activities", query: "beach" },
      });
      expect(result).toEqual(mockListings);
    });

    it("should return empty array on failure without throwing", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Forbidden"));
      const result = await adminService.getModerationListings();
      expect(result).toEqual([]);
    });
  });

  describe("approveListing & rejectListing & deleteListing", () => {
    it("should call POST /directory/:id/approve", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.approveListing("list-123");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/list-123/approve");
      expect(success).toBe(true);
    });

    it("should call POST /directory/:id/reject with reason", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.rejectListing("list-123", "Incomplete info");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/list-123/reject", {
        reason: "Incomplete info",
      });
      expect(success).toBe(true);
    });

    it("should call DELETE /directory/:id", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });
      const success = await adminService.deleteListing("list-123");
      expect(apiClient.delete).toHaveBeenCalledWith("/directory/list-123");
      expect(success).toBe(true);
    });
  });

  describe("getClaimsQueue & approveClaim & rejectClaim", () => {
    it("should fetch claims and filter by status if provided", async () => {
      const mockClaims = [
        { id: "c1", listing_id: "l1", status: "pending", business_name: "Cafe 1" },
        { id: "c2", listing_id: "l2", status: "approved", business_name: "Cafe 2" },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockClaims);

      const result = await adminService.getClaimsQueue("pending");
      expect(apiClient.get).toHaveBeenCalledWith("/directory/claims");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
    });

    it("should call POST /directory/claims/:id/approve", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.approveClaim("claim-99");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/claims/claim-99/approve");
      expect(success).toBe(true);
    });

    it("should call POST /directory/claims/:id/reject with reason", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.rejectClaim("claim-99", "Invalid proof");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/claims/claim-99/reject", {
        reason: "Invalid proof",
      });
      expect(success).toBe(true);
    });
  });

  describe("getPlatformAnalytics", () => {
    it("should fetch platform analytics with days param", async () => {
      const mockAnalytics = {
        kpiSummary: { totalViews: 500, claimConversionRate: 75.0 },
        viewsTrend: [],
        channelBreakdown: [],
        tierDistribution: { explorer: 10, voyager: 5, signature: 2, partner: 1 },
        statusDistribution: { approved: 18, pending: 2, rejected: 1, draft: 3 },
        topListings: [],
      };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockAnalytics);

      const result = await adminService.getPlatformAnalytics(90);
      expect(apiClient.get).toHaveBeenCalledWith("/admin/analytics", {
        params: { days: 90 },
      });
      expect(result.kpiSummary.totalViews).toBe(500);
      expect(result.kpiSummary.claimConversionRate).toBe(75.0);
    });

    it("should return fallback empty structure on failure", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network failure"));
      const result = await adminService.getPlatformAnalytics(30);
      expect(result.kpiSummary.totalViews).toBe(0);
      expect(result.channelBreakdown).toBeDefined();
    });
  });
});
