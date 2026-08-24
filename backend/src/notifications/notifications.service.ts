import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Server } from 'socket.io';
import { randomUUID } from 'crypto';
import {
  INotificationsRepository,
  NOTIFICATIONS_REPOSITORY,
} from './domain/repositories/notifications.repository.interface';

export interface NotificationPayload {
  /**
   * Известные значения: NEW_BOOKING, BOOKING_STATUS_CHANGED, BOOKING_CANCELLED,
   * NEW_MESSAGE, SYSTEM, COMMUNITY, FORUM_REPLY, FORUM_COMMENT, FORUM_LIKE,
   * FORUM_COMMENT_LIKE, BLOG_REPLY, BLOG_COMMENT, BLOG_LIKE.
   * Допустимы и произвольные строки (колонка type в БД — TEXT).
   */
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string | null;
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

  constructor(
    @Optional()
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository?: INotificationsRepository,
  ) {}

  setServer(server: Server) {
    this.server = server;
  }

  async notifyUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<LiveNotification> {
    let notification: LiveNotification;

    // 1. Persist notification to database via repository
    if (this.notificationsRepository) {
      try {
        notification = await this.notificationsRepository.create({
          userId,
          type: payload.type,
          title: payload.title,
          message: payload.message,
          data: payload.data,
          link: payload.link,
        });
      } catch (err) {
        this.logger.error(
          `Failed to persist notification for user ${userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
        notification = {
          id: randomUUID(),
          userId,
          read: false,
          createdAt: new Date().toISOString(),
          ...payload,
        };
      }
    } else {
      notification = {
        id: randomUUID(),
        userId,
        read: false,
        createdAt: new Date().toISOString(),
        ...payload,
      };
    }

    // 2. Emit real-time WebSocket event if server connected
    if (this.server) {
      this.server.to(`user:${userId}`).emit('notification', notification);
      this.logger.log(
        `Emitted live notification to user:${userId} (${notification.type})`,
      );
    }

    return notification;
  }

  async getUserNotifications(userId: string): Promise<LiveNotification[]> {
    if (this.notificationsRepository) {
      return this.notificationsRepository.findByUserId(userId);
    }
    return [];
  }

  async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    if (this.notificationsRepository) {
      return this.notificationsRepository.markAsRead(userId, notificationId);
    }
    return false;
  }

  async markAllAsRead(userId: string): Promise<number> {
    if (this.notificationsRepository) {
      return this.notificationsRepository.markAllAsRead(userId);
    }
    return 0;
  }

  async deleteNotification(
    userId: string,
    notificationId: string,
  ): Promise<boolean> {
    if (this.notificationsRepository) {
      return this.notificationsRepository.delete(userId, notificationId);
    }
    return false;
  }
}
