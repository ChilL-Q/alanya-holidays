import { useMemo } from "react";
import {
  directoryService,
  type CreateListingInput,
  type ListingTier,
} from "@/api-services/directory.service";
import { useEntityDraft } from "./useEntityDraft";

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

function hasMeaningfulDraft(data?: Partial<CreateListingInput> | null): boolean {
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

export function hasMeaningfulDraftContent(
  data?: Partial<CreateListingInput> | null,
): boolean {
  return hasMeaningfulDraft(data);
}

export function useListingDraft(options: UseListingDraftOptions = {}) {
  const { userId, initialDraftId = null, initialData = null } = options;

  const storageKey = `alanya_listing_draft_${userId || "guest"}`;

  const defaults = useMemo(
    () => ({ ...DEFAULT_DRAFT, ...(initialData || {}) }),
    // Recompute only when the identity of initialData changes
    [initialData],
  );

  return useEntityDraft<CreateListingInput>({
    storageKey,
    defaults,
    isMeaningful: hasMeaningfulDraft,
    initialDraftId,
    saveToApi: (data, draftId) =>
      directoryService.saveDraft(data as Partial<CreateListingInput>, draftId),
  });
}
