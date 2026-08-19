import { apiClient, ApiError } from "@/lib/api-client";

export type NotificationType = "booking" | "message" | "community" | "system";

export interface AppNotification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface RawBackendNotification {
  id?: string;
  userId?: string;
  user_id?: string;
  title?: string;
  message?: string;
  type?: string;
  read?: boolean;
  link?: string;
  createdAt?: string;
  created_at?: string;
  data?: Record<string, unknown>;
}

export function normalizeNotificationType(rawType?: string): NotificationType {
  if (!rawType) return "system";
  const upper = rawType.toUpperCase();
  if (upper.includes("BOOKING")) return "booking";
  if (upper.includes("MESSAGE") || upper.includes("CHAT")) return "message";
  if (
    upper.includes("COMMUNITY") ||
    upper.includes("EVENT") ||
    upper.includes("FORUM") ||
    upper.includes("MEMBER")
  ) {
    return "community";
  }
  if (
    rawType === "booking" ||
    rawType === "message" ||
    rawType === "community" ||
    rawType === "system"
  ) {
    return rawType;
  }
  return "system";
}

export const mockNotifications: AppNotification[] = [
  {
    id: "notif-1",
    title: "Booking Confirmed",
    message: "Your reservation for Cleopatra Luxury Villa is confirmed.",
    type: "booking",
    read: false,
    link: "/planner",
    createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 mins ago
  },
  {
    id: "notif-2",
    title: "New Message",
    message: "Captain Mehmet sent you a message regarding Sunset Yacht Tour.",
    type: "message",
    read: false,
    link: "/messages",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
  {
    id: "notif-3",
    title: "Upcoming Community Event",
    message: "Beach Volleyball Tournament starts tomorrow at 10:00 AM.",
    type: "community",
    read: true,
    link: "/events",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
  },
  {
    id: "notif-4",
    title: "Welcome to Alanya Holidays",
    message: "Explore luxury experiences, boat trips, and private villas.",
    type: "system",
    read: true,
    link: "/explore",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
  },
];

let fallbackNotificationsState: AppNotification[] = [...mockNotifications];

export function formatNotificationTime(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    const date = new Date(dateStr);
    const time = date.getTime();
    if (isNaN(time)) return dateStr;

    const now = Date.now();
    const diffMs = Math.max(0, now - time);
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) {
      return "Just now";
    }
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    if (diffHour < 24) {
      return `${diffHour}h ago`;
    }
    if (diffDay === 1) {
      return "Yesterday";
    }
    if (diffDay < 7) {
      return `${diffDay}d ago`;
    }

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateStr;
  }
}

export function mapRawNotificationToApp(raw: RawBackendNotification): AppNotification {
  return {
    id: String(raw.id || `notif-${Math.random().toString(36).slice(2, 9)}`),
    userId: raw.userId || raw.user_id,
    title: raw.title || "Notification",
    message: raw.message || "",
    type: normalizeNotificationType(raw.type),
    read: Boolean(raw.read),
    link: raw.link,
    createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
  };
}

export class NotificationsService {
  /**
   * Retrieves notifications for a user or current authenticated session.
   * Gracefully falls back to mock notifications if offline or backend is unavailable.
   */
  async getNotifications(userId?: string): Promise<AppNotification[]> {
    try {
      const params = userId ? { userId } : undefined;
      const data = await apiClient.get<RawBackendNotification[]>("/notifications", {
        params,
      });

      if (Array.isArray(data) && data.length > 0) {
        return data.map(mapRawNotificationToApp);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        return [...fallbackNotificationsState];
      }
      console.warn("Failed to fetch notifications from API, using fallback:", err);
    }

    return [...fallbackNotificationsState];
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    fallbackNotificationsState = fallbackNotificationsState.map((item) =>
      item.id === id ? { ...item, read: true } : item
    );

    try {
      await apiClient.patch(`/notifications/${id}/read`);
      return true;
    } catch (err) {
      console.warn(`Failed to mark notification ${id} as read on API:`, err);
      return true;
    }
  }

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(userId?: string): Promise<boolean> {
    fallbackNotificationsState = fallbackNotificationsState.map((item) => ({
      ...item,
      read: true,
    }));

    try {
      const body = userId ? { userId } : undefined;
      await apiClient.patch("/notifications/read-all", body);
      return true;
    } catch (err) {
      console.warn("Failed to mark all notifications as read on API:", err);
      return true;
    }
  }

  /**
   * Deletes / dismisses a single notification.
   */
  async deleteNotification(id: string): Promise<boolean> {
    fallbackNotificationsState = fallbackNotificationsState.filter(
      (item) => item.id !== id
    );

    try {
      await apiClient.delete(`/notifications/${id}`);
      return true;
    } catch (err) {
      console.warn(`Failed to delete notification ${id} on API:`, err);
      return true;
    }
  }
}

export const notificationsService = new NotificationsService();

export const getNotifications = (userId?: string) =>
  notificationsService.getNotifications(userId);

export const markAsRead = (id: string) =>
  notificationsService.markAsRead(id);

export const markAllAsRead = (userId?: string) =>
  notificationsService.markAllAsRead(userId);

export const deleteNotification = (id: string) =>
  notificationsService.deleteNotification(id);
