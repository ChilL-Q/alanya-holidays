import React from "react";

export type TrustBadgeType =
  | "Recommended by Travellers"
  | "Trusted by Travellers"
  | "Verified Experience"
  | "Signature Collection"
  | "Top Rated Destination Partner"
  | "Curated Experience"
  | "Local Favorite";

export const TRUST_BADGES: readonly TrustBadgeType[] = [
  "Recommended by Travellers",
  "Trusted by Travellers",
  "Verified Experience",
  "Signature Collection",
  "Top Rated Destination Partner",
  "Curated Experience",
  "Local Favorite",
] as const;

export function isTrustBadge(value: unknown): value is TrustBadgeType {
  return typeof value === "string" && (TRUST_BADGES as readonly string[]).includes(value);
}

export type TrustBadgeVariant = "glass" | "solid" | "subtle" | "pill";
export type TrustBadgeSize = "xs" | "sm" | "md" | "lg";

export interface TrustBadgeConfig {
  label: TrustBadgeType;
  shortLabel: string;
  icon: string;
  description: string;
  iconClass: string;
  styles: Record<TrustBadgeVariant, string>;
}

export const TRUST_BADGES_CONFIG: Record<TrustBadgeType, TrustBadgeConfig> = {
  "Recommended by Travellers": {
    label: "Recommended by Travellers",
    shortLabel: "Recommended",
    icon: "ri-star-smile-fill",
    description: "Highly recommended by verified travelers for outstanding hospitality and experience.",
    iconClass: "text-amber-300",
    styles: {
      glass: "bg-amber-950/80 text-amber-300 border border-amber-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-amber-500 text-amber-950 font-semibold border border-amber-400/40 shadow-sm",
      subtle: "bg-amber-50 text-amber-900 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/40",
      pill: "bg-amber-100 text-amber-900 font-medium",
    },
  },
  "Trusted by Travellers": {
    label: "Trusted by Travellers",
    shortLabel: "Trusted",
    icon: "ri-shield-check-fill",
    description: "Demonstrated reliability, quality standards, and consistent positive guest experiences.",
    iconClass: "text-sky-300",
    styles: {
      glass: "bg-sky-950/80 text-sky-300 border border-sky-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-sky-600 text-white font-medium border border-sky-400/40 shadow-sm",
      subtle: "bg-sky-50 text-sky-900 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/40",
      pill: "bg-sky-100 text-sky-900 font-medium",
    },
  },
  "Verified Experience": {
    label: "Verified Experience",
    shortLabel: "Verified",
    icon: "ri-checkbox-circle-fill",
    description: "Verified on-site by Alanya Holidays for quality assurance and authentic service.",
    iconClass: "text-emerald-300",
    styles: {
      glass: "bg-emerald-950/80 text-emerald-300 border border-emerald-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-emerald-600 text-white font-medium border border-emerald-400/40 shadow-sm",
      subtle: "bg-emerald-50 text-emerald-900 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/40",
      pill: "bg-emerald-100 text-emerald-900 font-medium",
    },
  },
  "Signature Collection": {
    label: "Signature Collection",
    shortLabel: "Signature",
    icon: "ri-vip-diamond-fill",
    description: "Handpicked premium establishment offering luxury amenities and bespoke hospitality.",
    iconClass: "text-purple-300",
    styles: {
      glass: "bg-purple-950/80 text-purple-300 border border-purple-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-purple-600 text-white font-medium border border-purple-400/40 shadow-sm",
      subtle: "bg-purple-50 text-purple-950 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/40",
      pill: "bg-purple-100 text-purple-950 font-medium",
    },
  },
  "Top Rated Destination Partner": {
    label: "Top Rated Destination Partner",
    shortLabel: "Top Partner",
    icon: "ri-award-fill",
    description: "Awarded to the highest-rated businesses across Alanya based on comprehensive traveler reviews.",
    iconClass: "text-indigo-300",
    styles: {
      glass: "bg-indigo-950/80 text-indigo-300 border border-indigo-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-indigo-600 text-white font-medium border border-indigo-400/40 shadow-sm",
      subtle: "bg-indigo-50 text-indigo-950 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/40",
      pill: "bg-indigo-100 text-indigo-950 font-medium",
    },
  },
  "Curated Experience": {
    label: "Curated Experience",
    shortLabel: "Curated",
    icon: "ri-compass-3-fill",
    description: "Specially selected excursion, tour, or activity designed for an unforgettable journey.",
    iconClass: "text-teal-300",
    styles: {
      glass: "bg-teal-950/80 text-teal-300 border border-teal-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-teal-600 text-white font-medium border border-teal-400/40 shadow-sm",
      subtle: "bg-teal-50 text-teal-900 border border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800/40",
      pill: "bg-teal-100 text-teal-900 font-medium",
    },
  },
  "Local Favorite": {
    label: "Local Favorite",
    shortLabel: "Local Fav",
    icon: "ri-heart-3-fill",
    description: "Cherished by Alanya locals for authentic Mediterranean flavors, tradition, and warmth.",
    iconClass: "text-rose-300",
    styles: {
      glass: "bg-rose-950/80 text-rose-300 border border-rose-400/40 backdrop-blur-md shadow-sm",
      solid: "bg-rose-600 text-white font-medium border border-rose-400/40 shadow-sm",
      subtle: "bg-rose-50 text-rose-950 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800/40",
      pill: "bg-rose-100 text-rose-950 font-medium",
    },
  },
};

