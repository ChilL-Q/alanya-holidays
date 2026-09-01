import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";
import { conciergeService } from "./concierge.service";
import { directoryService } from "./directory.service";

export interface ConciergeEnquiry {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  subject?: string | null;
  message: string;
  status: "new" | "responded" | "archived" | string;
  enquiry_type?: string;
  service_type?: string | null;
  dates?: string | null;
  duration?: string | null;
  party_size?: number | null;
  assigned_to?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface SubmitEnquiryPayload {
  name: string;
  email: string;
  subject?: string;
  message: string;
  phone?: string;
  country_code?: string;
  preferred_contact?: string;
  enquiry_type?: string;
  service_type?: string;
  dates?: string;
  duration?: string;
  party_size?: number;
}

export interface ModerationListing {
  id: string;
  name: string;
  slug?: string | null;
  short_description?: string;
  description?: string | null;
  category_id?: string;
  category?: string | null;
  tier?: "explorer" | "voyager" | "signature" | "partner" | string;
  status: "draft" | "pending" | "approved" | "rejected" | string;
  location?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  whatsapp?: string | null;
  google_map_url?: string | null;
  video_url?: string | null;
  gallery?: string[];
  owner_user_id?: string | null;
  rejection_reason?: string | null;
  is_verified?: boolean;
  is_featured?: boolean;
  base_score?: number;
  price_level?: number | string;
  claimed_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface DirectoryClaim {
  id: string;
  listing_id: string;
  user_id: string;
  email: string;
  phone: string;
  role: string;
  business_name: string;
  contact_phone: string;
  additional_notes?: string | null;
  whatsapp?: string | null;
  website?: string | null;
  address?: string | null;
  description?: string | null;
  status: "pending" | "approved" | "rejected" | string;
  verification_token?: string;
  rejection_reason?: string | null;
  directory_listing?: {
    id: string;
    name?: string;
    slug?: string;
    category_id?: string;
    gallery?: string[];
    tier?: string;
    status?: string;
    location?: string;
  } | null;
  created_at: string;
  updated_at?: string;
}

export interface PlatformKPIs {
  totalViews: number;
  totalClicks: number;
  totalWhatsAppClicks: number;
  totalWebsiteClicks: number;
  totalMapClicks: number;
  activeListingsCount: number;
  pendingListingsCount: number;
  pendingClaimsCount: number;
  totalClaimsCount: number;
  approvedClaimsCount: number;
  claimConversionRate: number;
}

export interface DailyTrendPoint {
  date: string;
  views: number;
  whatsappClicks: number;
  websiteClicks: number;
  mapClicks: number;
  totalClicks: number;
}

export interface ChannelBreakdownPoint {
  channel: "whatsapp" | "website" | "map";
  label: string;
  clicks: number;
  percentage: number;
}

export interface TopListingPerformance {
  id: string;
  name: string;
  category?: string;
  tier?: string;
  views: number;
  clicks: number;
}

export interface PlatformAnalyticsData {
  kpiSummary: PlatformKPIs;
  viewsTrend: DailyTrendPoint[];
  channelBreakdown: ChannelBreakdownPoint[];
  tierDistribution: {
    explorer: number;
    voyager: number;
    signature: number;
    partner: number;
  };
  statusDistribution: {
    approved: number;
    pending: number;
    rejected: number;
    draft: number;
  };
  topListings: TopListingPerformance[];
}

interface AdminFetchOptions {
  throwOnError?: boolean;
}

function mutationSucceeded(response: unknown): boolean {
  return !(
    response &&
    typeof response === "object" &&
    "success" in response &&
    (response as { success?: unknown }).success === false
  );
}

class AdminService {
  /**
   * Fetches all concierge enquiries for admin dashboard and analytics.
   */
  async getEnquiries(options?: AdminFetchOptions): Promise<ConciergeEnquiry[]> {
    try {
      const response = await apiClient.get<ConciergeEnquiry[] | { data: ConciergeEnquiry[] }>("/admin/enquiries");
      if (Array.isArray(response)) {
        return response;
      }
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown }).data)
      ) {
        return (response as { data: ConciergeEnquiry[] }).data;
      }
      return [];
    } catch (err) {
      logger.warn("Failed to fetch enquiries from API:", err);
      if (options?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Updates enquiry status (e.g. 'new', 'responded', 'archived').
   */
  async updateEnquiryStatus(id: number, status: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/admin/enquiries/${id}/status`, { status });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to update enquiry status:", err);
      return false;
    }
  }

  /**
   * Assigns enquiry to a team member.
   */
  async assignEnquiry(id: number, assignedTo: string | null): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/admin/enquiries/${id}/assign`, { assigned_to: assignedTo });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to assign enquiry:", err);
      return false;
    }
  }

  /**
   * Submits a new concierge enquiry via the canonical concierge service
   * (single POST /enquiries path for the whole app).
   */
  async submitEnquiry(
    payload: SubmitEnquiryPayload
  ): Promise<{ success: boolean; id?: number | string; message?: string }> {
    return conciergeService.submitConciergeEnquiry({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      country_code: payload.country_code,
      preferred_contact: payload.preferred_contact,
      subject: payload.subject || "Concierge Enquiry",
      message: payload.message,
      experience_type: payload.enquiry_type,
      item_name: payload.service_type,
      dates: payload.dates,
      duration: payload.duration,
      guests: payload.party_size,
    });
  }

  /**
   * Fetches directory listings for moderation with filter matrix.
   */
  async getModerationListings(params?: {
    status?: string;
    category?: string;
    query?: string;
    throwOnError?: boolean;
  }): Promise<ModerationListing[]> {
    try {
      const queryParams: Record<string, string> = {};
      if (params?.status && params.status !== "all") queryParams.status = params.status;
      else if (params?.status === "all") queryParams.status = "all";
      if (params?.category && params.category !== "all") queryParams.category = params.category;
      if (params?.query?.trim()) queryParams.query = params.query.trim();

      const response = await apiClient.get<ModerationListing[] | { data: ModerationListing[] }>(
        "/directory/admin/listings",
        { params: queryParams }
      );

      if (Array.isArray(response)) return response;
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown }).data)
      ) {
        return (response as { data: ModerationListing[] }).data;
      }
      return [];
    } catch (err) {
      logger.warn("Failed to fetch moderation listings:", err);
      if (params?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Approves a listing.
   */
  async approveListing(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/directory/admin/${id}/approve`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to approve listing:", err);
      return false;
    }
  }

  /**
   * Rejects a listing with a mandatory reason.
   */
  async rejectListing(id: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/directory/admin/${id}/reject`, { reason });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to reject listing:", err);
      return false;
    }
  }

  /**
   * Deletes a listing.
   */
  async deleteListing(id: string): Promise<boolean> {
    // Delegates to the canonical directory service (single DELETE /directory/:id path).
    try {
      const response = await directoryService.deleteListing(id);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to delete listing:", err);
      return false;
    }
  }

  /**
   * Fetches claims moderation queue.
   */
  async getClaimsQueue(status?: string, options?: AdminFetchOptions): Promise<DirectoryClaim[]> {
    try {
      const response = await apiClient.get<DirectoryClaim[] | { data: DirectoryClaim[] }>("/directory/admin/claims");
      let list: DirectoryClaim[] = [];
      if (Array.isArray(response)) {
        list = response;
      } else if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown }).data)
      ) {
        list = (response as { data: DirectoryClaim[] }).data;
      }

      if (status && status !== "all") {
        return list.filter((c) => c.status === status);
      }
      return list;
    } catch (err) {
      logger.warn("Failed to fetch claims queue:", err);
      if (options?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Approves an ownership claim (triggering RPC transfer).
   */
  async approveClaim(claimId: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/directory/admin/claims/${claimId}/approve`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to approve claim:", err);
      return false;
    }
  }

  /**
   * Rejects an ownership claim with a reason.
   */
  async rejectClaim(claimId: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/directory/admin/claims/${claimId}/reject`, { reason });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to reject claim:", err);
      return false;
    }
  }

  /**
   * Fetches platform-wide analytics.
   */
  async getPlatformAnalytics(days = 30, options?: AdminFetchOptions): Promise<PlatformAnalyticsData> {
    try {
      const response = await apiClient.get<PlatformAnalyticsData>("/admin/analytics", {
        params: { days },
      });
      if (response && response.kpiSummary) {
        return response;
      }
      throw new Error("Invalid analytics payload format");
    } catch (err) {
      logger.warn("Failed to fetch platform analytics, using fallback:", err);
      if (options?.throwOnError) throw err;
      return {
        kpiSummary: {
          totalViews: 0,
          totalClicks: 0,
          totalWhatsAppClicks: 0,
          totalWebsiteClicks: 0,
          totalMapClicks: 0,
          activeListingsCount: 0,
          pendingListingsCount: 0,
          pendingClaimsCount: 0,
          totalClaimsCount: 0,
          approvedClaimsCount: 0,
          claimConversionRate: 0,
        },
        viewsTrend: [],
        channelBreakdown: [
          { channel: "whatsapp", label: "WhatsApp", clicks: 0, percentage: 0 },
          { channel: "website", label: "Website", clicks: 0, percentage: 0 },
          { channel: "map", label: "Directions", clicks: 0, percentage: 0 },
        ],
        tierDistribution: { explorer: 0, voyager: 0, signature: 0, partner: 0 },
        statusDistribution: { approved: 0, pending: 0, rejected: 0, draft: 0 },
        topListings: [],
      };
    }
  }

  /**
   * Fetches creator UGC submissions for admin moderation.
   */
  async getContentSubmissions(params?: {
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
    throwOnError?: boolean;
  }): Promise<BlogSubmissionAdminItem[]> {
    const { throwOnError, ...restParams } = params ?? {};
    try {
      const queryParams: Record<string, string | number> = {};
      if (restParams.status && restParams.status !== "all") queryParams.status = restParams.status;
      if (restParams.search?.trim()) queryParams.search = restParams.search.trim();
      if (restParams.limit) queryParams.limit = restParams.limit;
      if (restParams.page) queryParams.page = restParams.page;

      const response = await apiClient.get<
        BlogSubmissionAdminItem[] | { data: BlogSubmissionAdminItem[] }
      >("/blog/submissions/admin", { params: queryParams });

      if (Array.isArray(response)) return response;
      if (
        response &&
        typeof response === "object" &&
        "data" in response &&
        Array.isArray((response as { data: unknown }).data)
      ) {
        return (response as { data: BlogSubmissionAdminItem[] }).data;
      }
      return [];
    } catch (err) {
      logger.warn("Failed to fetch content submissions, using fallback:", err);
      if (throwOnError) throw err;
      return [];
    }
  }

  /**
   * Approves a creator content submission.
   */
  async approveContentSubmission(id: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/blog/submissions/${id}/approve`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to approve content submission:", err);
      return false;
    }
  }

  /**
   * Rejects a creator content submission with mandatory reason.
   */
  async rejectContentSubmission(id: string, reason: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/blog/submissions/${id}/reject`, { reason });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error("Failed to reject content submission:", err);
      return false;
    }
  }

  /**
   * Batch approves directory listings concurrently.
   */
  async batchApproveListings(ids: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.approveListing(id)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch rejects directory listings with reason.
   */
  async batchRejectListings(
    ids: string[],
    reason: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.rejectListing(id, reason)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch approves ownership claims.
   */
  async batchApproveClaims(ids: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.approveClaim(id)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch rejects ownership claims.
   */
  async batchRejectClaims(
    ids: string[],
    reason: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.rejectClaim(id, reason)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch approves creator content submissions.
   */
  async batchApproveContentSubmissions(
    ids: string[]
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.approveContentSubmission(id)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch rejects creator content submissions.
   */
  async batchRejectContentSubmissions(
    ids: string[],
    reason: string
  ): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(
      ids.map((id) => this.rejectContentSubmission(id, reason))
    );
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  // ==========================================
  // Directory Curation Methods (Task 2.2)
  // ==========================================

  /**
   * Sets listing featured status to true.
   */
  async featureListing(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean; is_featured: boolean }>(`/directory/admin/${id}/feature`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to feature listing ${id}:`, err);
      return false;
    }
  }

  /**
   * Sets listing featured status to false.
   */
  async unfeatureListing(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean; is_featured: boolean }>(`/directory/admin/${id}/unfeature`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to unfeature listing ${id}:`, err);
      return false;
    }
  }

  /**
   * Sets listing verified status to true.
   */
  async verifyListing(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean; is_verified: boolean }>(`/directory/admin/${id}/verify`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to verify listing ${id}:`, err);
      return false;
    }
  }

  /**
   * Sets listing verified status to false.
   */
  async unverifyListing(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean; is_verified: boolean }>(`/directory/admin/${id}/unverify`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to unverify listing ${id}:`, err);
      return false;
    }
  }

  /**
   * Updates listing base curation score (0-100).
   */
  async updateListingScore(id: string, score: number): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean; base_score: number }>(`/directory/admin/${id}/score`, {
        score,
      });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to update score for listing ${id}:`, err);
      return false;
    }
  }

  /**
   * Convenience method: toggles feature state.
   */
  async toggleListingFeature(id: string, isFeatured: boolean): Promise<boolean> {
    return isFeatured ? this.featureListing(id) : this.unfeatureListing(id);
  }

  /**
   * Convenience method: toggles verify state.
   */
  async toggleListingVerify(id: string, isVerified: boolean): Promise<boolean> {
    return isVerified ? this.verifyListing(id) : this.unverifyListing(id);
  }

  /**
   * Batch features multiple listings concurrently.
   */
  async batchFeatureListings(ids: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.featureListing(id)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  /**
   * Batch verifies multiple listings concurrently.
   */
  async batchVerifyListings(ids: string[]): Promise<{ successful: string[]; failed: string[] }> {
    const results = await Promise.allSettled(ids.map((id) => this.verifyListing(id)));
    const successful: string[] = [];
    const failed: string[] = [];
    results.forEach((res, idx) => {
      if (res.status === "fulfilled" && res.value) {
        successful.push(ids[idx]);
      } else {
        failed.push(ids[idx]);
      }
    });
    return { successful, failed };
  }

  // ==========================================
  // Forum Moderation Hub Methods
  // ==========================================

  /**
   * Fetches forum violation reports with optional status and pagination filters.
   */
  async getForumReports(params?: {
    includeResolved?: boolean;
    page?: number;
    limit?: number;
    target_type?: "post" | "comment";
    throwOnError?: boolean;
  }): Promise<ForumReportAdminItem[]> {
    const { throwOnError, ...queryParams } = params ?? {};
    try {
      const res = await apiClient.get<ForumReportAdminItem[]>("/forum/reports", {
        params: queryParams as Record<string, string | number | boolean | null | undefined>,
      });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      logger.error("Failed to fetch forum reports from API:", err);
      if (throwOnError) throw err;
      return [];
    }
  }

  /**
   * Marks a reported violation as resolved.
   */
  async resolveForumReport(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>(`/forum/reports/${id}/resolve`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to resolve forum report ${id}:`, err);
      return false;
    }
  }

  /**
   * Fetches real-time forum metrics and KPIs.
   */
  async getForumStats(options?: AdminFetchOptions): Promise<ForumStatsAdminItem | null> {
    try {
      const stats = await apiClient.get<ForumStatsAdminItem>("/forum/stats");
      return stats;
    } catch (err) {
      logger.error("Failed to fetch forum stats:", err);
      if (options?.throwOnError) throw err;
      return null;
    }
  }

  /**
   * Pins or unpins a forum discussion topic.
   */
  async setForumPostPinned(id: string, pinned: boolean): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>(`/forum/posts/${id}/pin`, { pinned });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to set forum post ${id} pinned:`, err);
      return false;
    }
  }

  /**
   * Soft removes (is_removed = true) or restores (is_removed = false) a forum post.
   */
  async setForumPostRemoved(id: string, removed: boolean): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>(`/forum/posts/${id}/remove`, { removed });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to set forum post ${id} removed:`, err);
      return false;
    }
  }

  /**
   * Permanently hard deletes a forum post from the database.
   */
  async deleteForumPost(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/forum/posts/${id}`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to delete forum post ${id}:`, err);
      return false;
    }
  }

  /**
   * Soft removes or restores a forum comment.
   */
  async setForumCommentRemoved(id: string, removed: boolean): Promise<boolean> {
    try {
      const response = await apiClient.post<{ success: boolean }>(`/forum/comments/${id}/remove`, { removed });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to set forum comment ${id} removed:`, err);
      return false;
    }
  }

  /**
   * Permanently hard deletes a forum comment.
   */
  async deleteForumComment(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete<{ success: boolean }>(`/forum/comments/${id}`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to delete forum comment ${id}:`, err);
      return false;
    }
  }

  /**
   * Fetches soft-deleted comments queue for moderation audit.
   */
  async getRemovedForumComments(
    limit?: number,
    options?: AdminFetchOptions
  ): Promise<ForumRemovedCommentItem[]> {
    try {
      const res = await apiClient.get<ForumRemovedCommentItem[]>("/forum/reports/removed-comments", {
        params: limit !== undefined ? { limit } : undefined,
      });
      return Array.isArray(res) ? res : [];
    } catch (err) {
      logger.error("Failed to fetch removed comments:", err);
      if (options?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Fetches paginated moderation audit logs with filter matrix.
   */
  async getAuditLogs(
    params?: AuditLogQueryParams & AdminFetchOptions
  ): Promise<AuditLogPaginatedResult> {
    const { throwOnError, ...queryParams } = params ?? {};
    try {
      const res = await apiClient.get<AuditLogPaginatedResult>("/admin/audit-logs", {
        params: queryParams as Record<string, string | number | boolean | null | undefined>,
      });
      if (res && Array.isArray(res.data)) {
        return res;
      }
      return {
        data: [],
        total: 0,
        page: queryParams.page || 1,
        limit: queryParams.limit || 20,
        totalPages: 0,
      };
    } catch (err) {
      logger.error("Failed to fetch audit logs from API:", err);
      if (throwOnError) throw err;
      return {
        data: [],
        total: 0,
        page: queryParams.page || 1,
        limit: queryParams.limit || 20,
        totalPages: 0,
      };
    }
  }

  // ============================================
  // Bookings Administration
  // ============================================

  /**
   * Fetches all bookings, optionally filtered by status.
   */
  async getAdminBookings(status?: string, options?: AdminFetchOptions): Promise<AdminBookingItem[]> {
    try {
      const res = await apiClient.get<
        AdminBookingItem[] | { data: AdminBookingItem[] }
      >("/bookings/admin", { params: status ? { status } : undefined });
      if (Array.isArray(res)) return res;
      if (res && typeof res === "object" && "data" in res && Array.isArray(res.data)) {
        return res.data;
      }
      return [];
    } catch (err) {
      logger.error("Failed to fetch admin bookings:", err);
      if (options?.throwOnError) throw err;
      return [];
    }
  }

  /**
   * Updates booking lifecycle status (confirm/reject/cancel/complete).
   */
  async updateBookingStatus(
    id: string,
    status: string,
    reason?: string
  ): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/bookings/admin/${id}/status`, { status, reason });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to update booking ${id} status:`, err);
      return false;
    }
  }

  /**
   * Updates the payout lifecycle status of a booking.
   */
  async updatePayoutStatus(id: string, payoutStatus: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/bookings/admin/${id}/payout-status`, { payoutStatus });
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to update payout status for booking ${id}:`, err);
      return false;
    }
  }

  /**
   * Refunds (cancels with refund handling) a booking.
   */
  async refundBooking(id: string): Promise<boolean> {
    try {
      const response = await apiClient.post(`/bookings/admin/${id}/refund`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to refund booking ${id}:`, err);
      return false;
    }
  }

  // ============================================
  // Reviews Moderation
  // ============================================

  /**
   * Fetches paginated reviews by moderation status (default queue: pending).
   */
  async getModerationReviews(
    status: "pending" | "approved" | "rejected",
    page = 1,
    limit = 20,
    options?: AdminFetchOptions
  ): Promise<{ data: AdminReviewItem[]; total: number }> {
    try {
      const endpoint =
        status === "pending"
          ? "/reviews/admin/pending"
          : `/reviews/admin/status/${status}`;
      const res = await apiClient.get<{
        data?: AdminReviewItem[];
        total?: number;
      }>(endpoint, { params: { page, limit } });
      return {
        data: Array.isArray(res?.data) ? res.data : [],
        total: res?.total ?? 0,
      };
    } catch (err) {
      logger.error("Failed to fetch reviews for moderation:", err);
      if (options?.throwOnError) throw err;
      return { data: [], total: 0 };
    }
  }

  /**
   * Approves a pending review.
   */
  async approveReview(id: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/reviews/${id}/approve`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to approve review ${id}:`, err);
      return false;
    }
  }

  /**
   * Rejects a review.
   */
  async rejectReview(id: string): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/reviews/${id}/reject`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to reject review ${id}:`, err);
      return false;
    }
  }

  /**
   * Permanently deletes a review.
   */
  async deleteReview(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/reviews/${id}`);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to delete review ${id}:`, err);
      return false;
    }
  }

  // ============================================
  // Users Administration
  // ============================================

  /**
   * Fetches paginated user directory, optionally filtered by role.
   */
  async getUsers(params?: {
    role?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: AdminUserItem[]; pagination: AdminPagination }> {
    const empty = {
      data: [] as AdminUserItem[],
      pagination: { page: 1, limit: params?.limit ?? 20, total: 0, totalPages: 0 },
    };
    try {
      const res = await apiClient.get<{
        data?: AdminUserItem[];
        pagination?: AdminPagination;
      }>("/users/admin", { params: params as Record<string, string | number> });
      if (res && Array.isArray(res.data)) {
        return {
          data: res.data,
          pagination:
            res.pagination ??
            empty.pagination,
        };
      }
      return empty;
    } catch (err) {
      logger.error("Failed to fetch users:", err);
      throw err;
    }
  }

  /**
   * Updates a user profile fields (role, contacts, etc.).
   */
  async updateUserProfile(
    id: string,
    updates: { role?: string; full_name?: string; phone?: string; company_name?: string }
  ): Promise<boolean> {
    try {
      const response = await apiClient.patch(`/users/admin/${id}/status`, updates);
      return mutationSucceeded(response);
    } catch (err) {
      logger.error(`Failed to update user ${id}:`, err);
      return false;
    }
  }
}

export interface ModerationAuditLogItem {
  id: string;
  entity_type: "listing" | "blog_post" | "blog_submission" | "forum_post" | "forum_comment" | "forum_report" | "claim" | string;
  entity_id: string;
  action: "approve" | "reject" | "delete" | "feature" | "unfeature" | "verify" | "unverify" | "pin" | "remove" | "restore" | "resolve" | "update_score" | string;
  admin_id?: string | null;
  reason?: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  admin?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface AuditLogQueryParams {
  entity_type?: string;
  action?: string;
  admin_id?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AuditLogPaginatedResult {
  data: ModerationAuditLogItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ForumReportAdminItem {
  id: string;
  reporter_id: string;
  target_type: "post" | "comment" | string;
  target_id: string;
  reason: "spam" | "harassment" | "inappropriate" | "misinformation" | "other" | string;
  resolved: boolean;
  created_at: string;
  target_missing?: boolean;
  reporter?: {
    id?: string;
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
  target_post?: {
    id: string;
    title?: string;
    content?: string;
    author_id?: string;
    is_pinned?: boolean;
    is_removed?: boolean;
    created_at?: string;
  } | null;
  target_comment?: {
    id: string;
    post_id?: string;
    body?: string;
    user_id?: string;
    is_removed?: boolean;
    created_at?: string;
  } | null;
}

export interface ForumStatsAdminItem {
  totalTopics: number;
  totalReplies: number;
  usersOnline: number;
  latestMember: string | null;
}

export interface ForumRemovedCommentItem {
  id: string;
  post_id: string;
  user_id: string;
  body: string;
  is_removed: boolean;
  created_at: string;
  author_name?: string | null;
  author_avatar?: string | null;
}

export interface BlogSubmissionAdminItem {
  id: string;
  user_id: string;
  title: string;
  content: string;
  author_name?: string | null;
  author_email?: string | null;
  category?: string | null;
  video_url?: string | null;
  media_urls?: string[];
  tag_ids?: string[];
  status: "pending_review" | "approved" | "rejected" | string;
  payment_details?: {
    method: "iban" | "crypto" | "wise" | "credits" | string;
    handle: string;
    acceptedTerms?: boolean;
    [key: string]: unknown;
  } | null;
  rejection_reason?: string | null;
  created_at: string;
  updated_at?: string;
  user?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
}

export interface AdminBookingItem {
  id: string;
  item_id?: string | null;
  item_type?: "property" | "service" | string | null;
  check_in: string;
  check_out: string;
  total_price: number;
  guests?: number | null;
  status: "pending" | "confirmed" | "cancelled" | "rejected" | "completed" | string;
  payment_status?: string | null;
  payout_status?: string | null;
  created_at?: string | null;
  itemTitle?: string;
  property?: { id: string; title?: string; images?: string[] | null } | null;
  service?: { id: string; title?: string } | null;
  user?: {
    id?: string;
    full_name?: string | null;
    email?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface AdminReviewItem {
  id: string;
  listing_id?: string | null;
  rating?: number | null;
  title?: string | null;
  comment?: string | null;
  status?: "pending" | "approved" | "rejected" | string;
  created_at?: string | null;
  user?: { full_name?: string | null; avatar_url?: string | null } | null;
  listing?: { id?: string; name?: string | null } | null;
}

export interface AdminUserItem {
  id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  phone?: string | null;
  company_name?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
}

export interface AdminPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const adminService = new AdminService();
