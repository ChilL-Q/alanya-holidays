import { test, expect } from "@playwright/test";
import {
  seedAuthSession,
  mockSupabaseRest,
  setupAuthMocks,
  mockPropertyData,
} from "./utils/mock-utils";

test.describe("Host Property Flow", () => {
  test("should allow host to access list-property page", async ({ page }) => {
    // Mock auth endpoints so AuthContext resolves isLoading quickly
    await setupAuthMocks(page);
    await seedAuthSession(page, { role: "host" });
    await mockSupabaseRest(page, { role: "host" });
    await mockPropertyData(page);

    await page.route("**/rest/v1/properties**", async (route) => {
      if (route.request().method() === "POST") {
        await route.fulfill({
          status: 201,
          body: JSON.stringify([
            { id: "new-prop-1", title: "Beautiful Alanya Apartment" },
          ]),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/list-property");
    await page.waitForLoadState("domcontentloaded");

    // /list-property is a public page (no HostRoute) — accessible to everyone, but only hosts see the form
    await expect(page).toHaveURL("/list-property");
    await expect(page.locator("body")).toContainText(
      /property|listing|title|price/i,
    );
  });

  test("should redirect non-host to home from HostRoute-protected page", async ({
    page,
  }) => {
    await setupAuthMocks(page);
    await seedAuthSession(page, { role: "guest" });
    await mockSupabaseRest(page, { role: "guest" });

    // /host/dashboard is wrapped in HostRoute — guests are redirected to "/"
    await page.goto("/host/dashboard");
    await page.waitForLoadState("domcontentloaded");

    await expect(page).toHaveURL("/");
  });
});
