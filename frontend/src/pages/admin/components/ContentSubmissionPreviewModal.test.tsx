import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContentSubmissionPreviewModal from "./ContentSubmissionPreviewModal";
import type { BlogSubmissionAdminItem } from "@/api-services/admin.service";

describe("ContentSubmissionPreviewModal", () => {
  const mockSubmission: BlogSubmissionAdminItem = {
    id: "sub-101",
    user_id: "user-555",
    title: "Dim Cave Hidden Stalactite Chamber",
    content: "An off-the-beaten-path route through the cooler chambers with panoramic valley viewpoints.",
    author_name: "Can Yilmaz",
    author_email: "can@example.com",
    category: "Adventure",
    video_url: "https://www.youtube.com/watch?v=sample123",
    media_urls: ["https://example.com/cave1.jpg", "https://example.com/cave2.jpg"],
    status: "pending_review",
    payment_details: {
      method: "crypto",
      handle: "USDT_TRC20_WALLET_ADDRESS",
      acceptedTerms: true,
    },
    created_at: "2026-08-20T10:00:00Z",
    updated_at: "2026-08-20T10:00:00Z",
  };

  const defaultProps = {
    isOpen: true,
    submission: mockSubmission,
    onClose: vi.fn(),
    onApprove: vi.fn(),
    onReject: vi.fn(),
    isProcessing: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false or submission is null", () => {
    const { rerender } = render(
      <ContentSubmissionPreviewModal {...defaultProps} isOpen={false} />
    );
    expect(screen.queryByRole("dialog")).toBeNull();

    rerender(
      <ContentSubmissionPreviewModal {...defaultProps} submission={null} />
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should render submission preview with metadata, content, media and payout", () => {
    render(<ContentSubmissionPreviewModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Dim Cave Hidden Stalactite Chamber")).toBeInTheDocument();
    expect(screen.getByText("Can Yilmaz")).toBeInTheDocument();
    expect(screen.getByText("can@example.com")).toBeInTheDocument();
    expect(screen.getByText("Adventure")).toBeInTheDocument();
    expect(screen.getByText(/An off-the-beaten-path route/i)).toBeInTheDocument();
    expect(screen.getByText(/USDT_TRC20_WALLET_ADDRESS/i)).toBeInTheDocument();
    expect(screen.getByText("pending_review")).toBeInTheDocument();
  });

  it("should call onApprove when Approve button is clicked", async () => {
    render(<ContentSubmissionPreviewModal {...defaultProps} />);

    const approveBtn = screen.getByRole("button", { name: /approve & publish/i });
    fireEvent.click(approveBtn);

    expect(defaultProps.onApprove).toHaveBeenCalledWith("sub-101");
  });

  it("should show reject reason dialog and validate before calling onReject", async () => {
    render(<ContentSubmissionPreviewModal {...defaultProps} />);

    const rejectBtn = screen.getByRole("button", { name: /reject submission/i });
    fireEvent.click(rejectBtn);

    // Rejection reason input should now be visible
    expect(screen.getByPlaceholderText(/Enter reason for rejection/i)).toBeInTheDocument();

    const confirmRejectBtn = screen.getByRole("button", { name: /confirm rejection/i });
    fireEvent.click(confirmRejectBtn);

    // Should require reason
    expect(screen.getByText(/Please provide a rejection reason/i)).toBeInTheDocument();
    expect(defaultProps.onReject).not.toHaveBeenCalled();

    // Type reason
    const reasonInput = screen.getByPlaceholderText(/Enter reason for rejection/i);
    fireEvent.change(reasonInput, {
      target: { value: "Submission contains promotional affiliate links without context." },
    });

    fireEvent.click(confirmRejectBtn);

    expect(defaultProps.onReject).toHaveBeenCalledWith(
      "sub-101",
      "Submission contains promotional affiliate links without context."
    );
  });

  it("should close modal when close button is clicked", () => {
    render(<ContentSubmissionPreviewModal {...defaultProps} />);
    const closeBtn = screen.getByLabelText(/close preview/i);
    fireEvent.click(closeBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
