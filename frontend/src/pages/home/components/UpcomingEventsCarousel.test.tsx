import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UpcomingEventsCarousel from "./UpcomingEventsCarousel";

describe("UpcomingEventsCarousel Component", () => {
  const originalScrollBy = Element.prototype.scrollBy;

  beforeEach(() => {
    Element.prototype.scrollBy = vi.fn();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Element.prototype.scrollBy = originalScrollBy;
    vi.restoreAllMocks();
  });

  it("renders This Week's Events heading with count badge", () => {
    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    expect(screen.getByText(/This Week's Events/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /view all/i })).toHaveAttribute("href", "/events");
  });

  it("renders event date badges, attendee numbers, and spot indicators", () => {
    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    expect(screen.getByText("10")).toBeInTheDocument();
    expect(screen.getByText("JUN")).toBeInTheDocument();
    expect(screen.getByText(/Digital Nomad Beach Meetup/i)).toBeInTheDocument();
    expect(screen.getByText(/spots/i)).toBeInTheDocument();
  });

  it("renders browse all events card", () => {
    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    expect(screen.getByText(/Browse All Events/i)).toBeInTheDocument();
  });

  it("does not render scroll arrows when content fits within container without overflow", () => {
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(550);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /scroll left/i })).not.toBeInTheDocument();
  });

  it("renders right scroll arrow when content overflows and triggers smooth scrolling on click", () => {
    const scrollByMock = vi.fn();
    Element.prototype.scrollBy = scrollByMock;

    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    const rightArrow = screen.getByRole("button", { name: /scroll right/i });
    expect(rightArrow).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /scroll left/i })).not.toBeInTheDocument();

    fireEvent.click(rightArrow);
    expect(scrollByMock).toHaveBeenCalledWith(
      expect.objectContaining({
        left: 320,
        behavior: "smooth",
      })
    );
  });

  it("dynamically updates scroll arrows on window resize", () => {
    const clientWidthSpy = vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

    render(
      <MemoryRouter>
        <UpcomingEventsCarousel />
      </MemoryRouter>
    );

    expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();

    // Shrink viewport so content now overflows
    clientWidthSpy.mockReturnValue(500);
    act(() => {
      window.dispatchEvent(new Event("resize"));
    });

    expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument();
  });
});
