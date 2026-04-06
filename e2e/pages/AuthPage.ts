import { expect, Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class AuthPage extends BasePage {
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly fullNameInput: Locator;
  readonly loginSubmitButton: Locator;
  readonly signupSubmitButton: Locator;
  readonly switchToSignupButton: Locator;
  readonly switchToLoginButton: Locator;
  readonly errorMessage: Locator;
  readonly otpInput: Locator;
  readonly verifyButton: Locator;

  constructor(page: Page) {
    super(page);
    const dialog = page.locator('[role="dialog"]');
    
    this.emailInput = dialog.locator('input[type="email"]');
    this.passwordInput = dialog.locator('input[type="password"]');
    this.fullNameInput = dialog.getByPlaceholder(/John Doe|Name/i);
    
    this.loginSubmitButton = dialog.locator('button[type="submit"]', { hasText: /Log in|Войти/i });
    this.signupSubmitButton = dialog.locator('button[type="submit"]', { hasText: /Create Account|Register|Sign up|Зарегистрироваться/i });
    
    this.switchToSignupButton = dialog.locator('button', { hasText: /Create Account|Register|Sign up|Зарегистрироваться/i }).filter({ hasNot: dialog.locator('[type="submit"]') });
    this.switchToLoginButton = dialog.locator('button', { hasText: /Log in|Войти/i }).filter({ hasNot: dialog.locator('[type="submit"]') });
    
    this.errorMessage = dialog.locator('.bg-red-50.text-red-600, [role="alert"]').first();
    this.otpInput = dialog.locator('#otp-input');
    this.verifyButton = dialog.locator('button', { hasText: /Verify/i });
  }

  /** Perform login flow */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    // Wait for the auth response to ensure the action completed
    const responsePromise = this.page.waitForResponse(resp => 
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null); // Ignore timeout if it happens (e.g. if click fails)

    await this.loginSubmitButton.click();
    await responsePromise;
    
    // Give some time for AuthContext state to update and closeModal to be called
    await this.page.waitForTimeout(1000);
  }

  /** Perform signup flow (first step) */
  async signup(email: string, password: string, fullName: string) {
    // Check if we are in signup mode by checking if fullNameInput is visible
    if (!await this.fullNameInput.isVisible()) {
      await this.switchToSignupButton.click();
      await expect(this.fullNameInput).toBeVisible();
    }
    
    await this.fullNameInput.fill(fullName);
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    
    const responsePromise = this.page.waitForResponse(resp => 
      resp.url().includes('/auth/v1/signup') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await this.signupSubmitButton.click();
    await responsePromise;
    
    await this.page.waitForTimeout(1000);
  }

  /** Verify OTP code */
  async verifyOtp(code: string) {
    await expect(this.otpInput).toBeVisible({ timeout: 10000 });
    await this.otpInput.fill(code);
    
    const responsePromise = this.page.waitForResponse(resp => 
      resp.url().includes('/auth/v1/verify') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await this.verifyButton.click();
    await responsePromise;
    
    await this.page.waitForTimeout(1000);
  }

  /** Assert error message is visible and contains text */
  async assertErrorMessage(message: string | RegExp) {
    await expect(this.errorMessage).toBeVisible({ timeout: 10000 });
    await expect(this.errorMessage).toContainText(message);
  }

  /** Wait for login modal to be closed */
  async assertModalClosed() {
    // Check for common modal headings to be gone
    await expect(this.page.locator('h3:has-text("Welcome back"), h3:has-text("Confirm your email"), h3:has-text("Create an account")')).not.toBeVisible({ timeout: 10000 });
  }
}
