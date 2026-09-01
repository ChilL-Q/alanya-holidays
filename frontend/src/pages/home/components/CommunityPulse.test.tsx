import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { forumService } from "@/api-services/forum.service";
import CommunityPulse from "./CommunityPulse";
import i18n from "@/i18n";

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
  image: "/images/home/cleopatra_beach.webp",
  isFeatured: true,
  slug: "digital-nomad-beach-meetup",
};

describe("CommunityPulse", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    vi.spyOn(eventsService, "getEvents").mockResolvedValue([event]);
    vi.spyOn(forumService, "getForumStats").mockResolvedValue({
      totalDiscussions: 10,
      activeMembers: 25,
      questionsAnswered: 8,
      localExperts: 3,
    });
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("en");
  });

  it("requests only the next three upcoming events", async () => {
    render(
      <MemoryRouter>
        <CommunityPulse />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(eventsService.getEvents).toHaveBeenCalledWith({ upcomingOnly: true, limit: 3 });
    });
  });

  it("links an event to the existing events search", async () => {
    render(
      <MemoryRouter>
        <CommunityPulse />
      </MemoryRouter>,
    );

    const eventLink = await screen.findByRole("link", { name: new RegExp(event.title, "i") });
    expect(eventLink).toHaveAttribute("href", `/events?q=${encodeURIComponent(event.title)}`);
  });

  it("does not show invented member activity when stats cannot be loaded", async () => {
    vi.mocked(forumService.getForumStats).mockRejectedValueOnce(new Error("Stats unavailable"));

    render(
      <MemoryRouter>
        <CommunityPulse />
      </MemoryRouter>,
    );

    expect(await screen.findByText(/Join the conversations, attend meetups/i)).toBeInTheDocument();
    expect(screen.queryByText(/1,240 members/i)).not.toBeInTheDocument();
  });

  it("localizes the section copy and count sentence in Russian", async () => {
    await i18n.changeLanguage("ru");
    render(
      <MemoryRouter>
        <CommunityPulse />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "Пульс сообщества" })).toBeInTheDocument();
    expect(await screen.findByText(/25 участников общаются в сообществе/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Все мероприятия" })).toHaveAttribute("href", "/events");
  });

  it("surfaces the events API failure instead of presenting it as an honest empty schedule", async () => {
    vi.mocked(eventsService.getEvents).mockRejectedValueOnce(new Error("Events API unavailable"));
    render(
      <MemoryRouter>
        <CommunityPulse />
      </MemoryRouter>,
    );

    expect(await screen.findByRole("alert")).toHaveTextContent("Events API unavailable");
    expect(screen.queryByText("More events are coming soon")).not.toBeInTheDocument();
  });
});
