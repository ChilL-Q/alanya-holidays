import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  notificationsService,
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  formatNotificationTime,
  mockNotifications,
  type AppNotification,
} from "./notifications.service";
import { apiClient } from "@/lib/api-client";

describe("notifications.service", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("formatNotificationTime", () => {
    it("should return 'Just now' for dates less than 1 minute ago", () => {
      const justNow = new Date(Date.now() - 30 * 1000).toISOString();
      expect(formatNotificationTime(justNow)).toBe("Just now");
    });

    it("should return minutes ago for dates less than 1 hour ago", () => {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      expect(formatNotificationTime(tenMinsAgo)).toBe("10m ago");
    });

    it("should return hours ago for dates less than 24 hours ago", () => {
      const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(threeHoursAgo)).toBe("3h ago");
    });

    it("should return 'Yesterday' for dates between 24 and 48 hours ago", () => {
      const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(yesterday)).toBe("Yesterday");
    });

    it("should return days ago for dates between 2 and 7 days ago", () => {
      const fourDaysAgo = new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString();
      expect(formatNotificationTime(fourDaysAgo)).toBe("4d ago");
    });

    it("should handle null, undefined, or invalid date gracefully", () => {
      expect(formatNotificationTime(undefined)).toBe("");
      expect(formatNotificationTime(null)).toBe("");
      expect(formatNotificationTime("invalid-date-string")).toBe("invalid-date-string");
    });
  });

  describe("getNotifications", () => {
    it("should return mapped notifications from API when successful", async () => {
      const apiResponse: AppNotification[] = [
        {
          id: "notif-100",
          title: "New Booking Request",
          message: "You have a new yacht reservation request",
          type: "booking",
          read: false,
          link: "/planner",
          createdAt: new Date().toISOString(),
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(apiResponse);

      const result = await notificationsService.getNotifications();
      expect(apiClient.get).toHaveBeenCalledWith("/notifications", {
        params: undefined,
      });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("notif-100");
      expect(result[0].type).toBe("booking");
      expect(result[0].read).toBe(false);
    });

    it("should pass userId query param if provided", async () => {
      vi.spyOn(apiClient, "get").mockResolvedValueOnce([]);

      await getNotifications("user-123");
      expect(apiClient.get).toHaveBeenCalledWith("/notifications", {
        params: { userId: "user-123" },
      });
    });

    it("should fallback to mock notifications when API call fails", async () => {
      vi.spyOn(apiClient, "get").mockRejectedValueOnce(new Error("Network Error"));

      const result = await getNotifications();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].id).toBe(mockNotifications[0].id);
      expect(result[0].title).toBe(mockNotifications[0].title);
      expect(result[0]).toHaveProperty("type");
    });

    it("should normalize backend notification payload formats", async () => {
      const rawBackendData = [
        {
          id: "raw-1",
          userId: "u1",
          title: "Booking Update",
          message: "Status changed",
          type: "NEW_BOOKING",
          read: false,
          created_at: "2026-06-01T12:00:00Z",
        },
      ];

      vi.spyOn(apiClient, "get").mockResolvedValueOnce(rawBackendData);

      const result = await getNotifications();
      expect(result[0].id).toBe("raw-1");
      expect(result[0].type).toBe("booking");
      expect(result[0].createdAt).toBe("2026-06-01T12:00:00Z");
    });
  });

  describe("markAsRead", () => {
    it("should call PATCH /notifications/:id/read on API", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const success = await notificationsService.markAsRead("notif-1");
      expect(apiClient.patch).toHaveBeenCalledWith("/notifications/notif-1/read");
      expect(success).toBe(true);
    });

    it("should gracefully update mock state when API fails", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValueOnce(new Error("Offline"));

      const success = await markAsRead("notif-1");
      expect(success).toBe(true);
    });
  });

  describe("markAllAsRead", () => {
    it("should call PATCH /notifications/read-all on API", async () => {
      vi.spyOn(apiClient, "patch").mockResolvedValueOnce({ success: true });

      const success = await notificationsService.markAllAsRead("user-999");
      expect(apiClient.patch).toHaveBeenCalledWith("/notifications/read-all", {
        userId: "user-999",
      });
      expect(success).toBe(true);
    });

    it("should gracefully update mock state when API fails", async () => {
      vi.spyOn(apiClient, "patch").mockRejectedValueOnce(new Error("Offline"));

      const success = await markAllAsRead();
      expect(success).toBe(true);
    });
  });

  describe("deleteNotification", () => {
    it("should call DELETE /notifications/:id on API", async () => {
      vi.spyOn(apiClient, "delete").mockResolvedValueOnce({ success: true });

      const success = await notificationsService.deleteNotification("notif-2");
      expect(apiClient.delete).toHaveBeenCalledWith("/notifications/notif-2");
      expect(success).toBe(true);
    });

    it("should gracefully remove from mock state when API fails", async () => {
      vi.spyOn(apiClient, "delete").mockRejectedValueOnce(new Error("Offline"));

      const success = await deleteNotification("notif-2");
      expect(success).toBe(true);
    });
  });
});
