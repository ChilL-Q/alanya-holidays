import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import type { Business } from "@/mocks/businesses";

interface BusinessCardProps {
  business: Business;
  compareMode?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  maxReached?: boolean;
}

const priceRangeLabel: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
};

export default function BusinessCard({ business, compareMode = false, isCompared = false, onToggleCompare, maxReached = false }: BusinessCardProps) {
  const navigate = useNavigate();
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorited = isFavorite(business.id);

  const handleCardClick = () => {
    if (compareMode) {
      onToggleCompare?.(business.id);
    } else {
      navigate(`/business/${business.id}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      data-testid="business-card"
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`bg-white rounded-2xl border transition-all group overflow-hidden flex flex-col cursor-pointer ${
        compareMode
          ? isCompared
            ? "border-accent-400 ring-2 ring-accent-200"
            : "border-background-200/70 hover:border-accent-200"
          : "border-background-200/70 hover:border-primary-200/60"
      }`}
    >
      {/* Image */}
      <div className="relative w-full h-48 overflow-hidden">
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
        />
        {/* Compare checkbox overlay */}
        {compareMode && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggleCompare?.(business.id); }}
            className={`absolute top-3 left-3 w-7 h-7 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer z-10 ${
              isCompared
                ? "bg-accent-500 border-accent-500 text-white"
                : maxReached
                  ? "bg-white/70 border-foreground-300 text-foreground-400 cursor-not-allowed"
                  : "bg-white/80 border-foreground-300 text-transparent hover:border-accent-400"
            }`}
            disabled={maxReached && !isCompared}
            title={isCompared ? "Remove from comparison" : maxReached ? "Max 4 businesses" : "Add to comparison"}
          >
            {isCompared && <i className="ri-check-line text-sm"></i>}
          </button>
        )}
        {/* Featured badge */}
        {business.featured && !compareMode && (
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-accent-500 text-white text-xs font-semibold flex items-center gap-1 whitespace-nowrap">
            <i className="ri-star-fill text-[10px]"></i>
            Featured
          </div>
        )}
        {/* Price range */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-foreground-700 text-xs font-medium whitespace-nowrap">
          {priceRangeLabel[business.priceRange] || business.priceRange}
        </div>
        {/* Category badge */}
        <div className="absolute bottom-3 left-3">
          <span className="px-2.5 py-1 rounded-full bg-foreground-900/70 backdrop-blur-sm text-white text-xs font-medium whitespace-nowrap">
            {business.subcategory}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        {/* Name & Rating */}
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="font-heading text-base md:text-lg text-foreground-900 leading-tight group-hover:text-primary-500 transition-colors">
            {business.name}
          </h3>
          <div className="flex items-center gap-1 shrink-0">
            <i className="ri-star-fill text-yellow-400 text-sm"></i>
            <span className="text-sm font-semibold text-foreground-900">{business.rating}</span>
            <span className="text-xs text-foreground-500">({business.reviewCount})</span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-foreground-500 leading-relaxed mb-4 line-clamp-3">
          {business.description}
        </p>

        {/* Address */}
        <div className="flex items-start gap-2 mb-3">
          <i className="ri-map-pin-line text-foreground-400 text-sm mt-0.5 shrink-0"></i>
          <span className="text-xs text-foreground-500 leading-relaxed">{business.address}</span>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-2 mb-4">
          <i className="ri-time-line text-foreground-400 text-sm shrink-0"></i>
          <span className="text-xs text-foreground-500 whitespace-nowrap">{business.openingHours}</span>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5 mt-auto">
          {business.tags.slice(0, 4).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full bg-secondary-100 text-secondary-800 text-xs font-medium whitespace-nowrap"
            >
              {tag}
            </span>
          ))}
          {business.tags.length > 4 && (
            <span className="px-2 py-0.5 rounded-full bg-background-100 text-foreground-500 text-xs whitespace-nowrap">
              +{business.tags.length - 4} more
            </span>
          )}
        </div>

        {/* Contact buttons */}
        <div className="flex items-center gap-2">
          <a
            href={`tel:${business.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-phone-line text-sm"></i>
            Call
          </a>
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full border border-foreground-200 text-foreground-700 text-sm font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-external-link-line text-sm"></i>
            Website
          </a>
          <button
            onClick={(e) => { e.stopPropagation(); toggleFavorite(business.id); }}
            className={`w-10 h-10 flex items-center justify-center rounded-full border transition-all cursor-pointer ${
              favorited
                ? "border-accent-300 bg-accent-50 text-accent-500"
                : "border-foreground-200 text-foreground-500 hover:text-accent-500 hover:border-accent-300"
            }`}
            title={favorited ? "Remove from favorites" : "Save to favorites"}
          >
            <i className={`${favorited ? "ri-heart-fill" : "ri-heart-line"} text-lg`}></i>
          </button>
        </div>
      </div>
    </div>
  );
}