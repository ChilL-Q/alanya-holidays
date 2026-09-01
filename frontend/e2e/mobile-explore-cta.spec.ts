import { test, expect, type Locator } from "@playwright/test";

type Rect = { top: number; right: number; bottom: number; left: number };

const readRect = (locator: Locator) =>
  locator.evaluate((element) => {
    const { top, right, bottom, left } = element.getBoundingClientRect();
    return { top, right, bottom, left };
  });

const intersects = (a: Rect, b: Rect) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;

test.describe("Mobile Explore Alanya CTA", () => {
  test("fits above fixed widgets, remains clickable, and keeps desktop pill copy", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto("/");

    const cta = page.getByRole("link", { name: /explore alanya/i });
    const creatorTrigger = page.getByRole("button", {
      name: /open community post widget/i,
    });
    const whatsapp = page.getByRole("link", { name: /chat on whatsapp/i });

    await expect(cta).toBeVisible();
    await expect(creatorTrigger).toBeVisible();
    await expect(whatsapp).toBeVisible();

    const viewport = { width: 320, height: 568 };
    const ctaRect = await readRect(cta);
    expect(ctaRect.left).toBeGreaterThanOrEqual(0);
    expect(ctaRect.top).toBeGreaterThanOrEqual(0);
    expect(ctaRect.right).toBeLessThanOrEqual(viewport.width);
    expect(ctaRect.bottom).toBeLessThanOrEqual(viewport.height);

    const fixedRects = await Promise.all([readRect(creatorTrigger), readRect(whatsapp)]);
    for (const fixedRect of fixedRects) {
      expect(intersects(ctaRect, fixedRect)).toBe(false);
    }

    const hitTarget = await cta.evaluate((element) => {
      const { left, top, width, height } = element.getBoundingClientRect();
      return document.elementFromPoint(left + width / 2, top + height / 2)?.closest("a") === element;
    });
    expect(hitTarget).toBe(true);

    await expect(creatorTrigger).toHaveAttribute("aria-label", /open community post widget/i);
    await expect(creatorTrigger).toHaveCSS("width", "48px");
    await expect(creatorTrigger).toHaveCSS("height", "48px");

    await cta.click();
    await expect(page).toHaveURL(/\/explore$/);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto("/");
    await expect(
      page.getByText(/share with the community/i).first()
    ).toBeVisible();
  });
});
