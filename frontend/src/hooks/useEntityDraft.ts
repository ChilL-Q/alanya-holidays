import { useState, useEffect, useRef, useCallback } from "react";
import { logger } from "@/lib/logger";

export interface StoredEntityDraft<T> {
  formData: Partial<T>;
  draftId?: string | null;
  lastSavedAt: string;
}

export interface UseEntityDraftOptions<T> {
  storageKey: string;
  defaults: Partial<T>;
  saveToApi: (data: Partial<T>, draftId?: string) => Promise<{ id: string }>;
  isMeaningful?: (data: Partial<T>) => boolean;
  initialDraftId?: string | null;
  debounceMs?: number;
}

/**
 * Generic local+cloud draft persistence for any listing entity.
 * Local drafts are debounced to localStorage; "Save Draft" pushes to the API
 * via saveToApi and remembers the returned server id.
 */
export function useEntityDraft<T extends Record<string, unknown>>(
  options: UseEntityDraftOptions<T>,
) {
  const {
    storageKey,
    defaults,
    saveToApi,
    isMeaningful,
    initialDraftId = null,
    debounceMs = 500,
  } = options;

  const hasContent = useCallback(
    (data: Partial<T>) => (isMeaningful ? isMeaningful(data) : Object.keys(data).length > 0),
    [isMeaningful],
  );

  const [draft, setDraft] = useState<Partial<T>>(() => ({ ...defaults }));
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState(false);
  const [localDraftSummary, setLocalDraftSummary] = useState<{
    name?: string;
    lastSavedAt?: Date;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;
  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as StoredEntityDraft<T>;
        if (parsed?.formData && hasContent(parsed.formData)) {
          setHasLocalDraft(true);
          setLocalDraftSummary({
            name:
              typeof parsed.formData.title === "string"
                ? parsed.formData.title
                : typeof parsed.formData.name === "string"
                  ? parsed.formData.name
                  : "Untitled Draft",
            lastSavedAt: parsed.lastSavedAt ? new Date(parsed.lastSavedAt) : undefined,
          });
          return;
        }
      }
      setHasLocalDraft(false);
      setLocalDraftSummary(null);
    } catch {
      setHasLocalDraft(false);
      setLocalDraftSummary(null);
    }
  }, [storageKey, hasContent]);

  const cancelPendingSave = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  const persistLocally = useCallback(
    (data: Partial<T>, currentDraftId: string | null) => {
      if (!hasContent(data)) return;
      cancelPendingSave();
      debounceTimerRef.current = setTimeout(() => {
        try {
          const now = new Date();
          const payload: StoredEntityDraft<T> = {
            formData: data,
            draftId: currentDraftId,
            lastSavedAt: now.toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
          setLastSavedAt(now);
        } catch (e) {
          logger.warn("Failed to auto-save listing draft to localStorage:", e);
        }
      }, debounceMs);
    },
    [storageKey, debounceMs, cancelPendingSave, hasContent],
  );

  const mutateDraft = useCallback(
    (updater: (current: Partial<T>) => Partial<T>) => {
      const updated = updater(draftRef.current);
      draftRef.current = updated;
      setDraft(updated);
      setIsDirty(true);
      persistLocally(updated, draftIdRef.current);
    },
    [persistLocally],
  );

  const updateField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      mutateDraft((current) => ({ ...current, [key]: value })),
    [mutateDraft],
  );

  const setDraftData = useCallback(
    (data: Partial<T>) => mutateDraft((current) => ({ ...current, ...data })),
    [mutateDraft],
  );

  const restoreLocalDraft = useCallback(() => {
    cancelPendingSave();
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return;
      const parsed = JSON.parse(stored) as StoredEntityDraft<T>;
      if (!parsed?.formData) return;
      const restored = { ...defaults, ...parsed.formData };
      draftRef.current = restored;
      setDraft(restored);
      if (parsed.draftId) {
        setDraftId(parsed.draftId);
        draftIdRef.current = parsed.draftId;
      }
      if (parsed.lastSavedAt) setLastSavedAt(new Date(parsed.lastSavedAt));
      setHasLocalDraft(false);
      setIsDirty(true);
    } catch (e) {
      logger.warn("Failed to restore draft from localStorage:", e);
    }
  }, [storageKey, defaults, cancelPendingSave]);

  const discardLocalDraft = useCallback(() => {
    cancelPendingSave();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    setHasLocalDraft(false);
    setLocalDraftSummary(null);
  }, [storageKey, cancelPendingSave]);

  const clearDraft = useCallback(() => {
    cancelPendingSave();
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    draftRef.current = { ...defaults };
    setDraft({ ...defaults });
    setDraftId(null);
    draftIdRef.current = null;
    setIsDirty(false);
    setHasLocalDraft(false);
    setLocalDraftSummary(null);
    setLastSavedAt(null);
  }, [storageKey, defaults, cancelPendingSave]);

  const saveDraftToCloud = useCallback(async () => {
    setIsSaving(true);
    try {
      const currentDraft = draftRef.current;
      const saved = await saveToApi(currentDraft, draftIdRef.current || undefined);
      if (saved?.id) {
        setDraftId(saved.id);
        draftIdRef.current = saved.id;
        const now = new Date();
        setLastSavedAt(now);
        setIsDirty(false);
        const payload: StoredEntityDraft<T> = {
          formData: currentDraft,
          draftId: saved.id,
          lastSavedAt: now.toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }
      return saved;
    } finally {
      setIsSaving(false);
    }
  }, [storageKey, saveToApi]);

  return {
    draft,
    draftId,
    isDirty,
    isSaving,
    lastSavedAt,
    hasLocalDraft,
    localDraftSummary,
    updateField,
    setDraftData,
    restoreLocalDraft,
    discardLocalDraft,
    clearDraft,
    saveToCloud: saveDraftToCloud,
  };
}
