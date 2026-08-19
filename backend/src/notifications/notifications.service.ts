import { Injectable, Logger } from '@nestjs/common';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';

export interface NotificationPayload {
  type:
    | 'NEW_BOOKING'
    | 'BOOKING_STATUS_CHANGED'
    | 'BOOKING_CANCELLED'
    | 'NEW_MESSAGE'
    | 'SYSTEM'
    | 'COMMUNITY';
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface LiveNotification extends NotificationPayload {
  id: string;
  userId: string;
  read: boolean;
  createdAt: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private server: Server | null = null;
  private readonly userNotificationsMap = new Map<string, LiveNotification[]>();

  setServer(server: Server) {
    this.server = server;
  }

  notifyUser(userId: string, payload: NotificationPayload): LiveNotification {
    const notification: LiveNotification = {
      id: randomUUID(),
      userId,
      read: false,
      createdAt: new Date().toISOString(),
      ...payload,
    };

    // 1. Store in memory (keep last 50 per user)
    const existing = this.userNotificationsMap.get(userId) || [];
    const updated = [notification, ...existing].slice(0, 50);
    this.userNotificationsMap.set(userId, updated);

    // 2. Emit real-time WebSocket event if server connected
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
      this.logger.log(
        `Emitted live notification to user:${userId} (${notification.type})`,
      );
    }

    return notification;
  }

  getUserNotifications(userId: string): LiveNotification[] {
    return this.userNotificationsMap.get(userId) || [];
  }

  markAsRead(userId: string, notificationId: string): boolean {
    const userList = this.userNotificationsMap.get(userId);
    if (!userList) return false;

    const item = userList.find((n) => n.id === notificationId);
    if (item) {
      item.read = true;
      return true;
    }
    return false;
  }

  markAllAsRead(userId: string): number {
    const userList = this.userNotificationsMap.get(userId);
    if (!userList) return 0;

    let count = 0;
    for (const item of userList) {
      if (!item.read) {
        item.read = true;
        count++;
      }
    }
    return count;
  }

  deleteNotification(userId: string, notificationId: string): boolean {
    const userList = this.userNotificationsMap.get(userId);
    if (!userList) return false;

    const initialLength = userList.length;
    const filtered = userList.filter((n) => n.id !== notificationId);
    if (filtered.length !== initialLength) {
      this.userNotificationsMap.set(userId, filtered);
      return true;
    }
    return false;
  }
}
