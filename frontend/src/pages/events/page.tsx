import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import ErrorState from "@/components/base/ErrorState";
import { useAuth } from "@/context/AuthContext";
import EventHero from "./components/EventHero";
import CalendarStrip from "./components/CalendarStrip";
import EventCard from "./components/EventCard";
import EventFilters from "./components/EventFilters";
import EventSearch from "./components/EventSearch";
import ViewToggle from "./components/ViewToggle";
import MapView from "./components/MapView";
import HostEventModal from "./components/HostEventModal";
import { useEventsPage } from "./useEventsPage";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { eventCategoryLabel } from "./eventCategoryLabels";

export default function EventsPage() {
  const { t, i18n } = useTranslation();
  const { isAdmin } = useAuth();
  const {
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
  } = useEventsPage();

  return (
    <>
      <Navbar />
      <main>
        <EventHero
          totalEvents={events.length}
          eventsThisMonth={eventsThisMonth}
          onHostEvent={() => setShowHostModal(true)}
          showHostButton={isAdmin}
        />

        <CalendarStrip
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        <section className="w-full px-4 md:px-8 lg:px-12 pt-10 md:pt-12 pb-8 md:pb-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-5">
            <div className="flex-1">
              <EventSearch query={searchQuery} onQueryChange={setSearchQuery} />
            </div>
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>

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

          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <p className="text-sm text-foreground-500">
                {t("events.resultsFound", { count: filteredEvents.length })}
              </p>
              {searchQuery.trim() && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-accent-100 text-accent-700 rounded-full text-xs font-medium">
                  &ldquo;{searchQuery.trim()}&rdquo;
                  <button
                    onClick={() => setSearchQuery("")}
                    className="cursor-pointer hover:text-accent-900 transition-colors"
                    aria-label={t("events.clearSearch")}
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </span>
              )}
              {showSavedOnly && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-primary-100 text-primary-700 rounded-full text-xs font-medium">
                  {t("events.saved")} ({savedEvents.size})
                  <button
                    onClick={() => setShowSavedOnly(false)}
                    className="cursor-pointer hover:text-primary-900 transition-colors"
                    aria-label={t("events.clearSavedFilter")}
                  >
                    <i className="ri-close-line text-xs"></i>
                  </button>
                </span>
              )}
              <button
                onClick={clearAllFilters}
                aria-label={t("events.clearAllFilters")}
                className="inline-flex items-center gap-1 text-xs text-foreground-500 hover:text-foreground-700 transition-colors cursor-pointer"
              >
                <i className="ri-close-circle-line"></i>
                {t("events.clearAllFilters")}
              </button>
            </div>
          )}

          {viewMode === "map" && (
            <div>
              {fetchError ? (
                <ErrorState
                  title={t("events.loadError")}
                  message={fetchError}
                  onRetry={loadEvents}
                />
              ) : isLoading ? (
                <div className="rounded-2xl border border-background-200 bg-background-50 p-8 md:p-10 animate-pulse">
                  <div className="w-full h-[320px] md:h-[420px] rounded-2xl bg-background-200 mb-6" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map((n) => (
                      <div key={n} className="rounded-xl border border-background-200 bg-white p-4 space-y-3">
                        <div className="h-4 bg-background-200 rounded w-2/3" />
                        <div className="h-3 bg-background-100 rounded w-1/2" />
                        <div className="h-8 bg-background-100 rounded w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : filteredEvents.length > 0 ? (
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
                    {searchQuery.trim()
                      ? t("events.noMatch", { query: searchQuery.trim() })
                      : showSavedOnly
                        ? t("events.noSaved")
                        : hasActiveFilters
                          ? t("events.noEvents")
                          : t("events.noPublishedUpcoming")}
                  </h3>
                  <p className="text-foreground-500 text-sm mb-6">
                    {searchQuery.trim()
                      ? t("events.searchHint")
                      : showSavedOnly
                        ? t("events.savedHint")
                        : hasActiveFilters
                          ? t("events.filterHint")
                          : t("events.noPublishedUpcomingHint")}
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                  >
                    <i className="ri-refresh-line"></i>
                    {t("public.resetFilters")}
                  </button>
                </div>
              )}
            </div>
          )}

          {viewMode === "list" && (
            <>
              {!hasActiveFilters && !isLoading && savedVisibleEvents.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-bookmark-fill text-primary-500"></i>
                    <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">{t("events.savedEvents")}</span>
                    <span className="text-xs text-foreground-400 ml-1">{savedEvents.size}</span>
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">{t("events.savedEvents")}</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
                    {savedVisibleEvents.map((event) => (
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

              {!hasActiveFilters && !isLoading && featuredEvents.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-star-fill text-primary-500"></i>
                    <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">{t("events.featured")}</span>
                  </div>
                  <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">{t("events.dontMiss")}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                    {featuredEvents.map((event) => (
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

              <div>
                {!hasActiveFilters && (
                  <div className="flex items-center gap-2 mb-2">
                    <i className="ri-calendar-check-line text-accent-500"></i>
                    <span className="text-sm font-semibold text-accent-500 uppercase tracking-wider">{t("events.allUpcoming")}</span>
                  </div>
                )}
                <h2 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-5">
                  {selectedDate
                    ? t("events.onDate", { date: new Date(selectedDate + "T00:00:00").toLocaleDateString(i18n.language, {
                        month: "long",
                        day: "numeric",
                      }) })
                    : activeCategory
                      ? eventCategoryLabel(t, activeCategory)
                      : showFeatured
                        ? t("events.featuredEvents")
                        : showSavedOnly
                          ? t("events.savedEvents")
                          : searchQuery.trim()
                            ? t("events.searchResults", { query: searchQuery.trim() })
                            : t("events.upcomingEvents")}
                </h2>

                {fetchError ? (
                  <ErrorState
                    title={t("events.loadError")}
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
                        ? t("events.noMatch", { query: searchQuery.trim() })
                        : showSavedOnly
                          ? t("events.noSaved")
                          : hasActiveFilters
                            ? t("events.noEvents")
                            : t("events.noPublishedUpcoming")}
                    </h3>
                    <p className="text-foreground-500 text-sm mb-6">
                      {searchQuery.trim()
                        ? t("events.searchHint")
                        : showSavedOnly
                          ? t("events.savedHint")
                          : hasActiveFilters
                            ? t("events.filterHint")
                            : t("events.noPublishedUpcomingHint")}
                    </p>
                    <button
                      onClick={clearAllFilters}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-background-100 text-foreground-700 rounded-full text-sm font-medium hover:bg-background-200 transition-colors cursor-pointer"
                    >
                      <i className="ri-refresh-line"></i>
                      {t("public.resetFilters")}
                    </button>
                  </div>
                )}
              </div>
            </>
          )}

          {isAdmin && (
            <div className="mt-16 bg-gradient-to-r from-accent-500 to-accent-600 rounded-2xl p-8 md:p-10 text-center">
              <h2 className="font-heading text-2xl md:text-3xl text-white mb-3">
                {t("events.hostPrompt")}
              </h2>
              <p className="text-white/80 text-sm md:text-base max-w-lg mx-auto mb-6">
                {t("events.hostDescription")}
              </p>
              <button
                onClick={() => setShowHostModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-accent-600 rounded-full text-sm font-semibold hover:bg-white/95 transition-colors cursor-pointer"
              >
                {t("events.createEvent")}
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
