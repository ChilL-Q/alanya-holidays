import { useRef, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { forumService, type CategoryThread } from "@/api-services/forum.service";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/base/ErrorState";
import "@/i18n";

export default function TrendingThreads() {
  const { t } = useTranslation();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [threads, setThreads] = useState<CategoryThread[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = () => {
    setError(null);
    return forumService
      .getTrendingThreads(8)
      .then((data) => setThreads(data || []))
      .catch((err: unknown) => {
        logger.warn("Failed to load trending threads:", err);
        setError(err instanceof Error ? err.message : t("home.discussionsUnavailable"));
      });
  };

  useEffect(() => {
    let isMounted = true;
    forumService.getTrendingThreads(8).then((data) => {
      if (isMounted) setThreads(data || []);
    }).catch((err: unknown) => {
      logger.warn("Failed to load trending threads:", err);
      if (isMounted) setError(err instanceof Error ? err.message : t("home.discussionsUnavailable"));
    });

    return () => {
      isMounted = false;
    };
  }, [t]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const scrollAmount = 320;
      scrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="py-16 md:py-24 bg-background-100">
      <div className="w-full px-4 md:px-8 lg:px-12">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <i className="ri-fire-line text-primary-500 text-lg"></i>
              <span className="text-sm font-semibold text-primary-500 uppercase tracking-wider">
                {t("home.trendingNow")}
              </span>
            </div>
            <h2 className="font-heading text-2xl md:text-4xl text-foreground-900">
              {t("home.hotDiscussions")}
            </h2>
          </div>
          <p className="hidden md:block text-foreground-500 text-sm max-w-xs text-right">
            {t("home.hotDiscussionsDescription")}
          </p>
        </div>

        {error ? (
          <ErrorState title={t("home.discussionsUnavailable")} message={error} onRetry={loadThreads} />
        ) : (
        /* Cards Container */
        <div className="relative">
          <div
            ref={scrollRef}
            className="flex gap-4 md:gap-6 overflow-x-auto scrollbar-hide pb-4 snap-x snap-mandatory"
          >
            {threads.map((thread) => (
              <Link
                key={thread.id}
                to={`/thread/${thread.id}`}
                className="flex-shrink-0 w-72 md:w-80 snap-start group"
              >
                <div className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 h-full flex flex-col">
                  {/* Card Image */}
                  <div className="relative h-40 overflow-hidden">
                    <img
                      src={
                        thread.imageUrl ||
                        thread.categoryImageUrl ||
                        "/images/placeholder-business.svg"
                      }
                      alt=""
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
                    {/* Category Tag */}
                    <span className="absolute top-3 right-3 px-3 py-1 bg-primary-500 text-white text-xs font-semibold rounded-full">
                      {thread.category}
                    </span>
                    {/* Hot Badge */}
                    {thread.isHot && (
                      <span className="absolute top-3 left-3 flex items-center gap-1 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        <i className="ri-fire-line"></i>
                        {t("home.hotBadge")}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-heading text-lg text-foreground-900 mb-2 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {thread.title}
                    </h3>
                    <p className="text-foreground-500 text-sm mb-3 line-clamp-2 flex-1">
                      {thread.excerpt}
                    </p>
                    {/* Footer */}
                    <div className="flex items-center justify-between text-xs text-foreground-500">
                      <div className="flex items-center gap-2">
                        <img
                          src={thread.authorAvatar}
                          alt={thread.author}
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span>{thread.author}</span>
                      </div>
                      <span>{thread.postedAt}</span>
                    </div>
                    {/* Stats */}
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-background-100 text-xs text-foreground-500">
                      <span className="flex items-center gap-1">
                        <i className="ri-message-3-line"></i>
                        {thread.replies}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-eye-line"></i>
                        {thread.views.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="ri-heart-3-line"></i>
                        {thread.likes}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Scroll Buttons */}
          <button
            onClick={() => scroll("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-foreground-700 hover:bg-primary-50 transition-colors"
          >
            <i className="ri-arrow-left-s-line text-lg"></i>
          </button>
          <button
            onClick={() => scroll("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center text-foreground-700 hover:bg-primary-50 transition-colors"
          >
            <i className="ri-arrow-right-s-line text-lg"></i>
          </button>
        </div>
        )}
      </div>
    </section>
  );
}
