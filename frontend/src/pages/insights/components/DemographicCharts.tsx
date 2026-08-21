import React, { useState } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import {
  NATIONALITY_DISTRIBUTION,
  DISTRICT_FOREIGN_POPULATION,
  TOTAL_FOREIGN_POPULATION,
  type NationalityShare,
  type DistrictForeignPop,
} from "../data/regionalData";

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    payload?: NationalityShare | DistrictForeignPop;
  }>;
}

function NationalityTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as NationalityShare;
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 rounded-xl p-3 shadow-lg max-w-xs text-xs z-50">
        <div className="flex items-center gap-2 font-bold text-foreground-900 dark:text-foreground-50 text-sm mb-1">
          <span>{data.flag}</span>
          <span>{data.nationality}</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-700 dark:text-foreground-200 mb-1.5">
          <span>Registered Residents:</span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {data.count.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 mb-2">
          <span>Share of Province:</span>
          <span className="font-semibold">{data.percentage}%</span>
        </div>
        <p className="text-[11px] text-foreground-500 dark:text-foreground-400 border-t border-background-100 dark:border-background-700 pt-1.5 leading-tight">
          {data.description}
        </p>
      </div>
    );
  }
  return null;
}

function DistrictTooltip({ active, payload }: CustomTooltipProps) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload as DistrictForeignPop;
    if (!data) return null;
    return (
      <div className="bg-white dark:bg-background-800 border border-background-200 dark:border-background-700 rounded-xl p-3 shadow-lg max-w-xs text-xs z-50">
        <div className="flex items-center justify-between gap-2 font-bold text-foreground-900 dark:text-foreground-50 text-sm mb-1">
          <span>{data.district}</span>
          {data.isMainHub && (
            <span className="px-1.5 py-0.5 rounded bg-primary-100 dark:bg-primary-950 text-primary-700 dark:text-primary-300 text-[10px] font-bold">
              #1 HUB
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-700 dark:text-foreground-200 mb-1">
          <span>Foreign Residents:</span>
          <span className="font-semibold text-primary-600 dark:text-primary-400">
            {data.count.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 mb-1">
          <span>Share of All Foreigners:</span>
          <span className="font-semibold">{data.percentage}%</span>
        </div>
        <div className="flex items-center justify-between gap-4 text-foreground-600 dark:text-foreground-400 mb-2">
          <span>District Expat Share:</span>
          <span className="font-semibold">{data.foreignShareInDistrict}%</span>
        </div>
        <p className="text-[11px] text-foreground-500 dark:text-foreground-400 border-t border-background-100 dark:border-background-700 pt-1.5 leading-tight">
          {data.description}
        </p>
      </div>
    );
  }
  return null;
}

export default function DemographicCharts() {
  const [selectedNationality, setSelectedNationality] = useState<string | null>(null);

  return (
    <section id="demographics" className="py-8 md:py-12 border-t border-background-200 dark:border-background-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-3xl mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-100 dark:bg-accent-950/80 border border-accent-200 dark:border-accent-800/60 text-accent-800 dark:text-accent-300 text-xs font-semibold uppercase tracking-wider mb-3">
            <i className="ri-user-heart-line" />
            <span>Expatriate & Resident Demographics</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground-900 dark:text-foreground-50 tracking-tight">
            International Communities in Antalya & Alanya
          </h2>
          <p className="text-sm sm:text-base text-foreground-600 dark:text-foreground-400 mt-2">
            Antalya Province is home to over 185,000 registered foreign residents from 120+ countries. Alanya represents the single largest international hub, accommodating nearly a third of all foreign residents in the province.
          </p>
        </div>

        {/* 2-Column Visualization Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Chart 1: Donut Chart - Foreign Residents by Nationality */}
          <div className="lg:col-span-6 bg-white dark:bg-background-800/90 rounded-2xl border border-background-200 dark:border-background-700/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-50">
                    Foreign Residents by Nationality
                  </h3>
                  <p className="text-xs text-foreground-500 dark:text-foreground-400">
                    Total: {TOTAL_FOREIGN_POPULATION.toLocaleString()} registered permit holders
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-primary-50 dark:bg-primary-950/70 text-primary-600 dark:text-primary-400 text-base">
                  <i className="ri-pie-chart-2-line" />
                </span>
              </div>

              {/* Chart Container */}
              <div className="h-64 sm:h-72 w-full my-2" data-testid="nationality-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={NATIONALITY_DISTRIBUTION}
                      dataKey="count"
                      nameKey="nationality"
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={95}
                      paddingAngle={3}
                    >
                      {NATIONALITY_DISTRIBUTION.map((entry) => (
                        <Cell
                          key={`cell-${entry.nationality}`}
                          fill={entry.color}
                          stroke="transparent"
                          className="cursor-pointer transition-opacity hover:opacity-80"
                          onClick={() =>
                            setSelectedNationality(
                              selectedNationality === entry.nationality ? null : entry.nationality
                            )
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<NationalityTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Breakdown List */}
            <div className="mt-4 pt-4 border-t border-background-100 dark:border-background-700/70 space-y-2">
              <div className="text-xs font-semibold text-foreground-700 dark:text-foreground-300 uppercase tracking-wider mb-2">
                Top Expat Communities
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {NATIONALITY_DISTRIBUTION.map((item) => (
                  <button
                    key={item.nationality}
                    onClick={() => setSelectedNationality(selectedNationality === item.nationality ? null : item.nationality)}
                    className={`flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                      selectedNationality === item.nationality
                        ? "bg-primary-50 dark:bg-primary-950/70 border border-primary-300 dark:border-primary-700"
                        : "bg-background-50/70 dark:bg-background-900/60 hover:bg-background-100 dark:hover:bg-background-800"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-xs font-medium text-foreground-800 dark:text-foreground-200 truncate">
                        {item.flag} {item.nationality}
                      </span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="text-xs font-bold text-foreground-900 dark:text-foreground-100">
                        {item.count.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-foreground-500 ml-1">
                        ({item.percentage}%)
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chart 2: Horizontal Bar Chart - Foreign Residents by District */}
          <div className="lg:col-span-6 bg-white dark:bg-background-800/90 rounded-2xl border border-background-200 dark:border-background-700/80 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-foreground-900 dark:text-foreground-50">
                    Foreign Residents by District
                  </h3>
                  <p className="text-xs text-foreground-500 dark:text-foreground-400">
                    Top 8 municipal hubs • Alanya is #1 with 31.6% of all foreign residents
                  </p>
                </div>
                <span className="p-2 rounded-xl bg-accent-50 dark:bg-accent-950/70 text-accent-600 dark:text-accent-400 text-base">
                  <i className="ri-bar-chart-horizontal-line" />
                </span>
              </div>

              {/* Chart Container */}
              <div className="h-72 sm:h-80 w-full my-2" data-testid="district-chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={DISTRICT_FOREIGN_POPULATION}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#94a3b8" opacity={0.2} />
                    <XAxis
                      type="number"
                      domain={[0, 65000]}
                      tick={{ fill: "#64748b", fontSize: 11 }}
                      tickFormatter={(val) => `${(val / 1000).toFixed(0)}k`}
                    />
                    <YAxis
                      dataKey="district"
                      type="category"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#475569", fontSize: 11, fontWeight: 500 }}
                      width={85}
                    />
                    <Tooltip content={<DistrictTooltip />} />
                    <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                      {DISTRICT_FOREIGN_POPULATION.map((entry) => (
                        <Cell
                          key={`bar-${entry.district}`}
                          fill={entry.isMainHub ? "#f97316" : entry.color}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Callout Banner for Alanya */}
            <div className="mt-4 pt-4 border-t border-background-100 dark:border-background-700/70">
              <div className="p-3.5 rounded-xl bg-primary-50 dark:bg-primary-950/70 border border-primary-200 dark:border-primary-800/60 flex items-start gap-3">
                <i className="ri-award-line text-primary-600 dark:text-primary-400 text-lg mt-0.5 flex-shrink-0" />
                <div className="text-xs text-foreground-700 dark:text-foreground-300">
                  <span className="font-bold text-primary-800 dark:text-primary-300">
                    Alanya: The Epicenter of Mediterranean Expat Living
                  </span>{" "}
                  — With 58,500 registered international residents representing 16.1% of the town&apos;s total population, Alanya holds the highest absolute expat population in the entire Mediterranean region of Türkiye.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
