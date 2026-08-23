import { describe, it, expect, beforeEach, vi } from "vitest";
import { safeStorage } from "./storage";

describe("SafeStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("stores and retrieves basic objects with envelope", () => {
    const data = { name: "Alanya Tour", duration: 3 };
    const saved = safeStorage.set("tour", data);
    expect(saved).toBe(true);

    const retrieved = safeStorage.get("tour", null);
    expect(retrieved).toEqual(data);
  });

  it("returns fallback if key does not exist", () => {
    const retrieved = safeStorage.get("non-existent", "default-value");
    expect(retrieved).toBe("default-value");
  });

  it("handles legacy unwrapped JSON items seamlessly", () => {
    localStorage.setItem("legacy_key", JSON.stringify({ legacy: true }));
    const result = safeStorage.get<{ legacy: boolean } | null>("legacy_key", null);
    expect(result).toEqual({ legacy: true });
  });

  it("removes items and clears storage cleanly", () => {
    safeStorage.set("k1", "v1");
    safeStorage.set("k2", "v2");
    expect(safeStorage.get("k1", "")).toBe("v1");

    safeStorage.remove("k1");
    expect(safeStorage.get("k1", "fallback")).toBe("fallback");
    expect(safeStorage.get("k2", "")).toBe("v2");

    safeStorage.clear();
    expect(safeStorage.get("k2", "fallback")).toBe("fallback");
  });

  it("supports schema migration when version changes", () => {
    // Save version 1 data
    safeStorage.set("schema_test", { username: "alex" }, { version: 1 });

    // Read with version 2 and migration function
    const result = safeStorage.get(
      "schema_test",
      { username: "unknown", role: "guest" },
      {
        version: 2,
        migrate: (oldVersion, oldData: any) => ({
          username: oldData.username,
          role: "user",
        }),
      }
    );

    expect(result).toEqual({ username: "alex", role: "user" });

    // Verify it saved migrated version back
    const reRead = safeStorage.get("schema_test", null, { version: 2 });
    expect(reRead).toEqual({ username: "alex", role: "user" });
  });

  it("gracefully catches JSON parse errors and returns fallback", () => {
    localStorage.setItem("corrupted", "{invalid_json");
    const result = safeStorage.get("corrupted", "safe-fallback");
    expect(result).toBe("safe-fallback");
  });

  it("gracefully handles localStorage throws (e.g. quota exceeded or disabled)", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });

    const setRes = safeStorage.set("test_key", "val");
    expect(setRes).toBe(false);
  });
});
