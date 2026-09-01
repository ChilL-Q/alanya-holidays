import { useState } from "react";
import { afterEach, describe, it, expect } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import CalendarStrip from "./CalendarStrip";
import type { ForumEvent } from "@/api-services/events.service";
import i18n from "@/i18n";

const events: ForumEvent[] = [
  {
    id: "ev-cal-1",
    title: "Sunrise Gathering",
    date: "2026-09-10",
    day: "10",
    month: "SEP",
    time: "07:00",
    location: "Cleopatra Beach",
    category: "Beach Gatherings",
    attendees: 12,
    maxAttendees: 40,
    host: "Alanya Crew",
    hostAvatar: "https://example.com/avatar-1.jpg",
    description: "Start the day together by the sea.",
    image: "https://example.com/event-1.jpg",
    isFeatured: false,
    going_by_me: false,
  },
  {
    id: "ev-cal-2",
    title: "Harbor Networking Night",
    date: "2026-09-12",
    day: "12",
    month: "SEP",
    time: "18:00",
    location: "Alanya Harbor",
    category: "Business Networking",
    attendees: 8,
    maxAttendees: 25,
    host: "Local Friends",
    hostAvatar: "https://example.com/avatar-2.jpg",
    description: "Founders and remote workers meetup.",
    image: "https://example.com/event-2.jpg",
    isFeatured: false,
    going_by_me: false,
  },
];

function StatefulCalendarStrip({ initialDate = null }: { initialDate?: string | null }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(initialDate);

  return (
    <>
      <CalendarStrip events={events} selectedDate={selectedDate} onDateSelect={setSelectedDate} />
      <output data-testid="selected-date">{selectedDate ?? "ALL"}</output>
    </>
  );
}

describe("CalendarStrip", () => {
  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("supports arrow key navigation between calendar options", () => {
    render(<StatefulCalendarStrip initialDate="2026-09-10" />);

    const selectedDate = screen.getByTestId("selected-date");
    const septemberTenth = screen.getByRole("option", { name: /Thursday, September 10, has events/i });

    septemberTenth.focus();
    fireEvent.keyDown(septemberTenth, { key: "ArrowRight" });
    expect(selectedDate).toHaveTextContent("2026-09-11");

    const septemberEleventh = screen.getByRole("option", { name: /Friday, September 11/i });
    expect(septemberEleventh).toHaveFocus();

    fireEvent.keyDown(septemberEleventh, { key: "ArrowLeft" });
    expect(selectedDate).toHaveTextContent("2026-09-10");
  });

  it("reserves month-label space for every date tile so month transitions do not shift layout", () => {
    render(<StatefulCalendarStrip initialDate="2026-09-10" />);

    const septemberTenth = screen.getByRole("option", { name: /Thursday, September 10, has events/i });
    expect(septemberTenth.querySelector(".invisible")).toBeTruthy();
  });

  it("supports Home and End keys for quick calendar navigation", () => {
    render(<StatefulCalendarStrip initialDate="2026-09-10" />);

    const selectedDate = screen.getByTestId("selected-date");
    const septemberTenth = screen.getByRole("option", { name: /Thursday, September 10, has events/i });

    septemberTenth.focus();
    fireEvent.keyDown(septemberTenth, { key: "Home" });
    expect(selectedDate).toHaveTextContent("ALL");
    expect(screen.getByRole("option", { name: /Show events for all dates/i })).toHaveFocus();

    const allDatesOption = screen.getByRole("option", { name: /Show events for all dates/i });
    fireEvent.keyDown(allDatesOption, { key: "End" });

    const options = screen.getAllByRole("option");
    expect(options.at(-1)).toHaveAttribute("aria-selected", "true");
    expect(options.at(-1)).toHaveFocus();
    expect(selectedDate).not.toHaveTextContent("ALL");
  });

  it("localizes calendar controls and date labels in Russian", async () => {
    await i18n.changeLanguage("ru");
    render(<StatefulCalendarStrip initialDate="2026-09-10" />);

    expect(screen.getByRole("button", { name: "Прокрутить календарь влево" })).toBeInTheDocument();
    expect(screen.getByRole("listbox", { name: "Даты мероприятий" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: /четверг, 10 сентября, есть мероприятия/i })).toBeInTheDocument();
    expect(screen.getAllByText("ЧТ").length).toBeGreaterThan(0);
  });
});
