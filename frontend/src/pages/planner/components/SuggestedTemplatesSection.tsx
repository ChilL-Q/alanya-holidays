import React, { useMemo } from "react";
import type { SuggestedPlan } from "@/mocks/suggestedPlans";

interface SuggestedTemplatesSectionProps {
  suggestedPlans: SuggestedPlan[];
  activeCategory: string;
  onSelectCategory: (category: string) => void;
  onCopyPlan: (planId: string) => void;
}

export const SuggestedTemplatesSection: React.FC<SuggestedTemplatesSectionProps> = ({
  suggestedPlans,
  activeCategory,
  onSelectCategory,
  onCopyPlan,
}) => {
  const suggestedCategories = useMemo(
    () => ["All", ...new Set(suggestedPlans.map((sp) => sp.category))],
    [suggestedPlans],
  );

  const filteredSuggestedPlans = useMemo(
    () =>
      activeCategory === "All"
        ? suggestedPlans
        : suggestedPlans.filter((sp) => sp.category === activeCategory),
    [suggestedPlans, activeCategory],
  );

  if (suggestedPlans.length === 0) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-lg font-semibold text-foreground-900">Suggested Plans</h2>
          <p className="text-xs text-foreground-500 mt-0.5">Pre-built itineraries — copy one to get started instantly</p>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {suggestedCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
              activeCategory === cat
                ? "bg-primary-500 text-white shadow-sm"
                : "bg-white border border-background-200 text-foreground-600 hover:border-primary-300 hover:text-primary-600"
            }`}
          >
            {cat === "All" && <i className="ri-apps-line text-sm"></i>}
            {cat === "Adventure" && <i className="ri-compass-3-line text-sm"></i>}
            {cat === "Family-Friendly" && <i className="ri-hearts-line text-sm"></i>}
            {cat === "Romantic" && <i className="ri-heart-line text-sm"></i>}
            {cat === "Budget-Friendly" && <i className="ri-money-dollar-circle-line text-sm"></i>}
            {cat === "Culture & Food" && <i className="ri-restaurant-line text-sm"></i>}
            {cat === "Food & Relaxation" && <i className="ri-cup-line text-sm"></i>}
            {cat === "Indoor & Cozy" && <i className="ri-home-smile-line text-sm"></i>}
            {cat === "Work & Social" && <i className="ri-briefcase-line text-sm"></i>}
            {cat === "Summer (Jul-Aug)" && <i className="ri-sun-line text-sm"></i>}
            {cat === "Winter (Nov-Mar)" && <i className="ri-snowy-line text-sm"></i>}
            {cat}
            {activeCategory === cat && cat !== "All" && (
              <span className="text-xs text-white/70 ml-0.5">
                ({filteredSuggestedPlans.length})
              </span>
            )}
          </button>
        ))}
      </div>

      {filteredSuggestedPlans.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-background-100">
            <i className="ri-search-line text-foreground-300 text-xl"></i>
          </div>
          <h3 className="font-heading text-base text-foreground-800 mb-1">No plans in this category</h3>
          <p className="text-sm text-foreground-500 mb-4">
            No suggested plans match the "{activeCategory}" category yet.
          </p>
          <button
            onClick={() => onSelectCategory("All")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            <i className="ri-arrow-left-line"></i>
            Show All Plans
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredSuggestedPlans.map((sp) => {
            const dayLabels = [...new Set(sp.items.map((i) => i.dayLabel))];
            return (
              <div
                key={sp.id}
                className="bg-white rounded-2xl border border-background-200/70 p-5 flex flex-col group hover:border-primary-300 transition-colors shadow-xs hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-secondary-100 flex items-center justify-center shrink-0">
                    <i className="ri-lightbulb-flash-line text-secondary-500 text-lg"></i>
                  </div>
                  <span className="text-xs text-foreground-400 bg-background-50 px-2 py-1 rounded-full whitespace-nowrap">
                    {sp.category}
                  </span>
                </div>
                <h3 className="font-heading text-sm font-semibold text-foreground-900 mb-1.5">{sp.name}</h3>
                <p className="text-xs text-foreground-500 leading-relaxed line-clamp-3 mb-4 flex-1">
                  {sp.description}
                </p>
                <div className="flex items-center gap-3 text-xs text-foreground-400 mb-4">
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
                  onClick={() => onCopyPlan(sp.id)}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
                >
                  <i className="ri-file-copy-line text-sm"></i>
                  Copy as My Plan
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SuggestedTemplatesSection;
