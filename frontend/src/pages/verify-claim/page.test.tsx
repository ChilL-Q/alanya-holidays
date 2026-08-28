import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { directoryService } from "@/api-services/directory.service";
import { ApiError } from "@/lib/api-client";
import VerifyClaimPage from "./page";

vi.mock("@/api-services/directory.service", () => ({
  directoryService: {
    verifyClaim: vi.fn(),
  },
}));

const verifyClaim = vi.mocked(directoryService.verifyClaim);

function renderPage(token?: string) {
  const fragment = token === undefined ? "" : `#token=${encodeURIComponent(token)}`;
  window.history.replaceState({}, "", `/verify-claim${fragment}`);
  return render(
    <BrowserRouter>
      <VerifyClaimPage />
    </BrowserRouter>
  );
}

describe("VerifyClaimPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    document.querySelector('meta[name="referrer"][data-verify-claim]')?.remove();
  });

  it("scrubs the token from browser history before exchanging it after confirmation", async () => {
    const events: string[] = [];
    const replaceState = vi.spyOn(window.history, "replaceState").mockImplementation((...args) => {
      events.push("scrub");
      return History.prototype.replaceState.apply(window.history, args);
    });
    verifyClaim.mockImplementation(async () => {
      events.push("api");
      return { success: true };
    });

    renderPage("raw+/claim?token");

    expect(window.location.pathname).toBe("/verify-claim");
    expect(window.location.search).toBe("");
    expect(window.location.hash).toBe("");
    expect(verifyClaim).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /confirm email/i }));

    await screen.findByText(/email verified/i);
    expect(events.at(-1)).toBe("api");
    expect(events.slice(0, -1)).not.toContain("api");
    expect(events.slice(0, -1).every((event) => event === "scrub")).toBe(true);
    expect(verifyClaim).toHaveBeenCalledWith("raw+/claim?token");
    replaceState.mockRestore();
  });

  it("ignores a token in the HTTP query string", () => {
    window.history.replaceState({}, "", "/verify-claim?token=query-token");
    render(
      <BrowserRouter>
        <VerifyClaimPage />
      </BrowserRouter>
    );

    expect(screen.getByRole("heading", { name: /invalid verification link/i })).toBeInTheDocument();
    expect(verifyClaim).not.toHaveBeenCalled();
  });

  it("shows an invalid state when no token is present", () => {
    renderPage();

    expect(screen.getByRole("heading", { name: /invalid verification link/i })).toBeInTheDocument();
    expect(verifyClaim).not.toHaveBeenCalled();
  });

  it("does not report success when the backend rejects the token", async () => {
    verifyClaim.mockResolvedValueOnce({ success: false });
    renderPage("claim-token");

    fireEvent.click(screen.getByRole("button", { name: /confirm email/i }));

    expect(
      await screen.findByRole("heading", { name: /invalid verification link/i })
    ).toBeInTheDocument();
  });

  it.each([
    [400, "invalid verification link"],
    [404, "invalid verification link"],
    [410, "verification link expired"],
  ])("maps HTTP %i to the stable %s state", async (status, heading) => {
    verifyClaim.mockRejectedValueOnce(new ApiError("Rejected", status, "Rejected"));
    renderPage("claim-token");

    fireEvent.click(screen.getByRole("button", { name: /confirm email/i }));

    await waitFor(() => {
      expect(screen.getByRole("heading", { name: new RegExp(heading, "i") })).toBeInTheDocument();
    });
  });

  it("sets a no-referrer policy for the page", () => {
    renderPage("claim-token");

    expect(document.querySelector('meta[name="referrer"]')).toHaveAttribute("content", "no-referrer");
  });
});
