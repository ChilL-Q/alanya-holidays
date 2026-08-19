import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

const MAX_COMPARE = 4;

interface CompareContextValue {
  selectedIds: Set<string>;
  isSelected: (businessId: string) => boolean;
  toggleSelect: (businessId: string) => void;
  clearSelection: () => void;
  selectedCount: number;
  maxReached: boolean;
}

const CompareContext = createContext<CompareContextValue>({
  selectedIds: new Set(),
  isSelected: () => false,
  toggleSelect: () => {},
  clearSelection: () => {},
  selectedCount: 0,
  maxReached: false,
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const isSelected = useCallback(
    (businessId: string) => selectedIds.has(businessId),
    [selectedIds],
  );

  const toggleSelect = useCallback((businessId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(businessId)) {
        next.delete(businessId);
      } else {
        if (next.size >= MAX_COMPARE) return prev;
        next.add(businessId);
      }
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const value: CompareContextValue = useMemo(
    () => ({
      selectedIds,
      isSelected,
      toggleSelect,
      clearSelection,
      selectedCount: selectedIds.size,
      maxReached: selectedIds.size >= MAX_COMPARE,
    }),
    [selectedIds, isSelected, toggleSelect, clearSelection]
  );

  return (
    <CompareContext.Provider value={value}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare(): CompareContextValue {
  return useContext(CompareContext);
}