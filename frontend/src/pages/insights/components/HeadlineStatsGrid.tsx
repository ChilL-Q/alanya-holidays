import React from "react";
import { PROVINCE_HEADLINE_METRICS, type ProvinceMetric } from "../data/regionalData";

interface HeadlineStatsGridProps {
  metrics?: ProvinceMetric[];
}

export default function HeadlineStatsGrid({ metrics = PROVINCE_HEADLINE_METRICS }: HeadlineStatsGridProps) {
  return (
    <section className="py-8 md:py-12" aria-labelledby="headline-stats-title">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
          <div>
            <h2 id="headline-stats-title" className="text-xl sm:text-2xl font-bold text-foreground-900 dark:text-foreground-50">
              Antalya Province at a Glance
            </h2>
            <p className="text-sm text-foreground-600 dark:text-foreground-400 mt-1">
              Key demographic and geographic indicators across 19 municipal districts
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs text-foreground-500 dark:text-foreground-400 bg-background-100 dark:bg-background-800/80 px-3 py-1.5 rounded-full self-start sm:self-auto border border-background-200 dark:border-background-700">
            <i className="ri-database-2-line text-primary-500" />
            <span>Updated ADNKS 2024/2025</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5">
          {metrics.map((metric) => (
            <div
              key={metric.id}
              data-testid={`metric-card-${metric.id}`}
              className={`relative overflow-hidden rounded-2xl p-5 border transition-all duration-200 flex flex-col justify-between ${
                metric.highlight
                  ? "bg-gradient-to-br from-white via-primary-50/20 to-white dark:from-background-800/90 dark:via-background-800/70 dark:to-background-900/90 border-primary-300/80 dark:border-primary-700/50 shadow-sm hover:shadow-md hover:border-primary-400"
                  : "bg-white dark:bg-background-800 border border-background-200/80 dark:border-background-700/80 shadow-sm hover:shadow-md hover:border-background-300 dark:hover:border-background-600"
              }`}
            >
              {/* Top Row: Icon and Trend */}
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                    metric.highlight
                      ? "bg-primary-100 dark:bg-primary-950/80 text-primary-600 dark:text-primary-400"
                      : "bg-background-100 dark:bg-background-700/80 text-foreground-700 dark:text-foreground-300"
                  }`}
                >
                  <i className={metric.icon} />
                </div>
                {metric.trend && (
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                      metric.highlight
                        ? "bg-primary-100/80 dark:bg-primary-950 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-800/50"
                        : "bg-background-100 dark:bg-background-700 text-foreground-600 dark:text-foreground-300"
                    }`}
                  >
                    {metric.trend}
                  </span>
                )}
              </div>

              {/* Middle: Value & Label */}
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight">
                  {metric.formatted}
                </div>
                <div className="text-sm font-semibold text-foreground-800 dark:text-foreground-200 mt-1">
                  {metric.label}
                </div>
              </div>

              {/* Bottom: Subtext */}
              <p className="text-xs text-foreground-500 dark:text-foreground-400 mt-3 pt-3 border-t border-background-100 dark:border-background-700/60 leading-relaxed">
                {metric.subtext}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
