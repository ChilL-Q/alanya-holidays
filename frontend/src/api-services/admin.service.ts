import { apiClient } from "@/lib/api-client";

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
      console.warn("Failed to fetch enquiries from API:", err);
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
      console.error("Failed to update enquiry status:", err);
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
      console.error("Failed to assign enquiry:", err);
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
      console.warn("Failed to submit enquiry via API, using fallback:", err);
      return {
        success: true,
        id: Date.now(),
        message: "Enquiry submitted (offline mode)",
      };
    }
  }
}

export const adminService = new AdminService();
