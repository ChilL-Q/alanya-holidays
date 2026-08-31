import type { ReactNode } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { eventsService } from "@/api-services/events.service";
import { useEventsPage } from "./useEventsPage";

function RouterWrapper({ children }: { children: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}

describe("useEventsPage", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("requests only upcoming events for the upcoming events page", async () => {
    const getEvents = vi.spyOn(eventsService, "getEvents").mockResolvedValue([]);

    renderHook(() => useEventsPage(), { wrapper: RouterWrapper });

    await waitFor(() => {
      expect(getEvents).toHaveBeenCalledWith({ upcomingOnly: true });
    });
  });
});
