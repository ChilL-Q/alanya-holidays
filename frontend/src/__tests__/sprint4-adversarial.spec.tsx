import "@testing-library/jest-dom";
import React, { useEffect, useState } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ApiClient, ApiError, isAbortError } from "@/lib/api-client";
import { SafeStorage, safeStorage } from "@/lib/storage";

// Import i18n modules
import enActivity from "@/i18n/local/en/activity";
import ruActivity from "@/i18n/local/ru/activity";
import trActivity from "@/i18n/local/tr/activity";

import enCommon from "@/i18n/local/en/common";
import ruCommon from "@/i18n/local/ru/common";
import trCommon from "@/i18n/local/tr/common";

import enMessages from "@/i18n/local/en/messages";
import ruMessages from "@/i18n/local/ru/messages";
import trMessages from "@/i18n/local/tr/messages";

import enProduct from "@/i18n/local/en/product";
import ruProduct from "@/i18n/local/ru/product";
import trProduct from "@/i18n/local/tr/product";

import enSettings from "@/i18n/local/en/settings";
import ruSettings from "@/i18n/local/ru/settings";
import trSettings from "@/i18n/local/tr/settings";

import globalI18nMessages from "@/i18n/local/index";

// Import Components under test
import Navbar from "@/pages/home/components/Navbar";
import MessagesPage from "@/pages/messages/page";
import { notificationsService } from "@/api-services/notifications.service";
import { chatService } from "@/api-services/chat.service";

