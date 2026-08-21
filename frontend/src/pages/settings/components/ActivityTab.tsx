import React, { useState } from "react";
import { Activity, ShoppingBag, Compass, Bookmark, MessageSquare } from "lucide-react";
import { OrdersList } from "./OrdersList";
import { BookingsList } from "./BookingsList";
import { FavoritesList } from "./FavoritesList";
import { ForumActivityList } from "./ForumActivityList";

export type ActivitySubtabId = "orders" | "bookings" | "favorites" | "forum";

export interface ActivityTabProps {
  initialSubtab?: ActivitySubtabId;
}

export function ActivityTab({ initialSubtab = "orders" }: ActivityTabProps) {
  const [activeSubtab, setActiveSubtab] = useState<ActivitySubtabId>(initialSubtab);

  const subtabs = [
    {
      id: "orders" as const,
      label: "My Orders",
      shortLabel: "Orders",
      icon: ShoppingBag,
      description: "Shop purchases, vouchers & receipts",
      activeColor: "bg-amber-500 text-white shadow-xs",
    },
    {
      id: "bookings" as const,
      label: "My Bookings",
      shortLabel: "Bookings",
      icon: Compass,
      description: "Villa stays & VIP concierge",
      activeColor: "bg-indigo-600 text-white shadow-xs",
    },
    {
      id: "favorites" as const,
      label: "My Favorites",
      shortLabel: "Favorites",
      icon: Bookmark,
      description: "Saved places, villas & tours",
      activeColor: "bg-rose-600 text-white shadow-xs",
    },
    {
      id: "forum" as const,
      label: "Forum Activity",
      shortLabel: "Forum",
      icon: MessageSquare,
      description: "Discussions & questions",
      activeColor: "bg-emerald-600 text-white shadow-xs",
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
            <h2 className="text-xl font-bold text-slate-900">User Activity & History Hub</h2>
            <p className="text-sm text-slate-500">
              Manage your orders, luxury villa bookings, saved destinations, and community threads
            </p>
          </div>
        </div>
      </div>

      {/* Subtab Navigator Pills */}
      <div
        role="tablist"
        aria-label="Activity subtabs"
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
      </div>
    </div>
  );
}
