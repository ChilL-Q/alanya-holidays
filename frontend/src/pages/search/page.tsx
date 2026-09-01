import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { forumService, type CategoryThread, type ForumMember } from "@/api-services/forum.service";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import "@/i18n";

export type ResultTab = "all" | "threads" | "members" | "events";

export interface SearchResult {
  threads: CategoryThread[];
  members: ForumMember[];
  events: ForumEvent[];
}

export function HighlightMatch({ text, query }: { text: string; query: string }) {
  const trimmed = query.trim();
  if (!trimmed) {
    return <>{text}</>;
  }
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "i");
  const parts = text.split(regex);
  const matchRegex = new RegExp(`^(${escaped})$`, "i");

  return (
    <>
      {parts.map((part, index) =>
        matchRegex.test(part) ? (
          <mark key={index} className="bg-primary-100/70 text-foreground-900 rounded px-0.5 font-medium">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("all");
  const [isSearching, setIsSearching] = useState(false);

  const [threads, setThreads] = useState<CategoryThread[]>([]);
  const [members, setMembers] = useState<ForumMember[]>([]);
  const [events, setEvents] = useState<ForumEvent[]>([]);

  // 1. Debounce query input by 300ms
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // 2. Fetch server-side search results when debouncedQuery changes
  useEffect(() => {
    let isCancelled = false;

    if (!debouncedQuery) {
      setThreads([]);
      setEvents([]);
      setMembers([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    Promise.all([
      forumService.getThreads({
        limit: 20,
        params: { search: debouncedQuery },
      }),
      eventsService.getEvents({
        limit: 20,
        params: { search: debouncedQuery },
      }),
      forumService.getMembers({
        limit: 50,
      }),
    ])
      .then(([threadRes, eventRes, memberRes]) => {
        if (!isCancelled) {
          setThreads(threadRes.threads || []);
          setEvents(eventRes || []);

          const q = debouncedQuery.toLowerCase();
          const filteredMembers = (memberRes || []).filter(
            (m) =>
              m.fullName.toLowerCase().includes(q) ||
              m.username.toLowerCase().includes(q) ||
              m.bio.toLowerCase().includes(q) ||
              m.role.toLowerCase().includes(q)
          );
          setMembers(filteredMembers);
          setIsSearching(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          logger.error("Server-side search query failed:", err);
          setThreads([]);
          setEvents([]);
          setMembers([]);
          setIsSearching(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [debouncedQuery]);

  const totalResults = threads.length + members.length + events.length;
  const hasResults = totalResults > 0;

  const displayedThreads = activeTab === "all" || activeTab === "threads" ? threads : [];
  const displayedMembers = activeTab === "all" || activeTab === "members" ? members : [];
  const displayedEvents = activeTab === "all" || activeTab === "events" ? events : [];

  return (
    <div className="min-h-screen bg-background-50 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1">
        {/* Hero Search Section */}
        <section className="relative pt-20 md:pt-24 pb-8 md:pb-12 bg-gradient-to-b from-secondary-100/60 via-background-50 to-background-50">
          <div className="w-full px-4 md:px-8 lg:px-12 max-w-4xl mx-auto text-center">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-secondary-100 rounded-xl mx-auto mb-4">
              <i className="ri-search-line text-secondary-600 text-xl md:text-2xl"></i>
            </div>
            <h1 className="font-heading text-2xl md:text-4xl text-foreground-900 mb-2">
              {t("public.search.title")}
            </h1>
            <p className="text-foreground-500 text-sm md:text-base mb-6">
              {t("public.search.description")}
            </p>

            {/* Search Input Box */}
            <div className="relative max-w-2xl mx-auto">
              <div className="flex items-center bg-background-50 rounded-xl border border-background-200/80 focus-within:border-primary-300/60 focus-within:ring-2 focus-within:ring-primary-100/60 transition-all overflow-hidden shadow-sm">
                <div className="pl-4">
                  {isSearching ? (
                    <i className="ri-loader-4-line animate-spin text-primary-500 text-lg"></i>
                  ) : (
                    <i className="ri-search-line text-foreground-400 text-lg"></i>
                  )}
                </div>
                <input
                  type="text"
                  placeholder={t("public.search.placeholder")}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent px-3 py-3.5 text-foreground-900 placeholder:text-foreground-400 text-sm outline-none"
                  autoFocus
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery("")}
                    aria-label={t("public.clearSearch")}
                    data-testid="clear-search-btn"
                    className="pr-4 cursor-pointer text-foreground-400 hover:text-foreground-600 transition-colors"
                  >
                    <i className="ri-close-circle-line text-lg"></i>
                  </button>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Results Section */}
        <section className="w-full px-4 md:px-8 lg:px-12 max-w-6xl mx-auto pb-16">
          {isSearching && (
            <div className="text-center py-16" data-testid="search-loading">
              <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-500 rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-foreground-500 text-sm">{t("public.search.searching")}</p>
            </div>
          )}

          {!isSearching && debouncedQuery && (
            <>
              {/* Results Stats & Filter Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <p className="text-sm text-foreground-500">
                  {totalResults === 0
                    ? t("public.search.noResults")
                    : t(totalResults === 1 ? "public.search.foundOne" : "public.search.foundMany", { count: totalResults, query: debouncedQuery })}
                </p>

                {hasResults && (
                  <div className="inline-flex items-center bg-background-100 rounded-full p-1">
                    {([
                      { key: "all", label: t("public.search.all") },
                      { key: "threads", label: t("public.search.threads", { count: threads.length }) },
                      { key: "members", label: t("public.search.members", { count: members.length }) },
                      { key: "events", label: t("public.search.events", { count: events.length }) },
                    ] as { key: ResultTab; label: string }[]).map((tab) => (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                          activeTab === tab.key
                            ? "bg-background-50 text-foreground-900 shadow-sm"
                            : "text-foreground-500 hover:text-foreground-700"
                        }`}
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* No Results Empty State */}
              {!hasResults && (
                <div className="text-center py-16">
                  <div className="w-16 h-16 flex items-center justify-center rounded-full bg-background-100 mx-auto mb-4">
                    <i className="ri-search-line text-foreground-300 text-2xl"></i>
                  </div>
                  <p className="text-foreground-600 font-medium mb-1">{t("public.search.noResults")}</p>
                  <p className="text-foreground-400 text-sm">
                    {t("public.search.tryDifferent")}
                  </p>
                </div>
              )}

              {/* Discussions / Thread Results */}
              {displayedThreads.length > 0 && (
                <div className="mb-10">
                  {activeTab === "all" && (
                    <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                      <i className="ri-chat-3-line text-foreground-400"></i>
                      {t("public.discussions")}
                    </h2>
                  )}
                  <div className="space-y-3">
                    {displayedThreads.map((thread) => (
                      <Link
                        key={thread.id}
                        to={`/thread/${thread.id}`}
                        className="block bg-background-50 rounded-xl border border-background-200/70 p-4 hover:border-primary-200/60 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-full overflow-hidden bg-background-200 shrink-0">
                            <img src={thread.authorAvatar} alt={thread.author} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-semibold text-foreground-900 group-hover:text-primary-500 transition-colors mb-1">
                              <HighlightMatch text={thread.title} query={debouncedQuery} />
                            </h3>
                            <p className="text-xs text-foreground-500 line-clamp-1">
                              <HighlightMatch text={thread.excerpt} query={debouncedQuery} />
                            </p>
                            <div className="flex items-center gap-3 mt-2 text-xs text-foreground-400">
                              <span>{thread.author}</span>
                              <span>·</span>
                              <span className="px-1.5 py-0.5 bg-background-100 rounded-full text-foreground-500">{thread.category}</span>
                              <span>·</span>
                              <span><i className="ri-chat-3-line mr-0.5"></i>{thread.replies}</span>
                              <span><i className="ri-eye-line mr-0.5"></i>{thread.views}</span>
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Members Results */}
              {displayedMembers.length > 0 && (
                <div className="mb-10">
                  {activeTab === "all" && (
                    <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                      <i className="ri-user-line text-foreground-400"></i>
                      {t("public.members")}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedMembers.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center gap-3 bg-background-50 rounded-xl border border-background-200/70 p-4"
                      >
                        <div className="relative shrink-0">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-background-200">
                            <img src={member.avatar} alt={member.fullName} className="w-full h-full object-cover" loading="lazy" />
                          </div>
                          {member.isOnline && (
                            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-accent-500 rounded-full border-2 border-background-50"></div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground-900 truncate">
                            <HighlightMatch text={member.fullName} query={debouncedQuery} />
                          </p>
                          <p className="text-xs text-foreground-500 truncate">@{member.username}</p>
                          <p className="text-xs text-foreground-400 truncate">{member.role}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Events Results */}
              {displayedEvents.length > 0 && (
                <div className="mb-10">
                  {activeTab === "all" && (
                    <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                      <i className="ri-calendar-event-line text-foreground-400"></i>
                      {t("events.title")}
                    </h2>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedEvents.map((event) => (
                      <Link
                        key={event.id}
                        to={`/events`}
                        className="block bg-background-50 rounded-xl border border-background-200/70 overflow-hidden hover:border-primary-200/60 transition-all group"
                      >
                        <div className="h-40 overflow-hidden">
                          <img src={event.image} alt={event.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                        </div>
                        <div className="p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-0.5 bg-background-100 text-foreground-500 rounded-full text-xs">
                              {event.month} {event.day}
                            </span>
                            <span className="text-xs text-foreground-400">{event.time}</span>
                          </div>
                          <h3 className="text-sm font-semibold text-foreground-900 group-hover:text-primary-500 transition-colors mb-1">
                            <HighlightMatch text={event.title} query={debouncedQuery} />
                          </h3>
                          <p className="text-xs text-foreground-500 line-clamp-2">
                            <HighlightMatch text={event.description} query={debouncedQuery} />
                          </p>
                          <div className="flex items-center gap-3 mt-3 text-xs text-foreground-400">
                            <span><i className="ri-map-pin-line mr-0.5"></i>{event.location}</span>
                            <span><i className="ri-user-line mr-0.5"></i>{event.attendees}/{event.maxAttendees}</span>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Initial Empty Search Hero State */}
          {!debouncedQuery && !isSearching && (
            <div className="text-center py-20">
              <div className="w-20 h-20 flex items-center justify-center rounded-full bg-secondary-100 mx-auto mb-5">
                <i className="ri-search-line text-secondary-500 text-3xl"></i>
              </div>
              <h2 className="font-heading text-xl text-foreground-900 mb-2">
                {t("public.search.initialTitle")}
              </h2>
              <p className="text-foreground-500 text-sm max-w-md mx-auto mb-8">
                {t("public.search.initialDescription")}
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                {[
                  "public.search.suggestion.beaches",
                  "public.search.suggestion.residence",
                  "public.search.suggestion.nomad",
                  "public.search.suggestion.breakfast",
                  "public.search.suggestion.coworking",
                  "public.search.suggestion.hiking",
                ].map((suggestionKey) => {
                  const suggestion = t(suggestionKey);
                  return (
                  <button
                    key={suggestion}
                    onClick={() => setQuery(suggestion)}
                    className="px-3 py-1.5 bg-background-100 text-foreground-600 rounded-full text-xs hover:bg-secondary-100 hover:text-secondary-700 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    {suggestion}
                  </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
