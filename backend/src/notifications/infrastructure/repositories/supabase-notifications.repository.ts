import { Injectable, Logger } from '@nestjs/common';
import { SupabaseService } from '../../../supabase/supabase.service';
import { LiveNotification } from '../../notifications.service';
import {
  CreateNotificationInput,
  INotificationsRepository,
} from '../../domain/repositories/notifications.repository.interface';

interface NotificationRow {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  title: string;
  message: string;
  data: Record<string, unknown> | null;
  link: string | null;
  read: boolean;
  created_at: string;
}

@Injectable()
export class SupabaseNotificationsRepository implements INotificationsRepository {
  private readonly logger = new Logger(SupabaseNotificationsRepository.name);

  constructor(private readonly supabaseService: SupabaseService) {}

  private get client() {
    return this.supabaseService.getClient();
  }

  private toDomain(row: NotificationRow): LiveNotification {
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      title: row.title,
      message: row.message,
      data: row.data || {},
      link: row.link,
      read: row.read,
      createdAt: row.created_at,
    };
  }

  async create(input: CreateNotificationInput): Promise<LiveNotification> {
    const insertPayload = {
      user_id: input.userId,
      actor_id: input.actorId || null,
      type: input.type,
      title: input.title,
      message: input.message,
      data: input.data || {},
      link: input.link || null,
      read: false,
    };

    const { data, error } = await this.client
      .from('notifications')
      .insert([insertPayload])
      .select()
      .single();

    if (error) {
      this.logger.error(`Failed to create notification: ${error.message}`);
      throw new Error(error.message);
    }

    return this.toDomain(data as NotificationRow);
  }

  async findByUserId(userId: string, limit = 50): Promise<LiveNotification[]> {
    const safeLimit =
      Number.isFinite(limit) && limit > 0 ? Math.min(limit, 100) : 50;

    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(safeLimit);

    if (error) {
      this.logger.error(
        `Failed to find notifications for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    return ((data as NotificationRow[]) || []).map((row) => this.toDomain(row));
  }

  async markAsRead(userId: string, id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('notifications')
      .update({ read: true })
      .match({ id, user_id: userId })
      .select('id');

    if (error) {
      this.logger.error(
        `Failed to mark notification ${id} as read for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    return !!(data && data.length > 0);
  }

  async markAllAsRead(userId: string): Promise<number> {
    const { data, error } = await this.client
      .from('notifications')
      .update({ read: true })
      .match({ user_id: userId, read: false })
      .select('id');

    if (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    return data ? data.length : 0;
  }

  async delete(userId: string, id: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('notifications')
      .delete()
      .match({ id, user_id: userId })
      .select('id');

    if (error) {
      this.logger.error(
        `Failed to delete notification ${id} for user ${userId}: ${error.message}`,
      );
      throw new Error(error.message);
    }

    return !!(data && data.length > 0);
  }
}
