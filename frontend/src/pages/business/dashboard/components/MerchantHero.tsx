import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/i18n";
import {
  Store,
  PlusCircle,
  CheckCircle2,
  FileText,
  TrendingUp,
  Sparkles,
  Eye,
  Award,
} from "lucide-react";

export interface MerchantHeroProps {
  merchantName: string;
  email: string;
  activeListingsCount: number;
  draftsCount: number;
  tier?: string;
  onListNewBusiness: () => void;
  onFilterActive?: () => void;
  onFilterDrafts?: () => void;
  onSelectAnalytics?: () => void;
}

export const MerchantHero: React.FC<MerchantHeroProps> = ({
  merchantName,
  email,
  activeListingsCount,
  draftsCount,
  tier = "Explorer",
  onListNewBusiness,
  onFilterActive,
  onFilterDrafts,
  onSelectAnalytics,
}) => {
  const { t } = useTranslation();
  const formattedTier = tier
    ? tier.charAt(0).toUpperCase() + tier.slice(1).toLowerCase()
    : "Explorer";

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950/90 text-white p-6 sm:p-8 lg:p-10 shadow-2xl border border-white/10 mb-8">
      {/* Subtle luxury ambient glow effects */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 -mb-20 w-80 h-80 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        {/* Merchant Profile Info */}
        <div className="flex items-center gap-5 sm:gap-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-amber-400 via-amber-200 to-amber-600 shadow-xl flex items-center justify-center shrink-0">
            <div className="w-full h-full rounded-xl bg-slate-900 flex items-center justify-center text-amber-300">
              <Store className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
            </div>
          </div>

          <div className="space-y-1.5 min-w-0">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Store className="w-3.5 h-3.5 text-amber-400" />
              {t("merchant.dashboard")}
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl sm:text-3xl font-display font-semibold text-white tracking-tight truncate">
                {merchantName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30">
                <Sparkles className="w-3 h-3 text-amber-300" />
                {t("merchant.verifiedOwner")}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                <Award className="w-3 h-3 text-indigo-300" />
                {t("merchant.tier", { tier: formattedTier })}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 truncate">{email}</p>
          </div>
        </div>

        {/* Action Buttons & Quick Metric Pills */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Interactive Metric Pills Container */}
          <div className="flex flex-wrap items-center gap-2 bg-white/5 border border-white/10 rounded-xl p-1.5">
            <button
              type="button"
              onClick={onFilterActive}
              aria-label={t("merchant.viewActiveListings", { count: activeListingsCount })}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                <strong className="text-white font-semibold">{activeListingsCount}</strong> {t("merchant.active")}
              </span>
            </button>

            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            <button
              type="button"
              onClick={onFilterDrafts}
              aria-label={t("merchant.viewDraftListings", { count: draftsCount })}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong className="text-white font-semibold">{draftsCount}</strong> {t("merchant.drafts")}
              </span>
            </button>

            <div className="h-4 w-px bg-white/15 hidden sm:block" />

            <button
              type="button"
              onClick={onSelectAnalytics}
              aria-label={t("merchant.viewAnalytics")}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-white/10 px-3 py-1.5 rounded-lg transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-400/50"
            >
              <TrendingUp className="w-4 h-4 text-sky-400 shrink-0" />
              <span>{t("merchant.analyticsReady")}</span>
            </button>
          </div>

          {/* Primary CTA button */}
          <button
            type="button"
            onClick={onListNewBusiness}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-lg shadow-amber-500/20 hover:shadow-amber-500/30 cursor-pointer focus:outline-none focus:ring-2 focus:ring-amber-300"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{t("merchant.listNewBusiness")}</span>
          </button>

          {/* Secondary Exploration Action */}
          <Link
            to="/explore"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors border border-white/15 focus:outline-none focus:ring-2 focus:ring-white/30"
            title={t("merchant.browseDirectory")}
          >
            <Eye className="w-4 h-4 text-amber-300" />
            <span>{t("merchant.browseDirectory")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
