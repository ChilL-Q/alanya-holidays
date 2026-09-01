import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";
import { BrowserRouter } from "react-router-dom";

const { mockGetThreads, mockGetMembers, mockGetEvents } = vi.hoisted(() => ({
  mockGetThreads: vi.fn(),
  mockGetMembers: vi.fn(),
  mockGetEvents: vi.fn(),
}));

vi.mock("@/api-services/forum.service", () => ({
  forumService: {
    getThreads: mockGetThreads,
    getMembers: mockGetMembers,
  },
}));

vi.mock("@/api-services/events.service", () => ({
  eventsService: {
    getEvents: mockGetEvents,
  },
}));

vi.mock("@/pages/home/components/Navbar", () => ({
  default: () => <div data-testid="mock-navbar">Navbar</div>,
}));

vi.mock("@/pages/home/components/Footer", () => ({
  default: () => <div data-testid="mock-footer">Footer</div>,
}));

import SearchPage from "./SearchPage";

describe("SearchPage (Server-Side Debounced Search)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockGetThreads.mockResolvedValue({
      threads: [
        {
          id: "thread-1",
          title: "Best Beaches in Alanya",
          excerpt: "Cleopatra beach is stunning...",
          author: "Elena Rostova",
          authorAvatar: "https://avatar.url/elena.jpg",
          category: "Beaches & Nature",
          replies: 12,
          views: 340,
          likes: 25,
          postedAt: "2 hours ago",
          isHot: true,
        },
      ],
      total: 1,
    });

    mockGetEvents.mockResolvedValue([
      {
        id: "event-1",
        title: "Alanya Expat Beach Volleyball",
        description: "Join us this Sunday at Cleopatra Beach",
        location: "Cleopatra Beach",
        category: "Expat Socials",
        date: "2026-08-30",
        day: "30",
        month: "AUG",
        time: "10:00 AM",
        attendees: 15,
        maxAttendees: 20,
        host: "Community Host",
        hostAvatar: "https://avatar.url/host.jpg",
        image: "https://image.url/volley.jpg",
        isFeatured: false,
      },
    ]);

    mockGetMembers.mockResolvedValue([
      {
        id: "member-1",
        fullName: "Elena Rostova",
        username: "elenar",
        bio: "Beach guide and digital nomad living in Alanya",
        role: "Community Guide",
        avatar: "https://avatar.url/elena.jpg",
        isOnline: true,
      },
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not fetch server results on mount when query is empty", () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    expect(mockGetThreads).not.toHaveBeenCalled();
    expect(mockGetEvents).not.toHaveBeenCalled();
    expect(screen.getByText("Search across the entire forum")).toBeInTheDocument();
  });

  it("debounces server requests by 300ms upon typing", async () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");

    // User types 'cleopatra'
    fireEvent.change(searchInput, { target: { value: "cleopatra" } });

    // Immediate check: before 300ms timer expires, no API calls
    expect(mockGetThreads).not.toHaveBeenCalled();
    expect(mockGetEvents).not.toHaveBeenCalled();

    // Advance timer by 200ms (still below 300ms)
    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(mockGetThreads).not.toHaveBeenCalled();

    // Advance timer past 300ms
    await act(async () => {
      await vi.advanceTimersByTimeAsync(150);
    });

    expect(mockGetThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ search: "cleopatra" }),
      })
    );
    expect(mockGetEvents).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ search: "cleopatra" }),
      })
    );
  });

  it("renders search results, tabs, and counts when server responds", async () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");
    fireEvent.change(searchInput, { target: { value: "beach" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText(/Found 3 results for "beach"/i)).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /best beaches in alanya/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /alanya expat beach volleyball/i })).toBeInTheDocument();
    expect(screen.getAllByText("Elena Rostova").length).toBe(2);
  });

  it("allows switching between result tabs (Threads, Members, Events)", async () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");
    fireEvent.change(searchInput, { target: { value: "beach" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText("Threads (1)")).toBeInTheDocument();

    // Click Threads tab
    fireEvent.click(screen.getByText("Threads (1)"));
    expect(screen.getByRole("heading", { name: /best beaches in alanya/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /alanya expat beach volleyball/i })).not.toBeInTheDocument();

    // Click Events tab
    fireEvent.click(screen.getByText("Events (1)"));
    expect(screen.getByRole("heading", { name: /alanya expat beach volleyball/i })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: /best beaches in alanya/i })).not.toBeInTheDocument();
  });

  it("clears search input when clear button is clicked", async () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");
    fireEvent.change(searchInput, { target: { value: "alanya" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    const clearButton = screen.getByRole("button", { name: /clear/i });
    fireEvent.click(clearButton);

    expect(searchInput).toHaveValue("");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getByText("Search across the entire forum")).toBeInTheDocument();
  });

  it("handles empty results state gracefully", async () => {
    mockGetThreads.mockResolvedValue({ threads: [], total: 0 });
    mockGetEvents.mockResolvedValue([]);
    mockGetMembers.mockResolvedValue([]);

    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");
    fireEvent.change(searchInput, { target: { value: "nonexistentquery123" } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(screen.getAllByText("No results found").length).toBeGreaterThan(0);
    expect(screen.getByText("Try different keywords or check your spelling.")).toBeInTheDocument();
  });

  it("triggers search when clicking a suggestion chip", async () => {
    render(
      <BrowserRouter>
        <SearchPage />
      </BrowserRouter>
    );

    const chip = screen.getByText("Alanya beaches");
    fireEvent.click(chip);

    const searchInput = screen.getByPlaceholderText("Search threads, members, events...");
    expect(searchInput).toHaveValue("Alanya beaches");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(350);
    });

    expect(mockGetThreads).toHaveBeenCalledWith(
      expect.objectContaining({
        params: expect.objectContaining({ search: "Alanya beaches" }),
      })
    );
  });
});
