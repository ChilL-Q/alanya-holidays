import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/pages/home/components/Navbar";
import Footer from "@/pages/home/components/Footer";
import { adminService, type ConciergeEnquiry } from "@/api-services/admin.service";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
} from "recharts";

const typeLabels: Record<string, string> = {
  private_jet: "Private Jet",
  personal_chef: "Personal Chef",
  personal_driver: "Personal Driver",
  personal_shopper: "Personal Shopper",
  golf_vacation: "Golf Vacation",
  yacht_charter: "Yacht Charter",
  wine_tasting: "Wine Tasting",
  hammam_spa: "Hammam & Spa",
  general: "General",
};

const typeColors: Record<string, string> = {
  private_jet: "#0ea5e9",
  personal_chef: "#f97316",
  personal_driver: "#10b981",
  personal_shopper: "#ec4899",
  golf_vacation: "#84cc16",
  yacht_charter: "#06b6d4",
  wine_tasting: "#f43f5e",
  hammam_spa: "#14b8a6",
  general: "#a1a1aa",
};

const palette = [
  "#eab308",
  "#f97316",
  "#10b981",
  "#ec4899",
  "#84cc16",
  "#06b6d4",
  "#f43f5e",
  "#14b8a6",
  "#a1a1aa",
];

const statusPalette: Record<string, string> = {
  new: "#f97316",
  responded: "#eab308",
  archived: "#a1a1aa",
};

const statusLabels: Record<string, string> = {
  new: "New",
  responded: "Responded",
  archived: "Archived",
};

