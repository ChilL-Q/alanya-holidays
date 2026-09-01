import { describe, expect, it } from "vitest";
import en from "./local/en/common";
import ru from "./local/ru/common";
import tr from "./local/tr/common";
import messages from "./local/index";

const publicUiKeys = [
  "nav.home",
  "nav.discover",
  "nav.community",
  "nav.shop",
  "nav.blog",
  "nav.search",
  "nav.notifications",
  "nav.cart",
  "nav.newThread",
  "nav.userMenu",
  "nav.languageSelector",
  "nav.myProfile",
  "nav.favorites",
  "nav.merchantDashboard",
  "nav.signIn",
  "nav.joinCommunity",
  "nav.signOut",
  "nav.dismissNotification",
  "nav.noNotifications",
  "nav.notificationsHint",
  "nav.markAllRead",
  "nav.newNotifications",
  "nav.closeMenu",
  "nav.openMenu",
  "nav.adminDashboard",
] as const;

describe("public UI locale completeness", () => {
  it.each([
    ["en", en],
    ["ru", ru],
    ["tr", tr],
  ])("contains every shared public navigation key in %s", (_language, dictionary) => {
    for (const key of publicUiKeys) {
      expect(dictionary[key as keyof typeof dictionary], `${_language} is missing ${key}`).toEqual(
        expect.any(String),
      );
      expect(dictionary[key as keyof typeof dictionary].trim()).not.toBe("");
    }
  });

  it("keeps the public navigation key set identical across locales", () => {
    const keys = publicUiKeys as readonly string[];
    expect(keys.every((key) => key in en && key in ru && key in tr)).toBe(true);
  });

  it("keeps the complete translation resource key set identical across locales", () => {
    const enKeys = Object.keys(messages.en.translation).sort();
    const ruKeys = Object.keys(messages.ru.translation).sort();
    const trKeys = Object.keys(messages.tr.translation).sort();
    expect(ruKeys).toEqual(enKeys);
    expect(trKeys).toEqual(enKeys);
    for (const [language, dictionary] of Object.entries(messages)) {
      for (const key of enKeys) {
        expect(dictionary.translation[key], `${language} is missing ${key}`).toEqual(expect.any(String));
        expect(dictionary.translation[key].trim(), `${language} has blank ${key}`).not.toBe("");
      }
    }
  });

  it("uses the concise Dashboard label for the English merchant navigation entry", () => {
    expect(en["nav.merchantDashboard"]).toBe("Dashboard");
    expect(ru["nav.merchantDashboard"]).not.toBe("Dashboard");
    expect(tr["nav.merchantDashboard"]).not.toBe("Dashboard");
  });
});
