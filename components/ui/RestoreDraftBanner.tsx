import React from 'react';
import { AlertCircle } from 'lucide-react';

interface RestoreDraftBannerProps {
  onRestore: () => void;
  onDiscard: () => void;
}

export const RestoreDraftBanner: React.FC<RestoreDraftBannerProps> = ({ onRestore, onDiscard }) => {
  return (
    <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-400 p-4 rounded flex items-center gap-3">
      <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-amber-900 dark:text-amber-100 font-medium">You have unsaved progress</p>
        <p className="text-amber-700 dark:text-amber-200 text-sm mt-1">Would you like to restore your previous draft?</p>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={onDiscard}
          className="px-4 py-2 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800 dark:hover:bg-amber-700 text-amber-900 dark:text-amber-100 rounded font-medium text-sm transition-colors"
        >
          Discard
        </button>
        <button
          onClick={onRestore}
          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-sm transition-colors"
        >
          Restore
        </button>
      </div>
    </div>
  );
};
