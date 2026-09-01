import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  TOURISM_SEASONALITY_DATA,
  SOURCE_COUNTRIES_DATA,
  TOTAL_ANNUAL_TOURISTS,
  PEAK_SEASON_PERCENTAGE,
  type MonthlyTourismSeasonality,
  type SourceCountryTourism,
} from "../data/regionalData";
import { useTranslation } from "react-i18next";

interface SeasonalityTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: MonthlyTourismSeasonality;
  }>;
}

function SeasonalityTooltip({ active, payload }: SeasonalityTooltipProps) {
  const { t } = useTranslation();
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 rounded-xl p-3 shadow-lg max-w-xs text-xs z-50">
        <div className="flex items-center justify-between gap-2 font-bold text-foreground-900 dark:text-foreground-50 text-sm mb-1">
          <span>{data.month}</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              data.season === "Peak"
                ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                : data.season === "Shoulder"
                ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
            }`}
          >
            {data.season} {t("insights.season")}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-700 dark:text-foreground-200 mb-1">
          <span>{t("insights.estimatedArrivals")}</span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {data.tourists.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 mb-2">
          <span>{t("insights.annualShare")}</span>
          <span className="font-semibold">{data.share}%</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-foreground-600 dark:text-foreground-300 border-t border-background-100 dark:border-background-700 pt-2">
          <div>{t("insights.avgAir")} <span className="font-semibold">{data.tempAvgC}°C</span></div>
          <div>{t("insights.avgSea")} <span className="font-semibold">{data.seaTempC}°C</span></div>
        </div>
      </div>
    );
  }
  return null;
}

interface CountryTooltipProps {
  active?: boolean;
  payload?: Array<{
    value?: number;
    payload?: SourceCountryTourism;
  }>;
}

function SourceCountryTooltip({ active, payload }: CountryTooltipProps) {
  const { t } = useTranslation();
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 rounded-xl p-3 shadow-lg max-w-xs text-xs z-50">
        <div className="flex items-center gap-2 font-bold text-foreground-900 dark:text-foreground-50 text-sm mb-1">
          <span>{data.flag}</span>
          <span>{data.country}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-700 dark:text-foreground-200 mb-1">
          <span>{t("insights.inboundVisitors")}</span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {data.visitors.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 mb-1">
          <span>{t("insights.marketShare")}</span>
          <span className="font-semibold">{data.share}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 border-t border-background-100 dark:border-background-700 pt-1.5">
          <span>{t("insights.yoyGrowth")}</span>
          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{data.growthRate}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function TourismCharts() {
  const { t } = useTranslation();
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState<"All" | "Peak" | "Shoulder" | "Low">("All");

  const filteredMonthly = selectedSeasonFilter === "All"
    ? TOURISM_SEASONALITY_DATA
    : TOURISM_SEASONALITY_DATA.filter((d) => d.season === selectedSeasonFilter);

  return (
    <section id="tourism" className="py-8 md:py-12 border-t border-background-200 dark:border-background-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary-100 dark:bg-secondary-950/80 border border-secondary-200 dark:border-secondary-800/60 text-secondary-800 dark:text-secondary-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <i className="ri-flight-takeoff-line" />
            <span>{t("insights.tourismDynamics")}</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight">
            16.9M Annual Mediterranean Visitors
          </h2>
          <p className="text-sm sm:text-base text-foreground-600 dark:text-foreground-400 mt-2">
            Antalya & Alanya serve as the Mediterranean&apos;s leading holiday destination. Inbound arrivals peak from June to September, with growing shoulder season volume driven by cycling, hiking, and cultural tourism.
          </p>
        </div>

        {/* 2-Column Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart 3: Seasonality Area Chart */}
          <div className="lg:col-span-6 bg-white dark:bg-background-800/90 rounded-2xl border border-background-200 dark:border-background-700/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-50">
                    Monthly Tourist Arrivals Seasonality
                  </h3>
                  <p className="text-xs text-foreground-500 dark:text-foreground-400">
                    Jan–Dec distribution (Antalya & Gazipaşa-Alanya Airports)
                  </p>
                </div>
                {/* Filter Pills */}
                <div className="inline-flex rounded-lg bg-background-100 dark:bg-background-900 p-0.5 self-start sm:self-auto">
                  {(["All", "Peak", "Shoulder", "Low"] as const).map((season) => (
                    <button
                      key={season}
                      onClick={() => setSelectedSeasonFilter(season)}
                      className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all ${
                        selectedSeasonFilter === season
                          ? "bg-white dark:bg-background-700 text-primary-600 dark:text-primary-400 shadow-sm"
                          : "text-foreground-600 dark:text-foreground-400 hover:text-foreground-900"
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>

              {/* Chart Container */}
              <div className="h-64 sm:h-72 w-full my-2" data-testid="seasonality-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={filteredMonthly}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="tourismGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      dataKey="shortMonth"
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <Tooltip content={<SeasonalityTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="tourists"
                      stroke="#f97316"
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#tourismGradient)"
                      activeDot={{ r: 6, fill: "#f97316", stroke: "#ffffff", strokeWidth: 2 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Seasonality Insights Footer */}
            <div className="mt-4 pt-4 border-t border-background-100 dark:border-background-700/70 grid grid-cols-3 gap-2 text-center">
              <div className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50">
                <div className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider">
                  Peak (May–Sep)
                </div>
                <div className="text-base font-extrabold text-rose-900 dark:text-rose-200 mt-0.5">
                  {PEAK_SEASON_PERCENTAGE}%
                </div>
                <div className="text-[10px] text-rose-600 dark:text-rose-400">12.78M visitors</div>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50">
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider">
                  Shoulder (Mar, Apr, Oct)
                </div>
                <div className="text-base font-extrabold text-amber-900 dark:text-amber-200 mt-0.5">
                  18.1%
                </div>
                <div className="text-[10px] text-amber-600 dark:text-amber-400">3.06M visitors</div>
              </div>
              <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50">
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
                  Winter Sun (Nov–Feb)
                </div>
                <div className="text-base font-extrabold text-blue-900 dark:text-blue-200 mt-0.5">
                  6.3%
                </div>
                <div className="text-[10px] text-blue-600 dark:text-blue-400">1.06M visitors</div>
              </div>
            </div>
          </div>

          {/* Chart 4: Top Source Countries for Tourism */}
          <div className="lg:col-span-6 bg-white dark:bg-background-800/90 rounded-2xl border border-background-200 dark:border-background-700/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-50">
                    Top Source Countries for Tourism
                  </h3>
                  <p className="text-xs text-foreground-500 dark:text-foreground-400">
                    Total: {TOTAL_ANNUAL_TOURISTS.toLocaleString()} inbound foreign visitors
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-secondary-50 dark:bg-secondary-950/70 text-secondary-600 dark:text-secondary-400 text-base">
                  <i className="ri-earth-line" />
                </span>
              </div>

              {/* Chart Container */}
              <div className="h-64 sm:h-72 w-full my-2" data-testid="source-countries-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={SOURCE_COUNTRIES_DATA}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 55, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      type="number"
                      domain={[0, 6000000]}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(val) => `${(val / 1000000).toFixed(1)}M`}
                    />
                    <YAxis
                      dataKey="country"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                      width={105}
                    />
                    <Tooltip content={<SourceCountryTooltip />} />
                    <Bar dataKey="visitors" radius={[0, 8, 8, 0]}>
                      {SOURCE_COUNTRIES_DATA.map((entry) => (
                        <Cell key={`bar-country-${entry.country}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Country Share Cards */}
            <div className="mt-4 pt-4 border-t border-background-100 dark:border-background-700/70">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {SOURCE_COUNTRIES_DATA.slice(0, 4).map((country) => (
                  <div
                    key={country.country}
                    className="p-2.5 rounded-xl bg-background-50 dark:bg-background-900/70 border border-background-200 dark:border-background-700/60"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground-800 dark:text-foreground-200">
                      <span>{country.flag}</span>
                      <span className="truncate">{country.country}</span>
                    </div>
                    <div className="text-sm font-extrabold text-foreground-900 dark:text-foreground-50 mt-1">
                      {country.formatted}
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-foreground-500 mt-0.5">
                      <span>{country.share}%</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">{country.growthRate}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
