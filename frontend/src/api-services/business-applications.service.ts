import { apiClient } from "@/lib/api-client";

export type BusinessAccountType =
  | "seller"
  | "service_provider"
  | "property_host"
  | "directory_owner";

export type BusinessApplicationStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "withdrawn";

export interface BusinessApplication {
  id: string;
  userId: string;
  accountType: BusinessAccountType;
  businessName: string;
  contactEmail: string;
  contactPhone: string | null;
  website: string | null;
  status: BusinessApplicationStatus;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export type AdminBusinessApplication = BusinessApplication;

export interface AdminBusinessApplicationsPage {
  items: AdminBusinessApplication[];
  page: number;
  limit: number;
  total: number;
}

export interface CreateBusinessApplicationInput {
  accountType: BusinessAccountType;
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
}

export const businessApplicationsService = {
  async getMine(): Promise<BusinessApplication | null> {
    return apiClient.get<BusinessApplication | null>("/business-applications/me");
  },

  async create(
    input: CreateBusinessApplicationInput
  ): Promise<BusinessApplication> {
    return apiClient.post<BusinessApplication>("/business-applications", input);
  },

  async listAdmin(page = 1, limit = 20): Promise<AdminBusinessApplicationsPage> {
    return apiClient.get<AdminBusinessApplicationsPage>(
      "/business-applications/admin",
      { params: { page, limit } }
    );
  },

  async approve(id: string): Promise<AdminBusinessApplication> {
    return apiClient.patch<AdminBusinessApplication>(
      `/business-applications/admin/${id}/approve`
    );
  },

  async reject(id: string, reason: string): Promise<AdminBusinessApplication> {
    return apiClient.patch<AdminBusinessApplication>(
      `/business-applications/admin/${id}/reject`,
      { reason }
    );
  },
};
