import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import EventsPage from "./page";
import i18n from "@/i18n";

const pageState = vi.hoisted(() => ({
  events: [] as unknown[],
  isLoading: false,
  fetchError: null as string | null,
  selectedDate: null as string | null,
  activeCategory: null as string | null,
  showFeatured: false,
  showSavedOnly: false,
  showHostModal: false,
  rsvpdEvents: new Set<string>(),
  savedEvents: new Set<string>(),
  searchQuery: "",
  viewMode: "list" as "list" | "map",
  filteredEvents: [] as unknown[],
  savedVisibleEvents: [] as unknown[],
  featuredEvents: [] as unknown[],
  eventsThisMonth: 0,
  hasActiveFilters: false,
}));

vi.mock("@/pages/home/components/Navbar", () => ({ default: () => null }));
vi.mock("@/pages/home/components/Footer", () => ({ default: () => null }));
vi.mock("@/context/AuthContext", () => ({ useAuth: () => ({ isAdmin: false }) }));
vi.mock("./components/EventHero", () => ({ default: () => null }));
vi.mock("./components/CalendarStrip", () => ({ default: () => null }));
vi.mock("./components/EventCard", () => ({ default: () => null }));
vi.mock("./components/EventFilters", () => ({ default: () => null }));
vi.mock("./components/EventSearch", () => ({ default: () => null }));
vi.mock("./components/ViewToggle", () => ({ default: () => null }));
vi.mock("./components/MapView", () => ({ default: () => null }));
vi.mock("./components/HostEventModal", () => ({ default: () => null }));
vi.mock("./useEventsPage", () => ({
  useEventsPage: () => ({
    ...pageState,
    setSelectedDate: vi.fn(),
    setActiveCategory: vi.fn(),
    setShowFeatured: vi.fn(),
    setShowSavedOnly: vi.fn(),
    setShowHostModal: vi.fn(),
    setSearchQuery: vi.fn(),
    setViewMode: vi.fn(),
    clearAllFilters: vi.fn(),
    loadEvents: vi.fn(),
    handleRsvp: vi.fn(),
    handleCancelRsvp: vi.fn(),
    handleEventCreated: vi.fn(),
    handleSave: vi.fn(),
    handleUnsave: vi.fn(),
    ToastContainer: () => null,
  }),
}));

describe("EventsPage states", () => {
  beforeEach(() => {
    Object.assign(pageState, {
      events: [],
      isLoading: false,
      fetchError: null,
      selectedDate: null,
      activeCategory: null,
      showFeatured: false,
      showSavedOnly: false,
      searchQuery: "",
      viewMode: "list",
      filteredEvents: [],
      savedVisibleEvents: [],
      featuredEvents: [],
      hasActiveFilters: false,
    });
  });

  afterEach(async () => {
    await i18n.changeLanguage("en");
  });

  it("shows an honest localized state when no upcoming events are published", async () => {
    await i18n.changeLanguage("ru");
    render(<EventsPage />);

    expect(
      screen.getByRole("heading", { name: "Сейчас нет опубликованных предстоящих мероприятий" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Следите за обновлениями — новые мероприятия сообщества появятся здесь."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/текущим фильтрам/)).not.toBeInTheDocument();
  });

  it("surfaces API errors instead of presenting an empty event list", () => {
    pageState.fetchError = "Events API unavailable";
    render(<EventsPage />);

    expect(screen.getByRole("alert")).toHaveTextContent("Events API unavailable");
    expect(screen.queryByText("No events found")).not.toBeInTheDocument();
  });

  it("localizes active-filter results and controls", async () => {
    await i18n.changeLanguage("ru");
    Object.assign(pageState, {
      hasActiveFilters: true,
      searchQuery: "пляж",
      showSavedOnly: true,
      savedEvents: new Set(["saved-1"]),
    });

    render(<EventsPage />);

    expect(screen.getByText("Найдено мероприятий: 0")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Очистить поиск" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Очистить фильтр сохранённых" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Очистить все фильтры" })).toBeInTheDocument();
  });
});
