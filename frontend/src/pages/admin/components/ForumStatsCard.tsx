import React from "react";
import type { ForumStatsAdminItem } from "@/api-services/admin.service";

interface ForumStatsCardProps {
  stats: ForumStatsAdminItem | null;
  loading?: boolean;
  onRefresh?: () => void;
}

export default function ForumStatsCard({
  stats,
  loading = false,
  onRefresh,
}: ForumStatsCardProps) {
  const cards = [
    {
      id: "topics",
      label: "Total Topics",
      value: stats ? stats.totalTopics.toLocaleString() : "0",
      icon: "ri-discuss-line",
      color: "from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800",
      iconBg: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
      id: "replies",
      label: "Total Replies",
      value: stats ? stats.totalReplies.toLocaleString() : "0",
      icon: "ri-chat-3-line",
      color: "from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
      iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    },
    {
      id: "online",
      label: "Online (Last 5m)",
      value: stats ? stats.usersOnline.toLocaleString() : "0",
      icon: "ri-user-shared-line",
      color: "from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800",
      iconBg: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      id: "latest",
      label: "Newest Member",
      value: stats?.latestMember || "None",
      icon: "ri-user-add-line",
      color: "from-purple-500/10 to-pink-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800",
      iconBg: "bg-purple-100 dark:bg-purple-900/40",
      isText: true,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold text-secondary-900 dark:text-white flex items-center gap-2">
            <i className="ri-dashboard-3-line text-accent-600 dark:text-accent-400" />
            Forum Vital Metrics & KPIs
          </h2>
          <p className="text-xs text-secondary-500 dark:text-slate-400">
            Real-time platform activity metrics, discussions, and member pulse
          </p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="p-1.5 rounded-lg text-secondary-500 hover:text-secondary-800 dark:hover:text-white hover:bg-secondary-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Refresh forum stats"
          >
            <i className={`ri-refresh-line text-base ${loading ? "animate-spin" : ""}`} />
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map((card) => (
          <div
            key={card.id}
            className={`p-4 rounded-xl border bg-gradient-to-br ${card.color} flex items-center justify-between`}
          >
            <div className="min-w-0 flex-1 mr-2">
              <span className="block text-xs font-medium text-secondary-500 dark:text-slate-400 truncate">
                {card.label}
              </span>
              <span
                className={`block font-black text-secondary-900 dark:text-white truncate mt-1 ${
                  card.isText ? "text-sm sm:text-base" : "text-xl sm:text-2xl"
                }`}
                title={String(card.value)}
              >
                {loading ? "..." : card.value}
              </span>
            </div>
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${card.iconBg}`}
            >
              <i className={`${card.icon} text-lg`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
