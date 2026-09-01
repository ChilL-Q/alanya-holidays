import { LiveNotification } from '../../notifications.service';

export const NOTIFICATIONS_REPOSITORY = Symbol('INotificationsRepository');

export interface CreateNotificationInput {
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  link?: string | null;
  actorId?: string | null;
}

export interface INotificationsRepository {
  create(input: CreateNotificationInput): Promise<LiveNotification>;
  findByUserId(userId: string, limit?: number): Promise<LiveNotification[]>;
  markAsRead(userId: string, id: string): Promise<boolean>;
  markAllAsRead(userId: string): Promise<number>;
  delete(userId: string, id: string): Promise<boolean>;
}
