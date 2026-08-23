import React from "react";
import { useNavigate } from "react-router-dom";
import { useFavorites } from "@/hooks/useFavorites";
import type { Business } from "@/api-services/directory.service";
import TrustBadge from "@/components/common/TrustBadge";

export interface BusinessCardProps {
  business: Business;
  layout?: "horizontal" | "grid";
  compareMode?: boolean;
  isCompared?: boolean;
  onToggleCompare?: (id: string) => void;
  onClaimClick?: (business: Business) => void;
  maxReached?: boolean;
}

const priceRangeLabel: Record<string, string> = {
  "$": "Budget",
  "$$": "Moderate",
  "$$$": "Premium",
};

export default function BusinessCard({
  business,
  layout = "horizontal",
  compareMode = false,
  isCompared = false,
  onToggleCompare,
  onClaimClick,
  maxReached = false,
}: BusinessCardProps) {
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

  const isHorizontal = layout === "horizontal";

  return (
    <div
      data-testid="business-card"
      data-layout={layout}
      role="button"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      className={`bg-white rounded-2xl border transition-all duration-300 group overflow-hidden cursor-pointer ${
        isHorizontal
          ? "flex flex-col md:flex-row hover:shadow-lg"
          : "flex flex-col hover:shadow-md"
      } ${
        compareMode
          ? isCompared
            ? "border-accent-500 ring-2 ring-accent-300 shadow-sm"
            : "border-background-200/80 hover:border-accent-300"
          : "border-background-200/80 hover:border-primary-300"
      }`}
    >
      {/* Image Container */}
      <div
        className={`relative overflow-hidden shrink-0 ${
          isHorizontal
            ? "w-full md:w-80 md:min-w-[20rem] h-52 md:h-auto min-h-[13rem]"
            : "w-full h-52"
        }`}
      >
        <img
          src={business.image}
          alt={business.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 md:hidden pointer-events-none" />

        {/* Compare Checkbox Overlay */}
        {compareMode && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleCompare?.(business.id);
            }}
            className={`absolute top-3 left-3 w-8 h-8 rounded-lg border-2 flex items-center justify-center transition-all cursor-pointer z-20 shadow-sm ${
              isCompared
                ? "bg-accent-500 border-accent-500 text-white"
                : maxReached
                ? "bg-white/80 border-foreground-300 text-foreground-400 cursor-not-allowed"
                : "bg-white/90 border-foreground-300 text-transparent hover:border-accent-400"
            }`}
            disabled={maxReached && !isCompared}
            title={
              isCompared
                ? "Remove from comparison"
                : maxReached
                ? "Max 4 businesses"
                : "Add to comparison"
            }
          >
            {isCompared && <i className="ri-check-line text-base font-bold" />}
          </button>
        )}

        {/* Trust Badge */}
        {!compareMode && (
          <div className="absolute top-3 left-3 z-10 max-w-[calc(100%-5.5rem)]">
            <TrustBadge
              badge={business.trustBadge}
              business={business}
              variant="glass"
              size="sm"
            />
          </div>
        )}

        {/* Price Range Pill */}
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-white/95 backdrop-blur-md text-foreground-800 text-xs font-semibold shadow-sm whitespace-nowrap z-10">
          {priceRangeLabel[business.priceRange] || business.priceRange}
        </div>

        {/* Category Badge */}
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-3 py-1 rounded-full bg-foreground-950/80 backdrop-blur-md text-white text-xs font-medium shadow-sm whitespace-nowrap flex items-center gap-1.5">
            <i className="ri-bookmark-3-fill text-[11px] text-primary-400" />
            {business.subcategory || business.category}
          </span>
        </div>
      </div>

      {/* Content Container */}
      <div className="p-5 md:p-6 flex flex-col flex-1 justify-between min-w-0">
        <div>
          {/* Header Row: Title & Rating */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <h3 className="font-heading text-lg md:text-xl font-bold text-foreground-900 leading-snug group-hover:text-primary-600 transition-colors line-clamp-1">
              {business.name}
            </h3>
            <div className="flex items-center gap-1.5 shrink-0 px-2 py-0.5 rounded-lg bg-amber-50 border border-amber-200/60">
              <i className="ri-star-fill text-amber-500 text-sm" />
              <span className="text-sm font-bold text-foreground-900">{business.rating}</span>
              <span className="text-xs text-foreground-500 font-medium">({business.reviewCount})</span>
            </div>
          </div>

          {/* Description */}
          <p className="text-sm text-foreground-600 leading-relaxed mb-3 line-clamp-2">
            {business.description}
          </p>

          {/* Metadata Row: Address & Hours */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-foreground-500 mb-3">
            <div className="flex items-center gap-1.5 truncate">
              <i className="ri-map-pin-2-fill text-primary-500 text-sm shrink-0" />
              <span className="truncate">{business.address}</span>
            </div>
            <div className="flex items-center gap-1.5 truncate">
              <i className="ri-time-fill text-secondary-600 text-sm shrink-0" />
              <span className="truncate">{business.openingHours}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {business.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-0.5 rounded-md bg-secondary-50 text-secondary-800 border border-secondary-200/60 text-xs font-medium whitespace-nowrap"
              >
                {tag}
              </span>
            ))}
            {business.tags.length > 4 && (
              <span className="px-2 py-0.5 rounded-md bg-background-100 text-foreground-500 text-xs font-medium whitespace-nowrap">
                +{business.tags.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center gap-2 pt-3 border-t border-background-100 mt-auto">
          <a
            href={`tel:${business.phone}`}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-primary-500 text-white text-xs sm:text-sm font-semibold hover:bg-primary-600 transition-colors shadow-sm whitespace-nowrap cursor-pointer"
          >
            <i className="ri-phone-fill text-sm" />
            Call
          </a>
          <a
            href={business.website}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl border border-foreground-200 text-foreground-700 text-xs sm:text-sm font-medium hover:bg-background-50 hover:text-foreground-900 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-external-link-line text-sm" />
            Website
          </a>

          {/* Claim Action Trigger */}
          {onClaimClick && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onClaimClick(business);
              }}
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-accent-200 bg-accent-50 text-accent-700 text-xs sm:text-sm font-medium hover:bg-accent-100 hover:border-accent-300 transition-colors whitespace-nowrap cursor-pointer"
              title="Claim this listing as owner"
            >
              <i className="ri-shield-user-fill text-sm text-accent-600" />
              <span>Claim</span>
            </button>
          )}

          {/* Favorite Toggle Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(business.id);
            }}
            className={`w-9 h-9 flex items-center justify-center rounded-xl border transition-all cursor-pointer shrink-0 ${
              favorited
                ? "border-accent-300 bg-accent-50 text-accent-500 shadow-sm"
                : "border-foreground-200 text-foreground-500 hover:text-accent-500 hover:border-accent-300 hover:bg-accent-50/40"
            }`}
            title={favorited ? "Remove from favorites" : "Save to favorites"}
          >
            <i className={`${favorited ? "ri-heart-fill" : "ri-heart-line"} text-base`} />
          </button>
        </div>
      </div>
    </div>
  );
}