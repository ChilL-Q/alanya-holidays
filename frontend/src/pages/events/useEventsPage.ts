import { useState, useMemo, useCallback, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { useToast } from "@/hooks/useToast";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import "@/i18n";

export type EventsViewMode = "list" | "map";

function parseViewMode(value: string | null): EventsViewMode {
  return value === "map" ? "map" : "list";
}

function parseFlag(value: string | null): boolean {
  return value === "1" || value === "true";
}

function loadSavedEvents(): Set<string> {
  try {
    const raw = localStorage.getItem("alanya-holidays-saved-events");
    if (raw) {
      const arr: string[] = JSON.parse(raw);
      if (Array.isArray(arr)) return new Set(arr);
    }
  } catch {
    // localStorage unavailable or data corrupted, start fresh
  }
  return new Set();
}

function saveSavedEvents(saved: Set<string>) {
  try {
    localStorage.setItem("alanya-holidays-saved-events", JSON.stringify([...saved]));
  } catch {
    // localStorage unavailable, silently ignore
  }
}

export function useEventsPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(searchParams.get("date"));
  const [activeCategory, setActiveCategory] = useState<string | null>(searchParams.get("category"));
  const [showFeatured, setShowFeatured] = useState(parseFlag(searchParams.get("featured")));
  const [showSavedOnly, setShowSavedOnly] = useState(parseFlag(searchParams.get("saved")));
  const [showHostModal, setShowHostModal] = useState(false);
  const [rsvpdEvents, setRsvpdEvents] = useState<Set<string>>(new Set());
  const [savedEvents, setSavedEvents] = useState<Set<string>>(() => loadSavedEvents());
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [viewMode, setViewMode] = useState<EventsViewMode>(parseViewMode(searchParams.get("view")));
  const { showToast, ToastContainer } = useToast();

  const eventLookup = useMemo(() => {
    return new Map(events.map((event) => [event.id, event]));
  }, [events]);

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await eventsService.getEvents({ upcomingOnly: true });
      setEvents(data);
      const myRsvps = new Set<string>();
      data.forEach((event) => {
        if (event.going_by_me) {
          myRsvps.add(event.id);
        }
      });
      setRsvpdEvents(myRsvps);
    } catch {
      setFetchError(t("events.loadErrorMessage"));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    saveSavedEvents(savedEvents);
  }, [savedEvents]);

  useEffect(() => {
    const nextSelectedDate = searchParams.get("date");
    const nextActiveCategory = searchParams.get("category");
    const nextSearchQuery = searchParams.get("q") || "";
    const nextViewMode = parseViewMode(searchParams.get("view"));
    const nextShowFeatured = parseFlag(searchParams.get("featured"));
    const nextShowSavedOnly = parseFlag(searchParams.get("saved"));

    setSelectedDate((prev) => (prev === nextSelectedDate ? prev : nextSelectedDate));
    setActiveCategory((prev) => (prev === nextActiveCategory ? prev : nextActiveCategory));
    setSearchQuery((prev) => (prev === nextSearchQuery ? prev : nextSearchQuery));
    setViewMode((prev) => (prev === nextViewMode ? prev : nextViewMode));
    setShowFeatured((prev) => (prev === nextShowFeatured ? prev : nextShowFeatured));
    setShowSavedOnly((prev) => (prev === nextShowSavedOnly ? prev : nextShowSavedOnly));
  }, [searchParams]);

  useEffect(() => {
    const next = new URLSearchParams(searchParams);

    if (selectedDate) next.set("date", selectedDate);
    else next.delete("date");

    if (activeCategory) next.set("category", activeCategory);
    else next.delete("category");

    if (searchQuery.trim()) next.set("q", searchQuery.trim());
    else next.delete("q");

    if (viewMode !== "list") next.set("view", viewMode);
    else next.delete("view");

    if (showFeatured) next.set("featured", "1");
    else next.delete("featured");

    if (showSavedOnly) next.set("saved", "1");
    else next.delete("saved");

    if (next.toString() !== searchParams.toString()) {
      setSearchParams(next, { replace: true });
    }
  }, [selectedDate, activeCategory, searchQuery, viewMode, showFeatured, showSavedOnly, searchParams, setSearchParams]);

  const handleRsvp = useCallback(async (eventId: string) => {
    const event = eventLookup.get(eventId);

    setRsvpdEvents((prev) => new Set([...prev, eventId]));
    setEvents((prev) =>
      prev.map((item) =>
        item.id === eventId ? { ...item, attendees: item.attendees + 1, going_by_me: true } : item
      )
    );

    try {
      await eventsService.toggleRsvp(eventId);
      showToast(
        "You're going!",
        event ? `${event.title} — ${event.month} ${event.day} at ${event.time}` : "See you there!",
        "success"
      );
    } catch (err) {
      logger.warn("Failed to dispatch RSVP on server, rolling back:", err);
      setRsvpdEvents((prev) => {
        const next = new Set(prev);
        next.delete(eventId);
        return next;
      });
      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId ? { ...item, attendees: Math.max(0, item.attendees - 1), going_by_me: false } : item
        )
      );
      showToast(
        "RSVP Failed",
        "Could not confirm your attendance. Please try again.",
        "error"
      );
    }
  }, [eventLookup, showToast]);

  const handleCancelRsvp = useCallback(async (eventId: string) => {
    const event = eventLookup.get(eventId);

    setRsvpdEvents((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    setEvents((prev) =>
      prev.map((item) =>
        item.id === eventId
          ? { ...item, attendees: Math.max(0, item.attendees - 1), going_by_me: false }
          : item
      )
    );

    try {
      await eventsService.toggleRsvp(eventId);
      showToast(
        "RSVP cancelled",
        event ? `You're no longer attending ${event.title}` : "Maybe next time!",
        "info"
      );
    } catch (err) {
      logger.warn("Failed to dispatch cancel RSVP on server, rolling back:", err);
      setRsvpdEvents((prev) => new Set([...prev, eventId]));
      setEvents((prev) =>
        prev.map((item) =>
          item.id === eventId ? { ...item, attendees: item.attendees + 1, going_by_me: true } : item
        )
      );
      showToast(
        "Cancellation Failed",
        "Could not cancel RSVP. Please try again.",
        "error"
      );
    }
  }, [eventLookup, showToast]);

  const handleEventCreated = useCallback((newEvent: ForumEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(
      "Event published!",
      `${newEvent.title} is now live on the events page`,
      "success"
    );
  }, [showToast]);

  const handleSave = useCallback((eventId: string) => {
    setSavedEvents((prev) => new Set([...prev, eventId]));
    const event = eventLookup.get(eventId);
    showToast(
      "Event saved!",
      event ? `${event.title} added to your saved events` : "Event bookmarked!",
      "success"
    );
  }, [eventLookup, showToast]);

  const handleUnsave = useCallback((eventId: string) => {
    setSavedEvents((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    showToast(
      "Removed",
      "Event removed from your saved list",
      "info"
    );
  }, [showToast]);

  const filteredEvents = useMemo(() => {
    let result = [...events];

    if (selectedDate) {
      result = result.filter((event) => event.date === selectedDate);
    }

    if (activeCategory) {
      result = result.filter((event) => event.category === activeCategory);
    }

    if (showFeatured) {
      result = result.filter((event) => event.isFeatured);
    }

    if (showSavedOnly) {
      result = result.filter((event) => savedEvents.has(event.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (event) =>
          event.title.toLowerCase().includes(q) ||
          event.location.toLowerCase().includes(q) ||
          event.host.toLowerCase().includes(q) ||
          event.category.toLowerCase().includes(q) ||
          event.description.toLowerCase().includes(q)
      );
    }

    return result;
  }, [events, selectedDate, activeCategory, showFeatured, showSavedOnly, savedEvents, searchQuery]);

  const eventsThisMonth = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const prefix = `${year}-${month}`;
    return events.filter((event) => event.date.startsWith(prefix)).length;
  }, [events]);

  const hasActiveFilters = !!(
    activeCategory ||
    selectedDate ||
    showFeatured ||
    showSavedOnly ||
    searchQuery.trim()
  );

  const savedVisibleEvents = useMemo(() => {
    return events.filter((event) => savedEvents.has(event.id));
  }, [events, savedEvents]);

  const featuredEvents = useMemo(() => {
    return events.filter((event) => event.isFeatured);
  }, [events]);

  const clearAllFilters = useCallback(() => {
    setActiveCategory(null);
    setSelectedDate(null);
    setShowFeatured(false);
    setShowSavedOnly(false);
    setSearchQuery("");
  }, []);

  return {
    events,
    isLoading,
    fetchError,
    selectedDate,
    setSelectedDate,
    activeCategory,
    setActiveCategory,
    showFeatured,
    setShowFeatured,
    showSavedOnly,
    setShowSavedOnly,
    showHostModal,
    setShowHostModal,
    rsvpdEvents,
    savedEvents,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    filteredEvents,
    savedVisibleEvents,
    featuredEvents,
    eventsThisMonth,
    hasActiveFilters,
    clearAllFilters,
    loadEvents,
    handleRsvp,
    handleCancelRsvp,
    handleEventCreated,
    handleSave,
    handleUnsave,
    ToastContainer,
  };
}