export interface TrustBadgeBusinessData {
  id?: string;
  name?: string;
  category?: string | null;
  subcategory?: string | null;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  rating?: number | string | null;
  average_rating?: number | string | null;
  reviewCount?: number | string | null;
  review_count?: number | string | null;
  reviews_count?: number | string | null;
  image?: string;
  tags?: string[] | string | null;
  featured?: boolean | null;
  is_featured?: boolean | null;
  is_verified?: boolean | null;
  verified?: boolean | null;
  is_claimed?: boolean | null;
  claimed_at?: string | null;
  trustBadge?: TrustBadgeType | string | null;
  trust_badge?: TrustBadgeType | string | null;
  tier?: "partner" | "signature" | "voyager" | "explorer" | string | null;
  priceRange?: string | null;
  price_range?: string | null;
  openingHours?: string;
  lat?: number;
  lng?: number;
}

export type ResolveTrustBadgeInput = TrustBadgeBusinessData | string | null | undefined;

function extractRating(input: ResolveTrustBadgeInput): number {
  if (!input || typeof input !== "object") return 0;
  const raw = input.rating ?? input.average_rating;
  if (typeof raw === "number" && !Number.isNaN(raw) && Number.isFinite(raw)) {
    return Math.max(0, Math.min(5, raw));
  }
  if (typeof raw === "string") {
    const parsed = parseFloat(raw);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(0, Math.min(5, parsed));
    }
  }
  return 0;
}

function extractReviewCount(input: ResolveTrustBadgeInput): number {
  if (!input || typeof input !== "object") return 0;
  const raw = input.reviewCount ?? input.review_count ?? input.reviews_count;
  if (typeof raw === "number" && !Number.isNaN(raw) && Number.isFinite(raw)) {
    return Math.max(0, Math.floor(raw));
  }
  if (typeof raw === "string") {
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && Number.isFinite(parsed)) {
      return Math.max(0, parsed);
    }
  }
  return 0;
}

function extractTags(input: ResolveTrustBadgeInput): string[] {
  if (!input || typeof input !== "object" || !input.tags) return [];
  if (Array.isArray(input.tags)) {
    return input.tags.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
  }
  if (typeof input.tags === "string") {
    try {
      const parsed = JSON.parse(input.tags);
      if (Array.isArray(parsed)) {
        return parsed.map((t) => String(t).trim().toLowerCase()).filter(Boolean);
      }
    } catch {
      // not JSON string
    }
    return input.tags
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);
  }
  return [];
}

function extractTier(input: ResolveTrustBadgeInput): string {
  if (!input || typeof input !== "object" || !input.tier) return "";
  return String(input.tier).trim().toLowerCase();
}

