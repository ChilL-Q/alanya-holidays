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
    // Login page uses #login-email, #login-password, and submit button "Sign In"
    this.emailInput = page.locator('#login-email, #register-email');
    this.passwordInput = page.locator('#login-password, #register-password');
    this.fullNameInput = page.locator('#register-name');

    this.loginSubmitButton = page.getByRole('button', { name: /Sign In/i });
    this.signupSubmitButton = page.getByRole('button', { name: /Create Account/i });

    // On register page, "Sign In" link switches to login; on login page, "Register" link switches to register
    this.switchToSignupButton = page.getByRole('link', { name: /Register|Create one/i });
    this.switchToLoginButton = page.getByRole('link', { name: /Sign In|Sign in/i });

    this.errorMessage = page.locator('.bg-accent-100\\/70.text-accent-800, .bg-red-50.text-red-600, [role="alert"]').first();
    this.otpInput = page.locator('#otp-input');
    this.verifyButton = page.getByRole('button', { name: /Verify/i });
  }

  /** Perform login flow */
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);

    const responsePromise = this.page.waitForResponse(resp =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST',
      { timeout: 15000 }
    ).catch(() => null);

    await this.loginSubmitButton.click();
    await responsePromise;

    await this.page.waitForTimeout(1000);
  }

  /** Perform signup flow (first step) */
  async signup(email: string, password: string, fullName: string) {
    // Navigate to register page if not already there
    if (!this.page.url().includes('/register')) {
      await this.page.getByRole('link', { name: /Register|Create one|Join Community/i }).first().click();
      await this.page.waitForURL('**/register');
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

  /** Wait for login page to be done (redirected away from /login) */
  async assertModalClosed() {
    // After successful login, user is redirected away from /login
    await expect(this.page).not.toHaveURL(/\/login/, { timeout: 10000 });
  }
}