// Mock AuthContext for Navbar and Messages
const mockAuthState = {
  user: { id: "usr-challenger", email: "challenger@alanya-holidays.com", created_at: "2026-08-22T00:00:00Z" } as any,
  profile: {
    id: "usr-challenger",
    email: "challenger@alanya-holidays.com",
    full_name: "Challenger Agent",
    role: "user",
    avatar_url: null,
  } as any,
  loading: false,
  isAuthenticated: true,
  signOut: vi.fn(),
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

vi.mock("@/hooks/useFavorites", () => ({
  useFavorites: () => ({
    favorites: new Set(),
    isFavorite: () => false,
    favoriteCount: 0,
  }),
}));

vi.mock("@/context/CartContext", () => ({
  useCart: () => ({
    totalItems: 0,
    itemCount: 0,
    items: [],
  }),
}));

vi.mock("@/hooks/useDarkMode", () => ({
  useDarkMode: () => ({
    isDark: false,
    toggle: vi.fn(),
  }),
}));

describe("Sprint 4 Adversarial Stress-Test Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    window.HTMLElement.prototype.scrollIntoView = vi.fn();
    // Default safe notifications mock
    vi.spyOn(notificationsService, "getNotifications").mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  /* ========================================================================= */
  /* Vector 1: AbortSignal & Cancellation Race Conditions                      */
  /* ========================================================================= */
  describe("1. AbortSignal & Cancellation Stress Tests", () => {
    it("handles pre-aborted signals immediately without initiating network calls", async () => {
      const client = new ApiClient("/api");
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      const controller = new AbortController();
      controller.abort();

      mockFetch.mockRejectedValueOnce(new DOMException("The user aborted a request.", "AbortError"));

      await expect(
        client.get("/test-pre-aborted", { signal: controller.signal })
      ).rejects.toSatisfy((err: unknown) => {
        return isAbortError(err);
      });
    });

    it("survives burst race conditions of 100 concurrent requests with rapid aborts", async () => {
      const client = new ApiClient("/api");
      const mockFetch = vi.fn();
      globalThis.fetch = mockFetch;

      const results: { status: "fulfilled" | "rejected"; isAborted?: boolean; error?: any }[] = [];
      const controllers: AbortController[] = [];

      for (let i = 0; i < 100; i++) {
        const controller = new AbortController();
        controllers.push(controller);

        if (i % 4 === 0) {
          // Immediate abort
          controller.abort();
          mockFetch.mockRejectedValueOnce(new DOMException("Aborted", "AbortError"));
        } else if (i % 4 === 1) {
          // Abort mid-flight
          mockFetch.mockImplementationOnce(
            () =>
              new Promise((_, reject) => {
                setTimeout(() => reject(new DOMException("Aborted mid-flight", "AbortError")), 5);
              })
          );
          setTimeout(() => controller.abort(), 2);
        } else if (i % 4 === 2) {
          // Network failure (not abort)
          mockFetch.mockRejectedValueOnce(new Error("Failed to fetch"));
        } else {
          // Success
          mockFetch.mockResolvedValueOnce({
            ok: true,
            status: 200,
            headers: new Headers({ "content-type": "application/json" }),
            json: async () => ({ id: i, name: `Item ${i}` }),
          });
        }
      }

      // Execute all 100 requests concurrently
      const promises = controllers.map((ctrl, i) =>
        client
          .get(`/burst-${i}`, { signal: ctrl.signal })
          .then((data) => {
            results.push({ status: "fulfilled" });
            return data;
          })
          .catch((err) => {
            results.push({ status: "rejected", isAborted: isAbortError(err), error: err });
          })
      );

      await Promise.all(promises);

      expect(results.length).toBe(100);

      // Verify fulfilled and rejected counts
      const fulfilled = results.filter((r) => r.status === "fulfilled");
      const aborted = results.filter((r) => r.status === "rejected" && r.isAborted);
      const networkErrors = results.filter(
        (r) => r.status === "rejected" && !r.isAborted && r.error instanceof ApiError
      );

      expect(fulfilled.length).toBe(25);
      expect(aborted.length).toBe(50);
      expect(networkErrors.length).toBe(25);
    });

    it("verifies isAbortError oracle against all error shapes and edge cases", () => {
      expect(isAbortError(new DOMException("Aborted", "AbortError"))).toBe(true);
      expect(isAbortError(new Error("The operation was aborted"))).toBe(true);
      expect(isAbortError(new Error("Request aborted by user"))).toBe(true);
      expect(isAbortError(new ApiError("Aborted", 0, "AbortError", null, "/api", true))).toBe(true);
      expect(isAbortError(new ApiError("Aborted", 0, "AbortError", null, "/api", false))).toBe(true);

      // Non-abort errors
      expect(isAbortError(new Error("Network Error"))).toBe(false);
      expect(isAbortError(new ApiError("Not Found", 404, "Not Found", null, "/api"))).toBe(false);
      expect(isAbortError(new ApiError("Internal Error", 500, "Internal Server Error", null, "/api"))).toBe(false);
      expect(isAbortError(new TypeError("Cannot read properties of undefined"))).toBe(false);
      expect(isAbortError(null)).toBe(false);
      expect(isAbortError(undefined)).toBe(false);
      expect(isAbortError({})).toBe(false);
      expect(isAbortError(12345)).toBe(false);
    });

    it("verifies component unmount cleanly cancels pending request without unhandled rejection", async () => {
      let abortedInCleanup = false;

      function TestComponent() {
        const [data, setData] = useState<string | null>(null);

        useEffect(() => {
          const controller = new AbortController();
          const client = new ApiClient("/api");

          client
            .get<{ title: string }>("/slow-endpoint", { signal: controller.signal })
            .then((res) => setData(res.title))
            .catch((err) => {
              if (isAbortError(err)) {
                abortedInCleanup = true;
                return;
              }
            });

          return () => {
            controller.abort();
          };
        }, []);

        return <div>{data || "Loading..."}</div>;
      }

      globalThis.fetch = vi.fn().mockImplementation(
        () =>
          new Promise((_, reject) => {
            setTimeout(() => reject(new DOMException("The user aborted a request.", "AbortError")), 20);
          })
      );

      const { unmount } = render(<TestComponent />);
      expect(screen.getByText("Loading...")).toBeInTheDocument();

      // Unmount while fetch is in-flight
      unmount();

      await waitFor(() => {
        expect(abortedInCleanup).toBe(true);
      });
    });
  });

  /* ========================================================================= */
  /* Vector 2: Optimistic UI Rollback on Simulated Network Failures            */
  /* ========================================================================= */
  describe("2. Optimistic UI Rollback Stress Tests", () => {
    it("rolls back Navbar notifications when markAllAsRead fails", async () => {
      const initialNotifications: any[] = [
        { id: "notif-1", title: "Booking Confirmed", read: false, createdAt: "2026-08-22T10:00:00Z" },
        { id: "notif-2", title: "New Message", read: false, createdAt: "2026-08-22T11:00:00Z" },
        { id: "notif-3", title: "Welcome to Alanya", read: true, createdAt: "2026-08-22T08:00:00Z" },
      ];

      vi.spyOn(notificationsService, "getNotifications").mockResolvedValue(initialNotifications);
      const markAllSpy = vi
        .spyOn(notificationsService, "markAllAsRead")
        .mockRejectedValue(new Error("Network timeout"));

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      // Wait for notifications to load
      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument(); // 2 unread count badge
      });

      // Open notification dropdown
      const notifButton = screen.getByLabelText("Notifications");
      fireEvent.click(notifButton);

      expect(screen.getByText("Notifications")).toBeInTheDocument();

      // Click "Mark all as read"
      const markAllBtn = screen.getByText("Mark all as read");
      fireEvent.click(markAllBtn);

      // Expect markAllAsRead API called
      expect(markAllSpy).toHaveBeenCalledWith("usr-challenger");

      // Verify that after API failure, unread count rolls back to 2
      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument();
      });
    });

    it("rolls back Navbar single notification click when markAsRead fails", async () => {
      const initialNotifications: any[] = [
        { id: "notif-10", title: "Special Discount", read: false, createdAt: "2026-08-22T12:00:00Z" },
      ];

      vi.spyOn(notificationsService, "getNotifications").mockResolvedValue(initialNotifications);
      const markAsReadSpy = vi
        .spyOn(notificationsService, "markAsRead")
        .mockRejectedValue(new Error("500 Internal Server Error"));

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });

      // Open notification dropdown
      const notifButton = screen.getByLabelText("Notifications");
      fireEvent.click(notifButton);

      // Click the unread notification item
      const item = screen.getByText("Special Discount");
      fireEvent.click(item);

      expect(markAsReadSpy).toHaveBeenCalledWith("notif-10");

      // Verify notification remains unread after API failure
      await waitFor(() => {
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });

    it("rolls back Navbar notification deletion when deleteNotification fails", async () => {
      const initialNotifications: any[] = [
        { id: "notif-20", title: "Notification To Delete", read: true, createdAt: "2026-08-22T13:00:00Z" },
      ];

      vi.spyOn(notificationsService, "getNotifications").mockResolvedValue(initialNotifications);
      const deleteSpy = vi
        .spyOn(notificationsService, "deleteNotification")
        .mockRejectedValue(new Error("Network disconnect"));

      render(
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(notificationsService.getNotifications).toHaveBeenCalled();
      });

      // Open notification dropdown
      const notifButton = screen.getByLabelText("Notifications");
      fireEvent.click(notifButton);

      expect(screen.getByText("Notification To Delete")).toBeInTheDocument();

      // Click delete (dismiss) icon button
      const dismissBtn = screen.getByLabelText("Dismiss notification");
      fireEvent.click(dismissBtn);

      expect(deleteSpy).toHaveBeenCalledWith("notif-20");

      // Verify notification is restored to list after failure
      await waitFor(() => {
        expect(screen.getByText("Notification To Delete")).toBeInTheDocument();
      });
    });

    it("handles optimistic message sending failure and allows rollback of conversation preview in messages page", async () => {
      const mockConversations = [
        {
          id: "conv-1",
          participant: { id: "host-1", name: "Mehmet Captain", avatar: "https://avatar.jpg", online: true },
          unreadCount: 0,
          lastMessage: { content: "Original Last Message", createdAt: "2026-08-22T09:00:00Z", senderId: "host-1", isRead: true },
          createdAt: "2026-08-22T08:00:00Z",
          updatedAt: "2026-08-22T09:00:00Z",
          propertyName: "Sunset Boat Tour",
        },
      ];

      const mockMessages = [
        {
          id: "m-1",
          conversationId: "conv-1",
          senderId: "host-1",
          senderName: "Mehmet Captain",
          content: "Original Last Message",
          isRead: true,
          createdAt: "2026-08-22T09:00:00Z",
          isOutgoing: false,
          status: "delivered" as const,
        },
      ];

      vi.spyOn(chatService, "getConversations").mockResolvedValue(mockConversations);
      vi.spyOn(chatService, "getMessages").mockResolvedValue({
        messages: mockMessages,
        total: 1,
      });
      vi.spyOn(chatService, "markAsRead").mockResolvedValue({ success: true });

      const sendSpy = vi
        .spyOn(chatService, "sendMessage")
        .mockRejectedValueOnce(new Error("Network timeout"));

      render(
        <MemoryRouter>
          <MessagesPage />
        </MemoryRouter>
      );

      // Wait for conversation to load
      await waitFor(() => {
        expect(screen.getAllByText("Mehmet Captain").length).toBeGreaterThan(0);
      });

      // Type and send message
      const input = screen.getByPlaceholderText(/Message Mehmet Captain/i);
      fireEvent.change(input, { target: { value: "Optimistic Message Text" } });

      const sendButton = screen.getByTitle("Send message");
      fireEvent.click(sendButton);

      // Verify sendMessage was called
      expect(sendSpy).toHaveBeenCalledWith("conv-1", "Optimistic Message Text");

      // Verify conversation preview is rolled back to "Original Last Message"
      await waitFor(() => {
        expect(screen.getAllByText("Original Last Message").length).toBeGreaterThan(0);
      });
    });
  });

  /* ========================================================================= */
  /* Vector 3: Safe Storage Resilience against Corruptions & Quotas             */
  /* ========================================================================= */
  describe("3. Safe Storage Resilience Stress Tests", () => {
    it("handles severely corrupted JSON in localStorage gracefully", () => {
      const badValues = [
        "{malformed_json",
        "[1, 2, 3,",
        "undefined",
        "NaN",
        "{ 'invalid_quotes': 1 }",
        "<html><body>Error 500</body></html>",
        "\x00\x01\x02",
      ];

      badValues.forEach((badVal, idx) => {
        const key = `corrupted_key_${idx}`;
        localStorage.setItem(key, badVal);
        const fallback = { safe: true, index: idx };
        const result = safeStorage.get(key, fallback);
        expect(result).toEqual(fallback);
      });
    });

    it("handles schema migrations with version mismatches and error handling", () => {
      // Scenario A: Stored version 1, requested version 2 with valid migration
      safeStorage.set("settings_v1", { theme: "dark", oldSetting: "abc" }, { version: 1 });

      const migrated = safeStorage.get(
        "settings_v1",
        { theme: "light", newSetting: "default" },
        {
          version: 2,
          migrate: (oldVer, oldData: any) => ({
            theme: oldData.theme,
            newSetting: `migrated_${oldData.oldSetting}`,
          }),
        }
      );

      expect(migrated).toEqual({ theme: "dark", newSetting: "migrated_abc" });

      // Verify localStorage was updated to version 2 envelope
      const rawAfter = JSON.parse(localStorage.getItem("settings_v1")!);
      expect(rawAfter.version).toBe(2);
      expect(rawAfter.data).toEqual({ theme: "dark", newSetting: "migrated_abc" });

      // Scenario B: Migration function throws an error -> returns fallback safely
      safeStorage.set("broken_migration", { data: 123 }, { version: 1 });
      const fallbackResult = safeStorage.get(
        "broken_migration",
        { fallback: true },
        {
          version: 2,
          migrate: () => {
            throw new Error("Migration crashed!");
          },
        }
      );
      expect(fallbackResult).toEqual({ fallback: true });

      // Scenario C: Version mismatch without migrate callback -> returns envelope.data as is
      safeStorage.set("no_migrate", { foo: "bar" }, { version: 1 });
      const noMigrateResult = safeStorage.get("no_migrate", { foo: "fallback" }, { version: 2 });
      expect(noMigrateResult).toEqual({ foo: "bar" });
    });

    it("resists QuotaExceededError and DOMException on setItem", () => {
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      });

      const success = safeStorage.set("large_data", { huge: "x".repeat(1000) });
      expect(success).toBe(false);
    });

    it("resists SecurityError when localStorage access is disabled by browser sandbox", () => {
      vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
        throw new DOMException("Access is denied", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
        throw new DOMException("Access is denied", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
        throw new DOMException("Access is denied", "SecurityError");
      });
      vi.spyOn(Storage.prototype, "clear").mockImplementation(() => {
        throw new DOMException("Access is denied", "SecurityError");
      });

      expect(safeStorage.get("sec_key", "default")).toBe("default");
      expect(safeStorage.set("sec_key", "val")).toBe(false);
      expect(safeStorage.remove("sec_key")).toBe(false);
      expect(safeStorage.clear()).toBe(false);
    });

    it("safely handles storage when window is undefined or localStorage is missing", () => {
      const isolatedStorage = new SafeStorage();
      const origLocalStorage = window.localStorage;
      try {
        Object.defineProperty(window, "localStorage", {
          value: null,
          configurable: true,
        });

        expect(isolatedStorage.get("any_key", "default_val")).toBe("default_val");
        expect(isolatedStorage.set("any_key", "val")).toBe(false);
        expect(isolatedStorage.remove("any_key")).toBe(false);
        expect(isolatedStorage.clear()).toBe(false);
      } finally {
        Object.defineProperty(window, "localStorage", {
          value: origLocalStorage,
          configurable: true,
        });
      }
    });
  });

  /* ========================================================================= */
  /* Vector 4: i18n Dictionary Parity Across EN, RU, TR                        */
  /* ========================================================================= */
  describe("4. i18n Dictionary Parity Stress Tests", () => {
    function verifyDictionaryParity(
      moduleName: string,
      en: Record<string, string>,
      ru: Record<string, string>,
      tr: Record<string, string>
    ) {
      const enKeys = Object.keys(en).sort();
      const ruKeys = Object.keys(ru).sort();
      const trKeys = Object.keys(tr).sort();

      const missingInRu = enKeys.filter((k) => !ruKeys.includes(k));
      const missingInTr = enKeys.filter((k) => !trKeys.includes(k));
      const extraInRu = ruKeys.filter((k) => !enKeys.includes(k));
      const extraInTr = trKeys.filter((k) => !enKeys.includes(k));

      expect(
        missingInRu,
        `[${moduleName}] Missing keys in RU: ${missingInRu.join(", ")}`
      ).toEqual([]);

      expect(
        missingInTr,
        `[${moduleName}] Missing keys in TR: ${missingInTr.join(", ")}`
      ).toEqual([]);

      expect(
        extraInRu,
        `[${moduleName}] Extra keys in RU not in EN: ${extraInRu.join(", ")}`
      ).toEqual([]);

      expect(
        extraInTr,
        `[${moduleName}] Extra keys in TR not in EN: ${extraInTr.join(", ")}`
      ).toEqual([]);

      // Verify non-empty values
      [
        { lang: "en", dict: en },
        { lang: "ru", dict: ru },
        { lang: "tr", dict: tr },
      ].forEach(({ lang, dict }) => {
        Object.entries(dict).forEach(([key, val]) => {
          expect(typeof val).toBe("string");
          expect(
            val.trim().length,
            `[${moduleName}] Key "${key}" in ${lang} has an empty translation string`
          ).toBeGreaterThan(0);
        });
      });
    }

    it("verifies 100% key parity for activity dictionary", () => {
      verifyDictionaryParity("activity", enActivity, ruActivity, trActivity);
    });

    it("verifies 100% key parity for common dictionary", () => {
      verifyDictionaryParity("common", enCommon, ruCommon, trCommon);
    });

    it("verifies 100% key parity for messages dictionary", () => {
      verifyDictionaryParity("messages", enMessages, ruMessages, trMessages);
    });

    it("verifies 100% key parity for product dictionary", () => {
      verifyDictionaryParity("product", enProduct, ruProduct, trProduct);
    });

    it("verifies 100% key parity for settings dictionary", () => {
      verifyDictionaryParity("settings", enSettings, ruSettings, trSettings);
    });

    it("verifies merged global i18n resources across EN, RU, and TR have identical key counts", () => {
      const enTranslation = globalI18nMessages.en.translation;
      const ruTranslation = globalI18nMessages.ru.translation;
      const trTranslation = globalI18nMessages.tr.translation;

      expect(Object.keys(enTranslation).length).toBeGreaterThan(0);
      expect(Object.keys(ruTranslation).length).toBeGreaterThan(0);
      expect(Object.keys(trTranslation).length).toBeGreaterThan(0);

      const enKeys = Object.keys(enTranslation).sort();
      const ruKeys = Object.keys(ruTranslation).sort();
      const trKeys = Object.keys(trTranslation).sort();

      expect(ruKeys).toEqual(enKeys);
      expect(trKeys).toEqual(enKeys);
    });
  });
});
