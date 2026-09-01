import { apiClient, type RequestOptions } from "@/lib/api-client";
import type { Plan, PlanItem } from "@/hooks/usePlanner";
import type { SharedPlan } from "@/hooks/useSharedPlans";
import { itineraryTemplates, type SuggestedPlan } from "@/domain/itinerary-templates";

export type { SuggestedPlan };

export interface SavedItinerary<P = Record<string, unknown>, I = PlanItem[]> {
  id: string;
  user_id?: string;
  title: string;
  params?: P;
  itinerary: I;
  created_at: string;
  updated_at?: string;
}

export interface CreateItineraryInput<P = Record<string, unknown>, I = PlanItem[]> {
  title: string;
  params?: P;
  itinerary: I;
}

export interface UpdateItineraryInput<P = Record<string, unknown>, I = PlanItem[]> {
  title?: string;
  params?: P;
  itinerary?: I;
}

export interface GetCommunityItinerariesOptions extends RequestOptions {
  category?: string;
  limit?: number;
  offset?: number;
}

const LOCAL_PLANS_STORAGE_KEY = "alanya-planner-plans";
const LOCAL_COMMUNITY_STORAGE_KEY = "alanya-community-plans";

function generateLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `itin-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadLocalPlans(): Plan[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(LOCAL_PLANS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as Plan[];
    }
  } catch {
    // ignore corrupted data
  }
  return [];
}

function saveLocalPlans(plans: Plan[]): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(LOCAL_PLANS_STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // storage full or unavailable
  }
}

function loadLocalCommunityPlans(): SharedPlan[] {
  try {
    if (typeof localStorage === "undefined") return [];
    const raw = localStorage.getItem(LOCAL_COMMUNITY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as SharedPlan[];
    }
  } catch {
    // ignore corrupted data
  }
  return [];
}

function mapPlanToSavedItinerary(plan: Plan): SavedItinerary {
  return {
    id: plan.id,
    title: plan.name,
    params: { description: plan.description },
    itinerary: plan.items,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

function mapSharedPlanToSavedItinerary(shared: SharedPlan): SavedItinerary {
  const itemsWithIds: PlanItem[] = shared.items.map((item, index) => ({
    ...item,
    id: `shared-item-${shared.shareId}-${index}`,
  }));

  return {
    id: shared.shareId,
    title: shared.name,
    params: {
      description: shared.description,
      sharedBy: shared.authorName,
      category: shared.category,
      likes: shared.copyCount,
      forks: shared.copyCount,
    },
    itinerary: itemsWithIds,
    created_at: shared.sharedAt,
  };
}

function mapSuggestedPlanToSavedItinerary(suggested: SuggestedPlan): SavedItinerary {
  const itemsWithIds: PlanItem[] = suggested.items.map((item, index) => ({
    ...item,
    id: `template-item-${suggested.id}-${index}`,
  }));

  return {
    id: suggested.id,
    title: suggested.name,
    params: {
      description: suggested.description,
      category: suggested.category,
      isSuggestedTemplate: true,
    },
    itinerary: itemsWithIds,
    created_at: "2026-06-01T00:00:00Z",
  };
}

export class ItinerariesService {
  /**
   * Saves a new itinerary to the backend or local storage if unauthenticated.
   */
  async saveItinerary<P = Record<string, unknown>, I = PlanItem[]>(
    input: CreateItineraryInput<P, I>
  ): Promise<SavedItinerary<P, I>> {
    try {
      const response = await apiClient.post<SavedItinerary<P, I>>("/itineraries", input);
      if (response && response.id) {
        return response;
      }
    } catch {
      // Unauthenticated or offline fallback to localStorage
    }

    const localId = generateLocalId();
    const now = new Date().toISOString();
    const localPlan: Plan = {
      id: localId,
      name: input.title,
      description:
        input.params && typeof input.params === "object" && "description" in input.params
          ? String(input.params.description)
          : "",
      items: input.itinerary as unknown as PlanItem[],
      createdAt: now,
      updatedAt: now,
    };

    const existingPlans = loadLocalPlans();
    existingPlans.unshift(localPlan);
    saveLocalPlans(existingPlans);

    return mapPlanToSavedItinerary(localPlan) as unknown as SavedItinerary<P, I>;
  }

  /**
   * Retrieves all saved itineraries for the authenticated user (and local drafts).
   */
  async getMyItineraries(options?: RequestOptions): Promise<SavedItinerary[]> {
    let apiItineraries: SavedItinerary[] = [];
    try {
      const data = options
        ? await apiClient.get<SavedItinerary[]>("/itineraries/me", options)
        : await apiClient.get<SavedItinerary[]>("/itineraries/me");
      if (Array.isArray(data)) {
        apiItineraries = data;
      }
    } catch {
      // Unauthenticated or offline
    }

    const localPlans = loadLocalPlans().map(mapPlanToSavedItinerary);
    const existingIds = new Set(apiItineraries.map((it) => it.id));
    const uniqueLocal = localPlans.filter((p) => !existingIds.has(p.id));

    return [...apiItineraries, ...uniqueLocal];
  }

  /**
   * Retrieves a single itinerary by UUID, local ID, or starter template ID.
   */
  async getItineraryById(id: string, options?: RequestOptions): Promise<SavedItinerary | null> {
    try {
      const data = options
        ? await apiClient.get<SavedItinerary>(`/itineraries/${id}`, options)
        : await apiClient.get<SavedItinerary>(`/itineraries/${id}`);
      if (data && data.id) {
        return data;
      }
    } catch {
      // check local or template
    }

    // Search local plans
    const localPlans = loadLocalPlans();
    const foundPlan = localPlans.find((p) => p.id === id);
    if (foundPlan) {
      return mapPlanToSavedItinerary(foundPlan);
    }

    // Search local community plans
    const localCommunity = loadLocalCommunityPlans();
    const foundShared = localCommunity.find((sp) => sp.shareId === id || sp.originalPlanId === id);
    if (foundShared) {
      return mapSharedPlanToSavedItinerary(foundShared);
    }

    // Search starter template presets
    const foundTemplate = itineraryTemplates.find((sp) => sp.id === id);
    if (foundTemplate) {
      return mapSuggestedPlanToSavedItinerary(foundTemplate);
    }

    return null;
  }

  /**
   * Updates an itinerary's title, params, or items.
   */
  async updateItinerary<P = Record<string, unknown>, I = PlanItem[]>(
    id: string,
    input: UpdateItineraryInput<P, I>
  ): Promise<SavedItinerary<P, I> | null> {
    try {
      const response = await apiClient.put<SavedItinerary<P, I>>(`/itineraries/${id}`, input);
      if (response && response.id) {
        return response;
      }
    } catch {
      // Update local storage fallback
    }

    const localPlans = loadLocalPlans();
    const index = localPlans.findIndex((p) => p.id === id);
    if (index !== -1) {
      const existing = localPlans[index];
      const now = new Date().toISOString();
      const updatedPlan: Plan = {
        ...existing,
        name: input.title !== undefined ? input.title : existing.name,
        description:
          input.params && typeof input.params === "object" && "description" in input.params
            ? String(input.params.description)
            : existing.description,
        items: input.itinerary !== undefined ? (input.itinerary as unknown as PlanItem[]) : existing.items,
        updatedAt: now,
      };
      localPlans[index] = updatedPlan;
      saveLocalPlans(localPlans);
      return mapPlanToSavedItinerary(updatedPlan) as unknown as SavedItinerary<P, I>;
    }

    return null;
  }

  /**
   * Deletes an itinerary by UUID or local ID.
   */
  async deleteItinerary(id: string): Promise<boolean> {
    try {
      await apiClient.delete<{ success?: boolean } | boolean>(`/itineraries/${id}`);
    } catch {
      // clean up local plan
    }

    const localPlans = loadLocalPlans();
    const filtered = localPlans.filter((p) => p.id !== id);
    saveLocalPlans(filtered);
    return true;
  }

  /**
   * Retrieves featured / community shared itineraries.
   */
  async getCommunityItineraries(options: GetCommunityItinerariesOptions = {}): Promise<SavedItinerary[]> {
    try {
      const { category, limit, offset, params: extraParams, ...reqConfig } = options;
      const params: Record<string, string | number | undefined> = {};
      if (category && category !== "All") params.category = category;
      if (limit !== undefined) params.limit = limit;
      if (offset !== undefined) params.offset = offset;

      const data = await apiClient.get<SavedItinerary[]>("/itineraries/community", {
        ...reqConfig,
        params: { ...extraParams, ...params },
      });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch {
      // Fall back to starter domain templates
    }

    const localCommunity = loadLocalCommunityPlans();
    let result =
      localCommunity.length > 0
        ? localCommunity.map(mapSharedPlanToSavedItinerary)
        : itineraryTemplates.map(mapSuggestedPlanToSavedItinerary);

    if (options.category && options.category !== "All") {
      result = result.filter(
        (it) =>
          it.params &&
          typeof it.params === "object" &&
          "category" in it.params &&
          it.params.category === options.category
      );
    }

    if (options.limit !== undefined) {
      const offset = options.offset || 0;
      result = result.slice(offset, offset + options.limit);
    }

    return result;
  }
}

export const itinerariesService = new ItinerariesService();

export const saveItinerary = <P = Record<string, unknown>, I = PlanItem[]>(
  input: CreateItineraryInput<P, I>
) => itinerariesService.saveItinerary(input);

export const getMyItineraries = (options?: RequestOptions) =>
  itinerariesService.getMyItineraries(options);

export const getItineraryById = (id: string, options?: RequestOptions) =>
  itinerariesService.getItineraryById(id, options);

export const updateItinerary = <P = Record<string, unknown>, I = PlanItem[]>(
  id: string,
  input: UpdateItineraryInput<P, I>
) => itinerariesService.updateItinerary(id, input);

export const deleteItinerary = (id: string) => itinerariesService.deleteItinerary(id);

export const getCommunityItineraries = (options?: GetCommunityItinerariesOptions) =>
  itinerariesService.getCommunityItineraries(options);
