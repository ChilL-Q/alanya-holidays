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

    it("should preserve an explicit unsuccessful API result", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: false });

      await expect(adminService.updateEnquiryStatus(1, "responded")).resolves.toBe(false);
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
    it("should delegate to conciergeService.submitConciergeEnquiry with mapped fields", async () => {
      const { conciergeService } = await import("./concierge.service");
      const submitSpy = vi
        .spyOn(conciergeService, "submitConciergeEnquiry")
        .mockResolvedValueOnce({ success: true, id: 99, message: "Enquiry submitted successfully" });

      const result = await adminService.submitEnquiry({
        name: "Alice Smith",
        email: "alice@example.com",
        phone: "+90 555 123 4567",
        subject: "Yacht Inquiry",
        message: "Interested in sunset yacht trip",
        enquiry_type: "yacht",
        party_size: 4,
      });

      expect(submitSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Alice Smith",
          email: "alice@example.com",
          subject: "Yacht Inquiry",
          message: "Interested in sunset yacht trip",
          experience_type: "yacht",
          guests: 4,
        })
      );
      expect(result.success).toBe(true);
      expect(result.id).toBe(99);
    });

    it("should propagate failure instead of faking success", async () => {
      const { conciergeService } = await import("./concierge.service");
      vi.spyOn(conciergeService, "submitConciergeEnquiry").mockRejectedValueOnce(
        new Error("Network down")
      );

      await expect(
        adminService.submitEnquiry({
          name: "Bob Jones",
          email: "bob@example.com",
          message: "Need transfers",
        })
      ).rejects.toThrow("Network down");
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
    it("should call POST /directory/admin/:id/approve", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.approveListing("list-123");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-123/approve");
      expect(success).toBe(true);
    });

    it("should call POST /directory/admin/:id/reject with reason", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.rejectListing("list-123", "Incomplete info");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-123/reject", {
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

    it("does not convert an unsuccessful listing delete into success", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: false });

      await expect(adminService.deleteListing("list-123")).resolves.toBe(false);
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
      expect(apiClient.get).toHaveBeenCalledWith("/directory/admin/claims");
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("c1");
    });

    it("should call POST /directory/admin/claims/:id/approve", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.approveClaim("claim-99");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/claims/claim-99/approve");
      expect(success).toBe(true);
    });

    it("should call POST /directory/admin/claims/:id/reject with reason", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });
      const success = await adminService.rejectClaim("claim-99", "Invalid proof");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/claims/claim-99/reject", {
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

  describe("forum moderation methods", () => {
    it("should fetch forum reports with params", async () => {
      const mockReports = [
        {
          id: "rep-1",
          reporter_id: "u-1",
          target_type: "post",
          target_id: "post-1",
          reason: "spam",
          resolved: false,
          created_at: "2026-08-23T12:00:00Z",
        },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockReports);

      const res = await adminService.getForumReports({
        includeResolved: true,
        page: 1,
        limit: 20,
        target_type: "post",
      });

      expect(apiClient.get).toHaveBeenCalledWith("/forum/reports", {
        params: {
          includeResolved: true,
          page: 1,
          limit: 20,
          target_type: "post",
        },
      });
      expect(res).toEqual(mockReports);
    });

    it("should resolve a forum report via POST /forum/reports/:id/resolve", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

      const success = await adminService.resolveForumReport("rep-123");
      expect(apiClient.post).toHaveBeenCalledWith("/forum/reports/rep-123/resolve");
      expect(success).toBe(true);
    });

    it("should fetch forum stats via GET /forum/stats", async () => {
      const mockStats = {
        totalTopics: 120,
        totalReplies: 450,
        usersOnline: 15,
        latestMember: "Alice",
      };
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockStats);

      const stats = await adminService.getForumStats();
      expect(apiClient.get).toHaveBeenCalledWith("/forum/stats");
      expect(stats).toEqual(mockStats);
    });

    it("should pin / unpin a forum post via POST /forum/posts/:id/pin", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

      const success = await adminService.setForumPostPinned("post-1", true);
      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts/post-1/pin", { pinned: true });
      expect(success).toBe(true);
    });

    it("should soft remove or restore a post via POST /forum/posts/:id/remove", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

      const success = await adminService.setForumPostRemoved("post-1", true);
      expect(apiClient.post).toHaveBeenCalledWith("/forum/posts/post-1/remove", { removed: true });
      expect(success).toBe(true);
    });

    it("should hard delete a post via DELETE /forum/posts/:id", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const success = await adminService.deleteForumPost("post-1");
      expect(apiClient.delete).toHaveBeenCalledWith("/forum/posts/post-1");
      expect(success).toBe(true);
    });

    it("should soft remove or restore a comment via POST /forum/comments/:id/remove", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true });

      const success = await adminService.setForumCommentRemoved("com-1", true);
      expect(apiClient.post).toHaveBeenCalledWith("/forum/comments/com-1/remove", { removed: true });
      expect(success).toBe(true);
    });

    it("should hard delete a comment via DELETE /forum/comments/:id", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const success = await adminService.deleteForumComment("com-1");
      expect(apiClient.delete).toHaveBeenCalledWith("/forum/comments/com-1");
      expect(success).toBe(true);
    });

    it("should fetch removed comments via GET /forum/reports/removed-comments", async () => {
      const mockRemoved = [
        {
          id: "com-99",
          post_id: "post-1",
          user_id: "usr-2",
          body: "Spam text",
          is_removed: true,
          created_at: "2026-08-20T10:00:00Z",
        },
      ];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockRemoved);

      const res = await adminService.getRemovedForumComments(30);
      expect(apiClient.get).toHaveBeenCalledWith("/forum/reports/removed-comments", {
        params: { limit: 30 },
      });
      expect(res).toEqual(mockRemoved);
    });
  });

  describe("directory curation methods (Task 2.2)", () => {
    it("should call POST /directory/admin/:id/feature to feature listing", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, is_featured: true });
      const ok = await adminService.featureListing("list-1");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-1/feature");
      expect(ok).toBe(true);
    });

    it("should call POST /directory/admin/:id/unfeature to unfeature listing", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, is_featured: false });
      const ok = await adminService.unfeatureListing("list-1");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-1/unfeature");
      expect(ok).toBe(true);
    });

    it("should call POST /directory/admin/:id/verify to verify listing", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, is_verified: true });
      const ok = await adminService.verifyListing("list-1");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-1/verify");
      expect(ok).toBe(true);
    });

    it("should call POST /directory/admin/:id/unverify to unverify listing", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, is_verified: false });
      const ok = await adminService.unverifyListing("list-1");
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-1/unverify");
      expect(ok).toBe(true);
    });

    it("should call POST /directory/admin/:id/score to update listing base score", async () => {
      vi.spyOn(apiClient, "post").mockResolvedValueOnce({ success: true, base_score: 88 });
      const ok = await adminService.updateListingScore("list-1", 88);
      expect(apiClient.post).toHaveBeenCalledWith("/directory/admin/list-1/score", { score: 88 });
      expect(ok).toBe(true);
    });

    it("should handle error when curation API fails and return false", async () => {
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Server error"));
      const ok = await adminService.featureListing("list-err");
      expect(ok).toBe(false);
    });

    it("should perform batch feature of listings", async () => {
      vi.spyOn(apiClient, "post")
        .mockResolvedValueOnce({ success: true })
        .mockRejectedValueOnce(new Error("Fail"));

      const res = await adminService.batchFeatureListings(["l-1", "l-2"]);
      expect(res.successful).toEqual(["l-1"]);
      expect(res.failed).toEqual(["l-2"]);
    });

    it('should perform batch verify of listings', async () => {
      vi.spyOn(apiClient, 'post')
        .mockResolvedValueOnce({ success: true })
        .mockResolvedValueOnce({ success: true });

      const res = await adminService.batchVerifyListings(['l-1', 'l-2']);
      expect(res.successful).toEqual(['l-1', 'l-2']);
      expect(res.failed).toEqual([]);
    });
  });

  describe('getAuditLogs (Task 2.3)', () => {
    it('should fetch paginated audit logs from GET /admin/audit-logs with query params', async () => {
      const mockResult = {
        data: [
          {
            id: 'audit-1',
            entity_type: 'listing',
            entity_id: 'l-100',
            action: 'approve',
            admin_id: 'admin-1',
            reason: null,
            metadata: { score: 90 },
            created_at: '2026-08-24T12:00:00Z',
            admin: {
              id: 'admin-1',
              full_name: 'Admin User',
              email: 'admin@example.com',
            },
          },
        ],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };

      vi.spyOn(apiClient, 'get').mockResolvedValueOnce(mockResult);

      const params = {
        entity_type: 'listing',
        action: 'approve',
        search: 'l-100',
        page: 1,
        limit: 20,
      };
      const res = await adminService.getAuditLogs(params);

      expect(apiClient.get).toHaveBeenCalledWith('/admin/audit-logs', {
        params,
      });
      expect(res).toEqual(mockResult);
    });

    it('should return safe empty paginated fallback on error', async () => {
      vi.spyOn(apiClient, 'get').mockRejectedValueOnce(new Error('Network error'));

      const res = await adminService.getAuditLogs({ page: 2, limit: 10 });
      expect(res).toEqual({
        data: [],
        total: 0,
        page: 2,
        limit: 10,
        totalPages: 0,
      });
    });
  });

  describe("bookings administration", () => {
    it("getAdminBookings should call GET /bookings/admin with optional status filter", async () => {
      const mockBookings = [{ id: "b1", status: "pending", total_price: 100 }];
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce(mockBookings);

      const result = await adminService.getAdminBookings("pending");

      expect(getSpy).toHaveBeenCalledWith("/bookings/admin", { params: { status: "pending" } });
      expect(result).toEqual(mockBookings);
    });

    it("getAdminBookings should omit params when no filter and unwrap { data }", async () => {
      const getSpy = vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: [{ id: "b2" }] });

      const result = await adminService.getAdminBookings();

      expect(getSpy).toHaveBeenCalledWith("/bookings/admin", { params: undefined });
      expect(result).toEqual([{ id: "b2" }]);
    });

    it("updateBookingStatus should PATCH /bookings/admin/:id/status", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const ok = await adminService.updateBookingStatus("b1", "confirmed", "Looks good");

      expect(apiClient.patch).toHaveBeenCalledWith("/bookings/admin/b1/status", {
        status: "confirmed",
        reason: "Looks good",
      });
      expect(ok).toBe(true);
    });

    it("does not convert an unsuccessful booking response into success", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: false });

      await expect(adminService.updateBookingStatus("b1", "confirmed")).resolves.toBe(false);
    });

    it("updatePayoutStatus should PATCH /bookings/admin/:id/payout-status", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const ok = await adminService.updatePayoutStatus("b1", "paid");

      expect(apiClient.patch).toHaveBeenCalledWith("/bookings/admin/b1/payout-status", {
        payoutStatus: "paid",
      });
      expect(ok).toBe(true);
    });

    it("refundBooking should POST /bookings/admin/:id/refund and return false on error", async () => {
      const logSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      vi.spyOn(apiClient, "post").mockRejectedValueOnce(new Error("Stripe down"));

      const ok = await adminService.refundBooking("b1");

      expect(apiClient.post).toHaveBeenCalledWith("/bookings/admin/b1/refund");
      expect(ok).toBe(false);
      expect(logSpy).toHaveBeenCalled();
    });
  });

  describe("reviews moderation", () => {
    it("getModerationReviews('pending') should hit /reviews/admin/pending with pagination", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: [{ id: "r1" }], total: 7 });

      const result = await adminService.getModerationReviews("pending", 2, 20);

      expect(apiClient.get).toHaveBeenCalledWith("/reviews/admin/pending", {
        params: { page: 2, limit: 20 },
      });
      expect(result.data).toEqual([{ id: "r1" }]);
      expect(result.total).toBe(7);
    });

    it("getModerationReviews(approved) should hit /reviews/admin/status/approved", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({ data: [], total: 0 });

      await adminService.getModerationReviews("approved");

      expect(apiClient.get).toHaveBeenCalledWith("/reviews/admin/status/approved", {
        params: { page: 1, limit: 20 },
      });
    });

    it("approve/reject/delete should target /reviews/:id", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValue({ success: true });
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      expect(await adminService.approveReview("r9")).toBe(true);
      expect(await adminService.rejectReview("r9")).toBe(true);
      expect(await adminService.deleteReview("r9")).toBe(true);
      expect(apiClient.patch).toHaveBeenNthCalledWith(1, "/reviews/r9/approve");
      expect(apiClient.patch).toHaveBeenNthCalledWith(2, "/reviews/r9/reject");
      expect(apiClient.delete).toHaveBeenCalledWith("/reviews/r9");
    });

    it("does not convert an unsuccessful review response into success", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: false });

      await expect(adminService.approveReview("r9")).resolves.toBe(false);
    });
  });

  describe("users administration", () => {
    it("getUsers should call GET /users/admin and return data + pagination", async () => {
      const mockUsers = [{ id: "u1", email: "a@b.c", role: "user" }];
      vi.spyOn(apiClient, "get").mockResolvedValueOnce({
        data: mockUsers,
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

      const result = await adminService.getUsers({ role: "host", page: 1, limit: 20 });

      expect(apiClient.get).toHaveBeenCalledWith("/users/admin", {
        params: { role: "host", page: 1, limit: 20 },
      });
      expect(result.data).toEqual(mockUsers);
      expect(result.pagination.total).toBe(1);
    });

    it("propagates user directory load failures instead of reporting an empty directory", async () => {
      const failure = new Error("Admin users request denied");
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(failure);

      await expect(adminService.getUsers({ page: 1, limit: 20 })).rejects.toBe(failure);
    });

    it("updateUserProfile should PATCH /users/admin/:id/status", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const ok = await adminService.updateUserProfile("u1", { role: "host" });

      expect(apiClient.patch).toHaveBeenCalledWith("/users/admin/u1/status", { role: "host" });
      expect(ok).toBe(true);
    });

    it("does not convert an unsuccessful user update response into success", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: false });

      await expect(adminService.updateUserProfile("u1", { role: "host" })).resolves.toBe(false);
    });
  });
});
