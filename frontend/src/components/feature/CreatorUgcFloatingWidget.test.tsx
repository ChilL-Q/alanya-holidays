import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import CreatorUgcFloatingWidget from "./CreatorUgcFloatingWidget";

vi.mock("./SubmitContentModal", () => ({
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div role="dialog" aria-label="Share a Post">
        <button onClick={onClose}>Close mocked modal</button>
      </div>
    ) : null,
}));

const renderWidget = () =>
  render(
    <MemoryRouter>
      <CreatorUgcFloatingWidget />
    </MemoryRouter>
  );

describe("CreatorUgcFloatingWidget", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the collapsed trigger pill with community-focused copy", () => {
    renderWidget();
    const trigger = screen.getByRole("button", {
      name: /open community post widget/i,
    });
    expect(trigger).toBeInTheDocument();
    expect(screen.getByText(/Share with the Community/i)).toBeInTheDocument();
  });

  it("expands to the floating card when clicked", () => {
    renderWidget();
    fireEvent.click(
      screen.getByRole("button", { name: /open community post widget/i })
    );

    expect(
      screen.getByRole("button", { name: /open share post modal/i })
    ).toBeInTheDocument();
  });

  it("opens SubmitContentModal when the Write a Post button is clicked", () => {
    renderWidget();
    fireEvent.click(
      screen.getByRole("button", { name: /open community post widget/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /open share post modal/i })
    );

    expect(
      screen.getByRole("dialog", { name: /share a post/i })
    ).toBeInTheDocument();
  });

  it("closes the modal when SubmitContentModal triggers onClose", () => {
    renderWidget();
    fireEvent.click(
      screen.getByRole("button", { name: /open community post widget/i })
    );
    fireEvent.click(
      screen.getByRole("button", { name: /open share post modal/i })
    );

    fireEvent.click(screen.getByRole("button", { name: /close mocked modal/i }));

    expect(
      screen.queryByRole("dialog", { name: /share a post/i })
    ).not.toBeInTheDocument();
  });
});
