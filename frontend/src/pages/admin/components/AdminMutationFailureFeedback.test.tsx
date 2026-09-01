import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  adminService,
  type AdminReviewItem,
  type AdminUserItem,
  type ConciergeEnquiry,
} from "@/api-services/admin.service";
import ConciergeTab from "./ConciergeTab";
import ReviewsModerationTab from "./ReviewsModerationTab";
import UsersAdminTab from "./UsersAdminTab";

const review: AdminReviewItem = {
  id: "review-1",
  title: "A useful review",
  rating: 4,
  status: "pending",
};

const user: AdminUserItem = {
  id: "user-1",
  full_name: "Admin Target",
  email: "target@example.com",
  role: "user",
};

const enquiry: ConciergeEnquiry = {
  id: 1,
  name: "Guest One",
  email: "guest@example.com",
  subject: "Trip Planning",
  message: "Please help with our trip.",
  status: "new",
  created_at: "2026-08-20T10:00:00Z",
};

describe("Admin mutation failure feedback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows an actionable error when review approval is unsuccessful", async () => {
    vi.spyOn(adminService, "getModerationReviews").mockResolvedValue({
      data: [review],
      total: 1,
    });
    vi.spyOn(adminService, "approveReview").mockResolvedValue(false);

    render(<ReviewsModerationTab />);
    fireEvent.click(await screen.findByRole("button", { name: "Approve" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Review update failed. Please try again.",
    );
  });

  it("shows an actionable error when a role update is unsuccessful", async () => {
    vi.spyOn(adminService, "getUsers").mockResolvedValue({
      data: [user],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });
    vi.spyOn(adminService, "updateUserProfile").mockResolvedValue(false);

    render(<UsersAdminTab />);
    fireEvent.change(await screen.findByRole("combobox", { name: /role for admin target/i }), {
      target: { value: "host" },
    });

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User role update failed. Please try again.",
    );
  });

  it("distinguishes a user directory load failure from a genuine empty directory", async () => {
    const getUsers = vi
      .spyOn(adminService, "getUsers")
      .mockRejectedValueOnce(new Error("Admin users request denied"))
      .mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

    render(<UsersAdminTab />);

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Failed to load users. Please try again.",
    );
    expect(screen.queryByText("No users found for this filter.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("No users found for this filter.")).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getUsers).toHaveBeenCalledTimes(2);
  });

  it("rolls back and explains an unsuccessful enquiry status update", async () => {
    vi.spyOn(adminService, "getEnquiries").mockResolvedValue([enquiry]);
    vi.spyOn(adminService, "updateEnquiryStatus").mockResolvedValue(false);

    render(<ConciergeTab />);
    fireEvent.click(await screen.findByText("Guest One"));
    fireEvent.click(await screen.findByRole("button", { name: "Mark Responded" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Enquiry update failed. Please try again.",
    );
    expect(adminService.getEnquiries).toHaveBeenCalledTimes(2);
  });
});
