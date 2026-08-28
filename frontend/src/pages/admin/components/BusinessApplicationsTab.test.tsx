import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { businessApplicationsService } from "@/api-services/business-applications.service";
import BusinessApplicationsTab from "./BusinessApplicationsTab";

vi.mock("@/api-services/business-applications.service", () => ({
  businessApplicationsService: {
    listAdmin: vi.fn(),
    approve: vi.fn(),
    reject: vi.fn(),
  },
}));

const application = {
  id: "11111111-1111-4111-8111-111111111111",
  userId: "user-1",
  accountType: "seller" as const,
  businessName: "Alanya Crafts",
  contactEmail: "owner@example.com",
  contactPhone: "+90 555 000 0000",
  website: "https://example.com",
  status: "pending" as const,
  rejectionReason: null,
  reviewedBy: null,
  reviewedAt: null,
  createdAt: "2026-08-20T10:00:00Z",
  updatedAt: "2026-08-20T10:00:00Z",
};

const page = { items: [application], page: 1, limit: 20, total: 1 };

describe("BusinessApplicationsTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(businessApplicationsService.listAdmin).mockResolvedValue(page);
    vi.mocked(businessApplicationsService.approve).mockResolvedValue({
      ...application,
      status: "approved",
    });
    vi.mocked(businessApplicationsService.reject).mockResolvedValue({
      ...application,
      status: "rejected",
    });
  });

  it("loads and displays the pending application fields", async () => {
    render(<BusinessApplicationsTab />);

    expect(await screen.findByText("Alanya Crafts")).toBeInTheDocument();
    expect(screen.getByText("owner@example.com")).toBeInTheDocument();
    expect(screen.getByText("Seller")).toBeInTheDocument();
    expect(businessApplicationsService.listAdmin).toHaveBeenCalledWith(1, 20);
  });

  it("approves and refreshes the queue", async () => {
    render(<BusinessApplicationsTab />);

    fireEvent.click(await screen.findByRole("button", { name: "Approve Alanya Crafts" }));

    await waitFor(() => {
      expect(businessApplicationsService.approve).toHaveBeenCalledWith(application.id);
      expect(businessApplicationsService.listAdmin).toHaveBeenCalledTimes(2);
    });
  });

  it("validates the rejection reason, then rejects and refreshes", async () => {
    render(<BusinessApplicationsTab />);

    fireEvent.click(await screen.findByRole("button", { name: "Reject Alanya Crafts" }));
    fireEvent.change(screen.getByLabelText("Rejection reason for Alanya Crafts"), {
      target: { value: "Too short" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    expect(await screen.findByText("Rejection reason must be at least 10 characters.")).toBeInTheDocument();
    expect(businessApplicationsService.reject).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText("Rejection reason for Alanya Crafts"), {
      target: { value: "Registration details do not match." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Confirm rejection" }));

    await waitFor(() => {
      expect(businessApplicationsService.reject).toHaveBeenCalledWith(
        application.id,
        "Registration details do not match."
      );
      expect(businessApplicationsService.listAdmin).toHaveBeenCalledTimes(2);
    });
  });
});
