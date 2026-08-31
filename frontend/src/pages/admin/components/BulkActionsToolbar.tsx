import React from "react";
import { useTranslation } from "react-i18next";
import "@/i18n";

interface BulkActionsToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBatchApprove?: () => Promise<void> | void;
  onBatchReject?: () => Promise<void> | void;
  onBatchFeature?: () => Promise<void> | void;
  onBatchVerify?: () => Promise<void> | void;
  isLoading?: boolean;
  itemLabel?: string;
  approveLabel?: string;
  rejectLabel?: string;
  featureLabel?: string;
  verifyLabel?: string;
}

export default function BulkActionsToolbar({
  selectedCount,
  totalCount,
  onSelectAll,
  onDeselectAll,
  onBatchApprove,
  onBatchReject,
  onBatchFeature,
  onBatchVerify,
  isLoading = false,
  itemLabel,
  approveLabel,
  rejectLabel,
  featureLabel,
  verifyLabel,
}: BulkActionsToolbarProps) {
  const { t } = useTranslation();
  const resolvedItemLabel = itemLabel ?? t("merchant.items");
  const resolvedApproveLabel = approveLabel ?? t("admin.batchApprove");
  const resolvedRejectLabel = rejectLabel ?? t("admin.batchReject");
  const resolvedFeatureLabel = featureLabel ?? t("admin.featureSelected");
  const resolvedVerifyLabel = verifyLabel ?? t("admin.verifySelected");
  if (selectedCount === 0) return null;

  const isAllSelected = selectedCount === totalCount && totalCount > 0;

  return (
    <div
      data-testid="bulk-actions-toolbar"
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur-md text-white border border-slate-700/80 shadow-2xl rounded-2xl px-5 py-3.5 flex flex-wrap items-center gap-3 sm:gap-4 animate-in slide-in-from-bottom-5 duration-200"
    >
      <div className="flex items-center space-x-2.5">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-500 animate-pulse" />
        <span className="text-xs sm:text-sm font-semibold text-slate-200">
          <strong className="text-white font-bold">{selectedCount}</strong> of{" "}
          {t("admin.itemsSelected", { selected: selectedCount, total: totalCount, itemLabel: resolvedItemLabel })}
        </span>
      </div>

      <div className="h-4 w-px bg-slate-700 hidden sm:block" />

      {/* Select / Deselect All Toggle */}
      <button
        type="button"
        onClick={isAllSelected ? onDeselectAll : onSelectAll}
        className="text-xs font-semibold text-slate-300 hover:text-white underline underline-offset-2 transition-colors cursor-pointer"
      >
        {isAllSelected ? t("admin.deselectAll") : t("admin.selectAll", { total: totalCount })}
      </button>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 ml-auto">
        {onBatchFeature && (
          <button
            type="button"
            data-testid="bulk-feature-btn"
            onClick={onBatchFeature}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-star-fill text-sm" />
            <span>{resolvedFeatureLabel}</span>
          </button>
        )}

        {onBatchVerify && (
          <button
            type="button"
            data-testid="bulk-verify-btn"
            onClick={onBatchVerify}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-95 text-white shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-checkbox-circle-fill text-sm" />
            <span>{resolvedVerifyLabel}</span>
          </button>
        )}

        {onBatchApprove && (
          <button
            type="button"
            data-testid="bulk-approve-btn"
            onClick={onBatchApprove}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <i className="ri-loader-4-line animate-spin text-xs" />
            ) : (
              <i className="ri-checkbox-circle-line text-sm" />
            )}
            <span>{resolvedApproveLabel}</span>
          </button>
        )}

        {onBatchReject && (
          <button
            type="button"
            data-testid="bulk-reject-btn"
            onClick={onBatchReject}
            disabled={isLoading}
            className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-500 active:scale-95 text-white shadow-xs transition-all flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer"
          >
            <i className="ri-close-circle-line text-sm" />
            <span>{resolvedRejectLabel}</span>
          </button>
        )}

        <button
          type="button"
          onClick={onDeselectAll}
          title={t("admin.clearSelection")}
          aria-label={t("admin.clearSelection")}
          className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-700/50 transition-colors cursor-pointer"
        >
          <i className="ri-close-line text-lg" />
        </button>
      </div>
    </div>
  );
}
