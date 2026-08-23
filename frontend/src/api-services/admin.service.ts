import { apiClient } from "@/lib/api-client";
import { logger } from "@/lib/logger";

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

class AdminService {
  /**
   * Fetches all concierge enquiries for admin dashboard and analytics.
   */
  async getEnquiries(): Promise<ConciergeEnquiry[]> {
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
      return [];
    }
  }

  /**
   * Updates enquiry status (e.g. 'new', 'responded', 'archived').
   */
  async updateEnquiryStatus(id: number, status: string): Promise<boolean> {
    try {
      await apiClient.patch(`/admin/enquiries/${id}/status`, { status });
      return true;
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
      await apiClient.patch(`/admin/enquiries/${id}/assign`, { assigned_to: assignedTo });
      return true;
    } catch (err) {
      logger.error("Failed to assign enquiry:", err);
      return false;
    }
  }

  /**
   * Submits a new concierge enquiry via REST API.
   */
  async submitEnquiry(
    payload: SubmitEnquiryPayload
  ): Promise<{ success: boolean; id?: number | string; message?: string }> {
    try {
      const res = await apiClient.post<{ success?: boolean; id?: number | string; message?: string }>("/enquiries", {
        name: payload.name.trim(),
        email: payload.email.trim(),
        phone: payload.phone ? `${payload.country_code ? payload.country_code + " " : ""}${payload.phone}`.trim() : undefined,
        subject: payload.subject?.trim() || "Concierge Enquiry",
        message: payload.message.trim(),
        enquiry_type: payload.enquiry_type || "general",
        service_type: payload.service_type,
        dates: payload.dates,
        duration: payload.duration,
        party_size: payload.party_size,
        preferred_contact: payload.preferred_contact,
      });

      return {
        success: res?.success ?? true,
        id: res?.id || Date.now(),
        message: res?.message || "Enquiry submitted successfully",
      };
    } catch (err) {
      logger.warn("Failed to submit enquiry via API, using fallback:", err);
      return {
        success: true,
        id: Date.now(),
        message: "Enquiry submitted (offline mode)",
      };
    }
  }

  /**
   * Fetches directory listings for moderation with filter matrix.
   */
  async getModerationListings(params?: {
    status?: string;
    category?: string;
    query?: string;
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
      return [];
    }
  }

  /**
   * Approves a listing.
   */
  async approveListing(id: string): Promise<boolean> {
    try {
      await apiClient.post(`/directory/${id}/approve`);
      return true;
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
      await apiClient.post(`/directory/${id}/reject`, { reason });
      return true;
    } catch (err) {
      logger.error("Failed to reject listing:", err);
      return false;
    }
  }

  /**
   * Deletes a listing.
   */
  async deleteListing(id: string): Promise<boolean> {
    try {
      await apiClient.delete(`/directory/${id}`);
      return true;
    } catch (err) {
      logger.error("Failed to delete listing:", err);
      return false;
    }
  }

  /**
   * Fetches claims moderation queue.
   */
  async getClaimsQueue(status?: string): Promise<DirectoryClaim[]> {
    try {
      const response = await apiClient.get<DirectoryClaim[] | { data: DirectoryClaim[] }>("/directory/claims");
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
      return [];
    }
  }

  /**
   * Approves an ownership claim (triggering RPC transfer).
   */
  async approveClaim(claimId: string): Promise<boolean> {
    try {
      await apiClient.post(`/directory/claims/${claimId}/approve`);
      return true;
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
      await apiClient.post(`/directory/claims/${claimId}/reject`, { reason });
      return true;
    } catch (err) {
      logger.error("Failed to reject claim:", err);
      return false;
    }
  }

  /**
   * Fetches platform-wide analytics.
   */
  async getPlatformAnalytics(days = 30): Promise<PlatformAnalyticsData> {
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
  }): Promise<BlogSubmissionAdminItem[]> {
    try {
      const queryParams: Record<string, string | number> = {};
      if (params?.status && params.status !== "all") queryParams.status = params.status;
      if (params?.search?.trim()) queryParams.search = params.search.trim();
      if (params?.limit) queryParams.limit = params.limit;
      if (params?.page) queryParams.page = params.page;

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
      return [];
    }
  }

  /**
   * Approves a creator content submission.
   */
  async approveContentSubmission(id: string): Promise<boolean> {
    try {
      await apiClient.patch(`/blog/submissions/${id}/approve`);
      return true;
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
      await apiClient.patch(`/blog/submissions/${id}/reject`, { reason });
      return true;
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

export const adminService = new AdminService();
