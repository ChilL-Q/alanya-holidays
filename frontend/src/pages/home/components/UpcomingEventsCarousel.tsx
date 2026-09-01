import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

export default function UpcomingEventsCarousel() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [allEvents, setAllEvents] = useState<ForumEvent[]>(() => eventsService.getEventsSync());
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    let mounted = true;
    eventsService.getEvents().then((data) => {
      if (mounted && data) setAllEvents(data);
    }).catch(() => {});
    return () => {
      mounted = false;
    };
  }, []);

  const thisWeekEvents = useMemo(() => {
    const windowStart = new Date();
    windowStart.setHours(0, 0, 0, 0);
    const windowEnd = new Date(windowStart);
    windowEnd.setDate(windowEnd.getDate() + 7);

    return allEvents
      .filter((e) => {
        const eventDate = new Date(e.date + "T00:00:00");
        return eventDate >= windowStart && eventDate < windowEnd;
      })
      .sort((a, b) => new Date(a.date + "T00:00:00").getTime() - new Date(b.date + "T00:00:00").getTime());
  }, [allEvents]);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || thisWeekEvents.length === 0) return;

    checkScroll();

    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      resizeObserver = new ResizeObserver(() => {
        checkScroll();
      });
      resizeObserver.observe(el);
    }

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver?.disconnect();
    };
  }, [thisWeekEvents.length, checkScroll]);

  const scroll = (direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 320;
    el.scrollBy({
      left: direction === "left" ? -amount : amount,
      behavior: "smooth",
    });
    setTimeout(checkScroll, 350);
  };

  if (thisWeekEvents.length === 0) {
    return (
      <div className="mt-10 w-full">
        <div className="mb-4 flex items-center gap-2">
          <i className="ri-calendar-event-line text-lg text-white/80"></i>
          <h3 className="font-heading text-lg text-white">{t("home.thisWeeksEvents")}</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/50">0</span>
        </div>
        <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-white/80">
              <i className="ri-calendar-line text-lg"></i>
            </div>
            <div>
              <p className="text-sm font-medium text-white">{t("home.noEventsThisWeek")}</p>
              <p className="text-xs text-white/60">{t("home.noEventsThisWeekHint")}</p>
            </div>
          </div>
          <Link
            to="/events"
            className="inline-flex shrink-0 items-center justify-center gap-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-foreground-900 transition-colors hover:bg-white/90"
          >
            {t("home.browseAllEvents")}
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-10">
      {/* Heading */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <i className="ri-calendar-event-line text-white/80 text-lg"></i>
          <h3 className="font-heading text-white text-lg">
            {t("home.thisWeeksEvents", "This Week's Events")}
          </h3>
          <span className="text-white/50 text-xs px-2 py-0.5 rounded-full bg-white/10">
            {thisWeekEvents.length}
          </span>
        </div>
        <Link
          to="/events"
          className="inline-flex items-center gap-1 text-white/70 text-sm hover:text-white transition-colors cursor-pointer whitespace-nowrap"
        >
          {t("home.viewAll", "View All")}
          <i className="ri-arrow-right-line"></i>
        </Link>
      </div>

      {/* Carousel */}
      <div className="relative">
        {/* Left Arrow */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm"
            aria-label={t("home.scrollLeft", "Scroll left")}
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
        )}

        {/* Right Arrow */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer backdrop-blur-sm"
            aria-label={t("home.scrollRight", "Scroll right")}
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        )}

        {/* Scrollable Track */}
        <div
          ref={scrollRef}
          onScroll={checkScroll}
          className="flex gap-4 overflow-x-auto scrollbar-hide pb-2"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {thisWeekEvents.map((event) => (
            <Link
              key={event.id}
              to="/events"
              className="flex-shrink-0 w-64 group cursor-pointer"
            >
              {/* Card */}
              <div className="relative rounded-xl overflow-hidden bg-white/10 backdrop-blur-sm border border-white/10 hover:border-white/25 transition-all">
                {/* Image */}
                <div className="relative h-36 overflow-hidden">
                  <img
                    src={event.image}
                    alt={event.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                  {/* Date Badge */}
                  <div className="absolute top-3 left-3 bg-white text-foreground-900 rounded-lg px-2 py-1 text-center min-w-[44px]">
                    <p className="text-xs font-bold leading-tight">{event.day}</p>
                    <p className="text-[10px] leading-tight text-foreground-500">{event.month}</p>
                  </div>
                  {/* Category Tag */}
                  <span className="absolute top-3 right-3 bg-black/50 text-white/80 text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                    {event.category}
                  </span>
                </div>

                {/* Info */}
                <div className="p-3">
                  <h4 className="font-heading text-sm text-white mb-2 group-hover:text-white/90 transition-colors line-clamp-1">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 text-[11px] text-white/60">
                    <span className="flex items-center gap-1">
                      <i className="ri-time-line text-xs"></i>
                      {event.time}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line text-xs"></i>
                      {event.location.split(",")[0]}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <span className="flex items-center gap-1 text-[11px] text-white/50">
                      <i className="ri-user-line text-xs"></i>
                      {event.attendees} {t("home.going", "going")}
                    </span>
                    {event.attendees >= event.maxAttendees ? (
                      <span className="text-[10px] text-white/40 font-medium">{t("home.full", "Full")}</span>
                    ) : (
                      <span className="text-[10px] text-green-400 font-medium">
                        {event.maxAttendees - event.attendees} {t("home.spots", "spots")}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}

          {/* View All Card (shown when there are events) */}
          <Link
            to="/events"
            className="flex-shrink-0 w-64 flex flex-col items-center justify-center rounded-xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/25 hover:bg-white/10 transition-all group cursor-pointer min-h-[250px]"
          >
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:bg-white/20 transition-colors">
              <i className="ri-calendar-2-line text-white text-xl"></i>
            </div>
            <p className="text-white/80 text-sm font-medium mb-1">{t("home.browseAllEvents", "Browse All Events")}</p>
            <p className="text-white/40 text-xs">
              {allEvents.length} {t("home.upcoming", "upcoming")}
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
