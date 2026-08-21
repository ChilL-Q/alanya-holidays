import { Link } from "react-router-dom";

export interface EmbeddedDirectoryCtaProps {
  category: string;
  label: string;
  subtext?: string;
  icon?: string;
  buttonText?: string;
  className?: string;
}

const CATEGORY_MAP: Record<string, { name: string; icon: string }> = {
  all: { name: "All Directory", icon: "ri-store-2-line" },
  "restaurants-cafes": { name: "Restaurants & Cafés", icon: "ri-restaurant-2-line" },
  "hotels-accommodation": { name: "Hotels & Accommodation", icon: "ri-hotel-line" },
  "tours-activities": { name: "Tours & Activities", icon: "ri-ship-line" },
  "real-estate": { name: "Real Estate", icon: "ri-home-4-line" },
  "car-rental": { name: "Car & Scooter Rental", icon: "ri-car-line" },
  "health-wellness": { name: "Health & Wellness", icon: "ri-heart-pulse-line" },
  shopping: { name: "Shopping", icon: "ri-shopping-bag-3-line" },
  services: { name: "Professional Services", icon: "ri-briefcase-line" },
  nightlife: { name: "Nightlife & Bars", icon: "ri-goblet-line" },
};

function formatCategoryName(category: string): string {
  if (CATEGORY_MAP[category]) {
    return CATEGORY_MAP[category].name;
  }
  return category
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function EmbeddedDirectoryCta({
  category,
  label,
  subtext,
  icon,
  buttonText = "Explore Listings",
  className = "",
}: EmbeddedDirectoryCtaProps) {
  const categoryInfo = CATEGORY_MAP[category] || {
    name: formatCategoryName(category),
    icon: "ri-compass-3-line",
  };

  const resolvedIcon = icon || categoryInfo.icon;
  const targetUrl = `/explore?category=${encodeURIComponent(category)}`;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-primary-200/80 dark:border-primary-800/40 bg-gradient-to-r from-primary-50/70 via-accent-50/40 to-primary-50/30 dark:from-primary-950/40 dark:via-accent-950/20 dark:to-background-900 p-5 sm:p-6 my-6 shadow-sm hover:shadow-md transition-all ${className}`}
    >
      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100/80 text-primary-800 dark:bg-primary-900/60 dark:text-primary-300">
              <i className={`${resolvedIcon} text-xs`}></i>
              {categoryInfo.name}
            </span>
          </div>

          <h3 className="font-heading text-lg sm:text-xl font-bold text-foreground-900 dark:text-white mb-1">
            {label}
          </h3>

          {subtext && (
            <p className="text-foreground-600 dark:text-foreground-300 text-sm leading-relaxed max-w-xl">
              {subtext}
            </p>
          )}
        </div>

        <div className="shrink-0 pt-2 md:pt-0">
          <Link
            to={targetUrl}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white font-semibold text-sm shadow-sm transition-all hover:gap-3 cursor-pointer"
            aria-label={`${label} - ${buttonText}`}
          >
            <span>{buttonText}</span>
            <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      </div>
    </div>
  );
}
