import { useState, useEffect, useRef, useCallback } from "react";
import {
  directoryService,
  type CreateListingInput,
  type ListingTier,
} from "@/api-services/directory.service";

export interface StoredDraftData {
  formData: Partial<CreateListingInput>;
  draftId?: string | null;
  lastSavedAt: string;
}

export interface UseListingDraftOptions {
  userId?: string | null;
  initialDraftId?: string | null;
  initialData?: Partial<CreateListingInput> | null;
  debounceMs?: number;
}

const DEFAULT_DRAFT: Partial<CreateListingInput> = {
  name: "",
  category: "restaurants",
  subcategory: "",
  description: "",
  address: "",
  phone: "",
  email: "",
  website: "",
  tier: "explorer" as ListingTier,
  price_level: "$$",
  social_links: {
    whatsapp: "",
    instagram: "",
    facebook: "",
    tripadvisor: "",
  },
  video_url: "",
  booking_url: "",
  images: [],
};

export function hasMeaningfulDraftContent(data?: Partial<CreateListingInput> | null): boolean {
  if (!data) return false;
  return Boolean(
    (data.name || "").trim() ||
    (data.description || "").trim() ||
    (data.address || "").trim() ||
    (data.phone || "").trim() ||
    (data.email || "").trim() ||
    (data.website || "").trim() ||
    (Array.isArray(data.images) && data.images.length > 0) ||
    (data.video_url || "").trim() ||
    (data.booking_url || "").trim()
  );
}

export function useListingDraft(options: UseListingDraftOptions = {}) {
  const {
    userId,
    initialDraftId = null,
    initialData = null,
    debounceMs = 500,
  } = options;

  const storageKey = `alanya_listing_draft_${userId || "guest"}`;

  const [draft, setDraft] = useState<Partial<CreateListingInput>>(() => ({
    ...DEFAULT_DRAFT,
    ...(initialData || {}),
  }));
  const [draftId, setDraftId] = useState<string | null>(initialDraftId);
  const [isDirty, setIsDirty] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasLocalDraft, setHasLocalDraft] = useState<boolean>(false);
  const [localDraftSummary, setLocalDraftSummary] = useState<{
    name?: string;
    lastSavedAt?: Date;
  } | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const draftIdRef = useRef(draftId);
  draftIdRef.current = draftId;

  // Unmount cleanup: cancel any pending debounced save
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }
    };
  }, []);

  // Check localStorage on mount or storageKey change
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredDraftData = JSON.parse(stored);
        if (parsed && parsed.formData && hasMeaningfulDraftContent(parsed.formData)) {
          setHasLocalDraft(true);
          setLocalDraftSummary({
            name: parsed.formData.name || "Untitled Draft",
            lastSavedAt: parsed.lastSavedAt ? new Date(parsed.lastSavedAt) : undefined,
          });
        } else {
          setHasLocalDraft(false);
          setLocalDraftSummary(null);
        }
      } else {
        setHasLocalDraft(false);
        setLocalDraftSummary(null);
      }
    } catch {
      setHasLocalDraft(false);
      setLocalDraftSummary(null);
    }
  }, [storageKey]);

  // Synchronize initialData when changed externally
  useEffect(() => {
    if (initialData) {
      setDraft((prev) => ({ ...prev, ...initialData }));
    }
    if (initialDraftId) {
      setDraftId(initialDraftId);
    }
  }, [initialData, initialDraftId]);

  // Debounced save to localStorage
  const triggerDebouncedLocalSave = useCallback(
    (newDraft: Partial<CreateListingInput>, currentDraftId: string | null) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
      }

      if (!hasMeaningfulDraftContent(newDraft)) {
        return;
      }

      debounceTimerRef.current = setTimeout(() => {
        try {
          const now = new Date();
          const payload: StoredDraftData = {
            formData: newDraft,
            draftId: currentDraftId,
            lastSavedAt: now.toISOString(),
          };
          localStorage.setItem(storageKey, JSON.stringify(payload));
          setLastSavedAt(now);
        } catch (e) {
          console.warn("Failed to auto-save listing draft to localStorage:", e);
        }
      }, debounceMs);
    },
    [storageKey, debounceMs]
  );

  const updateField = useCallback(
    <K extends keyof CreateListingInput>(key: K, value: CreateListingInput[K]) => {
      const updated = { ...draftRef.current, [key]: value };
      draftRef.current = updated;
      setDraft(updated);
      setIsDirty(true);
      triggerDebouncedLocalSave(updated, draftIdRef.current);
    },
    [triggerDebouncedLocalSave]
  );

  const setDraftData = useCallback(
    (data: Partial<CreateListingInput>) => {
      const updated = { ...draftRef.current, ...data };
      draftRef.current = updated;
      setDraft(updated);
      setIsDirty(true);
      triggerDebouncedLocalSave(updated, draftIdRef.current);
    },
    [triggerDebouncedLocalSave]
  );

  const restoreLocalDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        const parsed: StoredDraftData = JSON.parse(stored);
        if (parsed && parsed.formData) {
          const restored = {
            ...DEFAULT_DRAFT,
            ...parsed.formData,
          };
          draftRef.current = restored;
          setDraft(restored);
          if (parsed.draftId) {
            setDraftId(parsed.draftId);
            draftIdRef.current = parsed.draftId;
          }
          if (parsed.lastSavedAt) {
            setLastSavedAt(new Date(parsed.lastSavedAt));
          }
          setHasLocalDraft(false);
          setIsDirty(true);
        }
      }
    } catch (e) {
      console.warn("Failed to restore draft from localStorage:", e);
    }
  }, [storageKey]);

  const discardLocalDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      localStorage.removeItem(storageKey);
      setHasLocalDraft(false);
      setLocalDraftSummary(null);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const clearDraft = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore
    }
    draftRef.current = DEFAULT_DRAFT;
    setDraft(DEFAULT_DRAFT);
    setDraftId(null);
    draftIdRef.current = null;
    setIsDirty(false);
    setHasLocalDraft(false);
    setLocalDraftSummary(null);
    setLastSavedAt(null);
  }, [storageKey]);

  const saveToCloud = useCallback(async () => {
    setIsSaving(true);
    try {
      const currentDraft = draftRef.current;
      const currentId = draftIdRef.current || undefined;

      const savedListing = await directoryService.saveDraft(currentDraft, currentId);

      if (savedListing && savedListing.id) {
        setDraftId(savedListing.id);
        const now = new Date();
        setLastSavedAt(now);
        setIsDirty(false);

        // Update local storage with new cloud draft id
        const payload: StoredDraftData = {
          formData: currentDraft,
          draftId: savedListing.id,
          lastSavedAt: now.toISOString(),
        };
        localStorage.setItem(storageKey, JSON.stringify(payload));
      }

      return savedListing;
    } finally {
      setIsSaving(false);
    }
  }, [storageKey]);

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
    saveToCloud,
  };
}
