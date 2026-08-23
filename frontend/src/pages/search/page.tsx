import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { forumService, type CategoryThread, type ForumMember } from "@/api-services/forum.service";
import { eventsService, type ForumEvent } from "@/api-services/events.service";

type ResultTab = "all" | "threads" | "members" | "events";

interface SearchResult {
  threads: CategoryThread[];
  members: ForumMember[];
  events: ForumEvent[];
}

function HighlightMatch({ text, query }: { text: string; query: string }) {
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
          <mark key={index}>{part}</mark>
        ) : (
          part
        )
      )}
    </>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState<ResultTab>("all");
  const [allThreads, setAllThreads] = useState<CategoryThread[]>([]);
  const [allMembers, setAllMembers] = useState<ForumMember[]>([]);
  const [allEvents, setAllEvents] = useState<ForumEvent[]>([]);

  useEffect(() => {
    let isMounted = true;
    forumService
      .getThreads({ limit: 100 })
      .then((res) => {
        if (isMounted && res.threads) setAllThreads(res.threads);
      })
      .catch(() => {});

    forumService
      .getMembers({ limit: 100 })
      .then((res) => {
        if (isMounted && res) setAllMembers(res);
      })
      .catch(() => {});

    eventsService
      .getEvents()
      .then((evts) => {
        if (isMounted && evts) setAllEvents(evts);
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, []);

  const results = useMemo<SearchResult>(() => {
    if (!query.trim()) {
      return { threads: [], members: [], events: [] };
    }

    const q = query.toLowerCase();

    // Search threads
    const matchedThreads = allThreads.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.excerpt.toLowerCase().includes(q) ||
        t.author.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.subcategory && t.subcategory.toLowerCase().includes(q))
    );

    // Search members
    const matchedMembers = allMembers.filter(
      (m) =>
        m.fullName.toLowerCase().includes(q) ||
        m.username.toLowerCase().includes(q) ||
        m.bio.toLowerCase().includes(q) ||
        m.role.toLowerCase().includes(q)
    );

    // Search events
    const matchedEvents = allEvents.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q) ||
        e.host.toLowerCase().includes(q)
    );

    return { threads: matchedThreads, members: matchedMembers, events: matchedEvents };
  }, [query, allThreads, allMembers, allEvents]);

  const totalResults = results.threads.length + results.members.length + results.events.length;

  const displayedThreads = activeTab === "all" || activeTab === "threads" ? results.threads : [];
  const displayedMembers = activeTab === "all" || activeTab === "members" ? results.members : [];
  const displayedEvents = activeTab === "all" || activeTab === "events" ? results.events : [];

  const hasResults = totalResults > 0;

  return (
    <div className="min-h-screen bg-background-50">
      <Navbar />

      {/* Hero Search */}
      <section className="relative pt-20 md:pt-24 pb-8 md:pb-12 bg-gradient-to-b from-secondary-100/60 via-background-50 to-background-50">
        <div className="w-full px-4 md:px-8 lg:px-12 max-w-4xl mx-auto text-center">
          <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-secondary-100 rounded-xl mx-auto mb-4">
            <i className="ri-search-line text-secondary-600 text-xl md:text-2xl"></i>
          </div>
          <h1 className="font-heading text-2xl md:text-4xl text-foreground-900 mb-2">
            Search the Forum
          </h1>
          <p className="text-foreground-500 text-sm md:text-base mb-6">
            Find discussions, members, and events across the entire Alanya community.
          </p>

          {/* Search Input */}
          <div className="relative max-w-2xl mx-auto">
            <div className="flex items-center bg-background-50 rounded-xl border border-background-200/80 focus-within:border-primary-300/60 focus-within:ring-2 focus-within:ring-primary-100/60 transition-all overflow-hidden">
              <div className="pl-4">
                <i className="ri-search-line text-foreground-400 text-lg"></i>
              </div>
              <input
                type="text"
                placeholder="Search threads, members, events..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent px-3 py-3.5 text-foreground-900 placeholder:text-foreground-400 text-sm outline-none"
                autoFocus
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="pr-4 cursor-pointer"
                >
                  <i className="ri-close-circle-line text-foreground-400 hover:text-foreground-600 text-lg"></i>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="w-full px-4 md:px-8 lg:px-12 max-w-6xl mx-auto pb-16">
        {query.trim() && (
          <>
            {/* Stats + Tabs */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
              <p className="text-sm text-foreground-500">
                {totalResults === 0
                  ? "No results found"
                  : `Found ${totalResults} result${totalResults !== 1 ? "s" : ""} for "${query}"`}
              </p>

              {hasResults && (
                <div className="inline-flex items-center bg-background-100 rounded-full p-1">
                  {([
                    { key: "all", label: "All" },
                    { key: "threads", label: `Threads (${results.threads.length})` },
                    { key: "members", label: `Members (${results.members.length})` },
                    { key: "events", label: `Events (${results.events.length})` },
                  ] as { key: ResultTab; label: string }[]).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === tab.key
                          ? "bg-background-50 text-foreground-900"
                          : "text-foreground-500 hover:text-foreground-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* No Results */}
            {!hasResults && (
              <div className="text-center py-16">
                <div className="w-16 h-16 flex items-center justify-center rounded-full bg-background-100 mx-auto mb-4">
                  <i className="ri-search-line text-foreground-300 text-2xl"></i>
                </div>
                <p className="text-foreground-600 font-medium mb-1">No results found</p>
                <p className="text-foreground-400 text-sm">
                  Try different keywords or check your spelling.
                </p>
              </div>
            )}

            {/* Thread Results */}
            {displayedThreads.length > 0 && (
              <div className="mb-10">
                {activeTab === "all" && (
                  <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                    <i className="ri-chat-3-line text-foreground-400"></i>
                    Discussions
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
                            <HighlightMatch text={thread.title} query={query} />
                          </h3>
                          <p className="text-xs text-foreground-500 line-clamp-1">
                            <HighlightMatch text={thread.excerpt} query={query} />
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

            {/* Member Results */}
            {displayedMembers.length > 0 && (
              <div className="mb-10">
                {activeTab === "all" && (
                  <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                    <i className="ri-user-line text-foreground-400"></i>
                    Members
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
                          <HighlightMatch text={member.fullName} query={query} />
                        </p>
                        <p className="text-xs text-foreground-500 truncate">@{member.username}</p>
                        <p className="text-xs text-foreground-400 truncate">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Event Results */}
            {displayedEvents.length > 0 && (
              <div className="mb-10">
                {activeTab === "all" && (
                  <h2 className="font-heading text-lg text-foreground-900 mb-4 flex items-center gap-2">
                    <i className="ri-calendar-event-line text-foreground-400"></i>
                    Events
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
                          <HighlightMatch text={event.title} query={query} />
                        </h3>
                        <p className="text-xs text-foreground-500 line-clamp-2">
                          <HighlightMatch text={event.description} query={query} />
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

        {/* Empty state - no query */}
        {!query.trim() && (
          <div className="text-center py-20">
            <div className="w-20 h-20 flex items-center justify-center rounded-full bg-secondary-100 mx-auto mb-5">
              <i className="ri-search-line text-secondary-500 text-3xl"></i>
            </div>
            <h2 className="font-heading text-xl text-foreground-900 mb-2">
              Search across the entire forum
            </h2>
            <p className="text-foreground-500 text-sm max-w-md mx-auto mb-8">
              Type above to find discussions, community members, and upcoming events. We search through everything.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
              {["Alanya beaches", "residence permit", "digital nomad", "Turkish breakfast", "coworking", "hiking trails"].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => setQuery(suggestion)}
                  className="px-3 py-1.5 bg-background-100 text-foreground-600 rounded-full text-xs hover:bg-secondary-100 hover:text-secondary-700 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      <Footer />
    </div>
  );
}