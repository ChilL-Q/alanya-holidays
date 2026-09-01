import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
import MapView from "./MapView";
import type { ForumEvent } from "@/api-services/events.service";
import i18n from "@/i18n";

const loaderState = vi.hoisted(() => ({
  isLoaded: false,
  loadError: undefined as unknown,
}));

const fakeMap = vi.hoisted(() => ({
  panTo: vi.fn(),
  setZoom: vi.fn(),
  fitBounds: vi.fn(),
}));

vi.mock("@react-google-maps/api", () => ({
  useJsApiLoader: () => loaderState,
  GoogleMap: ({ children, onLoad, onUnmount }: { children: React.ReactNode; onLoad?: (map: unknown) => void; onUnmount?: () => void }) => {
    React.useEffect(() => {
      onLoad?.(fakeMap);
      return () => onUnmount?.();
    }, [onLoad, onUnmount]);

    return <div data-testid="google-map">{children}</div>;
  },
  MarkerF: ({ title, label, onClick }: { title?: string; label?: { text?: string }; onClick?: () => void }) => (
    <button type="button" data-testid="map-marker" aria-label={title} onClick={onClick}>
      marker-{label?.text || "0"}
    </button>
  ),
  InfoWindowF: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="info-window">{children}</div>
  ),
}));

const mappedEventA: ForumEvent = {
  id: "ev-map-1",
  title: "Sunrise Gathering",
  date: "2026-09-10",
  day: "10",
  month: "SEP",
  time: "07:00",
  location: "Cleopatra Beach, Alanya",
  category: "Beach Gatherings",
  attendees: 12,
  maxAttendees: 40,
  host: "Alanya Crew",
  hostAvatar: "https://example.com/avatar-1.jpg",
  description: "Start the day together by the sea.",
  image: "https://example.com/event-1.jpg",
  isFeatured: true,
  going_by_me: false,
};

const mappedEventB: ForumEvent = {
  id: "ev-map-2",
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
};

const aliasMatchedEvent: ForumEvent = {
  id: "ev-map-2b",
  title: "Harbour Sunset Meetup",
  date: "2026-09-12",
  day: "12",
  month: "SEP",
  time: "19:30",
  location: "Alanya Harbour",
  category: "Business Networking",
  attendees: 6,
  maxAttendees: 18,
  host: "Harbor Crew",
  hostAvatar: "https://example.com/avatar-2b.jpg",
  description: "Alternate spelling should still resolve to harbor coordinates.",
  image: "https://example.com/event-2b.jpg",
  isFeatured: false,
  going_by_me: false,
};

const unmappedEvent: ForumEvent = {
  id: "ev-map-3",
  title: "Hidden Rooftop Meetup",
  date: "2026-09-13",
  day: "13",
  month: "SEP",
  time: "20:00",
  location: "Secret Rooftop, Alanya",
  category: "Expat Socials",
  attendees: 5,
  maxAttendees: 20,
  host: "Community Host",
  hostAvatar: "https://example.com/avatar-3.jpg",
  description: "Small sunset meetup at a private rooftop.",
  image: "https://example.com/event-3.jpg",
  isFeatured: false,
  going_by_me: false,
};

describe("MapView", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
    loaderState.isLoaded = false;
    loaderState.loadError = undefined;
    fakeMap.panTo.mockReset();
    fakeMap.setZoom.mockReset();
    fakeMap.fitBounds.mockReset();
    vi.unstubAllEnvs();
    (window as Window & { google?: unknown }).google = undefined;
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    (window as Window & { google?: unknown }).google = undefined;
    await i18n.changeLanguage("en");
  });

  it("shows fallback message when VITE_GOOGLE_MAPS_API_KEY is missing", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");

    render(
      <MapView
        events={[mappedEventA]}
        rsvpdEvents={new Set()}
        onRsvp={vi.fn()}
        onCancelRsvp={vi.fn()}
      />
    );

    expect(screen.getByText("The interactive event map is not available, but event locations are listed below.")).toBeInTheDocument();
    expect(screen.getByText("Cleopatra Beach")).toBeInTheDocument();
  });

  it("resolves normalized aliases and still flags truly unknown locations", () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    render(
      <MapView
        events={[mappedEventA, aliasMatchedEvent, unmappedEvent]}
        rsvpdEvents={new Set()}
        onRsvp={vi.fn()}
        onCancelRsvp={vi.fn()}
      />
    );

    expect(screen.getByText(/Map coverage note:/i)).toBeInTheDocument();
    expect(screen.getAllByText("No pin")).toHaveLength(1);
    expect(screen.getByText("Secret Rooftop, Alanya")).toBeInTheDocument();
    expect(screen.getByText("Alanya Harbor")).toBeInTheDocument();
    expect(screen.getByText(/1 location is shown in the list below but not yet pinned on the map/i)).toBeInTheDocument();
  });

  it("expands a location card and triggers RSVP from the location list", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
    const onRsvp = vi.fn();

    render(
      <MapView
        events={[mappedEventA]}
        rsvpdEvents={new Set()}
        onRsvp={onRsvp}
        onCancelRsvp={vi.fn()}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /Expand events for Cleopatra Beach/i }));

    expect(screen.getByText("Sunrise Gathering")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "RSVP for Sunrise Gathering" }));
    expect(onRsvp).toHaveBeenCalledWith("ev-map-1");
  });

  it("renders map markers, opens info window, and fits bounds for mapped locations", async () => {
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");
    loaderState.isLoaded = true;
    (window as Window & { google?: unknown }).google = {
      maps: {
        LatLngBounds: class {
          extend = vi.fn();
        },
      },
    };

    render(
      <MapView
        events={[mappedEventA, mappedEventB]}
        rsvpdEvents={new Set(["ev-map-2"])}
        onRsvp={vi.fn()}
        onCancelRsvp={vi.fn()}
      />
    );

    expect(screen.getByTestId("google-map")).toBeInTheDocument();
    expect(screen.getAllByTestId("map-marker")).toHaveLength(2);

    await waitFor(() => {
      expect(fakeMap.fitBounds).toHaveBeenCalled();
    });

    fireEvent.click(screen.getAllByTestId("map-marker")[1]);

    const infoWindow = screen.getByTestId("info-window");
    expect(infoWindow).toBeInTheDocument();
    expect(within(infoWindow).getByText("Harbor Networking Night")).toBeInTheDocument();
    expect(within(infoWindow).getByRole("button", { name: "Cancel RSVP for Harbor Networking Night" })).toBeInTheDocument();
  });

  it("localizes map fallback and coverage copy in Russian", async () => {
    await i18n.changeLanguage("ru");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key");

    render(
      <MapView
        events={[unmappedEvent]}
        rsvpdEvents={new Set()}
        onRsvp={vi.fn()}
        onCancelRsvp={vi.fn()}
      />,
    );

    expect(screen.getByText("Для отфильтрованных мероприятий пока нет координат на карте.")).toBeInTheDocument();
    expect(screen.getByText(/1 место показано в списке ниже/)).toBeInTheDocument();
    expect(screen.getByText("Без метки")).toBeInTheDocument();
  });
});
