import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiClient } from "@/lib/api-client";
import { businessApplicationsService } from "./business-applications.service";

vi.mock("@/lib/api-client", () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));

describe("businessApplicationsService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("gets the authenticated user's business application", async () => {
    const application = {
      id: "application-1",
      userId: "user-1",
      accountType: "service_provider" as const,
      businessName: "Alanya Services",
      contactEmail: "owner@example.com",
      contactPhone: null,
      website: null,
      status: "withdrawn" as const,
      rejectionReason: null,
      reviewedBy: null,
      reviewedAt: null,
      createdAt: "2026-08-28T10:00:00Z",
      updatedAt: "2026-08-28T10:00:00Z",
    };
    vi.mocked(apiClient.get).mockResolvedValue(application);

    await expect(businessApplicationsService.getMine()).resolves.toEqual(application);
    expect(apiClient.get).toHaveBeenCalledWith("/business-applications/me");
  });

  it("lists admin applications with pagination params", async () => {
    const page = { items: [], page: 2, limit: 10, total: 0 };
    vi.mocked(apiClient.get).mockResolvedValue(page);

    await expect(businessApplicationsService.listAdmin(2, 10)).resolves.toEqual(page);
    expect(apiClient.get).toHaveBeenCalledWith("/business-applications/admin", {
      params: { page: 2, limit: 10 },
    });
  });

  it("approves an application through the admin endpoint", async () => {
    const application = { id: "application-1", status: "approved" };
    vi.mocked(apiClient.patch).mockResolvedValue(application);

    await expect(businessApplicationsService.approve("application-1")).resolves.toEqual(application);
    expect(apiClient.patch).toHaveBeenCalledWith(
      "/business-applications/admin/application-1/approve"
    );
  });

  it("rejects an application with the required reason payload", async () => {
    const application = { id: "application-1", status: "rejected" };
    vi.mocked(apiClient.patch).mockResolvedValue(application);

    await expect(
      businessApplicationsService.reject("application-1", "Registration details do not match.")
    ).resolves.toEqual(application);
    expect(apiClient.patch).toHaveBeenCalledWith(
      "/business-applications/admin/application-1/reject",
      { reason: "Registration details do not match." }
    );
  });

  it("posts an existing-user onboarding application without authority fields", async () => {
    const input = {
      accountType: "seller" as const,
      businessName: "Analytical Engines Ltd",
      contactEmail: "ada@example.com",
      contactPhone: "+90 555 123 4567",
      website: "https://example.com",
    };
    vi.mocked(apiClient.post).mockResolvedValue({ id: "application-2", ...input, status: "pending" });

    await businessApplicationsService.create(input);

    expect(apiClient.post).toHaveBeenCalledWith("/business-applications", input);
    const submitted = vi.mocked(apiClient.post).mock.calls[0][1];
    expect(submitted).not.toHaveProperty("role");
    expect(submitted).not.toHaveProperty("status");
  });
});
