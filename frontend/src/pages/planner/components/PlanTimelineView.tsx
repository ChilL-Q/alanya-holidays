import React, { useMemo } from "react";
import type { Plan, PlanItem } from "@/hooks/usePlanner";
import SortableDayItemList from "./SortableDayItemList";

interface PlanTimelineViewProps {
  plan: Plan;
  dayLabels: string[];
  activeDay: string;
  onSelectDay: (day: string) => void;
  editingItemId: string | null;
  onSetEditingItemId: (id: string | null) => void;
  getItemDisplayInfo: (item: PlanItem) => {
    name: string;
    url: string | null;
    subcategory: string;
  };
  onToggleComplete: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  onRemoveItem: (itemId: string) => void;
  onReorderItems: (items: PlanItem[]) => void;
  onOpenAddItemModal: () => void;
  onOpenAiModal: (tab: "generate" | "chat") => void;
}

export const PlanTimelineView: React.FC<PlanTimelineViewProps> = ({
  plan,
  dayLabels,
  activeDay,
  onSelectDay,
  editingItemId,
  onSetEditingItemId,
  getItemDisplayInfo,
  onToggleComplete,
  onUpdateNotes,
  onRemoveItem,
  onReorderItems,
  onOpenAddItemModal,
  onOpenAiModal,
}) => {
  const dayItems = useMemo(() => {
    return plan.items
      .filter((item) => item.dayLabel === activeDay)
      .sort((a, b) => a.order - b.order || a.timeSlot.localeCompare(b.timeSlot));
  }, [plan, activeDay]);

  return (
    <div>
      {/* Day tabs */}
      {dayLabels.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
          <div className="flex gap-1.5 bg-white rounded-full border border-background-200 p-1 shadow-xs">
            {dayLabels.map((label) => {
              const currentDayItems = plan.items.filter((i) => i.dayLabel === label);
              const dayCompleted = currentDayItems.filter((i) => i.completed).length;
              const allDone = currentDayItems.length > 0 && dayCompleted === currentDayItems.length;
              return (
                <button
                  key={label}
                  onClick={() => onSelectDay(label)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    activeDay === label
                      ? "bg-primary-500 text-white shadow-xs"
                      : allDone
                        ? "bg-accent-100 text-accent-700 hover:bg-accent-200"
                        : "text-foreground-600 hover:bg-background-100"
                  }`}
                >
                  {label}
                  {currentDayItems.length > 0 && (
                    <span className={`text-xs ${activeDay === label ? "text-white/80" : "text-foreground-400"}`}>
                      {currentDayItems.length}
                    </span>
                  )}
                  {allDone && (
                    <i className={`ri-check-double-line text-xs ${activeDay === label ? "text-white" : "text-accent-500"}`}></i>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Day items */}
      {dayItems.length === 0 ? (
        <div className="max-w-md mx-auto text-center py-16 bg-white rounded-3xl border border-background-200 p-8 shadow-xs">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center rounded-full bg-background-100">
            <i className="ri-calendar-2-line text-foreground-300 text-xl"></i>
          </div>
          <h3 className="font-heading text-base text-foreground-800 mb-1">Nothing planned for {activeDay}</h3>
          <p className="text-sm text-foreground-500 mb-6">
            Add businesses, events, or custom activities to this day.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <button
              onClick={onOpenAddItemModal}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer shadow-xs"
            >
              <i className="ri-add-line"></i>
              Add to {activeDay}
            </button>
            <button
              onClick={() => onOpenAiModal("chat")}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-primary-300 bg-primary-50 text-primary-700 text-sm font-medium hover:bg-primary-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-sparkling-fill text-primary-500"></i>
              Ask AI for Ideas
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xs text-foreground-400 flex items-center gap-1">
              <i className="ri-draggable text-foreground-300"></i>
              Drag to reorder your itinerary
            </span>
          </div>
          <SortableDayItemList
            items={dayItems}
            planId={plan.id}
            editingItemId={editingItemId}
            getItemDisplayInfo={getItemDisplayInfo}
            onToggleComplete={onToggleComplete}
            onUpdateNotes={onUpdateNotes}
            onRemove={onRemoveItem}
            onReorder={onReorderItems}
            onSetEditingItemId={onSetEditingItemId}
          />
        </>
      )}
    </div>
  );
};

export default PlanTimelineView;