export function resolveTrustBadge(input?: ResolveTrustBadgeInput): TrustBadgeType | null {
  if (!input) return null;

  // Case 1: Direct string passed
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;
    if (isTrustBadge(trimmed)) {
      return trimmed;
    }
    const lower = trimmed.toLowerCase();
    const matchedCanonical = TRUST_BADGES.find((b) => b.toLowerCase() === lower);
    if (matchedCanonical) {
      return matchedCanonical;
    }
    if (lower === "featured" || lower === "recommended") return "Recommended by Travellers";
    if (lower === "trusted" || lower === "verified-partner") return "Trusted by Travellers";
    if (lower === "verified" || lower === "inspected") return "Verified Experience";
    if (lower === "signature" || lower === "premium" || lower === "luxury") return "Signature Collection";
    if (lower === "top rated" || lower === "top-rated" || lower === "partner") return "Top Rated Destination Partner";
    if (lower === "curated" || lower === "experience") return "Curated Experience";
    if (lower === "local" || lower === "local favorite" || lower === "favorite") return "Local Favorite";
    return null;
  }

  // Case 2: Explicit override in object
  const explicit = input.trustBadge ?? input.trust_badge;
  if (explicit) {
    const resolvedFromStr = resolveTrustBadge(explicit as string);
    if (resolvedFromStr) return resolvedFromStr;
  }

  const tier = extractTier(input);
  const rating = extractRating(input);
  const reviewCount = extractReviewCount(input);
  const tags = extractTags(input);
  const isFeatured = Boolean(input.featured ?? input.is_featured);
  const isVerified = Boolean(input.is_verified ?? input.verified);
  const isClaimed = Boolean(input.is_claimed ?? input.claimed_at);
  const category = (input.category || "").toLowerCase();
  const subcategory = (input.subcategory || "").toLowerCase();
  const priceRange = input.priceRange || input.price_range || "";

  // Stage 2: Onboarding Tier Mapping
  if (tier === "signature") {
    return "Signature Collection";
  }
  if (tier === "partner") {
    return rating >= 4.5 ? "Top Rated Destination Partner" : "Curated Experience";
  }
  if (tier === "voyager") {
    return "Curated Experience";
  }

  // Stage 3: Curated Domain Tag Matching
  const hasTag = (...terms: string[]) =>
    tags.some((tag) => terms.some((term) => tag.includes(term.toLowerCase())));

  if (hasTag("local favorite", "hidden gem", "local gem", "authentic", "family-run", "traditional", "neighborhood favorite")) {
    return "Local Favorite";
  }
  if (hasTag("luxury", "fine dining", "5-star", "vip", "michelin", "signature collection", "signature", "exclusive")) {
    return "Signature Collection";
  }
  if (hasTag("curated", "boutique", "handpicked", "exclusive experience", "curated experience")) {
    return "Curated Experience";
  }
  if (hasTag("verified partner", "verified experience", "certified guide", "verified")) {
    return "Verified Experience";
  }

  // Stage 4: Statistical Metrics (Rating + Review Volume)
  if (priceRange === "$$$" && rating >= 4.7) {
    return "Signature Collection";
  }

  if (rating >= 4.8 && reviewCount >= 100) {
    return "Top Rated Destination Partner";
  }

  if (
    rating >= 4.6 &&
    reviewCount >= 15 &&
    (priceRange === "$" || subcategory.includes("turkish") || category.includes("restaurant") || subcategory.includes("breakfast") || subcategory.includes("café"))
  ) {
    return "Local Favorite";
  }

  if (
    category.includes("tour") ||
    category.includes("activity") ||
    subcategory.includes("tour") ||
    subcategory.includes("excursion") ||
    hasTag("tour", "adventure")
  ) {
    if (rating >= 4.0) {
      return "Curated Experience";
    }
  }

  if (rating >= 4.7 && reviewCount >= 30) {
    return "Recommended by Travellers";
  }

  if (rating >= 4.4 && reviewCount >= 10) {
    return "Trusted by Travellers";
  }

  // Stage 5: Ownership Verification / Claim Status
  if (isVerified || isClaimed) {
    return "Verified Experience";
  }

  // Stage 6: Legacy "Featured" Flag Migration
  if (isFeatured) {
    return rating >= 4.5 || rating === 0 ? "Recommended by Travellers" : "Curated Experience";
  }

  // Stage 7: Baseline / Unmatched
  return null;
}

const SIZE_STYLES: Record<TrustBadgeSize, { container: string; icon: string; text: string }> = {
  xs: {
    container: "px-2 py-0.5 text-[10px] gap-1",
    icon: "text-[10px]",
    text: "text-[10px] leading-none",
  },
  sm: {
    container: "px-2.5 py-1 text-xs gap-1.5",
    icon: "text-xs",
    text: "text-xs leading-none",
  },
  md: {
    container: "px-3 py-1.5 text-sm gap-1.5",
    icon: "text-sm",
    text: "text-sm leading-tight",
  },
  lg: {
    container: "px-4 py-2 text-base gap-2",
    icon: "text-base",
    text: "text-base leading-tight",
  },
};

export interface TrustBadgeProps {
  badge?: TrustBadgeType | string | null;
  business?: ResolveTrustBadgeInput | null;
  variant?: TrustBadgeVariant;
  size?: TrustBadgeSize;
  showIcon?: boolean;
  truncateOnMobile?: boolean;
  className?: string;
  iconClassName?: string;
  "aria-label"?: string;
  onClick?: (e: React.MouseEvent<HTMLSpanElement>) => void;
}

export function TrustBadge({
  badge,
  business,
  variant = "glass",
  size = "sm",
  showIcon = true,
  truncateOnMobile = false,
  className = "",
  iconClassName = "",
  "aria-label": customAriaLabel,
  onClick,
}: TrustBadgeProps) {
  const resolvedBadge = resolveTrustBadge(badge || business);

  if (!resolvedBadge) {
    return null;
  }

  const config = TRUST_BADGES_CONFIG[resolvedBadge];
  if (!config) {
    return null;
  }

  const sizeStyle = SIZE_STYLES[size] || SIZE_STYLES.sm;
  const variantStyle = config.styles[variant] || config.styles.glass;

  return (
    <span
      role="status"
      aria-label={customAriaLabel || config.label}
      title={config.description}
      onClick={onClick}
      className={`inline-flex items-center rounded-full font-semibold whitespace-nowrap transition-colors select-none ${sizeStyle.container} ${variantStyle} ${className}`}
      data-testid="trust-badge"
      data-badge-type={resolvedBadge}
    >
      {showIcon && (
        <i
          className={`${config.icon} ${sizeStyle.icon} shrink-0 ${variant === "subtle" ? "" : config.iconClass} ${iconClassName}`}
          aria-hidden="true"
        />
      )}
      <span className={`${sizeStyle.text} ${truncateOnMobile ? "truncate max-w-[130px] sm:max-w-none" : ""}`}>
        {config.label}
      </span>
    </span>
  );
}

export default TrustBadge;
