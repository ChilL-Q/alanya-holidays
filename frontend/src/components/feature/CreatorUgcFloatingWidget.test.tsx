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

const renderWidget = (initialEntries: string[] = ["/"]) =>
  render(
    <MemoryRouter initialEntries={initialEntries}>
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

  it("uses the full text trigger outside the events page", () => {
    renderWidget(["/"]);
    expect(screen.getByText(/Share with the Community/i)).toBeInTheDocument();
  });

  it("keeps the mobile trigger compact while preserving its accessible label", () => {
    renderWidget(["/"]);
    const trigger = screen.getByRole("button", {
      name: /open community post widget/i,
    });

    expect(trigger).toHaveClass("max-sm:w-12", "max-sm:h-12", "max-sm:p-0", "max-sm:rounded-full");
    expect(screen.getByText(/Post a tip, story, or question/i).parentElement).toHaveClass(
      "hidden",
      "sm:flex"
    );
  });

  it("switches to a compact trigger on the events page to avoid covering cards", () => {
    renderWidget(["/events"]);
    expect(screen.getByRole("button", { name: /open community post widget/i })).toBeInTheDocument();
    expect(screen.queryByText(/Post a tip, story, or question/i)).not.toBeInTheDocument();
  });

  it.each(["/login", "/register", "/checkout", "/admin"])(
    "does not render its trigger on the protected form surface %s",
    (path) => {
      renderWidget([path]);
      expect(
        screen.queryByRole("button", { name: /open community post widget/i }),
      ).not.toBeInTheDocument();
    },
  );

  it("uses safe-area-aware offsets", () => {
    const { container } = renderWidget();
    expect(container.querySelector('[data-floating-widget="community"]')).toHaveClass(
      "bottom-[calc(1rem+env(safe-area-inset-bottom))]",
      "left-[calc(1rem+env(safe-area-inset-left))]",
    );
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
