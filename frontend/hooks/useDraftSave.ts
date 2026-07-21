import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { isDraftContentEmpty } from '../utils/drafts';

interface UseDraftSaveOptions<T = unknown> {
  storageKey: string;
  formData: T;
  excludeKeys?: readonly string[];
  onRestore?: (data: T) => void;
  dependencies: unknown[];
}

export function useDraftSave<T = unknown>({
  storageKey,
  formData,
  excludeKeys = [],
  onRestore,
  dependencies,
}: UseDraftSaveOptions<T>) {
  const [savedDraft, setSavedDraft] = useState<T | null>(null);
  const showRestoreBanner = savedDraft !== null;

  const hasContent = useCallback(
    (data: T) => !isDraftContentEmpty(data as Record<string, unknown>, excludeKeys),
    [excludeKeys]
  );

  // Load draft on mount
  useEffect(() => {
    const draftStr = localStorage.getItem(storageKey);
    if (draftStr) {
      try {
        const parsed = JSON.parse(draftStr);
        if (parsed && typeof parsed === 'object' && hasContent(parsed)) {
          setSavedDraft(parsed);
        }
      } catch (e) {
        console.error(`Failed to parse draft from ${storageKey}:`, e);
      }
    }
  }, [storageKey, hasContent]);

  // Save draft on formData change
  useEffect(() => {
    if (hasContent(formData)) {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          ...formData,
          updatedAt: new Date().toISOString(),
        })
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies, storageKey]);

  const handleRestoreDraft = () => {
    if (savedDraft) {
      const { updatedAt: _, ...rest } = savedDraft as Record<string, unknown>;
      onRestore?.(rest as T);
      toast.success('Unsaved progress restored!');
    }
    setSavedDraft(null);
  };

  const handleDiscardDraft = () => {
    localStorage.removeItem(storageKey);
    setSavedDraft(null);
    toast.success('Draft discarded');
  };

  return {
    showRestoreBanner,
    handleRestoreDraft,
    handleDiscardDraft,
  };
}
