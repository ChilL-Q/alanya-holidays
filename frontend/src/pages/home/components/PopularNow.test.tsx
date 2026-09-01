import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { logger } from "@/lib/logger";
import PopularNow from "./PopularNow";

const event: ForumEvent = {
  id: "event-1",
  title: "Digital Nomad Beach Meetup",
  date: "2026-06-20",
  day: "20",
  month: "JUN",
  time: "6:00 PM",
  location: "Cleopatra Beach, Alanya",
  category: "Beach Gatherings",
  attendees: 42,
  maxAttendees: 60,
  host: "Community Host",
  hostAvatar: "/images/placeholder-business.svg",
  description: "A beach meetup.",
  image: "/images/placeholder-business.svg",
  isFeatured: true,
  slug: "digital-nomad-beach-meetup",
};

describe("PopularNow", () => {
  const originalMatchMedia = window.matchMedia;

  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({
        matches: false,
        media: "(prefers-reduced-motion: reduce)",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    });
    vi.spyOn(eventsService, "getEvents").mockResolvedValue([event]);
    vi.spyOn(window, "requestAnimationFrame").mockImplementation(() => 1);
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
  });

  afterEach(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: originalMatchMedia,
    });
    vi.restoreAllMocks();
  });

  it("logs event loading failures while keeping the optional block hidden", async () => {
    const error = new Error("Events unavailable");
    vi.mocked(eventsService.getEvents).mockRejectedValueOnce(error);
    const warn = vi.spyOn(logger, "warn").mockImplementation(() => {});

    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(warn).toHaveBeenCalledWith("Failed to load popular events:", error);
    });
    expect(screen.queryByText(/Popular Now/i)).not.toBeInTheDocument();
  });

  it("requests only upcoming events", async () => {
    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(eventsService.getEvents).toHaveBeenCalledWith({ upcomingOnly: true });
    });
  });

  it("links each card to its event in the existing events search", async () => {
    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    const eventLink = await screen.findByRole("link", { name: new RegExp(event.title, "i") });
    expect(eventLink).toHaveAttribute(
      "href",
      `/events?q=${encodeURIComponent(event.title)}`,
    );
  });

  it("updates the right arrow when loaded content starts overflowing after resize", async () => {
    const clientWidth = vi
      .spyOn(HTMLElement.prototype, "clientWidth", "get")
      .mockReturnValue(1200);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(550);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    const rightArrow = await screen.findByRole("button", { name: /scroll right/i });
    await waitFor(() => expect(rightArrow).toBeDisabled());

    clientWidth.mockReturnValue(400);
    window.dispatchEvent(new Event("resize"));

    await waitFor(() => expect(rightArrow).toBeEnabled());
  });

  it("stops auto-scroll at the end without jumping back to the start", async () => {
    const frames: FrameRequestCallback[] = [];
    vi.mocked(window.requestAnimationFrame).mockImplementation((callback) => {
      frames.push(callback);
      return frames.length;
    });

    let scrollLeft = 49;
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(50);
    vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(100);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => scrollLeft);
    vi.spyOn(HTMLElement.prototype, "scrollLeft", "set").mockImplementation((value) => {
      scrollLeft = value;
    });

    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    expect(await screen.findByText(event.title)).toBeInTheDocument();
    await waitFor(() => expect(frames).toHaveLength(1));

    frames[0](0);
    expect(frames).toHaveLength(2);
    frames[1](1000);

    expect(scrollLeft).toBeGreaterThanOrEqual(48);
    expect(frames).toHaveLength(2);
  });

  it("pauses auto-scroll while keyboard focus is inside the event panel", async () => {
    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    const eventLink = await screen.findByRole("link", { name: new RegExp(event.title, "i") });
    await waitFor(() => expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1));

    fireEvent.focus(eventLink);

    await waitFor(() => {
      expect(window.cancelAnimationFrame).toHaveBeenCalledWith(1);
    });
  });

  it("does not auto-scroll when the user prefers reduced motion", async () => {
    vi.mocked(window.matchMedia).mockReturnValue({
      matches: true,
      media: "(prefers-reduced-motion: reduce)",
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    });

    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    expect(await screen.findByText(event.title)).toBeInTheDocument();
    await waitFor(() => expect(eventsService.getEvents).toHaveBeenCalledTimes(1));
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();
  });

  it("starts auto-scroll after asynchronously loaded events mount the carousel", async () => {
    render(
      <MemoryRouter>
        <PopularNow />
      </MemoryRouter>,
    );

    expect(screen.queryByText(event.title)).not.toBeInTheDocument();
    expect(window.requestAnimationFrame).not.toHaveBeenCalled();

    expect(await screen.findByText(event.title)).toBeInTheDocument();

    await waitFor(() => {
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(1);
    });
  });
});
