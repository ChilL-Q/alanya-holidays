import type { ForumEvent } from "@/mocks/events";

interface CalendarStripProps {
  events: ForumEvent[];
  selectedDate: string | null;
  onDateSelect: (date: string | null) => void;
}

export default function CalendarStrip({ events, selectedDate, onDateSelect }: CalendarStripProps) {
  // Generate June 10 - August 10 date range
  const startDate = new Date("2026-06-10");
  const endDate = new Date("2026-08-10");
  const dates: Date[] = [];
  const current = new Date(startDate);
  while (current <= endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }

  const eventDates = new Set(events.map((e) => e.date));
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const dayNames = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

  // Find the range that's visible
  const scrollToToday = () => {
    const el = document.getElementById("calendar-today");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  // Scroll to today on mount
  setTimeout(scrollToToday, 200);

  let lastMonth = "";

  return (
    <section className="w-full bg-background-50 border-b border-background-200/50 sticky top-16 md:top-20 z-30">
      <div className="w-full px-4 md:px-8 lg:px-12">
        <div className="flex items-center gap-3 py-3">
          {/* Scroll left */}
          <button
            onClick={() => {
              const container = document.getElementById("calendar-scroll");
              if (container) container.scrollBy({ left: -200, behavior: "smooth" });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 transition-colors shrink-0"
          >
            <i className="ri-arrow-left-s-line text-foreground-600"></i>
          </button>

          {/* Scrollable dates */}
          <div
            id="calendar-scroll"
            className="flex-1 flex gap-1 overflow-x-auto scrollbar-hide"
          >
            {/* All Dates button */}
            <button
              onClick={() => onDateSelect(null)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[64px] shrink-0 transition-all ${
                selectedDate === null
                  ? "bg-primary-500 text-background-50"
                  : "bg-background-100 text-foreground-600 hover:bg-background-200"
              }`}
            >
              <span className="text-xs font-medium">ALL</span>
              <i className="ri-calendar-line text-sm"></i>
            </button>

            {dates.map((d) => {
              const dateStr = d.toISOString().split("T")[0];
              const hasEvent = eventDates.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === "2026-06-04"; // current date
              const thisMonth = monthNames[d.getMonth()];
              const showMonthLabel = thisMonth !== lastMonth;
              lastMonth = thisMonth;

              return (
                <button
                  key={dateStr}
                  id={isToday ? "calendar-today" : undefined}
                  onClick={() => onDateSelect(isSelected ? null : dateStr)}
                  className={`flex flex-col items-center gap-1 px-3 py-2 rounded-xl min-w-[56px] shrink-0 transition-all relative ${
                    isSelected
                      ? "bg-primary-500 text-background-50"
                      : hasEvent
                        ? "bg-accent-100 text-accent-800 hover:bg-accent-200"
                        : "bg-background-100 text-foreground-600 hover:bg-background-200"
                  } ${isToday && !isSelected ? "ring-2 ring-primary-300" : ""}`}
                >
                  {showMonthLabel && (
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${isSelected ? "text-background-50/70" : "text-foreground-400"}`}>
                      {thisMonth}
                    </span>
                  )}
                  <span className="text-xs font-medium">{dayNames[d.getDay()]}</span>
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
            onClick={() => {
              const container = document.getElementById("calendar-scroll");
              if (container) container.scrollBy({ left: 200, behavior: "smooth" });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-background-100 hover:bg-background-200 transition-colors shrink-0"
          >
            <i className="ri-arrow-right-s-line text-foreground-600"></i>
          </button>
        </div>
      </div>
    </section>
  );
}