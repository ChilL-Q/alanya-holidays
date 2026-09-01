import React from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";
import { Link } from "react-router-dom";
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Search,
  Mail,
  Phone,
  Building,
} from "lucide-react";
import type { DirectoryClaim } from "@/api-services/directory.service";

export interface ClaimTrackerTabProps {
  claims: DirectoryClaim[];
  loading: boolean;
}

export const ClaimTrackerTab: React.FC<ClaimTrackerTabProps> = ({ claims, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div
            key={i}
            className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 animate-pulse space-y-3"
          >
            <div className="h-5 bg-secondary-200 dark:bg-slate-800 rounded-md w-1/3" />
            <div className="h-4 bg-secondary-100 dark:bg-slate-800/60 rounded-md w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (!claims || claims.length === 0) {
    return (
      <div className="p-8 sm:p-12 text-center rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto space-y-1.5">
          <h3 className="text-lg font-bold text-secondary-900 dark:text-white">
            {t("merchant.noClaims")}
          </h3>
          <p className="text-xs sm:text-sm text-secondary-500 dark:text-slate-400">
            {t("merchant.noClaimsDescription")}
          </p>
        </div>
        <div className="pt-2">
          <Link
            to="/search"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 transition-all shadow-md shadow-amber-500/20"
          >
            <Search className="w-4 h-4" />
            {t("merchant.findBusiness")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* SLA Info Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-indigo-50 dark:from-sky-950/30 dark:to-indigo-950/30 border border-sky-200/80 dark:border-sky-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="p-2 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-sky-900 dark:text-sky-200">
              {t("merchant.claimProcess")}
            </h4>
            <p className="text-xs text-sky-700 dark:text-sky-300">
              {t("merchant.claimProcessDescription")}
            </p>
          </div>
        </div>
      </div>

      {/* Claims List */}
      <div className="space-y-4">
        {claims.map((claim) => {
          const status = claim.status?.toLowerCase() || "pending";
          const isPending = status === "pending" || status === "submitted";
          const isVerified = status === "verified";
          const isApproved = status === "approved";
          const isRejected = status === "rejected";

          return (
            <div
              key={claim.id}
              className="p-5 sm:p-6 rounded-2xl bg-white dark:bg-slate-900 border border-secondary-200 dark:border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base sm:text-lg text-secondary-900 dark:text-white flex items-center gap-2">
                      <span>{claim.business_name || "Business Claim"}</span>
                      {claim.listing_id && (
                        <Link
                          to={`/business/${claim.listing_id}`}
                          className="text-xs text-amber-600 hover:text-amber-500 inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      )}
                    </h3>
                    <p className="text-xs text-secondary-500 dark:text-slate-400">
                      {t("merchant.submittedOn", { date: new Date(claim.created_at).toLocaleDateString() })}
                    </p>
                  </div>
                </div>

                {/* Status Badges */}
                <div>
                  {isApproved && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t("merchant.approvedOwnership")}
                    </span>
                  )}
                  {isVerified && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      {t("merchant.verifiedReview")}
                    </span>
                  )}
                  {isPending && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Clock className="w-3.5 h-3.5" />
                      {t("merchant.pendingModeration")}
                    </span>
                  )}
                  {isRejected && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      <XCircle className="w-3.5 h-3.5" />
                      {t("merchant.claimRejected")}
                    </span>
                  )}
                </div>
              </div>

              {/* Details & Rejection Callout */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-secondary-100 dark:border-slate-800 text-xs text-secondary-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-secondary-400" />
                  <span className="truncate">{claim.email}</span>
                </div>
                {(claim.phone || claim.contact_phone) && (
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-secondary-400" />
                    <span>{claim.phone || claim.contact_phone}</span>
                  </div>
                )}
                {claim.role && (
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-secondary-700 dark:text-slate-300">{t("merchant.role")}</span>
                    <span>{claim.role}</span>
                  </div>
                )}
              </div>

              {isRejected && claim.rejection_reason && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-semibold">{t("merchant.rejectionNote")} </strong>
                    <span>{claim.rejection_reason}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
