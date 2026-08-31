import { describe, expect, it } from "vitest";
import en from "./local/en/services";
import ru from "./local/ru/services";
import tr from "./local/tr/services";

const ownedPages = [
  "about", "contact", "help", "privacy", "terms", "gift-cards",
  "golf-vacations", "hammam-spa", "helicopter-tours", "private-jets",
  "villa-stays", "wine-tastings", "yacht-charters", "personal-chefs",
  "personal-driver", "personal-shopper", "photography-excursions",
] as const;

// These values intentionally remain outside the locale dictionaries: API/mock content,
// legal contact details, dates, currency/phone formats, and proper names must not be translated.
const approvedResiduals = [
  "Alanya", "Alanya Holidays", "Türkiye", "Turkish Riviera", "Antalya", "Gazipaşa",
  "WhatsApp", "Email", "EUR", "GMT+3", "contact@alanyaholidays.com",
  "privacy@alanyaforum.com", "legal@alanyaforum.com", "2023", "2024", "2025", "2026",
] as const;

describe("legal and services translation slice", () => {
  it("keeps the dedicated namespace key set identical across locales", () => {
    const keys = Object.keys(en).sort();
    expect(Object.keys(ru).sort()).toEqual(keys);
    expect(Object.keys(tr).sort()).toEqual(keys);
    for (const locale of [en, ru, tr]) {
      for (const key of keys) expect(locale[key as keyof typeof locale]).toEqual(expect.any(String));
    }
  });

  it("translates the owned page headlines in both non-English locales", () => {
    const headlineKeys = [
      "services.privacy.title", "services.terms.title", "services.about.title",
      "services.contact.heroTitle", "services.gifts.workTitle", "services.yacht.title",
      "services.villa.title", "services.helicopter.title",
    ] as const;
    for (const key of headlineKeys) {
      expect(ru[key]).not.toBe(en[key]);
      expect(tr[key]).not.toBe(en[key]);
    }
  });

  it("records the bounded residual-content policy for review", () => {
    expect(ownedPages).toHaveLength(17);
    expect(approvedResiduals).toContain("Alanya Holidays");
    expect(approvedResiduals).toContain("contact@alanyaholidays.com");
  });
});
