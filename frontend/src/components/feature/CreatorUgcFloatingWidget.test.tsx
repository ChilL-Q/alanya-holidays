import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CreatorUgcFloatingWidget from "./CreatorUgcFloatingWidget";
import SubmitContentModal from "./SubmitContentModal";
import toast from "react-hot-toast";
import { blogService } from "@/api-services/blog.service";

vi.mock("react-hot-toast", () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("CreatorUgcFloatingWidget Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(blogService, "submitGuide").mockResolvedValue({ success: true, id: "ugc-101" });
  });

  it("renders collapsed trigger pill initially with reward badge and smooth micro-interaction classes", () => {
    render(<CreatorUgcFloatingWidget />);
    const trigger = screen.getByRole("button", { name: /open creator rewards|get paid for content/i });
    expect(screen.getByText(/Get Paid for Content|Creator Rewards/i)).toBeInTheDocument();
    expect(screen.getByText(/€250|₺8,000/i)).toBeInTheDocument();
    expect(trigger).toHaveClass("ease-out");
    expect(trigger).toHaveClass("hover:-translate-y-0.5");
    expect(trigger).not.toHaveClass("hover:scale-105");
  });

  it("expands to full floating card when clicked", () => {
    render(<CreatorUgcFloatingWidget />);
    const trigger = screen.getByRole("button", { name: /open creator rewards|get paid for content/i });
    fireEvent.click(trigger);

    expect(screen.getByText(/Earn with Your Content|Get Paid for Sharing/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit content|start earning/i })).toBeInTheDocument();
  });

  it("can be collapsed back to pill when close button is clicked", () => {
    render(<CreatorUgcFloatingWidget />);
    const trigger = screen.getByRole("button", { name: /open creator rewards|get paid for content/i });
    fireEvent.click(trigger);

    const closeBtn = screen.getByRole("button", { name: /collapse|close banner/i });
    fireEvent.click(closeBtn);

    expect(screen.queryByText(/Earn with Your Content/i)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /open creator rewards|get paid for content/i })).toBeInTheDocument();
  });

  it("opens SubmitContentModal when Submit Content button is clicked in expanded state", () => {
    render(<CreatorUgcFloatingWidget />);
    const trigger = screen.getByRole("button", { name: /open creator rewards|get paid for content/i });
    fireEvent.click(trigger);

    const submitCta = screen.getByRole("button", { name: /submit content|start earning/i });
    fireEvent.click(submitCta);

    expect(screen.getByRole("dialog", { name: /submit creator content|ugc submission/i })).toBeInTheDocument();
  });
});

describe("SubmitContentModal Component", () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(blogService, "submitGuide").mockResolvedValue({ success: true, id: "ugc-101" });
  });

  it("does not render when isOpen is false", () => {
    render(<SubmitContentModal isOpen={false} onClose={vi.fn()} />);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders 4 media type selectors (Photo, Video, Article, Local Tip)", () => {
    render(<SubmitContentModal {...defaultProps} />);
    expect(screen.getByRole("button", { name: /photo/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /video/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /article/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /local tip/i })).toBeInTheDocument();
  });

  it("validates required fields before submitting", async () => {
    render(<SubmitContentModal {...defaultProps} />);
    const submitBtn = screen.getByRole("button", { name: /submit for review|send content/i });
    fireEvent.click(submitBtn);

    expect(await screen.findByText(/title is required|please enter a title/i)).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalled();
  });

  it("submits valid UGC payload and triggers success toast & closes modal", async () => {
    const onCloseMock = vi.fn();
    render(<SubmitContentModal isOpen={true} onClose={onCloseMock} />);

    // Select Video
    fireEvent.click(screen.getByRole("button", { name: /video/i }));

    // Fill form
    fireEvent.change(screen.getByLabelText(/content title/i), {
      target: { value: "Secret Cleopatra Beach Sunset Spots" },
    });
    fireEvent.change(screen.getByLabelText(/description/i), {
      target: { value: "A 4K drone reel showing hidden rocky coves near Cleopatra beach." },
    });
    fireEvent.change(screen.getByLabelText(/media url/i), {
      target: { value: "https://youtube.com/watch?v=example123" },
    });
    fireEvent.change(screen.getByLabelText(/your name/i), {
      target: { value: "Elena Rostova" },
    });
    fireEvent.change(screen.getByLabelText(/your email/i), {
      target: { value: "elena@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/payout method/i), {
      target: { value: "wise" },
    });
    fireEvent.change(screen.getByLabelText(/payout handle|account details/i), {
      target: { value: "elena@wise.com" },
    });

    // Accept terms
    fireEvent.click(screen.getByLabelText(/terms/i));

    // Submit
    const submitBtn = screen.getByRole("button", { name: /submit for review|send content/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        expect.stringMatching(/content submitted|thank you for your submission/i)
      );
    });

    expect(onCloseMock).toHaveBeenCalled();
  });
});
