import React, { useState, useEffect, useCallback } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";
import {
  adminService,
  type PlatformAnalyticsData,
} from "@/api-services/admin.service";

const CHANNEL_COLORS: Record<string, string> = {
  whatsapp: "#10b981", // emerald
  website: "#3b82f6",  // blue
  map: "#f43f5e",      // rose
};

export default function PlatformAnalyticsTab() {
  const [days, setDays] = useState<number>(30);
  const [analytics, setAnalytics] = useState<PlatformAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminService.getPlatformAnalytics(days);
      setAnalytics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load platform analytics");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const kpis = analytics?.kpiSummary;

  return (
    <div className="space-y-6">
      {/* Top Header & Timeframe Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-xs border border-secondary-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors">
        <div>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white">
            Platform Analytics & KPI Overview
          </h2>
          <p className="text-xs text-secondary-500 dark:text-slate-400">
            Real-time traffic, conversion rates, customer inquiry channels, and listing performance.
          </p>
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-1 bg-secondary-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { label: "7 Days", value: 7 },
            { label: "30 Days", value: 30 },
            { label: "90 Days", value: 90 },
          ].map((tf) => (
            <button
              key={tf.value}
              type="button"
              onClick={() => setDays(tf.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                days === tf.value
                  ? "bg-white dark:bg-slate-700 text-secondary-900 dark:text-white shadow-xs"
                  : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-2xl text-rose-800 dark:text-rose-200 text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <i className="ri-error-warning-line text-lg text-rose-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={fetchAnalytics}
            className="text-xs font-semibold text-rose-700 dark:text-rose-300 underline hover:no-underline cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* 6 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {/* Total Views */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Total Views</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center text-base">
              <i className="ri-eye-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading ? "..." : (kpis?.totalViews ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">Across all platform listings</div>
        </div>

        {/* Total Inquiries */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
              <i className="ri-chat-voice-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading ? "..." : (kpis?.totalClicks ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">WhatsApp, Web & Maps</div>
        </div>

        {/* Active Listings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Active Listings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-base">
              <i className="ri-store-2-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading ? "..." : (kpis?.activeListingsCount ?? 0).toLocaleString()}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">Live approved directory items</div>
        </div>

        {/* Moderation Queue */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Queue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center text-base">
              <i className="ri-hourglass-2-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading
              ? "..."
              : ((kpis?.pendingListingsCount ?? 0) + (kpis?.pendingClaimsCount ?? 0)).toLocaleString()}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">
            {kpis?.pendingListingsCount ?? 0} listings • {kpis?.pendingClaimsCount ?? 0} claims
          </div>
        </div>

        {/* Paid Tiers */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Paid Tiers</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center text-base">
              <i className="ri-vip-crown-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading
              ? "..."
              : (
                  (analytics?.tierDistribution.voyager ?? 0) +
                  (analytics?.tierDistribution.signature ?? 0) +
                  (analytics?.tierDistribution.partner ?? 0)
                ).toLocaleString()}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">Voyager, Signature, Partner</div>
        </div>

        {/* Claim Conversion Rate */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-2 transition-colors">
          <div className="flex items-center justify-between text-secondary-400 dark:text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Claim Rate</span>
            <div className="w-8 h-8 rounded-lg bg-accent-50 dark:bg-accent-950/60 text-accent-600 dark:text-accent-400 flex items-center justify-center text-base">
              <i className="ri-percent-line" />
            </div>
          </div>
          <div className="text-2xl font-black text-secondary-900 dark:text-white">
            {loading ? "..." : `${kpis?.claimConversionRate?.toFixed(1) ?? "0.0"}%`}
          </div>
          <div className="text-xs text-secondary-500 dark:text-slate-400">
            {kpis?.approvedClaimsCount ?? 0} / {kpis?.totalClaimsCount ?? 0} claims approved
          </div>
        </div>
      </div>

      {/* Visualizations Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Area Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-secondary-900 dark:text-white">
                Views & Inquiries Trend
              </h3>
              <p className="text-xs text-secondary-500 dark:text-slate-400">
                Daily traffic volume and total customer actions over the last {days} days.
              </p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            {analytics?.viewsTrend && analytics.viewsTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={analytics.viewsTrend}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="inquiriesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                  <XAxis
                    dataKey="date"
                    tickLine={false}
                    axisLine={{ stroke: "#64748b" }}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickFormatter={(str: string) => {
                      const d = new Date(str);
                      return isNaN(d.getTime())
                        ? str
                        : d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
                    }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.3)",
                      fontSize: "12px",
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Daily Views"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#viewsGrad)"
                  />
                  <Area
                    type="monotone"
                    dataKey="totalClicks"
                    name="Inquiries (Clicks)"
                    stroke="#10b981"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#inquiriesGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-secondary-400 dark:text-slate-500 bg-secondary-50 dark:bg-slate-950 rounded-xl">
                No time-series analytics recorded yet in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Channel Breakdown (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-secondary-900 dark:text-white">Inquiry Channels</h3>
            <p className="text-xs text-secondary-500 dark:text-slate-400">Distribution by action type</p>
          </div>

          <div className="h-52 w-full">
            {analytics?.channelBreakdown && analytics.channelBreakdown.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={analytics.channelBreakdown}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                  layout="vertical"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" opacity={0.3} />
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="label"
                    type="category"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    width={80}
                  />
                  <Tooltip
                    formatter={(value) => [`${value} clicks`, "Clicks"]}
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      color: "#f8fafc",
                      borderRadius: "12px",
                      border: "1px solid #334155",
                      fontSize: "12px",
                    }}
                  />
                  <Bar dataKey="clicks" radius={[0, 8, 8, 0]}>
                    {analytics.channelBreakdown.map((entry) => (
                      <Cell
                        key={entry.channel}
                        fill={CHANNEL_COLORS[entry.channel] || "#3b82f6"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-secondary-400 dark:text-slate-500 bg-secondary-50 dark:bg-slate-950 rounded-xl">
                No channel clicks recorded yet.
              </div>
            )}
          </div>

          {/* Breakdown summary pills */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-secondary-100 dark:border-slate-800 text-center">
            {analytics?.channelBreakdown.map((ch) => (
              <div key={ch.channel} className="p-2 rounded-xl bg-secondary-50 dark:bg-slate-800">
                <span className="text-xs font-semibold text-secondary-700 dark:text-slate-300 block truncate">
                  {ch.label}
                </span>
                <span className="text-sm font-bold text-secondary-900 dark:text-white">{ch.clicks}</span>
                <span className="text-2xs text-secondary-400 dark:text-slate-500 block">{ch.percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Second Row: Tier Distribution & Top Listings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Tier Distribution (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-secondary-900 dark:text-white">
              Subscription Tiers
            </h3>
            <p className="text-xs text-secondary-500 dark:text-slate-400">
              Active listings breakdown by subscription plan
            </p>
          </div>

          <div className="space-y-3 pt-2">
            {[
              {
                id: "explorer",
                label: "Explorer (Free)",
                count: analytics?.tierDistribution.explorer ?? 0,
                color: "bg-slate-500",
              },
              {
                id: "voyager",
                label: "Voyager (Growth)",
                count: analytics?.tierDistribution.voyager ?? 0,
                color: "bg-blue-500",
              },
              {
                id: "signature",
                label: "Signature (Premium)",
                count: analytics?.tierDistribution.signature ?? 0,
                color: "bg-amber-500",
              },
              {
                id: "partner",
                label: "Platform Partner",
                count: analytics?.tierDistribution.partner ?? 0,
                color: "bg-purple-500",
              },
            ].map((tier) => {
              const total =
                (analytics?.tierDistribution.explorer ?? 0) +
                (analytics?.tierDistribution.voyager ?? 0) +
                (analytics?.tierDistribution.signature ?? 0) +
                (analytics?.tierDistribution.partner ?? 0);
              const pct = total > 0 ? Math.round((tier.count / total) * 100) : 0;

              return (
                <div key={tier.id} className="space-y-1">
                  <div className="flex justify-between text-xs font-semibold text-secondary-700 dark:text-slate-300">
                    <span>{tier.label}</span>
                    <span>
                      {tier.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-secondary-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tier.color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Performing Listings Table (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-secondary-200/80 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
          <div>
            <h3 className="text-base font-bold text-secondary-900 dark:text-white">
              Top Performing Listings
            </h3>
            <p className="text-xs text-secondary-500 dark:text-slate-400">
              Highest traffic businesses ranked by total views and direct customer inquiries
            </p>
          </div>

          <div className="overflow-x-auto">
            {analytics?.topListings && analytics.topListings.length > 0 ? (
              <table className="min-w-full divide-y divide-secondary-100 dark:divide-slate-800 text-sm">
                <thead>
                  <tr className="text-xs text-secondary-400 dark:text-slate-500 uppercase">
                    <th className="pb-2 text-left font-bold">Business</th>
                    <th className="pb-2 text-left font-bold">Category</th>
                    <th className="pb-2 text-left font-bold">Tier</th>
                    <th className="pb-2 text-right font-bold">Views</th>
                    <th className="pb-2 text-right font-bold">Clicks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-secondary-100 dark:divide-slate-800/80">
                  {analytics.topListings.map((item, idx) => (
                    <tr key={item.id} className="hover:bg-secondary-50/70 dark:hover:bg-slate-800/50">
                      <td className="py-2.5 font-semibold text-secondary-900 dark:text-white flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-secondary-100 dark:bg-slate-800 text-secondary-600 dark:text-slate-400 text-xs font-bold flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <span className="truncate max-w-xs">{item.name}</span>
                      </td>
                      <td className="py-2.5 text-xs text-secondary-600 dark:text-slate-400 capitalize">
                        {item.category || "—"}
                      </td>
                      <td className="py-2.5">
                        <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-secondary-100 dark:bg-slate-800 text-secondary-700 dark:text-slate-300 capitalize">
                          {item.tier || "Explorer"}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-medium text-secondary-800 dark:text-slate-200">
                        {item.views.toLocaleString()}
                      </td>
                      <td className="py-2.5 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {item.clicks.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-secondary-400 dark:text-slate-500 bg-secondary-50 dark:bg-slate-950 rounded-xl">
                No listing traffic recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
