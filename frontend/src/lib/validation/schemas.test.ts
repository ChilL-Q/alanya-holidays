import { describe, it, expect } from "vitest";
import { checkoutSchema } from "./checkout.schemas";
import { loginSchema, registerSchema, forgotPasswordSchema } from "./auth.schemas";

describe("Validation Schemas", () => {
  describe("checkoutSchema", () => {
    it("validates valid checkout form data", () => {
      const validData = {
        recipientName: "John Doe",
        recipientEmail: "john@example.com",
        recipientPhone: "+905321234567",
        senderName: "Jane Smith",
        senderEmail: "jane@example.com",
        deliveryDate: "2026-09-01",
        giftMessage: "Happy Holiday!",
      };

      const result = checkoutSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it("rejects empty recipient name", () => {
      const invalidData = {
        recipientName: "",
        recipientEmail: "john@example.com",
        recipientPhone: "+905321234567",
        senderName: "Jane Smith",
        senderEmail: "jane@example.com",
      };

      const result = checkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toContain("recipientName");
      }
    });

    it("rejects invalid email formats", () => {
      const invalidData = {
        recipientName: "John Doe",
        recipientEmail: "not-an-email",
        recipientPhone: "+905321234567",
        senderName: "Jane Smith",
        senderEmail: "jane@example.com",
      };

      const result = checkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });

    it("rejects phone numbers with fewer than 6 characters", () => {
      const invalidData = {
        recipientName: "John Doe",
        recipientEmail: "john@example.com",
        recipientPhone: "123",
        senderName: "Jane Smith",
        senderEmail: "jane@example.com",
      };

      const result = checkoutSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe("loginSchema", () => {
    it("validates correct login credentials", () => {
      const result = loginSchema.safeParse({
        email: "user@example.com",
        password: "securePassword123",
        rememberMe: true,
      });
      expect(result.success).toBe(true);
    });

    it("rejects missing email or password", () => {
      const result = loginSchema.safeParse({
        email: "",
        password: "",
      });
      expect(result.success).toBe(false);
    });

    it("rejects malformed email", () => {
      const result = loginSchema.safeParse({
        email: "invalid-email",
        password: "password123",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("registerSchema", () => {
    it("validates valid registration details", () => {
      const result = registerSchema.safeParse({
        name: "Alanya Resident",
        email: "resident@example.com",
        password: "strongpassword123",
        confirmPassword: "strongpassword123",
      });
      expect(result.success).toBe(true);
    });

    it("rejects passwords shorter than 8 characters", () => {
      const result = registerSchema.safeParse({
        name: "Alanya Resident",
        email: "resident@example.com",
        password: "short",
        confirmPassword: "short",
      });
      expect(result.success).toBe(false);
    });

    it("rejects mismatched passwords", () => {
      const result = registerSchema.safeParse({
        name: "Alanya Resident",
        email: "resident@example.com",
        password: "strongpassword123",
        confirmPassword: "differentpassword456",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toContain("Passwords don't match");
      }
    });
  });

  describe("forgotPasswordSchema", () => {
    it("validates valid email address", () => {
      const result = forgotPasswordSchema.safeParse({
        email: "test@alanya-holidays.com",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty or invalid email", () => {
      expect(forgotPasswordSchema.safeParse({ email: "" }).success).toBe(false);
      expect(forgotPasswordSchema.safeParse({ email: "notanemail" }).success).toBe(false);
    });
  });
});
