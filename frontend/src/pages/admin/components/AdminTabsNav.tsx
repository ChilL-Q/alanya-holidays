import React from "react";

export type AdminTab = "publishing" | "listings" | "claims" | "business-applications" | "content" | "forum" | "bookings" | "reviews" | "users" | "audit" | "analytics" | "concierge";

interface AdminTabsNavProps {
  activeTab: AdminTab;
  onChangeTab: (tab: AdminTab) => void;
  counts?: {
    pendingListings?: number;
    pendingClaims?: number;
    pendingContent?: number;
    pendingReports?: number;
    pendingBookings?: number;
    pendingReviews?: number;
    newEnquiries?: number;
  };
}

interface TabDef {
  id: AdminTab;
  label: string;
  icon: string;
  badge?: number;
  badgeColor?: string;
}

export default function AdminTabsNav({
  activeTab,
  onChangeTab,
  counts,
}: AdminTabsNavProps) {
  const tabs: TabDef[] = [
    {
      id: "publishing",
      label: "Content Library",
      icon: "ri-edit-box-line",
    },
    {
      id: "listings",
      label: "Listings Moderation",
      icon: "ri-file-list-3-line",
      badge: counts?.pendingListings,
      badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    {
      id: "claims",
      label: "Claims Queue",
      icon: "ri-shield-check-line",
      badge: counts?.pendingClaims,
      badgeColor: "bg-purple-100 dark:bg-purple-950/80 text-purple-800 dark:text-purple-300 border-purple-200 dark:border-purple-800",
    },
    {
      id: "business-applications",
      label: "Business Applications",
      icon: "ri-briefcase-4-line",
    },
    {
      id: "content",
      label: "Content Moderation",
      icon: "ri-article-line",
      badge: counts?.pendingContent,
      badgeColor: "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
    },
    {
      id: "forum",
      label: "Forum Moderation",
      icon: "ri-discuss-line",
      badge: counts?.pendingReports,
      badgeColor: "bg-rose-100 dark:bg-rose-950/80 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800",
    },
    {
      id: "bookings",
      label: "Bookings",
      icon: "ri-calendar-check-line",
      badge: counts?.pendingBookings,
      badgeColor: "bg-sky-100 dark:bg-sky-950/80 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800",
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: "ri-star-line",
      badge: counts?.pendingReviews,
      badgeColor: "bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800",
    },
    {
      id: "users",
      label: "Users",
      icon: "ri-group-line",
    },
    {
      id: "audit",
      label: "Audit Log",
      icon: "ri-history-line",
    },
    {
      id: "analytics",
      label: "Platform Analytics",
      icon: "ri-bar-chart-box-line",
    },

    {
      id: "concierge",
      label: "Concierge Enquiries",
      icon: "ri-customer-service-2-line",
      badge: counts?.newEnquiries,
      badgeColor: "bg-accent-100 dark:bg-accent-950/80 text-accent-800 dark:text-accent-300 border-accent-200 dark:border-accent-800",
    },
  ];

  return (
    <div className="border-b border-secondary-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav
          className="-mb-px flex space-x-2 sm:space-x-8 overflow-x-auto scrollbar-none py-1"
          role="tablist"
          aria-label="Admin Hub Navigation Tabs"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                aria-controls={`admin-tabpanel-${tab.id}`}
                id={`admin-tab-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`group inline-flex items-center py-4 px-3 sm:px-4 border-b-2 font-medium text-sm sm:text-base whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  isActive
                    ? "border-accent-600 text-accent-700 dark:text-accent-400 font-semibold"
                    : "border-transparent text-secondary-500 dark:text-slate-400 hover:text-secondary-800 dark:hover:text-slate-200 hover:border-secondary-300 dark:hover:border-slate-700"
                }`}
              >
                <i
                  className={`${tab.icon} mr-2 text-lg transition-colors ${
                    isActive
                      ? "text-accent-600 dark:text-accent-400"
                      : "text-secondary-400 dark:text-slate-500 group-hover:text-secondary-600 dark:group-hover:text-slate-300"
                  }`}
                  aria-hidden="true"
                />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span
                    className={`ml-2.5 px-2 py-0.5 text-xs font-bold rounded-full border ${tab.badgeColor || "bg-accent-100 text-accent-800"}`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
