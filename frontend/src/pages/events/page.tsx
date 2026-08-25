import { useState, useMemo, useCallback, useEffect } from "react";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import EventHero from "./components/EventHero";
import CalendarStrip from "./components/CalendarStrip";
import EventCard from "./components/EventCard";
import EventFilters from "./components/EventFilters";
import EventSearch from "./components/EventSearch";
import ViewToggle from "./components/ViewToggle";
import MapView from "./components/MapView";
import HostEventModal from "./components/HostEventModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/useToast";
import ErrorState from "@/components/base/ErrorState";
import { logger } from "@/lib/logger";

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

export default function EventsPage() {
  const [events, setEvents] = useState<ForumEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showFeatured, setShowFeatured] = useState(false);
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [showHostModal, setShowHostModal] = useState(false);
  const [rsvpdEvents, setRsvpdEvents] = useState<Set<string>>(new Set());
  const [savedEvents, setSavedEvents] = useState<Set<string>>(() => loadSavedEvents());
  const { showToast, ToastContainer } = useToast();
  const { isAdmin } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"list" | "map">("list");

  const loadEvents = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const data = await eventsService.getEvents();
      setEvents(data);
      const myRsvps = new Set<string>();
      data.forEach((e) => {
        if (e.going_by_me) {
          myRsvps.add(e.id);
        }
      });
      if (myRsvps.size > 0) {
        setRsvpdEvents((prev) => new Set([...prev, ...myRsvps]));
      }
    } catch {
      setFetchError("Failed to load community events. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  useEffect(() => {
    saveSavedEvents(savedEvents);
  }, [savedEvents]);

  const handleRsvp = useCallback(async (eventId: string) => {
    setRsvpdEvents((prev) => new Set([...prev, eventId]));
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId ? { ...e, attendees: e.attendees + 1, going_by_me: true } : e
      )
    );

    try {
      await eventsService.toggleRsvp(eventId);
      const evt = events.find((e) => e.id === eventId);
      showToast(
        "You're going!",
        evt ? `${evt.title} — ${evt.month} ${evt.day} at ${evt.time}` : "See you there!",
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
        prev.map((e) =>
          e.id === eventId ? { ...e, attendees: Math.max(0, e.attendees - 1), going_by_me: false } : e
        )
      );
      showToast(
        "RSVP Failed",
        "Could not confirm your attendance. Please try again.",
        "error"
      );
    }
  }, [events, showToast]);

  const handleCancelRsvp = useCallback(async (eventId: string) => {
    setRsvpdEvents((prev) => {
      const next = new Set(prev);
      next.delete(eventId);
      return next;
    });
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, attendees: Math.max(0, e.attendees - 1), going_by_me: false }
          : e
      )
    );

    try {
      await eventsService.toggleRsvp(eventId);
      const evt = events.find((e) => e.id === eventId);
      showToast(
        "RSVP cancelled",
        evt ? `You're no longer attending ${evt.title}` : "Maybe next time!",
        "info"
      );
    } catch (err) {
      logger.warn("Failed to dispatch cancel RSVP on server, rolling back:", err);
      setRsvpdEvents((prev) => new Set([...prev, eventId]));
      setEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, attendees: e.attendees + 1, going_by_me: true } : e
        )
      );
      showToast(
        "Cancellation Failed",
        "Could not cancel RSVP. Please try again.",
        "error"
      );
    }
  }, [events, showToast]);

  const handleEventCreated = useCallback((newEvent: ForumEvent) => {
    setEvents((prev) => [newEvent, ...prev]);
    showToast(
      "Event created!",
      `${newEvent.title} has been submitted successfully`,
      "success"
    );
  }, [showToast]);

  const handleSave = useCallback((eventId: string) => {
    setSavedEvents((prev) => new Set([...prev, eventId]));
    const evt = events.find((e) => e.id === eventId);
    showToast(
      "Event saved!",
      evt ? `${evt.title} added to your saved events` : "Event bookmarked!",
      "success"
    );
  }, [events, showToast]);

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
      result = result.filter((e) => e.date === selectedDate);
    }

    if (activeCategory) {
      result = result.filter((e) => e.category === activeCategory);
    }

    if (showFeatured) {
      result = result.filter((e) => e.isFeatured);
    }

    if (showSavedOnly) {
      result = result.filter((e) => savedEvents.has(e.id));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.title.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.host.toLowerCase().includes(q)
      );
    }

    return result;
  }, [events, selectedDate, activeCategory, showFeatured, showSavedOnly, savedEvents, searchQuery]);

  const eventsThisMonth = useMemo(() => {
    return events.filter((e) => e.date.startsWith("2026-06")).length;
  }, [events]);

  const hasActiveFilters = !!(activeCategory || selectedDate || showFeatured || showSavedOnly || searchQuery.trim());

  const clearAllFilters = () => {
    setActiveCategory(null);
    setSelectedDate(null);
    setShowFeatured(false);
    setShowSavedOnly(false);
    setSearchQuery("");
  };

  return (
    <>
      <Navbar />
      <main>
        <EventHero totalEvents={events.length} eventsThisMonth={eventsThisMonth} onHostEvent={() => setShowHostModal(true)} showHostButton={isAdmin} />

        {/* Calendar Strip */}
        <CalendarStrip
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Main content */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-8 md:py-12">
          {/* Search + View Toggle row */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
            <div className="flex-1">
              <EventSearch query={searchQuery} onQueryChange={setSearchQuery} />
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

          {/* Filters */}
          <div className="mb-6">
            <EventFilters
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              showFeatured={showFeatured}
              onFeaturedToggle={setShowFeatured}
              showSaved={showSavedOnly}
              onSavedToggle={setShowSavedOnly}
            />
          </div>

          {/* Active filters indicator */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <p className="text-sm text-foreground-500">
                <span className="font-semibold text-foreground-900">{filteredEvents.length}</span>{" "}
                {filteredEvents.length === 1 ? "event" : "events"} found
              </p>
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                  &ldquo;{searchQuery.trim()}&rdquo;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="cursor-pointer hover:text-accent-900 transition-colors"
                    aria-label="Clear search"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </span>
              )}
              {showSavedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  Saved ({savedEvents.size})
                  <button
                    onClick={() => setShowSavedOnly(false)}
                    className="cursor-pointer hover:text-primary-900 transition-colors"
                    aria-label="Clear saved filter"
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 text-xs text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
              >
                <i className="ri-close-circle-line"></i>
                Clear all filters
              </button>
            </div>
          )}

          {/* Map View */}
          {viewMode === "map" && (
            <div>
              {filteredEvents.length > 0 ? (
                <MapView
                  events={filteredEvents}
                  rsvpdEvents={rsvpdEvents}
                  onRsvp={handleRsvp}
                  onCancelRsvp={handleCancelRsvp}
                />
              ) : (
                <div className="text-center py-16">
                  <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-4">
                    <i className="ri-search-line text-foreground-400 text-2xl"></i>
                  </div>
                  <h3 className="font-heading text-lg text-foreground-900 mb-2">
                    {searchQuery.trim() ? `No events match "${searchQuery.trim()}"` : showSavedOnly ? "No saved events" : "No events found"}
                  </h3>
                  <p className="text-foreground-500 text-sm mb-6">
                    {searchQuery.trim()
                      ? "Try searching with different keywords or clear the search to see all events."
                      : showSavedOnly
                        ? "You haven't saved any events yet. Browse and bookmark the ones you like!"
                        : "No events match your current filters. Try adjusting or clearing them."}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-refresh-line"></i>
                    Reset Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {/* List View */}
          {viewMode === "list" && (
            <>
              {/* Saved Events - show when no filters active and user has saved events */}
              {!hasActiveFilters && savedEvents.size > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-bookmark-fill text-primary-500"></i>
                    <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">Your Saved Events</span>
                    <span className="text-xs text-foreground-400 ml-1">{savedEvents.size}</span>
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">Don't Miss These</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {events
                      .filter((e) => savedEvents.has(e.id))
                      .map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isRsvpd={rsvpdEvents.has(event.id)}
                          isSaved={true}
                          onRsvp={handleRsvp}
                          onCancelRsvp={handleCancelRsvp}
                          onSave={handleSave}
                          onUnsave={handleUnsave}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* Featured Events - only show when no filters active */}
              {!hasActiveFilters && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-star-fill text-primary-500"></i>
                    <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">Featured</span>
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">Don't Miss These</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {events
                      .filter((e) => e.isFeatured)
                      .map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          isRsvpd={rsvpdEvents.has(event.id)}
                          isSaved={savedEvents.has(event.id)}
                          onRsvp={handleRsvp}
                          onCancelRsvp={handleCancelRsvp}
                          onSave={handleSave}
                          onUnsave={handleUnsave}
                        />
                      ))}
                  </div>
                </div>
              )}

              {/* All / Filtered Events */}
              <div>
                {!hasActiveFilters && (
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-calendar-check-line text-accent-500"></i>
                    <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">All Upcoming</span>
                  </div>
                )}
                <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">
                  {selectedDate
                    ? `Events on ${new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                      })}`
                    : activeCategory
                      ? activeCategory
                      : showFeatured
                        ? "Featured Events"
                        : showSavedOnly
                          ? "Your Saved Events"
                          : searchQuery.trim()
                            ? `Search results for "${searchQuery.trim()}"`
                            : "Upcoming Events"}
                </h2>

                {fetchError ? (
                  <ErrorState
                    title="Unable to load events"
                    message={fetchError}
                    onRetry={loadEvents}
                  />
                ) : isLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                      <div key={n} className="bg-background-50 rounded-xl border border-background-200/70 overflow-hidden animate-pulse">
                        <div className="w-full h-44 bg-background-200" />
                        <div className="p-4 space-y-3">
                          <div className="h-4 bg-background-200 rounded w-3/4" />
                          <div className="h-3 bg-background-100 rounded w-1/2" />
                          <div className="h-8 bg-background-100 rounded w-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : filteredEvents.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {filteredEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        isRsvpd={rsvpdEvents.has(event.id)}
                        isSaved={savedEvents.has(event.id)}
                        onRsvp={handleRsvp}
                        onCancelRsvp={handleCancelRsvp}
                        onSave={handleSave}
                        onUnsave={handleUnsave}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16">
                    <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-background-100 mb-4">
                      <i className={`${showSavedOnly ? "ri-bookmark-line" : "ri-search-line"} text-foreground-400 text-2xl`}></i>
                    </div>
                    <h3 className="font-heading text-lg text-foreground-900 mb-2">
                      {searchQuery.trim()
                        ? `No events match "${searchQuery.trim()}"`
                        : showSavedOnly
                          ? "No saved events yet"
                          : "No events found"}
                    </h3>
                    <p className="text-foreground-500 text-sm mb-6">
                      {searchQuery.trim()
                        ? "Try searching with different keywords or clear the search to see all events."
                        : showSavedOnly
                          ? "Bookmark events you're interested in and they'll show up here. Browse the list and click the bookmark icon to save them."
                          : "No events match your current filters. Try adjusting or clearing them."}
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-refresh-line"></i>
                      Reset Filters
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Host your own event CTA — backend event creation is admin-gated */}
          {isAdmin && (
            <div className="mt-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-8 md:p-10 text-center">
              <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
                Want to host your own event?
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto mb-6">
                Whether it is a beach cleanup, hiking trip, or coffee meetup — our community loves
                showing up. Create your event and we will help spread the word.
              </p>
              <button
                onClick={() => setShowHostModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors cursor-pointer"
              >
                Create an Event
                <i className="ri-arrow-right-line"></i>
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
      <HostEventModal
        isOpen={showHostModal}
        onClose={() => setShowHostModal(false)}
        onEventCreated={handleEventCreated}
      />
      <ToastContainer />
    </>
  );
}