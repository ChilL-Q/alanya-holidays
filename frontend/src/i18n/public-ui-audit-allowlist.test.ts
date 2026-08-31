import { describe, expect, it } from "vitest";
import { PUBLIC_UI_AUDIT_ALLOWLIST } from "./public-ui-audit-allowlist";

describe("public UI audit allowlist", () => {
  it("contains only narrow, reasoned exceptions", () => {
    expect(PUBLIC_UI_AUDIT_ALLOWLIST.length).toBeGreaterThan(0);
    for (const entry of PUBLIC_UI_AUDIT_ALLOWLIST) {
      expect(entry.path.startsWith("src/")).toBe(true);
      expect(entry.reason.trim().length).toBeGreaterThan(20);
      expect(["proper-noun", "technical-token", "non-ui-syntax"]).toContain(entry.category);
    }
  });
});
