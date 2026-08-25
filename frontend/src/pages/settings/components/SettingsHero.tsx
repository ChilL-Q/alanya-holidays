import React from "react";
import { User, Shield, Activity, Calendar, Mail, CheckCircle2, Sparkles, Store, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import type { UserProfile } from "@/context/AuthContext";

export type SettingsTabId = "profile" | "security" | "activity" | "billing";

export interface SettingsHeroProps {
  user: { id?: string; email?: string | null; created_at?: string } | null;
  profile: UserProfile | null;
  activeTab: SettingsTabId;
  onTabChange: (tab: SettingsTabId) => void;
}

function getInitials(name?: string | null, email?: string | null): string {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].slice(0, 2).toUpperCase();
  }
  if (email && email.trim()) {
    return email.slice(0, 2).toUpperCase();
  }
  return "AH";
}

function formatJoinDate(isoDate?: string | null): string {
  if (!isoDate) return "Member";
  try {
    const d = new Date(isoDate);
    return `Joined ${d.toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
  } catch {
    return "Member";
  }
}

export const SettingsHero: React.FC<SettingsHeroProps> = ({
  user,
  profile,
  activeTab,
  onTabChange,
}) => {
  const fullName = profile?.full_name || user?.email?.split("@")[0] || "Alanya Holidays Member";
  const email = profile?.email || user?.email || "No email connected";
  const role = profile?.role || "user";
  const initials = getInitials(fullName, email);
  const joinDateText = formatJoinDate(profile?.created_at || user?.created_at);

  const tabs: { id: SettingsTabId; label: string; icon: React.ReactNode; description: string }[] = [
    {
      id: "profile",
      label: "Profile & Preferences",
      icon: <User className="w-4 h-4" />,
      description: "Manage personal details, bio & socials",
    },
    {
      id: "security",
      label: "Account Security",
      icon: <Shield className="w-4 h-4" />,
      description: "Password & access settings",
    },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard className="w-4 h-4" />,
      description: "Manage your subscription & payments",
    },
    {
      id: "activity",
      label: "My Activity Hub",
      icon: <Activity className="w-4 h-4" />,
      description: "Orders, bookings & favorites",
    },
  ];

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/90 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/10 mb-8">
      {/* Subtle luxury ambient glow effects */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* User Identity Section */}
        <div className="flex items-center gap-5 sm:gap-6">
          {/* Avatar with luxury golden ring */}
          <div className="relative group">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-xl flex items-center justify-center">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={fullName}
                  className="w-full h-full rounded-full object-cover bg-slate-800"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-amber-300 font-display font-semibold text-2xl sm:text-3xl tracking-wider">
                  {initials}
                </div>
              )}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-white rounded-full p-1 border-2 border-slate-900 shadow-md">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>

          {/* Name, Email, Badges */}
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight">
                {fullName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium tracking-wide uppercase bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {role === "admin" ? "Admin" : role === "host" ? "Host / Partner" : "Verified Member"}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs sm:text-sm text-slate-300">
              <span className="inline-flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" />
                {email}
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {joinDateText}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Links */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <Link
            to="/business/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 transition-all duration-200 active:scale-95 cursor-pointer border border-amber-400/30"
          >
            <Store className="w-4 h-4 text-slate-950" />
            <span>Merchant Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Navigation Tabs Pill Container */}
      <div className="relative z-10 mt-8 pt-6 border-t border-white/10">
        <div
          role="tablist"
          aria-label="Settings Sections"
          className="flex flex-wrap gap-2 sm:gap-3"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                role="tab"
                id={`tab-${tab.id}`}
                aria-controls={`tabpanel-${tab.id}`}
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-white text-slate-900 shadow-lg shadow-black/20 font-semibold ring-2 ring-white/50"
                    : "bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5"
                }`}
              >
                <span className={isActive ? "text-amber-600" : "text-slate-400"}>
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
