import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import HostEventModal from "./HostEventModal";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { forumService, type Category } from "@/api-services/forum.service";

vi.mock("@/api-services/events.service", () => ({
  eventsService: {
    createEvent: vi.fn(),
  },
}));

vi.mock("@/api-services/forum.service", () => ({
  forumService: {
    getCategories: vi.fn(),
  },
}));

const categoryId = "11111111-2222-4333-8444-555555555555";

const createdEvent: ForumEvent = {
  id: "event-1",
  title: "Sunset Sports Meetup",
  date: "2026-09-01",
  day: "01",
  month: "SEP",
  time: "18:00",
  location: "Cleopatra Beach",
  category: "Sports Activities",
  attendees: 0,
  maxAttendees: 50,
  host: "Admin",
  hostAvatar: "/images/placeholder-business.svg",
  description: "Join the community for an evening sports meetup.",
  image: "/images/placeholder-business.svg",
  isFeatured: false,
};

describe("HostEventModal", () => {
  beforeEach(() => {
    vi.mocked(forumService.getCategories).mockResolvedValue([
      {
        id: categoryId,
        name: "Sports Activities",
        slug: "events-sports",
      } as Category,
    ]);
    vi.mocked(eventsService.createEvent).mockResolvedValue(createdEvent);
  });

  it("submits the selected forum category UUID and shows the success state", async () => {
    const onEventCreated = vi.fn();
    render(<HostEventModal isOpen onClose={vi.fn()} onEventCreated={onEventCreated} />);

    const categorySelect = await screen.findByRole("combobox");
    const categoryOption = screen.getByRole("option", { name: "Sports Activities" });
    fireEvent.change(categorySelect, { target: { value: categoryOption.getAttribute("value") } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Sunset Yoga at Cleopatra Beach"), {
      target: { value: "Sunset Sports Meetup" },
    });
    fireEvent.change(screen.getByPlaceholderText("e.g. Cleopatra Beach, Alanya"), {
      target: { value: "Cleopatra Beach" },
    });
    fireEvent.change(
      screen.getByPlaceholderText("Describe the event — what to bring, what to expect, who is it for..."),
      { target: { value: "Join the community for an evening sports meetup." } },
    );
    fireEvent.change(document.querySelector('input[name="eventDate"]') as HTMLInputElement, {
      target: { value: "2026-09-01" },
    });
    fireEvent.change(document.querySelector('input[name="eventTime"]') as HTMLInputElement, {
      target: { value: "18:00" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Publish Event" }));

    await waitFor(() => {
      expect(eventsService.createEvent).toHaveBeenCalledWith(
        expect.objectContaining({ categoryId }),
      );
    });
    expect(onEventCreated).toHaveBeenCalledWith(createdEvent);
    expect(await screen.findByRole("heading", { name: "Event Published!" })).toBeInTheDocument();
  });
});
