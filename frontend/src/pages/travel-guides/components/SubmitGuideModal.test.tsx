import "@testing-library/jest-dom";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import SubmitGuideModal from "./SubmitGuideModal";

const { mockSubmitGuide } = vi.hoisted(() => ({
  mockSubmitGuide: vi.fn(),
}));

vi.mock("@/api-services/blog.service", () => ({
  blogService: { submitGuide: mockSubmitGuide },
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { id: "11111111-1111-4111-8111-111111111111", email: "author@example.com" },
    profile: { full_name: "Guide Author" },
    isAuthenticated: true,
  }),
}));

vi.mock("@/components/base/RichTextEditor", () => ({
  default: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
  }) => (
    <textarea
      aria-label="Guide content"
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

const submitForm = async () => {
  fireEvent.change(screen.getByPlaceholderText("e.g., Hidden Waterfalls Near Alanya"), {
    target: { value: "Hidden beach guide" },
  });
  fireEvent.change(screen.getByLabelText("Guide content"), {
    target: { value: "<p>Detailed local recommendations.</p>" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit Guide" }));
  await waitFor(() => expect(mockSubmitGuide).toHaveBeenCalledTimes(1));
};

describe("SubmitGuideModal submission contract", () => {
  beforeEach(() => {
    mockSubmitGuide.mockReset();
    mockSubmitGuide.mockResolvedValue({ success: true, id: "submission-1" });
  });

  it("submits the fetched tag UUID while retaining its display label as category", async () => {
    const tagId = "22222222-2222-4222-8222-222222222222";
    render(
      <SubmitGuideModal
        isOpen
        onClose={vi.fn()}
        tags={[{ id: tagId, name: "Beaches", slug: "beaches" }]}
      />,
    );

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Beaches" },
    });
    await submitForm();

    expect(mockSubmitGuide).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Beaches",
        tags: [tagId],
        content_type: "guide",
      }),
    );
  });

  it("never places a fallback display label in the UUID tag array", async () => {
    render(<SubmitGuideModal isOpen onClose={vi.fn()} tags={[]} />);

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "Food & Drink" },
    });
    await submitForm();

    expect(mockSubmitGuide).toHaveBeenCalledWith(
      expect.objectContaining({
        category: "Food & Drink",
        tags: [],
        content_type: "guide",
      }),
    );
  });

  it("never submits a malformed fetched tag ID", async () => {
    render(
      <SubmitGuideModal
        isOpen
        onClose={vi.fn()}
        tags={[{ id: "not-a-uuid", name: "Beaches", slug: "beaches" }]}
      />,
    );

    await submitForm();

    expect(mockSubmitGuide).toHaveBeenCalledWith(
      expect.objectContaining({ category: "Beaches", tags: [] }),
    );
  });
});
