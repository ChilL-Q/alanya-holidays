import React, { useState } from "react";
import "@/i18n";
import { Activity, ShoppingBag, Compass, Bookmark, MessageSquare, BookmarkCheck } from "lucide-react";
import { OrdersList } from "./OrdersList";
import { BookingsList } from "./BookingsList";
import { FavoritesList } from "./FavoritesList";
import { ForumActivityList } from "./ForumActivityList";
import { SavedPostsList } from "./SavedPostsList";
import { useTranslation } from "react-i18next";

export type ActivitySubtabId = "orders" | "bookings" | "favorites" | "forum" | "saved-posts";

export interface ActivityTabProps {
  initialSubtab?: ActivitySubtabId;
}

export function ActivityTab({ initialSubtab = "orders" }: ActivityTabProps) {
  const { t } = useTranslation();
  const [activeSubtab, setActiveSubtab] = useState<ActivitySubtabId>(initialSubtab);

  const subtabs = [
    {
      id: "orders" as const,
      label: t("activity.myOrders", "My Orders"),
      shortLabel: t("activity.orders", "Orders"),
      icon: ShoppingBag,
      description: t("activity.ordersDescription", "Shop purchases, vouchers & receipts"),
      activeColor: "bg-amber-500 text-white shadow-xs",
    },
    {
      id: "bookings" as const,
      label: t("activity.myBookings", "My Bookings"),
      shortLabel: t("activity.bookings", "Bookings"),
      icon: Compass,
      description: t("activity.bookingsDescription", "Villa stays & VIP concierge"),
      activeColor: "bg-indigo-600 text-white shadow-xs",
    },
    {
      id: "favorites" as const,
      label: t("activity.myFavorites", "My Favorites"),
      shortLabel: t("activity.favorites", "Favorites"),
      icon: Bookmark,
      description: t("activity.favoritesDescription", "Saved places, villas & tours"),
      activeColor: "bg-rose-600 text-white shadow-xs",
    },
    {
      id: "forum" as const,
      label: t("activity.forumActivity", "Forum Activity"),
      shortLabel: t("activity.forum", "Forum"),
      icon: MessageSquare,
      description: t("activity.forumDescription", "Discussions & questions"),
      activeColor: "bg-emerald-600 text-white shadow-xs",
    },
    {
      id: "saved-posts" as const,
      label: t("activity.savedPosts", "Saved Posts"),
      shortLabel: t("activity.savedShort", "Saved"),
      icon: BookmarkCheck,
      description: t("activity.savedDescription", "Bookmarked forum discussions"),
      activeColor: "bg-teal-600 text-white shadow-xs",
    },
  ];

  return (
    <div
      role="tabpanel"
      id="tabpanel-activity"
      aria-labelledby="tab-activity"
      className="bg-white rounded-2xl p-6 sm:p-10 shadow-sm border border-slate-200/80 space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 shadow-2xs">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">{t("activity.hubTitle", "User Activity & History Hub")}</h2>
            <p className="text-sm text-slate-500">
              {t("activity.hubDescription", "Manage your orders, luxury villa bookings, saved destinations, and community threads")}
            </p>
          </div>
        </div>
      </div>

      {/* Subtab Navigator Pills */}
      <div
        role="tablist"
        aria-label={t("activity.subtabs", "Activity subtabs")}
        className="flex flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200/60"
      >
        {subtabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;

          return (
            <button
              key={tab.id}
              role="tab"
              id={`subtab-${tab.id}`}
              aria-selected={isActive}
              aria-controls={`subtabpanel-${tab.id}`}
              onClick={() => setActiveSubtab(tab.id)}
              className={`flex-1 min-w-[120px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                isActive
                  ? tab.activeColor
                  : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Subtab Content Panels */}
      <div
        role="tabpanel"
        id={`subtabpanel-${activeSubtab}`}
        aria-labelledby={`subtab-${activeSubtab}`}
        className="transition-all duration-300"
      >
        {activeSubtab === "orders" && <OrdersList />}
        {activeSubtab === "bookings" && <BookingsList />}
        {activeSubtab === "favorites" && <FavoritesList />}
        {activeSubtab === "forum" && <ForumActivityList />}
        {activeSubtab === "saved-posts" && <SavedPostsList />}
      </div>
    </div>
  );
}
