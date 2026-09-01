import React from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { ErrorState } from "@/components/base/ErrorState";
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
} from "recharts";
import {
  TrendingUp,
  Eye,
  PhoneCall,
  Globe,
  MapPin,
  Lock,
  Sparkles,
  ArrowUpRight,
  Zap,
} from "lucide-react";
import type { OwnerAnalyticsSummary } from "@/api-services/directory.service";

export interface PerformanceAnalyticsTabProps {
  analytics: OwnerAnalyticsSummary | null;
  hasPremiumAccess: boolean;
  loading: boolean;
  error?: string | null;
  days: number;
  onDaysChange: (days: number) => void;
  onOpenUpgradeModal: () => void;
  onRetry?: () => void | Promise<void>;
}

export const PerformanceAnalyticsTab: React.FC<PerformanceAnalyticsTabProps> = ({
  analytics,
  hasPremiumAccess,
  loading,
  error = null,
  days,
  onDaysChange,
  onOpenUpgradeModal,
  onRetry,
}) => {
  const { t } = useTranslation();
  const hasAnalyticsData = Boolean(analytics);
  const isInitialLoading = loading && !hasAnalyticsData;

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-secondary-200 dark:border-slate-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-28 bg-white dark:bg-slate-900 rounded-2xl animate-pulse border border-secondary-200 dark:border-slate-800"
            />
          ))}
        </div>
      </div>
    );
  }

  // Free Tier Lock Banner
  if (!hasPremiumAccess) {
    return (
      <div className="space-y-8">
        {/* Promotional Lock Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-12 shadow-2xl border border-white/10 text-center">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3.5 h-3.5" />
                {t("merchant.analyticsGating")}
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold font-display tracking-tight text-white">
                {t("merchant.unlockAnalytics")}
              </h2>
              <p className="text-sm text-slate-300 leading-relaxed">
                {t("merchant.analyticsUpgradeDescription")}
              </p>
            </div>

            {/* Feature preview list */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left pt-2">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <Eye className="w-5 h-5 text-amber-400" />
                <h4 className="text-xs font-bold text-white">{t("merchant.visitorImpressions")}</h4>
                <p className="text-[11px] text-slate-400">{t("merchant.visitorDescription")}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                <h4 className="text-xs font-bold text-white">{t("merchant.whatsappInquiries")}</h4>
                <p className="text-[11px] text-slate-400">{t("merchant.whatsappDescription")}</p>
              </div>
              <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <MapPin className="w-5 h-5 text-sky-400" />
                <h4 className="text-xs font-bold text-white">{t("merchant.directionRequests")}</h4>
                <p className="text-[11px] text-slate-400">{t("merchant.directionDescription")}</p>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="button"
                onClick={onOpenUpgradeModal}
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-xl shadow-amber-500/25 hover:scale-[1.02] cursor-pointer"
              >
                <Zap className="w-4 h-4" />
                {t("merchant.upgradeSubscription")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !hasAnalyticsData) {
    return (
        <ErrorState
        title={t("merchant.unableAnalytics")}
        message={error}
        onRetry={onRetry}
      />
    );
  }

  // Paid Analytics View
  const totalViews = analytics?.total_views || 0;
  const totalWhatsapp = analytics?.total_whatsapp_clicks || 0;
  const totalWebsite = analytics?.total_website_clicks || 0;
  const totalMap = analytics?.total_map_clicks || 0;
  const totalInteractions = totalWhatsapp + totalWebsite + totalMap;
  const ctr = totalViews > 0 ? ((totalInteractions / totalViews) * 100).toFixed(1) : "0.0";

  const chartData = analytics?.daily_data || [];

  return (
    <div className="space-y-6">
      {error && hasAnalyticsData && (
        <ErrorState
          variant="inline"
          message={error}
          onRetry={onRetry}
        />
      )}

      {/* Header & Timeframe Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 shadow-sm border border-secondary-200/80 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-amber-500" />
            {t("merchant.analyticsHeading")}
          </h2>
          <p className="text-xs text-secondary-500 dark:text-slate-400">
            {t("merchant.analyticsDescription")}
          </p>
          {loading && hasAnalyticsData && (
            <p className="mt-1 text-[11px] font-medium text-amber-600 dark:text-amber-400">
              {t("merchant.refreshingAnalytics")}
            </p>
          )}
        </div>

        {/* Timeframe selector */}
        <div className="flex items-center space-x-1 bg-secondary-100 dark:bg-slate-800 p-1 rounded-xl">
          {[
            { label: t("merchant.days", { count: 7 }), value: 7 },
            { label: t("merchant.days", { count: 30 }), value: 30 },
            { label: t("merchant.days", { count: 90 }), value: 90 },
          ].map((tf) => (
            <button
              key={tf.value}
              type="button"
              aria-pressed={days === tf.value}
              disabled={loading}
              onClick={() => onDaysChange(tf.value)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-60 disabled:cursor-not-allowed ${
                days === tf.value
                  ? "bg-white dark:bg-slate-700 text-secondary-900 dark:text-white shadow-sm"
                  : "text-secondary-600 dark:text-slate-400 hover:text-secondary-900 dark:hover:text-white"
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500 dark:text-slate-400">{t("merchant.totalImpressions")}</span>
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
            {totalViews.toLocaleString()}
          </div>
          <p className="text-[11px] text-secondary-400">{t("merchant.directoryViews")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500 dark:text-slate-400">{t("merchant.whatsappInquiries")}</span>
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400">
              <PhoneCall className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
            {totalWhatsapp.toLocaleString()}
          </div>
          <p className="text-[11px] text-secondary-400">{t("merchant.highIntentChats")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500 dark:text-slate-400">{t("merchant.websiteClicks")}</span>
            <div className="p-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 text-sky-600 dark:text-sky-400">
              <Globe className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
            {totalWebsite.toLocaleString()}
          </div>
          <p className="text-[11px] text-secondary-400">{t("merchant.officialSiteReferrals")}</p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-secondary-500 dark:text-slate-400">{t("merchant.engagementCtr")}</span>
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold font-display text-secondary-900 dark:text-white">
            {ctr}%
          </div>
          <p className="text-[11px] text-secondary-400">{t("merchant.totalInteractions", { count: totalInteractions })}</p>
        </div>
      </div>

      {/* Visual Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart */}
        <div className="lg:col-span-2 p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-secondary-900 dark:text-white">
              {t("merchant.dailyTrend", { count: days })}
            </h3>
          </div>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="viewGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="views"
                  name={t("merchant.pageViews")}
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#viewGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel Breakdown Bar Chart */}
        <div className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-secondary-900 dark:text-white">
              {t("merchant.inquiryChannels")}
          </h3>
          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[
                  { channel: "WhatsApp", count: totalWhatsapp, fill: "#10b981" },
                  { channel: "Website", count: totalWebsite, fill: "#3b82f6" },
                  { channel: t("merchant.mapDirections"), count: totalMap, fill: "#f43f5e" },
                ]}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" name={t("merchant.clicks")} radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
