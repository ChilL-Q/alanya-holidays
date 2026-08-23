import { apiClient, ApiError, type RequestOptions } from "@/lib/api-client";

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
   */
  async getNotifications(userId?: string, options?: RequestOptions): Promise<AppNotification[]> {
    try {
      const params = options?.params ?? (userId ? { userId } : undefined);
      const data = await apiClient.get<RawBackendNotification[]>("/notifications", {
        ...options,
        params,
      });

      if (Array.isArray(data)) {
        return data.map(mapRawNotificationToApp);
      }
      return [];
    } catch (err) {
      if (err instanceof ApiError && (err.status === 401 || err.status === 404)) {
        return [];
      }
      throw err;
    }
  }

  /**
   * Marks a notification as read.
   */
  async markAsRead(id: string): Promise<boolean> {
    await apiClient.patch(`/notifications/${id}/read`);
    return true;
  }

  /**
   * Marks all notifications as read.
   */
  async markAllAsRead(userId?: string): Promise<boolean> {
    const body = userId ? { userId } : undefined;
    await apiClient.patch("/notifications/read-all", body);
    return true;
  }

  /**
   * Deletes / dismisses a single notification.
   */
  async deleteNotification(id: string): Promise<boolean> {
    await apiClient.delete(`/notifications/${id}`);
    return true;
  }
}

export const notificationsService = new NotificationsService();

export const getNotifications = (userId?: string, options?: RequestOptions) =>
  notificationsService.getNotifications(userId, options);

export const markAsRead = (id: string) =>
  notificationsService.markAsRead(id);

export const markAllAsRead = (userId?: string) =>
  notificationsService.markAllAsRead(userId);

export const deleteNotification = (id: string) =>
  notificationsService.deleteNotification(id);

