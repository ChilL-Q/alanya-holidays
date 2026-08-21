import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useListingDraft } from "./useListingDraft";
import { directoryService } from "@/api-services/directory.service";

describe("Adversarial Empirical Verification: useListingDraft Hook", () => {
  const mockUserId = "adversarial-user-999";
  const storageKey = `alanya_listing_draft_${mockUserId}`;
  const guestKey = "alanya_listing_draft_guest";

  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
  });

  describe("1. Corrupted localStorage Resilience & Edge Cases", () => {
    it("handles syntactically malformed JSON in localStorage on mount without crashing", () => {
      localStorage.setItem(storageKey, "{ corrupted_json: true, unterminated: ");

      const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

      expect(result.current.hasLocalDraft).toBe(false);
      expect(result.current.localDraftSummary).toBeNull();
      expect(result.current.draft.name).toBe("");
    });

    it("handles non-object and null JSON payloads in localStorage gracefully", () => {
      localStorage.setItem(storageKey, "null");

      const { result: res1 } = renderHook(() => useListingDraft({ userId: mockUserId }));
      expect(res1.current.hasLocalDraft).toBe(false);

      localStorage.setItem(storageKey, JSON.stringify("plain string"));
      const { result: res2 } = renderHook(() => useListingDraft({ userId: mockUserId }));
      expect(res2.current.hasLocalDraft).toBe(false);

      localStorage.setItem(storageKey, JSON.stringify({}));
      const { result: res3 } = renderHook(() => useListingDraft({ userId: mockUserId }));
      expect(res3.current.hasLocalDraft).toBe(false);
    });

    it("handles corrupted JSON during restoreLocalDraft execution without throwing", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

      // Corrupt localStorage after initialization
      localStorage.setItem(storageKey, "{ malformed: [");

      act(() => {
        expect(() => result.current.restoreLocalDraft()).not.toThrow();
      });

      expect(result.current.draft.name).toBe("");
      warnSpy.mockRestore();
    });

    it("survives localStorage QuotaExceededError during debounced autosave", () => {
      const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
      const originalSetItem = localStorage.setItem.bind(localStorage);

      vi.spyOn(Storage.prototype, "setItem").mockImplementation((key, val) => {
        if (key.includes("alanya_listing_draft")) {
          throw new DOMException("QuotaExceededError: storage is full", "QuotaExceededError");
        }
        originalSetItem(key, val);
      });

      const { result } = renderHook(() => useListingDraft({ userId: mockUserId, debounceMs: 500 }));

      act(() => {
        result.current.updateField("name", "Huge Listing That Exceeds Quota");
      });

      expect(() => {
        act(() => {
          vi.advanceTimersByTime(500);
        });
      }).not.toThrow();

      expect(warnSpy).toHaveBeenCalledWith(
        "Failed to auto-save listing draft to localStorage:",
        expect.any(DOMException)
      );

      warnSpy.mockRestore();
    });
  });

  describe("2. Debounced Autosave Timing & Race Conditions", () => {
    it("batches rapid consecutive keystrokes and only writes the final value once", () => {
      const { result } = renderHook(() => useListingDraft({ userId: mockUserId, debounceMs: 500 }));

      // Simulate typing "ALANYA" across 6 rapid events (50ms apart)
      const letters = ["A", "Al", "Ala", "Alan", "Alany", "Alanya"];
      for (const str of letters) {
        act(() => {
          result.current.updateField("name", str);
          vi.advanceTimersByTime(50);
        });
      }

      // At t = 300ms, timer hasn't fired yet (since each keystroke reset the 500ms timer)
      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance remaining 500ms after last keystroke
      act(() => {
        vi.advanceTimersByTime(500);
      });

      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.formData.name).toBe("Alanya");
    });

    it("cancels pending debounced save when clearDraft is invoked", () => {
      const { result } = renderHook(() => useListingDraft({ userId: mockUserId, debounceMs: 500 }));

      act(() => {
        result.current.updateField("name", "Will Be Cleared");
      });

      // Clear draft at t=200ms before debounce timer fires
      act(() => {
        vi.advanceTimersByTime(200);
        result.current.clearDraft();
      });

      expect(localStorage.getItem(storageKey)).toBeNull();

      // Advance past remaining 300ms
      act(() => {
        vi.advanceTimersByTime(500);
      });

      // Must remain null and not be resurrected by orphaned timer
      expect(localStorage.getItem(storageKey)).toBeNull();
      expect(result.current.draft.name).toBe("");
      expect(result.current.isDirty).toBe(false);
    });

    it("cancels pending debounced save and prevents orphaned writes when unmounted", () => {
      const { result, unmount } = renderHook(() =>
        useListingDraft({ userId: mockUserId, debounceMs: 500 })
      );

      act(() => {
        result.current.updateField("name", "Unmounting In 200ms");
      });

      act(() => {
        vi.advanceTimersByTime(200);
      });

      expect(localStorage.getItem(storageKey)).toBeNull();

      unmount();

      act(() => {
        vi.advanceTimersByTime(500);
      });

      // After unmount, timer must not fire to resurrect or write draft
      expect(localStorage.getItem(storageKey)).toBeNull();
    });
  });

  describe("3. Multi-User & Guest Account Isolation", () => {
    it("uses 'alanya_listing_draft_guest' when userId is null/undefined", () => {
      const { result } = renderHook(() => useListingDraft({ userId: null, debounceMs: 500 }));

      act(() => {
        result.current.updateField("name", "Guest Listing");
        vi.advanceTimersByTime(500);
      });

      expect(localStorage.getItem(guestKey)).not.toBeNull();
      const parsed = JSON.parse(localStorage.getItem(guestKey)!);
      expect(parsed.formData.name).toBe("Guest Listing");
      expect(localStorage.getItem(storageKey)).toBeNull();
    });

    it("isolates drafts between different users", () => {
      const userA = "user-alice";
      const userB = "user-bob";

      localStorage.setItem(
        `alanya_listing_draft_${userA}`,
        JSON.stringify({
          formData: { name: "Alice Restaurant" },
          draftId: "draft-alice",
          lastSavedAt: new Date().toISOString(),
        })
      );

      const { result: resAlice } = renderHook(() => useListingDraft({ userId: userA }));
      expect(resAlice.current.hasLocalDraft).toBe(true);
      expect(resAlice.current.localDraftSummary?.name).toBe("Alice Restaurant");

      const { result: resBob } = renderHook(() => useListingDraft({ userId: userB }));
      expect(resBob.current.hasLocalDraft).toBe(false);
      expect(resBob.current.localDraftSummary).toBeNull();
    });
  });

  describe("4. Cloud Synchronization & Error Recovery", () => {
    it("handles saveToCloud network rejection without hung isSaving state", async () => {
      vi.spyOn(directoryService, "saveDraft").mockRejectedValueOnce(
        new Error("500 Internal Server Error / Database unavailable")
      );

      const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

      act(() => {
        result.current.updateField("name", "Failed Cloud Save");
      });

      await expect(
        act(async () => {
          await result.current.saveToCloud();
        })
      ).rejects.toThrow("500 Internal Server Error");

      // Verify isSaving reset back to false
      expect(result.current.isSaving).toBe(false);
      expect(result.current.draft.name).toBe("Failed Cloud Save");
    });

    it("updates localStorage with cloud draftId after successful saveToCloud", async () => {
      vi.spyOn(directoryService, "saveDraft").mockResolvedValueOnce({
        id: "assigned-cloud-id-456",
        name: "Synced Venue",
        category: "bars",
        status: "draft",
      } as any);

      const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));

      act(() => {
        result.current.updateField("name", "Synced Venue");
      });

      await act(async () => {
        await result.current.saveToCloud();
      });

      expect(result.current.draftId).toBe("assigned-cloud-id-456");
      expect(result.current.isDirty).toBe(false);

      const stored = localStorage.getItem(storageKey);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.draftId).toBe("assigned-cloud-id-456");
      expect(parsed.formData.name).toBe("Synced Venue");
    });
  });

  describe("5. Discard and Restore Lifecycle", () => {
    it("discardLocalDraft removes storage item and resets recovery indicators without mutating current form", () => {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          formData: { name: "Discardable Draft" },
          lastSavedAt: new Date().toISOString(),
        })
      );

      const { result } = renderHook(() => useListingDraft({ userId: mockUserId }));
      expect(result.current.hasLocalDraft).toBe(true);

      act(() => {
        result.current.discardLocalDraft();
      });

      expect(localStorage.getItem(storageKey)).toBeNull();
      expect(result.current.hasLocalDraft).toBe(false);
      expect(result.current.localDraftSummary).toBeNull();
    });
  });
});
