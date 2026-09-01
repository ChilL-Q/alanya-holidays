import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { eventsService, type ForumEvent } from "@/api-services/events.service";
import { forumService, type ForumStats } from "@/api-services/forum.service";
import { useTranslation } from "react-i18next";
import "@/i18n";
import ErrorState from "@/components/base/ErrorState";

export default function CommunityPulse() {
  const { t } = useTranslation();
  const [pulseEvents, setPulseEvents] = useState<ForumEvent[]>([]);
  const [stats, setStats] = useState<ForumStats | null>(null);
  const [isLoadingEvents, setIsLoadingEvents] = useState(true);
  const [eventsError, setEventsError] = useState<string | null>(null);

  const loadEvents = () => {
    setIsLoadingEvents(true);
    setEventsError(null);
    return eventsService.getEvents({ upcomingOnly: true, limit: 3 })
      .then((data) => setPulseEvents(data))
      .catch((err: unknown) => {
        setEventsError(err instanceof Error ? err.message : t("home.eventsUnavailable"));
      })
      .finally(() => setIsLoadingEvents(false));
  };

  useEffect(() => {
    let mounted = true;
    eventsService
      .getEvents({ upcomingOnly: true, limit: 3 })
      .then((data) => {
        if (mounted) setPulseEvents(data);
      })
      .catch((err: unknown) => {
        if (mounted) {
          setEventsError(err instanceof Error ? err.message : t("home.eventsUnavailable"));
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingEvents(false);
      });

    forumService.getForumStats().then((data) => {
      if (mounted) setStats(data);
    }).catch(() => {});

    return () => {
      mounted = false;
    };
  }, [t]);

  return (
    <section id="events" className="py-16 md:py-24">
      <div className="flex flex-col lg:flex-row">
        {/* Left Side - Image */}
        <div className="relative w-full lg:w-1/2 h-80 lg:h-auto lg:min-h-[600px]">
          <img
            src="/images/home/alanya_castle.webp"
            alt={t("home.alanyaCastleAlt")}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent"></div>
          {/* Label */}
          <span className="absolute top-6 left-6 text-white/80 text-xs font-medium tracking-wider uppercase">
            {t("home.discoverNext")}
          </span>
          {/* Title */}
          <div className="absolute bottom-6 left-6 right-6">
            <h2 className="font-heading text-4xl md:text-5xl lg:text-6xl text-white leading-tight">
              <span className="block font-light">{t("events.upcoming").toUpperCase()}</span>
              <span className="block font-bold">{t("events.title").toUpperCase()}</span>
            </h2>
          </div>
        </div>

        {/* Right Side - Content */}
        <div className="w-full lg:w-1/2 bg-white px-6 md:px-10 lg:px-12 py-10 md:py-14 lg:py-16">
          <h3 className="font-heading text-2xl md:text-3xl text-foreground-900 mb-6">
            {t("home.communityPulse")}
          </h3>

          <p className="text-foreground-600 text-sm md:text-base leading-relaxed mb-8">
            {stats ? `${t("home.communityMembersSentence", { count: stats.activeMembers.toLocaleString() })} ` : ""}
            {t("home.communityPulseDescription")}
          </p>

          {/* Events List */}
          <div className="space-y-4 min-h-60">
            {eventsError ? (
              <ErrorState title={t("home.eventsUnavailable")} message={eventsError} onRetry={loadEvents} />
            ) : isLoadingEvents ? (
              <div className="space-y-4" aria-label={t("home.loadingUpcomingEvents")}>
                {[0, 1, 2].map((item) => (
                  <div key={item} className="flex items-center gap-4 p-3 animate-pulse">
                    <div className="w-16 h-16 rounded-lg bg-background-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/5 rounded bg-background-200" />
                      <div className="h-3 w-3/5 rounded bg-background-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : null}

            {!eventsError && !isLoadingEvents && pulseEvents.length === 0 && (
              <div className="min-h-60 flex items-center justify-center rounded-xl border border-dashed border-background-300 bg-background-50 px-6 text-center">
                <div>
                  <i className="ri-calendar-event-line text-3xl text-primary-400" />
                  <p className="mt-3 font-heading text-foreground-900">{t("events.comingSoon")}</p>
                  <p className="mt-1 text-sm text-foreground-500">{t("events.comingSoonDescription")}</p>
                </div>
              </div>
            )}

            {!eventsError && !isLoadingEvents && pulseEvents.slice(0, 3).map((event) => (
              <Link
                key={event.id}
                to={`/events?q=${encodeURIComponent(event.title)}`}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-background-50 transition-colors group cursor-pointer"
              >
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-16 h-16 rounded-lg object-cover flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading text-sm text-foreground-900 mb-1 group-hover:text-primary-500 transition-colors">
                    {event.title}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-foreground-500">
                    <span className="flex items-center gap-1">
                      <i className="ri-calendar-line"></i>
                      {event.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <i className="ri-map-pin-line"></i>
                      {event.location}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs text-primary-500 font-medium">
                  <i className="ri-user-line"></i>
                  {event.attendees}
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8">
            <Link
              to="/events"
              className="inline-flex items-center gap-2 px-6 py-3 bg-secondary-700 text-white rounded-full text-sm font-medium hover:bg-secondary-800 transition-colors"
            >
              {t("home.viewAllEvents")}
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
