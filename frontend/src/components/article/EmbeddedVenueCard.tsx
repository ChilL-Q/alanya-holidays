import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { directoryService, type Business } from "@/api-services/directory.service";

export interface EmbeddedVenueCardProps {
  venue?: Business;
  venueId?: string;
  layout?: "card" | "compact";
  onClick?: (venueId: string) => void;
  className?: string;
}

export default function EmbeddedVenueCard({
  venue,
  venueId,
  layout = "card",
  onClick,
  className = "",
}: EmbeddedVenueCardProps) {
  const [imageError, setImageError] = useState(false);
  const [fetchedVenue, setFetchedVenue] = useState<Business | null>(() =>
    venueId ? directoryService.getListingByIdSync(venueId) : null
  );

  useEffect(() => {
    if (venue || !venueId) return;
    let isMounted = true;
    void directoryService
      .getListingById(venueId)
      .then((data) => {
        if (isMounted) {
          setFetchedVenue(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setFetchedVenue(null);
        }
      });
    return () => {
      isMounted = false;
    };
  }, [venue, venueId]);

  // Resolve business details from props or directory service
  const resolvedVenue = venue ?? (venueId ? fetchedVenue ?? undefined : undefined);

  if (!resolvedVenue) {
    return (
      <div
        className={`p-4 rounded-xl border border-dashed border-background-300 bg-background-50 dark:bg-background-900/40 text-center my-4 ${className}`}
      >
        <div className="flex items-center justify-center gap-2 text-sm">
          <i className="ri-store-2-line text-primary-500"></i>
          <span className="text-foreground-500">Venue not found or listing unavailable.</span>
          <Link
            to="/explore"
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline ml-1"
          >
            Browse Directory
          </Link>
        </div>
      </div>
    );
  }

  const fallbackImage =
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=600&q=80";

  const handleActionClick = () => {
    if (onClick) {
      onClick(resolvedVenue.id);
    }
  };

  if (layout === "compact") {
    return (
      <div
        className={`group relative flex items-center gap-3.5 p-3 rounded-xl border border-background-200 dark:border-background-800 bg-white dark:bg-background-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all my-3 ${className}`}
      >
        {resolvedVenue.image && (
          <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0 bg-background-100 dark:bg-background-800">
            <img
              src={imageError ? fallbackImage : resolvedVenue.image}
              alt={resolvedVenue.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="font-semibold text-sm text-foreground-900 dark:text-white truncate">
              {resolvedVenue.name}
            </h4>
            {resolvedVenue.trustBadge && (
              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-accent-50 text-accent-700 border border-accent-200 dark:bg-accent-950/40 dark:text-accent-300">
                {resolvedVenue.trustBadge}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs text-foreground-500">
            <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400">
              <i className="ri-star-fill text-xs text-amber-500"></i>
              {resolvedVenue.rating.toFixed(1)}
            </span>
            {resolvedVenue.reviewCount > 0 && (
              <span>({resolvedVenue.reviewCount})</span>
            )}
            {(resolvedVenue.subcategory || resolvedVenue.priceRange) && (
              <>
                <span className="text-foreground-300">•</span>
                <span className="truncate font-medium text-foreground-700 dark:text-foreground-300">
                  {resolvedVenue.subcategory || resolvedVenue.priceRange}
                </span>
              </>
            )}
          </div>
        </div>

        <Link
          to={`/business/${resolvedVenue.id}`}
          onClick={handleActionClick}
          aria-label={`View ${resolvedVenue.name}`}
          className="shrink-0 px-3 py-1.5 rounded-lg bg-primary-50 dark:bg-primary-950/40 hover:bg-primary-100 dark:hover:bg-primary-900/60 text-primary-700 dark:text-primary-300 text-xs font-semibold transition-colors flex items-center gap-1"
        >
          <span>View</span>
          <i className="ri-arrow-right-s-line"></i>
        </Link>
      </div>
    );
  }

  // Standard "card" layout
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-background-200 dark:border-background-800 bg-white dark:bg-background-900 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-lg transition-all my-6 ${className}`}
    >
      <div className="flex flex-col sm:flex-row">
        {resolvedVenue.image && (
          <div className="relative sm:w-56 md:w-64 h-48 sm:h-auto shrink-0 overflow-hidden bg-background-100 dark:bg-background-800">
            <img
              src={imageError ? fallbackImage : resolvedVenue.image}
              alt={resolvedVenue.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        )}

        <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {resolvedVenue.subcategory && (
                <span className="px-2.5 py-0.5 rounded-full bg-primary-50 text-primary-700 dark:bg-primary-950/40 dark:text-primary-300 text-xs font-medium">
                  {resolvedVenue.subcategory}
                </span>
              )}
              {resolvedVenue.priceRange && (
                <span className="px-2.5 py-0.5 rounded-full bg-background-100 text-foreground-700 dark:bg-background-800 dark:text-foreground-300 text-xs font-semibold">
                  {resolvedVenue.priceRange}
                </span>
              )}
              {resolvedVenue.trustBadge && (
                <span className="px-2.5 py-0.5 rounded-full bg-accent-50 text-accent-700 dark:bg-accent-950/40 dark:text-accent-300 border border-accent-200 dark:border-accent-800/50 text-xs font-semibold flex items-center gap-1">
                  <i className="ri-shield-check-line text-xs"></i>
                  {resolvedVenue.trustBadge}
                </span>
              )}
            </div>

            <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground-900 dark:text-white mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {resolvedVenue.name}
            </h3>

            <div className="flex items-center gap-3 mb-3 text-sm">
              <div className="flex items-center gap-1 text-amber-500 font-bold">
                <i className="ri-star-fill text-amber-500"></i>
                <span className="text-foreground-900 dark:text-white">
                  {resolvedVenue.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-foreground-400 text-xs">
                ({resolvedVenue.reviewCount} reviews)
              </span>
              {resolvedVenue.address && (
                <span className="hidden md:inline text-xs text-foreground-500 truncate max-w-[200px]">
                  <i className="ri-map-pin-line mr-1"></i>
                  {resolvedVenue.address}
                </span>
              )}
            </div>

            {resolvedVenue.description && (
              <p className="text-foreground-600 dark:text-foreground-300 text-sm line-clamp-2 mb-4 leading-relaxed">
                {resolvedVenue.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-background-100 dark:border-background-800">
            <div className="flex items-center gap-3 text-xs text-foreground-500">
              {resolvedVenue.phone && (
                <a
                  href={`tel:${resolvedVenue.phone}`}
                  className="hover:text-primary-600 transition-colors flex items-center gap-1"
                  title="Call venue"
                >
                  <i className="ri-phone-line"></i>
                  <span className="hidden sm:inline">Call</span>
                </a>
              )}
              {resolvedVenue.website && (
                <a
                  href={resolvedVenue.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-primary-600 transition-colors flex items-center gap-1"
                  title="Visit website"
                >
                  <i className="ri-global-line"></i>
                  <span className="hidden sm:inline">Website</span>
                </a>
              )}
            </div>

            <Link
              to={`/business/${resolvedVenue.id}`}
              onClick={handleActionClick}
              aria-label={`View ${resolvedVenue.name}`}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-semibold shadow-sm transition-all hover:gap-2"
            >
              <span>View details</span>
              <i className="ri-arrow-right-line"></i>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
