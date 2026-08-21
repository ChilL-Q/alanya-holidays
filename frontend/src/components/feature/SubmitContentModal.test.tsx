import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import SubmitContentModal from "./SubmitContentModal";
import { blogService } from "@/api-services/blog.service";
import toast from "react-hot-toast";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SubmitContentModal (Creator UGC Submissions)", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmitSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should not render when isOpen is false", () => {
    render(<SubmitContentModal {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("should render modal with all sections when isOpen is true", () => {
    render(<SubmitContentModal {...defaultProps} />);

    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Submit Creator Content")).toBeInTheDocument();
    expect(screen.getByText("Select Content Type")).toBeInTheDocument();
    expect(screen.getByLabelText(/Content Title/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Description \/ Story/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Your Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payout Method/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Payout Handle/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to terms and conditions/i)).toBeInTheDocument();
  });

  it("should switch active media type buttons", () => {
    render(<SubmitContentModal {...defaultProps} />);

    const videoButton = screen.getByRole("button", { name: /video/i });
    fireEvent.click(videoButton);
    expect(videoButton).toHaveAttribute("aria-pressed", "true");

    const articleButton = screen.getByRole("button", { name: /article/i });
    fireEvent.click(articleButton);
    expect(articleButton).toHaveAttribute("aria-pressed", "true");
    expect(videoButton).toHaveAttribute("aria-pressed", "false");
  });

  it("should validate required fields and display error message", async () => {
    render(<SubmitContentModal {...defaultProps} />);

    const submitBtn = screen.getByRole("button", { name: /submit for review/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/Please enter a title for your content/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("Please enter a title for your content.");
  });

  it("should validate terms and conditions acceptance", async () => {
    render(<SubmitContentModal {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: "Secret Sunset Spot in Mahmutlar" },
    });
    fireEvent.change(screen.getByLabelText(/Description \/ Story/i), {
      target: { value: "A wonderful quiet beach area with limestone rocks." },
    });
    fireEvent.change(screen.getByLabelText(/Your Name/i), {
      target: { value: "Anna Ivanova" },
    });
    fireEvent.change(screen.getByLabelText(/Your Email/i), {
      target: { value: "anna@example.com" },
    });

    const submitBtn = screen.getByRole("button", { name: /submit for review/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/You must accept the terms/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith("You must accept the terms to submit content.");
  });

  it("should submit payload and call blogService.submitGuide on valid submission", async () => {
    const submitGuideSpy = vi.spyOn(blogService, "submitGuide").mockResolvedValueOnce({
      success: true,
      id: "sub-9988",
    });

    render(<SubmitContentModal {...defaultProps} />);

    // Select video type
    fireEvent.click(screen.getByRole("button", { name: /video/i }));

    fireEvent.change(screen.getByLabelText(/Content Title/i), {
      target: { value: "Secret Sunset Spot in Mahmutlar" },
    });
    fireEvent.change(screen.getByLabelText(/Description \/ Story/i), {
      target: { value: "A wonderful quiet beach area with limestone rocks." },
    });
    fireEvent.change(screen.getByLabelText(/Media URL/i), {
      target: { value: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    fireEvent.change(screen.getByLabelText(/Your Name/i), {
      target: { value: "Anna Ivanova" },
    });
    fireEvent.change(screen.getByLabelText(/Your Email/i), {
      target: { value: "anna@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/Payout Method/i), {
      target: { value: "crypto" },
    });
    fireEvent.change(screen.getByLabelText(/Payout Handle/i), {
      target: { value: "TRX7890123456789" },
    });
    fireEvent.click(screen.getByLabelText(/I agree to terms and conditions/i));

    const submitBtn = screen.getByRole("button", { name: /submit for review/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(submitGuideSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Secret Sunset Spot in Mahmutlar",
          content: "A wonderful quiet beach area with limestone rocks.",
          author_name: "Anna Ivanova",
          author_email: "anna@example.com",
          category: "video",
          video_url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
          payment_details: expect.objectContaining({
            method: "crypto",
            handle: "TRX7890123456789",
            acceptedTerms: true,
          }),
        })
      );
      expect(defaultProps.onSubmitSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringContaining("Content submitted!")
      );
    });
  });

  it("should close modal when Cancel button is clicked", () => {
    render(<SubmitContentModal {...defaultProps} />);
    const cancelBtn = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelBtn);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it("should close modal when Escape key is pressed", () => {
    render(<SubmitContentModal {...defaultProps} />);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});
