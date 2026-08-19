import React, { useRef } from "react";
import type { Plan, PlanItem } from "@/hooks/usePlanner";

// Create Plan Modal
interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  onPlanNameChange: (name: string) => void;
  planDescription: string;
  onPlanDescriptionChange: (desc: string) => void;
  onCreate: () => void;
}

export const CreatePlanModal: React.FC<CreatePlanModalProps> = ({
  isOpen,
  onClose,
  planName,
  onPlanNameChange,
  planDescription,
  onPlanDescriptionChange,
  onCreate,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-background-200">
          <h3 className="font-heading text-lg font-semibold text-foreground-900">Create New Plan</h3>
          <p className="text-xs text-foreground-500 mt-1">Give your plan a name and start building your itinerary</p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
              Plan Name *
            </label>
            <input
              type="text"
              value={planName}
              onChange={(e) => onPlanNameChange(e.target.value)}
              placeholder="e.g., Weekend in Alanya, Food Tour, Beach Day..."
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300"
              onKeyDown={(e) => {
                if (e.key === "Enter") onCreate();
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
              Description (optional)
            </label>
            <textarea
              value={planDescription}
              onChange={(e) => onPlanDescriptionChange(e.target.value)}
              placeholder="What's this plan about? Any notes for yourself..."
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 placeholder:text-foreground-300 resize-y"
            ></textarea>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-background-200 flex items-center gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onCreate}
            disabled={!planName.trim()}
            className="px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
          >
            Create Plan
          </button>
        </div>
      </div>
    </div>
  );
};

// Edit Plan Modal
interface EditPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
  editPlanName: string;
  onEditPlanNameChange: (name: string) => void;
  editPlanDescription: string;
  onEditPlanDescriptionChange: (desc: string) => void;
  onSave: () => void;
  onDeleteRequest: () => void;
  onDuplicate: () => void;
}

export const EditPlanModal: React.FC<EditPlanModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  editPlanName,
  onEditPlanNameChange,
  editPlanDescription,
  onEditPlanDescriptionChange,
  onSave,
  onDeleteRequest,
  onDuplicate,
}) => {
  if (!isOpen || !selectedPlan) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-20" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-md w-full mx-4 shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-background-200">
          <h3 className="font-heading text-lg font-semibold text-foreground-900">Edit Plan</h3>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
              Plan Name *
            </label>
            <input
              type="text"
              value={editPlanName}
              onChange={(e) => onEditPlanNameChange(e.target.value)}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700"
              onKeyDown={(e) => {
                if (e.key === "Enter") onSave();
              }}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={editPlanDescription}
              onChange={(e) => onEditPlanDescriptionChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-primary-300 text-foreground-700 resize-y"
            ></textarea>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-background-200 flex items-center gap-3 justify-between flex-wrap">
          <div className="flex items-center gap-2">
            <button
              onClick={onDeleteRequest}
              className="px-3.5 py-2 rounded-full border border-red-200 text-xs text-red-600 font-medium hover:bg-red-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-delete-bin-6-line mr-1"></i>
              Delete
            </button>
            <button
              onClick={onDuplicate}
              className="px-3.5 py-2 rounded-full border border-foreground-200 text-xs text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-file-copy-line mr-1"></i>
              Duplicate
            </button>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={!editPlanName.trim()}
              className="px-5 py-2 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Share Plan Modal
interface SharePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
  shareAuthorName: string;
  onShareAuthorNameChange: (name: string) => void;
  onConfirmShare: () => void;
}

export const SharePlanModal: React.FC<SharePlanModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  shareAuthorName,
  onShareAuthorNameChange,
  onConfirmShare,
}) => {
  if (!isOpen || !selectedPlan) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-accent-100">
          <i className="ri-share-forward-line text-accent-500 text-xl"></i>
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground-900 mb-1 text-center">Share as Template?</h3>
        <p className="text-sm text-foreground-500 mb-4 text-center">
          <strong>{selectedPlan.name}</strong> will appear in the Community Templates section where other travelers can copy it as a starting point for their own plans.
        </p>
        <div className="mb-4">
          <label className="block text-xs font-semibold text-foreground-500 uppercase tracking-wider mb-1.5 text-left">
            Your Name
          </label>
          <input
            type="text"
            value={shareAuthorName}
            onChange={(e) => onShareAuthorNameChange(e.target.value)}
            placeholder="How you'll appear to the community"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-background-200 bg-background-50 focus:outline-none focus:border-accent-300 text-foreground-700 placeholder:text-foreground-300"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") onConfirmShare();
            }}
          />
          <p className="text-xs text-foreground-400 mt-1.5 text-left">
            {selectedPlan.items.length} items · Your plan stays in your library unchanged
          </p>
        </div>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmShare}
            className="px-5 py-2 rounded-full bg-accent-500 text-white text-sm font-medium hover:bg-accent-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            Share Plan
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirm Modal
interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
  onConfirmDelete: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  onConfirmDelete,
}) => {
  if (!isOpen || !selectedPlan) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center" onClick={onClose}>
      <div
        className="bg-white rounded-2xl max-w-sm w-full mx-4 shadow-2xl p-6 text-center"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full bg-red-100">
          <i className="ri-error-warning-line text-red-500 text-xl"></i>
        </div>
        <h3 className="font-heading text-base font-semibold text-foreground-900 mb-1">Delete Plan?</h3>
        <p className="text-sm text-foreground-500 mb-6">
          This will permanently delete <strong>{selectedPlan.name}</strong> and all its items. This cannot be undone.
        </p>
        <div className="flex items-center gap-3 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-full border border-foreground-200 text-sm text-foreground-600 font-medium hover:bg-background-100 transition-colors whitespace-nowrap cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirmDelete}
            className="px-5 py-2 rounded-full bg-red-500 text-white text-sm font-medium hover:bg-red-600 transition-colors whitespace-nowrap cursor-pointer"
          >
            Delete Plan
          </button>
        </div>
      </div>
    </div>
  );
};