export default function InsightsPage() {
  const [enquiries, setEnquiries] = useState<ConciergeEnquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<30 | 90 | 365>(30);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await adminService.getEnquiries();
        setEnquiries(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = useMemo(() => {
    const total = enquiries.length;
    const newCount = enquiries.filter((e) => e.status === "new").length;
    const responded = enquiries.filter((e) => e.status === "responded").length;
    const archived = enquiries.filter((e) => e.status === "archived").length;
    const thisMonth = enquiries.filter((e) => {
      const d = new Date(e.created_at);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;
    return { total, newCount, responded, archived, thisMonth };
  }, [enquiries]);

  const typeData = useMemo(() => {
    const map: Record<string, number> = {};
    enquiries.forEach((e) => {
      const key = e.enquiry_type || "general";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map)
      .map(([key, count]) => ({
        name: typeLabels[key] || key,
        type: key,
        count,
        fill: typeColors[key] || palette[Object.keys(map).indexOf(key) % palette.length],
      }))
      .sort((a, b) => b.count - a.count);
  }, [enquiries]);

  const statusData = useMemo(() => {
    const map: Record<string, number> = {};
    enquiries.forEach((e) => {
      const key = e.status || "new";
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([key, count]) => ({
      name: statusLabels[key] || key,
      status: key,
      count,
      fill: statusPalette[key] || "#a1a1aa",
    }));
  }, [enquiries]);

  const trendData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now);
    cutoff.setDate(cutoff.getDate() - timeRange);

    const dayMap: Record<string, { date: string; total: number; [key: string]: number | string }> = {};

    // Initialize all days in range
    for (let d = new Date(cutoff); d <= now; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      dayMap[key] = { date: key, total: 0 };
    }

    enquiries.forEach((e) => {
      const dateKey = e.created_at.slice(0, 10);
      if (dayMap[dateKey]) {
        dayMap[dateKey].total = (dayMap[dateKey].total as number) + 1;
        const typeKey = e.enquiry_type || "general";
        dayMap[dateKey][typeKey] = ((dayMap[dateKey][typeKey] as number) || 0) + 1;
      }
    });

    return Object.values(dayMap)
      .sort((a, b) => (a.date as string).localeCompare(b.date as string))
      .map((d) => ({
        ...d,
        display: new Date(d.date as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
      }));
  }, [enquiries, timeRange]);

  // Group trend into weeks if 90+ days
  const groupedTrendData = useMemo(() => {
    if (timeRange < 90) return trendData;

    const weekMap: Record<string, { date: string; total: number; display: string }> = {};
    trendData.forEach((d) => {
      const date = new Date(d.date as string);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      const key = weekStart.toISOString().slice(0, 10);
      if (!weekMap[key]) {
        weekMap[key] = {
          date: key,
          total: 0,
          display: `${weekStart.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
        };
      }
      weekMap[key].total += d.total as number;
    });
    return Object.values(weekMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [trendData, timeRange]);

  const displayTrendData = timeRange >= 90 ? groupedTrendData : trendData;

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-16 md:pt-20 flex items-center justify-center">
          <div className="text-center">
            <i className="ri-loader-4-line animate-spin text-foreground-400 text-4xl mb-4 block"></i>
            <p className="text-sm text-foreground-500">Loading insights...</p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <main className="min-h-screen pt-16 md:pt-20 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto px-4">
            <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-accent-100 mb-4">
              <i className="ri-error-warning-line text-accent-600 text-2xl"></i>
            </div>
            <h2 className="font-heading text-lg text-foreground-800 mb-2">Could not load insights</h2>
            <p className="text-sm text-foreground-500">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-background-50 text-sm font-semibold hover:bg-primary-600 transition-colors cursor-pointer whitespace-nowrap"
            >
              <i className="ri-refresh-line"></i> Retry
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-24 md:pt-28 bg-background-50">
        {/* Header */}
        <section className="w-full bg-white border-b border-background-200/70">
          <div className="w-full px-4 md:px-8 lg:px-12 py-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-accent-100">
                  <i className="ri-line-chart-line text-accent-600 text-lg"></i>
                </div>
                <div>
                  <h1 className="font-heading text-2xl text-foreground-900">Enquiry Insights</h1>
                  <p className="text-xs text-foreground-500 mt-0.5">Real-time trends and analytics from {stats.total} concierge enquiries</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/admin"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-background-200 text-sm text-foreground-600 hover:bg-background-50 transition-colors whitespace-nowrap"
                >
                  <i className="ri-dashboard-3-line text-sm"></i>
                  Admin Dashboard
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="w-full px-4 md:px-8 lg:px-12 py-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl p-5 bg-white border border-background-200/70">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-background-100 mb-3">
                <i className="ri-inbox-line text-foreground-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.total}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Total Enquiries</p>
            </div>
            <div className="rounded-2xl p-5 bg-white border border-background-200/70">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-accent-100 mb-3">
                <i className="ri-calendar-check-line text-accent-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.thisMonth}</p>
              <p className="text-xs text-foreground-500 mt-0.5">This Month</p>
            </div>
            <div className="rounded-2xl p-5 bg-white border border-background-200/70">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-amber-100 mb-3">
                <i className="ri-mail-unread-line text-amber-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{stats.newCount}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Awaiting Response</p>
            </div>
            <div className="rounded-2xl p-5 bg-white border border-background-200/70">
              <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-emerald-100 mb-3">
                <i className="ri-pie-chart-2-line text-emerald-600 text-base"></i>
              </div>
              <p className="text-2xl font-semibold text-foreground-900">{typeData.length}</p>
              <p className="text-xs text-foreground-500 mt-0.5">Categories</p>
            </div>
          </div>
        </section>

        {/* Charts Grid */}
        <section className="w-full px-4 md:px-8 lg:px-12 pb-16 md:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">

            {/* Enquiries by Type — Bar Chart */}
            <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-base text-foreground-900">Enquiries by Category</h3>
                <span className="px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">All Time</span>
              </div>
              {typeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground-400">
                  <i className="ri-bar-chart-2-line text-3xl mb-2"></i>
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="w-full h-[340px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={typeData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--background-200) / 0.5)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11, fill: "oklch(var(--foreground-500))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: "oklch(var(--foreground-700))" }} axisLine={false} tickLine={false} width={110} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid oklch(var(--background-200) / 0.7)",
                          backgroundColor: "#fff",
                          fontSize: "12px",
                          boxShadow: "none",
                        }}
                        formatter={(value: number) => [`${value} enquiries`, "Count"]}
                      />
                      <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={20}>
                        {typeData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={palette[idx % palette.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Status Distribution — Pie Chart */}
            <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-base text-foreground-900">Status Distribution</h3>
                <span className="px-2.5 py-1 rounded-full bg-secondary-100 text-secondary-700 text-xs font-medium whitespace-nowrap">All Time</span>
              </div>
              {statusData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground-400">
                  <i className="ri-pie-chart-2-line text-3xl mb-2"></i>
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="w-full h-[340px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={70}
                        outerRadius={110}
                        paddingAngle={4}
                        dataKey="count"
                        stroke="none"
                      >
                        {statusData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid oklch(var(--background-200) / 0.7)",
                          backgroundColor: "#fff",
                          fontSize: "12px",
                          boxShadow: "none",
                        }}
                        formatter={(value: number) => [`${value} enquiries`, "Count"]}
                      />
                      <Legend
                        verticalAlign="bottom"
                        iconType="circle"
                        iconSize={8}
                        formatter={(value: string) => <span className="text-xs text-foreground-600">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Enquiry Trend — Area Chart */}
            <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6 lg:col-span-2">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <h3 className="font-heading text-base text-foreground-900">Enquiry Volume Trend</h3>
                <div className="flex items-center gap-1.5">
                  {([30, 90, 365] as const).map((days) => (
                    <button
                      key={days}
                      onClick={() => setTimeRange(days)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                        timeRange === days
                          ? "bg-foreground-900 text-background-50"
                          : "bg-background-100 text-foreground-600 hover:bg-background-200"
                      }`}
                    >
                      {days === 365 ? "1 Year" : `${days} Days`}
                    </button>
                  ))}
                </div>
              </div>
              {displayTrendData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-foreground-400">
                  <i className="ri-line-chart-line text-3xl mb-2"></i>
                  <p className="text-sm">No trend data for this period</p>
                </div>
              ) : (
                <div className="w-full h-[320px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={displayTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#eab308" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="#eab308" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(var(--background-200) / 0.5)" vertical={false} />
                      <XAxis
                        dataKey="display"
                        tick={{ fontSize: 10, fill: "oklch(var(--foreground-500))" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                        minTickGap={40}
                      />
                      <YAxis tick={{ fontSize: 11, fill: "oklch(var(--foreground-500))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid oklch(var(--background-200) / 0.7)",
                          backgroundColor: "#fff",
                          fontSize: "12px",
                          boxShadow: "none",
                        }}
                        formatter={(value: number) => [`${value} enquiries`, "Volume"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="total"
                        stroke="#eab308"
                        strokeWidth={2}
                        fill="url(#trendGradient)"
                        dot={false}
                        activeDot={{ r: 4, fill: "#eab308", stroke: "#fff", strokeWidth: 2 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Top Types Breakdown Table */}
            <div className="bg-white rounded-2xl border border-background-200/70 p-5 md:p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-heading text-base text-foreground-900">Category Breakdown</h3>
              </div>
              {typeData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-foreground-400">
                  <i className="ri-list-check-2 text-2xl mb-2"></i>
                  <p className="text-sm">No data yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {typeData.map((item, idx) => {
                    const pct = stats.total > 0 ? ((item.count / stats.total) * 100).toFixed(1) : "0";
                    return (
                      <div key={item.name} className="flex items-center gap-4">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: palette[idx % palette.length] }}></div>
                        <span className="text-sm text-foreground-700 w-36 shrink-0 whitespace-nowrap truncate">{item.name}</span>
                        <div className="flex-1 h-2 rounded-full bg-background-100 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: palette[idx % palette.length],
                            }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-foreground-900 w-10 text-right shrink-0">{item.count}</span>
                        <span className="text-xs text-foreground-400 w-10 text-right shrink-0">{pct}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}