import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { SupabaseService } from '../supabase/supabase.service';
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

  constructor(
    @Optional()
    @Inject(NOTIFICATIONS_REPOSITORY)
    private readonly notificationsRepository?: INotificationsRepository,
    @Optional()
    private readonly supabaseService?: SupabaseService,
  ) {}

  async notifyUser(
    userId: string,
    payload: NotificationPayload,
  ): Promise<LiveNotification> {
    // 1. Persist notification to database via repository
    if (this.notificationsRepository) {
      try {
        return await this.notificationsRepository.create({
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
      }
    }

    return {
      id: randomUUID(),
      userId,
      read: false,
      createdAt: new Date().toISOString(),
      ...payload,
    };
  }

  /**
   * Уведомить всех администраторов. Единственный владелец инварианта
   * «кто админы» — handlers и другие модули не запрашивают profiles сами.
   * Никогда не бросает: сбой резолвинга админов или записи логируется.
   */
  async notifyAdmins(
    payload: NotificationPayload,
  ): Promise<LiveNotification[]> {
    const adminIds = await this.getAdminIds();
    return Promise.all(
      adminIds.map((adminId) => this.notifyUser(adminId, payload)),
    );
  }

  private async getAdminIds(): Promise<string[]> {
    if (!this.supabaseService) return [];
    try {
      const { data, error } = await this.supabaseService
        .getClient()
        .from('profiles')
        .select('id')
        .eq('role', 'admin');

      if (error) throw new Error(error.message);
      return (data ?? []).map((row) => row.id);
    } catch (err) {
      this.logger.error(
        `Failed to resolve admin ids: ${err instanceof Error ? err.message : String(err)}`,
      );
      return [];
    }
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
