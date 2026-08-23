import { useState, useEffect, useCallback } from 'react';
import { itinerariesService, type SavedItinerary } from '@/api-services/itineraries.service';
import { logger } from "@/lib/logger";

export interface PlanItem {
  id: string;
  type: 'business' | 'event' | 'custom';
  referenceId?: string;
  customName?: string;
  customDescription?: string;
  image?: string;
  subcategory?: string;
  dayLabel: string;
  timeSlot: string;
  notes: string;
  completed: boolean;
  order: number;
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  items: PlanItem[];
}

const STORAGE_KEY = 'alanya-planner-plans';

function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function loadPlans(): Plan[] {
  try {
    if (typeof localStorage === 'undefined') return [];
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) return parsed as Plan[];
    }
  } catch {
    // corrupted data
  }
  return [];
}

function savePlans(plans: Plan[]): void {
  try {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(plans));
  } catch {
    // storage full
  }
}

function mapSavedItineraryToPlan(itinerary: SavedItinerary): Plan {
  const description =
    itinerary.params && typeof itinerary.params === 'object' && 'description' in itinerary.params
      ? String(itinerary.params.description)
      : '';

  return {
    id: itinerary.id,
    name: itinerary.title,
    description,
    createdAt: itinerary.created_at || new Date().toISOString(),
    updatedAt: itinerary.updated_at || itinerary.created_at || new Date().toISOString(),
    items: Array.isArray(itinerary.itinerary) ? (itinerary.itinerary as PlanItem[]) : [],
  };
}

export function usePlanner() {
  const [plans, setPlans] = useState<Plan[]>(loadPlans);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    savePlans(plans);
  }, [plans]);

  /**
   * Syncs local plans with cloud saved itineraries.
   * Merges server itineraries into local plans without destroying un-synced local changes.
   */
  const syncWithCloud = useCallback(async (): Promise<Plan[]> => {
    setIsSyncing(true);
    try {
      const cloudItineraries = await itinerariesService.getMyItineraries();
      if (Array.isArray(cloudItineraries) && cloudItineraries.length > 0) {
        const cloudPlans = cloudItineraries.map(mapSavedItineraryToPlan);
        setPlans((prev) => {
          const map = new Map<string, Plan>();
          // local plans first
          prev.forEach((p) => map.set(p.id, p));
          // merge cloud plans
          cloudPlans.forEach((cp) => map.set(cp.id, cp));
          return Array.from(map.values());
        });
      }
    } catch (err) {
      logger.warn('Failed to sync plans with cloud:', err);
    } finally {
      setIsSyncing(false);
    }
    return loadPlans();
  }, []);

  /**
   * Saves a specific local plan directly to cloud backend.
   */
  const savePlanToCloud = useCallback(
    async (planId: string): Promise<SavedItinerary | null> => {
      const plan = plans.find((p) => p.id === planId);
      if (!plan) return null;

      try {
        const saved = await itinerariesService.saveItinerary({
          title: plan.name,
          params: { description: plan.description },
          itinerary: plan.items,
        });
        return saved;
      } catch (err) {
        logger.warn(`Failed to save plan '${planId}' to cloud:`, err);
        return null;
      }
    },
    [plans],
  );

  const createPlan = useCallback((name: string, description: string): Plan => {
    const now = new Date().toISOString();
    const plan: Plan = {
      id: generateId(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      items: [],
    };
    setPlans((prev) => [...prev, plan]);

    // Background cloud sync attempt
    itinerariesService
      .saveItinerary({
        title: name,
        params: { description },
        itinerary: [],
      })
      .catch(() => {
        // silent offline fallback
      });

    return plan;
  }, []);

  const updatePlan = useCallback(
    (planId: string, updates: Partial<Pick<Plan, 'name' | 'description'>>) => {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
        ),
      );

      // Background cloud update attempt
      itinerariesService
        .updateItinerary(planId, {
          title: updates.name,
          params: updates.description !== undefined ? { description: updates.description } : undefined,
        })
        .catch(() => {
          // silent offline fallback
        });
    },
    [],
  );

  const deletePlan = useCallback((planId: string) => {
    setPlans((prev) => prev.filter((p) => p.id !== planId));

    // Background cloud delete attempt
    itinerariesService.deleteItinerary(planId).catch(() => {
      // silent offline fallback
    });
  }, []);

  const duplicatePlan = useCallback(
    (planId: string): Plan | null => {
      const existing = plans.find((p) => p.id === planId);
      if (!existing) return null;
      const now = new Date().toISOString();
      const newPlan: Plan = {
        ...existing,
        id: generateId(),
        name: `${existing.name} (Copy)`,
        createdAt: now,
        updatedAt: now,
        items: existing.items.map((i) => ({
          ...i,
          id: generateId(),
        })),
      };
      setPlans((prev) => [...prev, newPlan]);

      // Background cloud save attempt
      itinerariesService
        .saveItinerary({
          title: newPlan.name,
          params: { description: newPlan.description },
          itinerary: newPlan.items,
        })
        .catch(() => {
          // silent offline fallback
        });

      return newPlan;
    },
    [plans],
  );

  const addItem = useCallback((planId: string, item: Omit<PlanItem, 'id'>): PlanItem => {
    const newItem: PlanItem = {
      ...item,
      id: generateId(),
    };
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? { ...p, items: [...p.items, newItem], updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    return newItem;
  }, []);

  const updateItem = useCallback(
    (planId: string, itemId: string, updates: Partial<PlanItem>) => {
      setPlans((prev) =>
        prev.map((p) =>
          p.id === planId
            ? {
                ...p,
                items: p.items.map((i) => (i.id === itemId ? { ...i, ...updates } : i)),
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
    },
    [],
  );

  const removeItem = useCallback((planId: string, itemId: string) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId
          ? {
              ...p,
              items: p.items.filter((i) => i.id !== itemId),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  }, []);

  const reorderItems = useCallback((planId: string, reorderedItems: PlanItem[]) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === planId ? { ...p, items: reorderedItems, updatedAt: new Date().toISOString() } : p,
      ),
    );
  }, []);

  const getPlan = useCallback(
    (planId: string) => plans.find((p) => p.id === planId) || null,
    [plans],
  );

  const getDayLabels = useCallback((planId: string): string[] => {
    const plan = plans.find((p) => p.id === planId);
    if (!plan || plan.items.length === 0) return ['Day 1'];
    const labels = new Set<string>(plan.items.map((i) => i.dayLabel));
    const sorted = Array.from(labels).sort((a: string, b: string) => {
      const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
      const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
      return numA - numB;
    });
    return sorted.length > 0 ? sorted : ['Day 1'];
  }, [plans]);

  return {
    plans,
    isSyncing,
    syncWithCloud,
    savePlanToCloud,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan,
    addItem,
    updateItem,
    removeItem,
    reorderItems,
    getPlan,
    getDayLabels,
  };
}