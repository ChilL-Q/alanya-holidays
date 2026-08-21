import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useListingDraft } from "./useListingDraft";
import { directoryService } from "@/api-services/directory.service";

describe("useListingDraft Hook", () => {
  const mockUserId = "user-uuid-123";
  const storageKey = `alanya_listing_draft_${mockUserId}`;

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  it("initializes with empty draft and detects no local draft initially", () => {
    const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

    expect(result.current.draft.name).toBe("");
    expect(result.current.hasLocalDraft).toBe(false);
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftId).toBeNull();
  });

  it("detects existing draft in localStorage on mount", () => {
    const savedData = {
      formData: {
        name: "Restored Beach Cafe",
        category: "restaurants",
        description: "Great beachside coffee.",
      },
      draftId: "cloud-draft-99",
      lastSavedAt: new Date(Date.now() - 60000).toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(savedData));

    const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

    expect(result.current.hasLocalDraft).toBe(true);
    expect(result.current.localDraftSummary?.name).toBe("Restored Beach Cafe");
  });

  it("debounces localStorage saves by 500ms on form field updates", () => {
    const { result } = renderHook(() => useListingDraft({ userId: mockUserId, debounceMs: 500 }));

    act(() => {
      result.current.updateField("name", "Typing Business Name");
    });

    expect(result.current.draft.name).toBe("Typing Business Name");
    expect(result.current.isDirty).toBe(true);
    // Not saved immediately before timer
    expect(localStorage.getItem(storageKey)).toBeNull();

    // Fast-forward debounce timer
    act(() => {
      vi.advanceTimersByTime(500);
    });

    const stored = localStorage.getItem(storageKey);
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.formData.name).toBe("Typing Business Name");
  });

  it("restores draft data from localStorage when restoreLocalDraft is called", () => {
    const savedData = {
      formData: {
        name: "Recovered Venue",
        category: "hotels",
        description: "Cozy boutique hotel.",
        address: "Damlatas 5",
      },
      draftId: "cloud-draft-111",
      lastSavedAt: new Date().toISOString(),
    };

    localStorage.setItem(storageKey, JSON.stringify(savedData));

    const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

    expect(result.current.hasLocalDraft).toBe(true);

    act(() => {
      result.current.restoreLocalDraft();
    });

    expect(result.current.draft.name).toBe("Recovered Venue");
    expect(result.current.draft.category).toBe("hotels");
    expect(result.current.draft.address).toBe("Damlatas 5");
    expect(result.current.draftId).toBe("cloud-draft-111");
    expect(result.current.hasLocalDraft).toBe(false);
  });

  it("clears draft from state and localStorage when clearDraft is called", () => {
    const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

    act(() => {
      result.current.updateField("name", "Temporary Name");
      vi.advanceTimersByTime(500);
    });

    expect(localStorage.getItem(storageKey)).not.toBeNull();

    act(() => {
      result.current.clearDraft();
    });

    expect(localStorage.getItem(storageKey)).toBeNull();
    expect(result.current.draft.name).toBe("");
    expect(result.current.isDirty).toBe(false);
    expect(result.current.draftId).toBeNull();
  });

  it("saves draft to cloud via directoryService.saveDraft and updates draftId", async () => {
    const mockBiz = {
      id: "new-cloud-draft-id",
      name: "Cloud Synced Cafe",
      category: "cafes",
      status: "draft",
    };

    vi.spyOn(directoryService, "saveDraft").mockResolvedValueOnce(mockBiz as any);

    const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

    act(() => {
      result.current.updateField("name", "Cloud Synced Cafe");
    });

    let savedBiz: any;
    await act(async () => {
      savedBiz = await result.current.saveToCloud();
    });

    expect(directoryService.saveDraft).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Cloud Synced Cafe" }),
      undefined
    );
    expect(result.current.draftId).toBe("new-cloud-draft-id");
    expect(result.current.isDirty).toBe(false);
    expect(savedBiz.id).toBe("new-cloud-draft-id");
  });
});
