import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import UpcomingEventsCarousel from "./UpcomingEventsCarousel";
import { eventsService } from "@/api-services/events.service";

describe("Adversarial Stress Test: UpcomingEventsCarousel", () => {
  const originalScrollBy = Element.prototype.scrollBy;
  const originalResizeObserver = globalThis.ResizeObserver;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-08T12:00:00.000Z"));
    Element.prototype.scrollBy = vi.fn();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
    Element.prototype.scrollBy = originalScrollBy;
    globalThis.ResizeObserver = originalResizeObserver;
    vi.restoreAllMocks();
  });

  describe("Edge Case 1: 0 events in date window", () => {
    it("renders null and attaches no DOM listeners when event list is empty", () => {
      vi.spyOn(eventsService, "getEventsSync").mockReturnValue([]);
      vi.spyOn(eventsService, "getEvents").mockResolvedValue([]);

      const windowAddListenerSpy = vi.spyOn(window, "addEventListener");

      const { container } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
      expect(screen.queryByText(/This Week's Events/i)).not.toBeInTheDocument();
      expect(windowAddListenerSpy).not.toHaveBeenCalled();
    });

    it("renders null when all events fall outside the target week (2026-06-05 to 2026-06-12)", () => {
      const outsideEvents = [
        {
          id: "past-1",
          title: "Past Event",
          date: "2026-05-01",
          time: "10:00 AM",
          location: "Alanya Center, Alanya",
          category: "Culture",
          image: "https://images.unsplash.com/photo-1",
          attendees: 10,
          maxAttendees: 50,
          day: "01",
          month: "MAY",
          host: "Alanya Cultural Hub",
          hostAvatar: "https://images.unsplash.com/avatar-1",
          description: "Past cultural festival in Alanya center.",
          isFeatured: false,
        },
        {
          id: "future-1",
          title: "Future Event",
          date: "2026-07-20",
          time: "18:00",
          location: "Cleopatra Beach, Alanya",
          category: "Sports",
          image: "https://images.unsplash.com/photo-2",
          attendees: 5,
          maxAttendees: 20,
          day: "20",
          month: "JUL",
          host: "Beach Sports Club",
          hostAvatar: "https://images.unsplash.com/avatar-2",
          description: "Future beach volleyball meetup.",
          isFeatured: false,
        },
      ];

      vi.spyOn(eventsService, "getEventsSync").mockReturnValue(outsideEvents);
      vi.spyOn(eventsService, "getEvents").mockResolvedValue(outsideEvents);

      const { container } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Edge Case 2: 1 event on wide desktop container", () => {
    it("renders heading and cards but hides both left and right scroll buttons on 1440px viewport", () => {
      const singleEvent = [
        {
          id: "single-1",
          title: "Sole Weekly Event",
          date: "2026-06-08",
          time: "19:00",
          location: "Harbor Walk, Alanya",
          category: "Meetup",
          image: "https://images.unsplash.com/photo-1",
          attendees: 15,
          maxAttendees: 30,
          day: "08",
          month: "JUN",
          host: "Single Host",
          hostAvatar: "https://example.com/avatar3.jpg",
          description: "Single event description",
          isFeatured: true,
        },
      ];

      vi.spyOn(eventsService, "getEventsSync").mockReturnValue(singleEvent);
      vi.spyOn(eventsService, "getEvents").mockResolvedValue(singleEvent);

      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(1440);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(560);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

      render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      expect(screen.getByText(/This Week's Events/i)).toBeInTheDocument();
      expect(screen.getByText("1")).toBeInTheDocument();
      expect(screen.getByText("Sole Weekly Event")).toBeInTheDocument();
      expect(screen.getByText(/Browse All Events/i)).toBeInTheDocument();

      expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /scroll left/i })).not.toBeInTheDocument();
    });
  });

  describe("Edge Case 3: Multiple events with container overflow & scroll navigation", () => {
    it("handles full lifecycle: initial overflow right -> middle scroll -> end of track", () => {
      const scrollByMock = vi.fn();
      Element.prototype.scrollBy = scrollByMock;

      let currentScrollLeft = 0;
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1200);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => currentScrollLeft);

      const { container } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      const scrollTrack = container.querySelector(".overflow-x-auto") as HTMLDivElement;
      expect(scrollTrack).toBeInTheDocument();

      // At start: right arrow visible, left arrow hidden
      const rightArrow = screen.getByRole("button", { name: /scroll right/i });
      expect(rightArrow).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /scroll left/i })).not.toBeInTheDocument();

      // Click right arrow -> scrollBy called with +320
      fireEvent.click(rightArrow);
      expect(scrollByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          left: 320,
          behavior: "smooth",
        })
      );

      // Simulate scroll to middle (scrollLeft = 400)
      currentScrollLeft = 400;
      act(() => {
        fireEvent.scroll(scrollTrack);
      });

      // In middle: both left and right arrows visible
      expect(screen.getByRole("button", { name: /scroll left/i })).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument();

      // Click left arrow -> scrollBy called with -320
      const leftArrow = screen.getByRole("button", { name: /scroll left/i });
      fireEvent.click(leftArrow);
      expect(scrollByMock).toHaveBeenCalledWith(
        expect.objectContaining({
          left: -320,
          behavior: "smooth",
        })
      );

      // Simulate scroll to end (scrollLeft = 800, which is scrollWidth 1200 - clientWidth 400)
      currentScrollLeft = 800;
      act(() => {
        fireEvent.scroll(scrollTrack);
      });

      // At end: left arrow visible, right arrow hidden
      expect(screen.getByRole("button", { name: /scroll left/i })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();
    });

    it("verifies sub-pixel 4px boundary tolerance", () => {
      let currentScrollLeft = 2; // <= 4: considered start
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockImplementation(() => currentScrollLeft);

      const { container } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      const scrollTrack = container.querySelector(".overflow-x-auto") as HTMLDivElement;

      // scrollLeft = 2: left arrow should NOT appear
      expect(screen.queryByRole("button", { name: /scroll left/i })).not.toBeInTheDocument();

      // scrollLeft = 6: left arrow SHOULD appear
      currentScrollLeft = 6;
      act(() => {
        fireEvent.scroll(scrollTrack);
      });
      expect(screen.getByRole("button", { name: /scroll left/i })).toBeInTheDocument();

      // scrollLeft = 598 (scrollWidth 1000 - clientWidth 400 - 2): right arrow should NOT appear (within 4px of end)
      currentScrollLeft = 598;
      act(() => {
        fireEvent.scroll(scrollTrack);
      });
      expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();

      // scrollLeft = 592 (scrollWidth 1000 - clientWidth 400 - 8): right arrow SHOULD appear
      currentScrollLeft = 592;
      act(() => {
        fireEvent.scroll(scrollTrack);
      });
      expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument();
    });
  });

  describe("Edge Case 4: Dynamic Viewport Resizing and ResizeObserver", () => {
    it("responds dynamically to both window resize events and ResizeObserver notifications", () => {
      let resizeCallback: (() => void) | null = null;
      class MockResizeObserver {
        constructor(callback: () => void) {
          resizeCallback = callback;
        }
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = vi.fn();
      }
      globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      let clientWidthVal = 1400;
      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockImplementation(() => clientWidthVal);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(800);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

      render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();

      // Shrink via Window resize
      clientWidthVal = 500;
      act(() => {
        window.dispatchEvent(new Event("resize"));
      });
      expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument();

      // Expand via ResizeObserver callback
      clientWidthVal = 1200;
      act(() => {
        if (resizeCallback) resizeCallback();
      });
      expect(screen.queryByRole("button", { name: /scroll right/i })).not.toBeInTheDocument();
    });

    it("gracefully runs when ResizeObserver is undefined (SSR / fallback environment)", () => {
      delete (globalThis as Record<string, unknown>).ResizeObserver;

      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

      expect(() => {
        render(
          <MemoryRouter>
            <UpcomingEventsCarousel />
          </MemoryRouter>
        );
      }).not.toThrow();

      expect(screen.getByRole("button", { name: /scroll right/i })).toBeInTheDocument();
    });
  });

  describe("Edge Case 5: Event Listener Cleanup and Safe Unmount", () => {
    it("cleans up scroll, window resize listeners and disconnects ResizeObserver on unmount", () => {
      const disconnectSpy = vi.fn();
      class MockResizeObserver {
        observe = vi.fn();
        unobserve = vi.fn();
        disconnect = disconnectSpy;
      }
      globalThis.ResizeObserver = MockResizeObserver as unknown as typeof ResizeObserver;

      const windowRemoveListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      unmount();

      expect(windowRemoveListenerSpy).toHaveBeenCalledWith("resize", expect.any(Function));
      expect(disconnectSpy).toHaveBeenCalled();
    });

    it("does not throw or leak state when unmounted during pending setTimeout after scroll button click", () => {
      vi.useFakeTimers();

      vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(400);
      vi.spyOn(HTMLElement.prototype, "scrollWidth", "get").mockReturnValue(1000);
      vi.spyOn(HTMLElement.prototype, "scrollLeft", "get").mockReturnValue(0);

      const { unmount } = render(
        <MemoryRouter>
          <UpcomingEventsCarousel />
        </MemoryRouter>
      );

      const rightArrow = screen.getByRole("button", { name: /scroll right/i });
      fireEvent.click(rightArrow);

      // Unmount immediately before the 350ms timeout fires
      unmount();

      // Fast-forward timers past the 350ms timeout
      expect(() => {
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }).not.toThrow();

      vi.useRealTimers();
    });
  });
});
