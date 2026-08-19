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
});
