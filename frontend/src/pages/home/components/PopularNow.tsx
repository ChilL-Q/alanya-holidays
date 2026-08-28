import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { logger } from "@/lib/logger";

export default function PopularNow() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allEvents, setAllEvents] = useState<ForumEvent[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollStateRef = useRef({ left: false, right: false });

  useEffect(() => {
    let mounted = true;
    eventsService.getEvents({ upcomingOnly: true }).then((data) => {
      if (mounted && data) setAllEvents(data);
    }).catch((err) => {
      logger.warn("Failed to load popular events:", err);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const popularEvents = useMemo(() => {
    return [...allEvents]
      .sort((a, b) => b.attendees - a.attendees)
      .slice(0, 8);
  }, [allEvents]);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const canLeft = el.scrollLeft > 4;
    const canRight = el.scrollLeft < el.scrollWidth - el.clientWidth - 4;
    if (canLeft !== scrollStateRef.current.left) {
      scrollStateRef.current.left = canLeft;
      setCanScrollLeft(canLeft);
    }
    if (canRight !== scrollStateRef.current.right) {
      scrollStateRef.current.right = canRight;
      setCanScrollRight(canRight);
    }
  }, []);

  useEffect(() => {
    if (popularEvents.length === 0) return;

    updateScrollState();
    window.addEventListener("resize", updateScrollState);
    return () => window.removeEventListener("resize", updateScrollState);
  }, [popularEvents.length, updateScrollState]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({
      left: direction === "left" ? -340 : 340,
      behavior: "smooth",
    });
  };

  // requestAnimationFrame-based auto-scroll — no jank, no stacked animations
  useEffect(() => {
    if (isPaused || window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const el = scrollRef.current;
    if (!el) return;

    let rafId: number;
    let lastTs: number | null = null;
    const speed = 35; // px per second
    let remainder = 0;

    const tick = (ts: number) => {
      if (lastTs === null) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;

      remainder += speed * dt;

      if (remainder >= 1) {
        const px = Math.floor(remainder);
        el.scrollLeft += px;
        remainder -= px;

        const maxScrollLeft = el.scrollWidth - el.clientWidth;
        if (el.scrollLeft >= maxScrollLeft - 2) {
          el.scrollLeft = maxScrollLeft;
          updateScrollState();
          return;
        }
      }

      updateScrollState();
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPaused, popularEvents.length, updateScrollState]);

  if (popularEvents.length === 0) return null;

  return (
    <section className="relative z-20 -mt-6 mb-0">
      <div className="max-w-full mx-auto px-4 md:px-8 lg:px-12">
        <div
          className="bg-white rounded-2xl shadow-sm border border-background-200/70 px-5 py-4"
          onFocusCapture={() => setIsPaused(true)}
          onBlurCapture={(event) => {
            const nextTarget = event.relatedTarget;
            if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
              setIsPaused(false);
            }
          }}
        >
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              {/* Pulsing Live Indicator */}
              <div className="relative flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                <span className="text-xs font-bold text-red-500 tracking-wider uppercase animate-pulse">
                  Popular Now
                </span>
              </div>
              {/* Divider */}
              <span className="w-px h-4 bg-background-300/60 hidden sm:block"></span>
              <span className="text-xs text-foreground-500 hidden sm:block">
                Most attended events right now
              </span>
            </div>

            {/* Scroll Arrows */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => scroll("left")}
                disabled={!canScrollLeft}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                aria-label="Scroll left"
              >
                <i className="ri-arrow-left-s-line text-sm"></i>
              </button>
              <button
                onClick={() => scroll("right")}
                disabled={!canScrollRight}
                className="w-7 h-7 flex items-center justify-center rounded-full bg-background-100 text-foreground-600 hover:bg-background-200 disabled:opacity-30 disabled:cursor-default transition-colors cursor-pointer"
                aria-label="Scroll right"
              >
                <i className="ri-arrow-right-s-line text-sm"></i>
              </button>
            </div>
          </div>

          {/* Scrollable Cards */}
          <div
            ref={scrollRef}
            onScroll={updateScrollState}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="flex gap-3 overflow-x-auto scrollbar-hide pb-1"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {popularEvents.map((event, index) => (
              <Link
                key={event.id}
                to={`/events?q=${encodeURIComponent(event.title)}`}
                className="flex-shrink-0 w-[280px] group cursor-pointer"
              >
                <div className="flex items-center gap-3 p-2.5 rounded-xl bg-background-50 hover:bg-background-100 transition-colors border border-transparent hover:border-background-200/70">
                  {/* Rank Badge */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0
                      ? "bg-red-500 text-white"
                      : index === 1
                      ? "bg-orange-400 text-white"
                      : index === 2
                      ? "bg-amber-400 text-white"
                      : "bg-background-200 text-foreground-600"
                  }`}>
                    {index + 1}
                  </div>

                  {/* Event Image */}
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                    <img
                      src={event.image}
                      alt={event.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {index === 0 && (
                      <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center shadow-sm">
                        <i className="ri-fire-fill text-white text-[8px]"></i>
                      </div>
                    )}
                  </div>

                  {/* Event Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-heading text-sm text-foreground-900 group-hover:text-primary-500 transition-colors line-clamp-1 leading-tight">
                      {event.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-foreground-500 line-clamp-1">
                        {event.location.split(",")[0]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5">
                      <span className="flex items-center gap-1 text-[11px] text-foreground-400">
                        <i className="ri-calendar-line text-[10px]"></i>
                        {event.month} {event.day}
                      </span>
                      <span className={`flex items-center gap-1 text-[11px] font-medium ${
                        event.attendees >= 50
                          ? "text-red-500"
                          : event.attendees >= 30
                          ? "text-orange-500"
                          : "text-foreground-500"
                      }`}>
                        <i className="ri-group-line text-[10px]"></i>
                        {event.attendees} going
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}

            {/* View All Card */}
            <Link
              to="/events"
              className="flex-shrink-0 w-[200px] flex flex-col items-center justify-center rounded-xl bg-background-50 hover:bg-background-100 transition-colors border border-dashed border-background-300/60 group cursor-pointer min-h-[88px]"
            >
              <div className="w-8 h-8 rounded-full bg-primary-500/10 flex items-center justify-center mb-1.5 group-hover:bg-primary-500/20 transition-colors">
                <i className="ri-calendar-event-line text-primary-500 text-sm"></i>
              </div>
              <p className="text-foreground-700 text-xs font-medium">View All Events</p>
              <p className="text-foreground-400 text-[10px]">{allEvents.length} upcoming</p>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}