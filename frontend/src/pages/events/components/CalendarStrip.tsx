import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { ForumEvent } from "@/api-services/events.service";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface CalendarStripProps {
  events: ForumEvent[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

const formatLocalDate = (d: Date) => {
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
};

export default function CalendarStrip({ events, selectedDate, onDateSelect }: CalendarStripProps) {
  const { t, i18n } = useTranslation();
  const today = new Date();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const parsedEventDates = events
    .map((event) => new Date(`${event.date}T00:00:00`))
    .filter((date) => !Number.isNaN(date.getTime()));

  const firstEventDate = parsedEventDates.length > 0
    ? new Date(Math.min(...parsedEventDates.map((date) => date.getTime())))
    : today;
  const lastEventDate = parsedEventDates.length > 0
    ? new Date(Math.max(...parsedEventDates.map((date) => date.getTime())))
    : today;

  const startDate = new Date(firstEventDate < today ? firstEventDate : today);
  startDate.setDate(startDate.getDate() - 7);

  const endDate = new Date(lastEventDate > today ? lastEventDate : today);
  endDate.setDate(endDate.getDate() + 30);

  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const eventDates = new Set(events.map((e) => e.date));
  const monthFormatter = new Intl.DateTimeFormat(i18n.language, { month: "short" });
  const dayFormatter = new Intl.DateTimeFormat(i18n.language, { weekday: "short" });
  const accessibleDateFormatter = new Intl.DateTimeFormat(i18n.language, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  // Scroll to today on mount
  useEffect(() => {
    const scrollToToday = () => {
      const el = document.getElementById("calendar-today");
      if (el && typeof el.scrollIntoView === "function") {
        el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
      }
    };
    // small delay ensures DOM is fully painted with the scroll container
    const timer = setTimeout(scrollToToday, 100);
    return () => clearTimeout(timer);
  }, []);

  const focusCalendarOption = (targetIndex: number) => {
    const options = scrollContainerRef.current?.querySelectorAll<HTMLButtonElement>('[data-calendar-option="true"]');
    if (!options || options.length === 0) return;

    const clampedIndex = Math.max(0, Math.min(targetIndex, options.length - 1));
    const targetOption = options[clampedIndex];
    if (!targetOption) return;

    targetOption.focus();
    targetOption.click();
    if (typeof targetOption.scrollIntoView === "function") {
      targetOption.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const handleOptionKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>, currentIndex: number) => {
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"].includes(event.key)) {
      return;
    }

    event.preventDefault();

    const options = scrollContainerRef.current?.querySelectorAll<HTMLButtonElement>('[data-calendar-option="true"]');
    const optionCount = options?.length ?? 0;
    if (optionCount === 0) return;

    if (event.key === "Home") {
      focusCalendarOption(0);
      return;
    }

    if (event.key === "End") {
      focusCalendarOption(optionCount - 1);
      return;
    }

    const direction = event.key === "ArrowLeft" || event.key === "ArrowUp" ? -1 : 1;
    focusCalendarOption(currentIndex + direction);
  };

  let lastMonth = "";

  return (
    <section className="w-full bg-background-50 border-b border-background-200/50 sticky top-16 md:top-20 z-30">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 py-3">
          {/* Scroll left */}
          <button
            type="button"
            onClick={() => {
              const container = document.getElementById("calendar-scroll");
              if (container) container.scrollBy({ left: -200, behavior: "smooth" });
            }}
            aria-label={t("events.scrollCalendarLeft")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 transition-colors shrink-0"
          >
            <i className="ri-arrow-left-s-line text-foreground-600"></i>
          </button>

          {/* Scrollable dates */}
          <div
            id="calendar-scroll"
            ref={scrollContainerRef}
            className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide py-1 pr-1 scroll-px-1"
            role="listbox"
            aria-label={t("events.eventDates")}
          >
            {/* All Dates button */}
            <button
              type="button"
              role="option"
              data-calendar-option="true"
              tabIndex={selectedDate === null ? 0 : -1}
              onClick={() => onDateSelect(null)}
              onKeyDown={(event) => handleOptionKeyDown(event, 0)}
              aria-selected={selectedDate === null}
              aria-label={t("events.showAllDates")}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px] shrink-0 transition-all first:ml-1 ${
                selectedDate === null
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              <span className="text-xs font-medium">{t("public.all").toUpperCase()}</span>
              <i className="ri-calendar-line text-sm"></i>
            </button>

            {dates.map((d, dateIndex) => {
              const dateStr = formatLocalDate(d);
              const hasEvent = eventDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === formatLocalDate(new Date());
              const thisMonth = monthFormatter.format(d).replace(".", "").toUpperCase();
              const showMonthLabel = thisMonth !== lastMonth;
              lastMonth = thisMonth;

              return (
                <button
                  key={dateStr}
                  type="button"
                  role="option"
                  data-calendar-option="true"
                  tabIndex={isSelected ? 0 : -1}
                  id={isToday ? "calendar-today" : undefined}
                  onClick={() => onDateSelect(isSelected ? null : dateStr)}
                  onKeyDown={(event) => handleOptionKeyDown(event, dateIndex + 1)}
                  aria-selected={isSelected}
                  aria-current={isToday ? "date" : undefined}
                  aria-label={`${accessibleDateFormatter.format(d)}${hasEvent ? `, ${t("events.dateHasEvents")}` : ""}${isToday ? `, ${t("events.dateToday")}` : ""}`}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] shrink-0 transition-all relative last:mr-1 ${
                    isSelected
                      ? "bg-primary-500 text-background-50"
                      : hasEvent
                        ? "bg-accent-100 text-accent-800 hover:bg-accent-200"
                        : "bg-background-100 text-foreground-600 hover:bg-background-200"
                  } ${isToday && !isSelected ? "ring-2 ring-inset ring-primary-300" : ""}`}
                >
                  <span
                    aria-hidden={!showMonthLabel}
                    className={`text-[10px] font-bold uppercase tracking-wider min-h-[12px] ${
                      showMonthLabel
                        ? isSelected
                          ? "text-background-50/70"
                          : "text-foreground-400"
                        : "invisible"
                    }`}
                  >
                    {thisMonth}
                  </span>
                  <span className="text-xs font-medium">{dayFormatter.format(d).replace(".", "").toUpperCase()}</span>
                  <span className="text-base font-semibold">{d.getDate()}</span>
                  {hasEvent && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-accent-500"></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Scroll right */}
          <button
            type="button"
            onClick={() => {
              const container = document.getElementById("calendar-scroll");
              if (container) container.scrollBy({ left: 200, behavior: "smooth" });
            }}
            aria-label={t("events.scrollCalendarRight")}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 transition-colors shrink-0"
          >
            <i className="ri-arrow-right-s-line text-foreground-600"></i>
          </button>
        </div>
      </div>
    </section>
  );
}
