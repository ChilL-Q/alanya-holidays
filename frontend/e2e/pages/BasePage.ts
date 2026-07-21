import { Page, Locator, expect } from '@playwright/test';

export class BasePage {
  readonly page: Page;
  readonly cookieAcceptButton: Locator;
  readonly profileButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cookieAcceptButton = page.getByRole('button', { name: /Accept|Принять/i });
    this.profileButton = page.getByTestId('profile-button');
  }

  /** Navigate to a specific path */
  async goto(path: string = '/') {
    await this.page.goto(path);
    // Wait for initial load
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Dismiss cookie banner if it appears */
  async dismissCookieBanner() {
    try {
      if (await this.cookieAcceptButton.isVisible({ timeout: 5000 })) {
        await this.cookieAcceptButton.click();
        await expect(this.cookieAcceptButton).not.toBeVisible();
      }
    } catch (_e) {
      // Banner might not appear, which is fine
    }
  }

  /** Open login modal from navbar */
  async openLoginModal() {
    await this.profileButton.click();
    await this.page.getByText(/Log in|Войти/i).first().click();
    // Wait for modal heading to appear (supports multiple languages)
    await expect(this.page.locator('h3:has-text("Welcome back"), h3:has-text("С возвращением"), h3:has-text("Hoş geldiniz")')).toBeVisible({ timeout: 10000 });
  }

  /** Common navigation helper */
  async navigateTo(label: string) {
    await this.page.getByRole('link', { name: label }).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Wait for a specific timeout (use sparingly) */
  async wait(ms: number) {
    await this.page.waitForTimeout(ms);
  }
}
