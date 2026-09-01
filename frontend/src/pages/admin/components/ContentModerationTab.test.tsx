import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContentModerationTab from "./ContentModerationTab";
import { adminService, type BlogSubmissionAdminItem } from "@/api-services/admin.service";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("ContentModerationTab", () => {
  const mockSubmissions: BlogSubmissionAdminItem[] = [
    {
      id: "sub-1",
      user_id: "user-1",
      title: "Secret Sunset Spot in Mahmutlar",
      content: "A wonderful quiet beach area with limestone rocks and calm water.",
      author_name: "Elena Rostova",
      author_email: "elena@example.com",
      category: "Beaches",
      video_url: "https://youtube.com/watch?v=sample1",
      status: "pending_review",
      payment_details: { method: "iban", handle: "TR123456789", acceptedTerms: true },
      created_at: "2026-08-20T10:00:00Z",
      updated_at: "2026-08-20T10:00:00Z",
    },
    {
      id: "sub-2",
      user_id: "user-2",
      title: "Top 5 Hidden Breakfast Places",
      content: "Organic village breakfast in Oba with homemade jams.",
      author_name: "Murat Celik",
      author_email: "murat@example.com",
      category: "Food & Drink",
      status: "approved",
      payment_details: { method: "wise", handle: "murat@wise.com", acceptedTerms: true },
      created_at: "2026-08-19T14:00:00Z",
      updated_at: "2026-08-19T15:00:00Z",
    },
    {
      id: "sub-3",
      user_id: "user-3",
      title: "Spam Promotional Offer",
      content: "Buy cheap crypto here...",
      author_name: "Bot Spammer",
      author_email: "bot@spam.com",
      category: "Other",
      status: "rejected",
      rejection_reason: "Promotional spam not related to tourism.",
      created_at: "2026-08-18T09:00:00Z",
      updated_at: "2026-08-18T10:00:00Z",
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(adminService, "getContentSubmissions").mockResolvedValue(mockSubmissions);
    vi.spyOn(adminService, "approveContentSubmission").mockResolvedValue(true);
    vi.spyOn(adminService, "rejectContentSubmission").mockResolvedValue(true);
  });

  it("should render submissions and status filters", async () => {
    const onContentCountUpdate = vi.fn();
    render(<ContentModerationTab onContentCountUpdate={onContentCountUpdate} />);

    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
      expect(screen.getByText("Top 5 Hidden Breakfast Places")).toBeInTheDocument();
      expect(screen.getByText("Spam Promotional Offer")).toBeInTheDocument();
    });

    expect(onContentCountUpdate).toHaveBeenCalledWith({
      total: 3,
      pending: 1,
    });
  });

  it("should filter submissions by status tab", async () => {
    render(<ContentModerationTab />);

    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
    });

    // Click Pending filter
    const pendingFilter = screen.getByRole("button", { name: /pending review/i });
    fireEvent.click(pendingFilter);

    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
      expect(screen.queryByText("Top 5 Hidden Breakfast Places")).toBeNull();
    });
  });

  it("should filter submissions by search keyword", async () => {
    render(<ContentModerationTab />);

    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search submissions/i);
    fireEvent.change(searchInput, { target: { value: "Breakfast" } });

    await waitFor(() => {
      expect(screen.getByText("Top 5 Hidden Breakfast Places")).toBeInTheDocument();
      expect(screen.queryByText("Secret Sunset Spot in Mahmutlar")).toBeNull();
    });
  });

  it("should open preview modal and approve submission", async () => {
    render(<ContentModerationTab />);

    await waitFor(() => {
      expect(screen.getByText("Secret Sunset Spot in Mahmutlar")).toBeInTheDocument();
    });

    // Click Review button on first submission
    const reviewBtn = screen.getByRole("button", {
      name: /review secret sunset spot in mahmutlar/i,
    });
    fireEvent.click(reviewBtn);

    // Modal should be open
    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });

    const approveBtn = screen.getByRole("button", { name: /approve & publish/i });
    fireEvent.click(approveBtn);

    await waitFor(() => {
      expect(adminService.approveContentSubmission).toHaveBeenCalledWith("sub-1");
      expect(toast.success).toHaveBeenCalledWith(expect.stringContaining("approved"));
    });
  });
});
