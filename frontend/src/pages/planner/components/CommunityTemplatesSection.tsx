import React, { useMemo } from "react";
import type { SharedPlan } from "@/hooks/useSharedPlans";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface CommunityTemplatesSectionProps {
  sharedPlans: SharedPlan[];
  communitySort: "recent" | "popular";
  onSortChange: (sort: "recent" | "popular") => void;
  onCopyPlan: (plan: SharedPlan) => void;
}

export const CommunityTemplatesSection: React.FC<CommunityTemplatesSectionProps> = ({
  sharedPlans,
  communitySort,
  onSortChange,
  onCopyPlan,
}) => {
  const { t } = useTranslation();
  const sortedSharedPlans = useMemo(
    () =>
      communitySort === "popular"
        ? [...sharedPlans].sort((a, b) => b.copyCount - a.copyCount)
        : sharedPlans,
    [sharedPlans, communitySort],
  );

  if (sharedPlans.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground-900">{t("public.communityTemplates")}</h2>
          <p className="text-xs text-foreground-500 mt-0.5">{t("public.communityTemplatesDescription")}</p>
        </div>
        <div className="flex items-center gap-1.5 bg-white rounded-full border border-background-200 p-1">
          <button
            onClick={() => onSortChange("recent")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              communitySort === "recent"
                ? "bg-primary-500 text-white shadow-xs"
                : "text-foreground-500 hover:text-foreground-700"
            }`}
          >
            <i className="ri-time-line text-xs"></i>
            Recent
          </button>
          <button
            onClick={() => onSortChange("popular")}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
              communitySort === "popular"
                ? "bg-primary-500 text-white shadow-xs"
                : "text-foreground-500 hover:text-foreground-700"
            }`}
          >
            <i className="ri-fire-line text-xs"></i>
            Most Copied
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedSharedPlans.map((sp) => {
          const dayLabels = [...new Set(sp.items.map((i) => i.dayLabel))];
          return (
            <div
              key={sp.shareId}
              className="bg-white rounded-2xl border border-accent-200/50 p-5 flex flex-col group hover:border-accent-400 transition-colors shadow-xs hover:shadow-md relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center shrink-0">
                  <i className="ri-share-forward-line text-accent-600 text-lg"></i>
                </div>
                {sp.copyCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-accent-700 bg-accent-50 font-medium px-2 py-1 rounded-full whitespace-nowrap">
                    <i className="ri-file-copy-line text-xs"></i>
                    {sp.copyCount} {sp.copyCount === 1 ? "copy" : "copies"}
                  </span>
                )}
              </div>
              <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-1">{sp.name}</h3>
              <p className="text-xs text-accent-700 font-medium mb-2">{t("public.byAuthor", { name: sp.authorName })}</p>
              {sp.description && (
                <p className="text-xs text-foreground-500 leading-relaxed line-clamp-2 mb-4 flex-1">
                  {sp.description}
                </p>
              )}
              <div className="flex items-center gap-3 text-xs text-foreground-400 mb-4 mt-auto">
                <span className="flex items-center gap-1">
                  <i className="ri-list-check text-foreground-300"></i>
                  {sp.items.length} items
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-calendar-line text-foreground-300"></i>
                  {dayLabels.length} {dayLabels.length === 1 ? "day" : "days"}
                </span>
              </div>
              <button
                onClick={() => onCopyPlan(sp)}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
              >
                <i className="ri-file-copy-line text-sm"></i>
                Copy Template
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommunityTemplatesSection;
