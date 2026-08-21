import React from "react";

interface InsightsHeroProps {
  onScrollToSection?: (sectionId: string) => void;
}

export default function InsightsHero({ onScrollToSection }: InsightsHeroProps) {
  const handleScroll = (id: string) => {
    if (onScrollToSection) {
      onScrollToSection(id);
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-32 md:pb-20 border-b border-background-200 dark:border-background-800 bg-background-50 dark:bg-background-950">
      {/* Decorative background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-r from-primary-500/10 via-accent-500/10 to-primary-500/10 blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-100 dark:bg-primary-950/80 border border-primary-200 dark:border-primary-800/60 text-primary-800 dark:text-primary-300 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse" />
            <span>Official Regional Data & Demographics • 2024–2025</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight leading-tight mb-6">
            Antalya & Alanya{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-300 dark:to-accent-400">
              Regional Insights
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-foreground-600 dark:text-foreground-300 leading-relaxed mb-8">
            Explore comprehensive public demographic data, foreign resident communities, tourism seasonality curves, and municipal district profiles for Türkiye&apos;s premier Mediterranean coastline — verified against official TÜİK, Ministry, and Migration registries.
          </p>

          {/* Quick anchor navigation pills */}
          <div className="flex flex-wrap gap-2.5 sm:gap-3">
            <button
              onClick={() => handleScroll("demographics")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-background-800/90 border border-background-200 dark:border-background-700 text-foreground-800 dark:text-foreground-200 text-sm font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm hover:shadow"
            >
              <i className="ri-pie-chart-line text-primary-500" />
              <span>Demographics</span>
            </button>
            <button
              onClick={() => handleScroll("tourism")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-background-800/90 border border-background-200 dark:border-background-700 text-foreground-800 dark:text-foreground-200 text-sm font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm hover:shadow"
            >
              <i className="ri-flight-takeoff-line text-accent-500" />
              <span>Tourism Trends</span>
            </button>
            <button
              onClick={() => handleScroll("districts")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-background-800/90 border border-background-200 dark:border-background-700 text-foreground-800 dark:text-foreground-200 text-sm font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm hover:shadow"
            >
              <i className="ri-building-line text-secondary-500" />
              <span>8 District Profiles</span>
            </button>
            <button
              onClick={() => handleScroll("sources")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white dark:bg-background-800/90 border border-background-200 dark:border-background-700 text-foreground-800 dark:text-foreground-200 text-sm font-medium hover:border-primary-500 hover:text-primary-600 dark:hover:text-primary-400 transition-all shadow-sm hover:shadow"
            >
              <i className="ri-shield-check-line text-emerald-500" />
              <span>Official Sources</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
