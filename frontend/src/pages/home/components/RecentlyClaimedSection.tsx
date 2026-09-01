import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { directoryService, type Business } from "@/api-services/directory.service";
import TrustBadge from "@/components/common/TrustBadge";
import { logger } from "@/lib/logger";
import { useTranslation } from "react-i18next";
import ErrorState from "@/components/base/ErrorState";
import "@/i18n";

export interface RecentlyClaimedSectionProps {
  onClaimClick?: (business: Business) => void;
}

export default function RecentlyClaimedSection({ onClaimClick }: RecentlyClaimedSectionProps) {
  const { t } = useTranslation();
  const [listings, setListings] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await directoryService.getRecentlyClaimedListings(6);
      setListings(Array.isArray(data) ? data : []);
    } catch (err: unknown) {
      logger.warn("Failed to load recently claimed listings:", err);
      setError(err instanceof Error ? err.message : t("home.recentVerifiedTitle"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const fetchRecent = async () => {
      try {
        const data = await directoryService.getRecentlyClaimedListings(6);
        if (isMounted) {
          setListings(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        logger.warn("Failed to load recently claimed listings:", err);
        if (isMounted) setError(err instanceof Error ? err.message : t("home.recentVerifiedTitle"));
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchRecent();
    return () => {
      isMounted = false;
    };
  }, [t]);

  return (
    <section className="w-full px-4 md:px-8 lg:px-12 py-12 md:py-16 bg-background-50 border-t border-background-200/60">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2.5">
              <i className="ri-shield-check-fill text-emerald-600 text-sm" />
              {t("home.recentVerifiedLabel")}
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground-900 leading-tight">
              {t("home.recentVerifiedTitle")}
            </h2>
            <p className="text-sm text-foreground-600 mt-1 max-w-2xl">
              {t("home.recentVerifiedDescription")}
            </p>
          </div>
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors whitespace-nowrap"
          >
            {t("home.exploreAllListings")}
            <i className="ri-arrow-right-line" />
          </Link>
        </div>

        {/* Listings Grid */}
        {error ? (
          <ErrorState title={t("home.recentVerifiedTitle")} message={error} onRetry={loadListings} />
        ) : !loading && listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-background-300 bg-white px-6 py-10 text-center">
            <h3 className="font-heading text-lg text-foreground-900">{t("home.noRecentVerified")}</h3>
            <p className="mt-2 text-sm text-foreground-500">{t("home.noRecentVerifiedHint")}</p>
          </div>
        ) : (
        <div
          data-testid="recently-claimed-grid"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6"
        >
          {loading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl border border-background-200 p-4 h-72 animate-pulse"
                />
              ))
            : listings.slice(0, 6).map((biz) => (
                <div
                  key={biz.id}
                  className="bg-white rounded-2xl border border-background-200/80 overflow-hidden hover:border-primary-300 hover:shadow-md transition-all duration-300 flex flex-col group"
                >
                  {/* Image */}
                  <div className="relative h-44 w-full overflow-hidden shrink-0">
                    <img
                      src={biz.image}
                      alt={biz.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <TrustBadge badge={biz.trustBadge} business={biz} variant="glass" size="xs" />
                    </div>

                    {/* Verified Owner Badge */}
                    <div className="absolute bottom-3 left-3 z-10">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 backdrop-blur-md text-emerald-300 text-[11px] font-semibold shadow-sm">
                        <i className="ri-checkbox-circle-fill text-xs" />
                        {t("home.verifiedOwner")}
                      </span>
                    </div>

                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-white/95 backdrop-blur-md text-foreground-800 text-[11px] font-bold shadow-sm">
                      {biz.priceRange || "$$"}
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col flex-1 justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <Link
                          to={`/business/${biz.id}`}
                          className="font-heading text-base font-bold text-foreground-900 group-hover:text-primary-600 transition-colors line-clamp-1"
                        >
                          {biz.name}
                        </Link>
                        <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-foreground-900">
                          <i className="ri-star-fill text-amber-500 text-xs" />
                          <span>{biz.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-foreground-600 line-clamp-2 mb-3 leading-relaxed">
                        {biz.description}
                      </p>

                      <div className="flex items-center gap-1 text-[11px] text-foreground-500 mb-3 truncate">
                        <i className="ri-map-pin-2-fill text-primary-500 shrink-0" />
                        <span className="truncate">{biz.address}</span>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-between pt-3 border-t border-background-100 mt-auto">
                      <span className="text-[11px] font-medium text-foreground-400">
                        {biz.subcategory || biz.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {onClaimClick && (
                          <button
                            type="button"
                            onClick={() => onClaimClick(biz)}
                            className="text-xs font-semibold text-accent-600 hover:text-accent-700 cursor-pointer"
                          >
                            {t("home.claimInfo")}
                          </button>
                        )}
                        <Link
                          to={`/business/${biz.id}`}
                          className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary-700 hover:bg-primary-100 text-xs font-semibold transition-colors"
                        >
                          {t("home.viewDetails")}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
        </div>
        )}
      </div>
    </section>
  );
}
