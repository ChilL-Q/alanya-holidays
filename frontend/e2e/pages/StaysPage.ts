import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class StaysPage extends BasePage {
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly propertyCard: Locator;
  readonly dateInput: Locator;
  readonly reserveButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder(/Where in Alanya/i);
    this.searchButton = page.locator('button', { hasText: /Search|Поиск/i });
    this.propertyCard = page.locator('a[href*="/property/"]');
    this.dateInput = page.locator('input').filter({ hasText: /Check/i });
    this.reserveButton = page.locator('button').filter({ hasText: /Reserve|Book|Add/i });
  }

  async search(location: string) {
    await this.searchInput.fill(location);
    await this.searchButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async openFirstProperty() {
    await this.propertyCard.first().click();
    await this.page.waitForLoadState('networkidle');
  }

  async addToCart() {
    // Open date picker if needed
    if (await this.dateInput.isVisible()) {
      await this.dateInput.click();
      // Select some dates (simplified for mock environment)
      const availableDates = this.page.locator('.react-datepicker__day:not(.react-datepicker__day--disabled)');
      if (await availableDates.count() > 10) {
        await availableDates.nth(5).click();
        await availableDates.nth(10).click();
      }
    }
    
    await this.reserveButton.click();
    // In our app, adding to cart might trigger a toast or just update localStorage
    await this.page.waitForTimeout(500); 
  }

  async getCartCount(): Promise<number> {
    const cartJson = await this.page.evaluate(() => localStorage.getItem('alanya_cart'));
    const cart = cartJson ? JSON.parse(cartJson) : [];
    return cart.length;
  }
}