// Print Plan Modal
interface PrintPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlan: Plan | null;
  dayLabels: string[];
  getItemDisplayInfo: (item: PlanItem) => {
    name: string;
    url: string | null;
    subcategory: string;
  };
  onPrint: () => void;
}

export const PrintPlanModal: React.FC<PrintPlanModalProps> = ({
  isOpen,
  onClose,
  selectedPlan,
  dayLabels,
  getItemDisplayInfo,
  onPrint,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !selectedPlan) return null;

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #planner-print,
          #planner-print * { visibility: visible; }
          #planner-print {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
          #planner-print .no-print { display: none !important; }
          @page { size: A4; margin: 12mm; }
        }
      `}</style>
      <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center pt-8 pb-8 overflow-y-auto no-print" onClick={onClose}>
        <div
          className="bg-white rounded-2xl max-w-3xl w-full mx-4 shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-background-200 no-print">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-100 flex items-center justify-center">
                <i className="ri-printer-line text-primary-500"></i>
              </div>
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground-900">Print Plan</h3>
                <p className="text-xs text-foreground-500">Ready to print your itinerary</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onPrint}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary-500 text-white text-sm font-medium hover:bg-primary-600 transition-colors whitespace-nowrap cursor-pointer"
              >
                <i className="ri-printer-line text-sm"></i>
                Print
              </button>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full flex items-center justify-center border border-foreground-200 text-foreground-400 hover:text-foreground-600 hover:bg-background-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line"></i>
              </button>
            </div>
          </div>
          <div id="planner-print" ref={printRef} className="bg-white px-8 py-6">
            <div className="mb-6 pb-4 border-b-2 border-foreground-900">
              <div className="flex items-center justify-between mb-3">
                <h1 className="font-heading text-2xl font-bold text-foreground-900">{selectedPlan.name}</h1>
                <span className="text-xs text-foreground-400">
                  {new Date(selectedPlan.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              {selectedPlan.description && (
                <p className="text-sm text-foreground-600 mb-3">{selectedPlan.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-foreground-500">
                <span>{selectedPlan.items.length} items</span>
                <span>{dayLabels.length} {dayLabels.length === 1 ? "day" : "days"}</span>
                <span>Alanya Holidays Planner</span>
              </div>
            </div>

            {dayLabels.map((label) => {
              const items = selectedPlan.items
                .filter((i) => i.dayLabel === label)
                .sort((a, b) => a.order - b.order);
              if (items.length === 0) return null;
              return (
                <div key={label} className="mb-6">
                  <h3 className="font-heading text-sm font-semibold text-foreground-700 uppercase tracking-wider mb-3 pb-2 border-b border-background-200">
                    {label}
                  </h3>
                  <div className="space-y-3">
                    {items.map((item) => {
                      const info = getItemDisplayInfo(item);
                      return (
                        <div key={item.id} className="flex items-start gap-3 pl-2 border-l-2 border-background-200">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              {item.completed && (
                                <i className="ri-check-double-line text-accent-500 text-xs shrink-0"></i>
                              )}
                              <p className={`text-sm ${item.completed ? "text-foreground-400 line-through" : "text-foreground-800"}`}>
                                {info.name}
                              </p>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {item.timeSlot && item.timeSlot !== "Flexible" && (
                                <span className="text-xs text-foreground-500">{item.timeSlot}</span>
                              )}
                              {item.type !== "custom" && (
                                <span className="text-xs text-foreground-400">{info.subcategory}</span>
                              )}
                            </div>
                            {item.notes && (
                              <p className="mt-1 text-xs text-foreground-500 italic">{item.notes}</p>
                            )}
                            {item.type === "custom" && item.customDescription && (
                              <p className="mt-1 text-xs text-foreground-500">{item.customDescription}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            <div className="mt-8 pt-4 border-t border-background-200 text-center">
              <p className="text-xs text-foreground-400">
                Alanya Holidays — Printed {new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
