import { apiClient } from "@/lib/api-client";
import type { Plan, PlanItem } from "@/hooks/usePlanner";
import type { SharedPlan } from "@/hooks/useSharedPlans";
import { suggestedPlans, type SuggestedPlan } from "@/mocks/suggestedPlans";

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

export interface GetCommunityItinerariesOptions {
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
      authorName: shared.authorName,
      category: shared.category,
      copyCount: shared.copyCount,
      originalPlanId: shared.originalPlanId,
    },
    itinerary: itemsWithIds,
    created_at: shared.sharedAt,
  };
}

function mapSuggestedPlanToSavedItinerary(suggested: SuggestedPlan): SavedItinerary {
  const itemsWithIds: PlanItem[] = suggested.items.map((item, index) => ({
    ...item,
    id: `suggested-item-${suggested.id}-${index}`,
  }));

  return {
    id: suggested.id,
    title: suggested.name,
    params: {
      description: suggested.description,
      category: suggested.category,
    },
    itinerary: itemsWithIds,
    created_at: new Date().toISOString(),
  };
}

export class ItinerariesService {
  /**
   * Saves a user's generated or custom itinerary.
   * If offline or API fails, saves locally and returns fallback SavedItinerary.
   */
  async saveItinerary<P = Record<string, unknown>, I = PlanItem[]>(
    input: CreateItineraryInput<P, I>
  ): Promise<SavedItinerary<P, I>> {
    try {
      const response = await apiClient.post<SavedItinerary<P, I>>("/itineraries", input);
      if (response && response.id) {
        return response;
      }
    } catch (err) {
      console.warn("Failed to save itinerary to API, falling back to local storage:", err);
    }

    // Local fallback
    const now = new Date().toISOString();
    const id = generateLocalId();
    const fallbackItinerary: SavedItinerary<P, I> = {
      id,
      title: input.title,
      params: input.params,
      itinerary: input.itinerary,
      created_at: now,
      updated_at: now,
    };

    // If items match PlanItem structure, persist to local plans
    if (Array.isArray(input.itinerary)) {
      const localPlans = loadLocalPlans();
      const newPlan: Plan = {
        id,
        name: input.title,
        description:
          input.params && typeof input.params === "object" && "description" in input.params
            ? String(input.params.description)
            : "",
        createdAt: now,
        updatedAt: now,
        items: input.itinerary as unknown as PlanItem[],
      };
      localPlans.push(newPlan);
      saveLocalPlans(localPlans);
    }

    return fallbackItinerary;
  }

  /**
   * Lists all itineraries owned by the authenticated user.
   * Falls back to local plans stored in localStorage.
   */
  async getMyItineraries(): Promise<SavedItinerary[]> {
    try {
      const data = await apiClient.get<SavedItinerary[]>("/itineraries/me");
      if (Array.isArray(data)) {
        return data;
      }
    } catch (err) {
      console.warn("Failed to fetch itineraries from API, falling back to local plans:", err);
    }

    const localPlans = loadLocalPlans();
    return localPlans.map(mapPlanToSavedItinerary);
  }

  /**
   * Retrieves a single itinerary by UUID or local ID.
   */
  async getItineraryById(id: string): Promise<SavedItinerary | null> {
    try {
      const data = await apiClient.get<SavedItinerary>(`/itineraries/${id}`);
      if (data && data.id) {
        return data;
      }
    } catch (err) {
      console.warn(`Failed to fetch itinerary '${id}' from API, searching local storage:`, err);
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

    // Search suggested plans
    const foundSuggested = suggestedPlans.find((sp) => sp.id === id);
    if (foundSuggested) {
      return mapSuggestedPlanToSavedItinerary(foundSuggested);
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
    } catch (err) {
      console.warn(`Failed to update itinerary '${id}' via API, falling back to local storage:`, err);
    }

    // Update local plans fallback
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
      const result = await apiClient.delete<{ success?: boolean } | boolean>(`/itineraries/${id}`);
      if (result === true || (result && typeof result === "object" && result.success !== false)) {
        // Also clean up local plan if present
        const localPlans = loadLocalPlans();
        const filtered = localPlans.filter((p) => p.id !== id);
        if (filtered.length !== localPlans.length) {
          saveLocalPlans(filtered);
        }
        return true;
      }
    } catch (err) {
      console.warn(`Failed to delete itinerary '${id}' from API, removing from local storage:`, err);
    }

    // Local fallback deletion
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
      const params: Record<string, string | number | undefined> = {};
      if (options.category) params.category = options.category;
      if (options.limit !== undefined) params.limit = options.limit;
      if (options.offset !== undefined) params.offset = options.offset;

      const data = await apiClient.get<SavedItinerary[]>("/itineraries/community", { params });
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    } catch (err) {
      console.warn("Failed to fetch community itineraries from API, using fallback templates:", err);
    }

    const localCommunity = loadLocalCommunityPlans();
    let result =
      localCommunity.length > 0
        ? localCommunity.map(mapSharedPlanToSavedItinerary)
        : suggestedPlans.map(mapSuggestedPlanToSavedItinerary);

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

export const getMyItineraries = () => itinerariesService.getMyItineraries();

export const getItineraryById = (id: string) => itinerariesService.getItineraryById(id);

export const updateItinerary = <P = Record<string, unknown>, I = PlanItem[]>(
  id: string,
  input: UpdateItineraryInput<P, I>
) => itinerariesService.updateItinerary(id, input);

export const deleteItinerary = (id: string) => itinerariesService.deleteItinerary(id);

export const getCommunityItineraries = (options?: GetCommunityItinerariesOptions) =>
  itinerariesService.getCommunityItineraries(options);
