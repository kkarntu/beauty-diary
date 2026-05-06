import type { NotificationType } from '@beauty-diary/shared';

export interface NotificationRow {
  id: string;
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  readAt: Date | null;
  createdAt: Date;
}

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  payload: Record<string, unknown>;
}

export interface NotificationRepository {
  create(input: CreateNotificationInput): Promise<NotificationRow>;
  listByUser(
    userId: string,
    page: number,
    pageSize: number,
  ): Promise<{ items: NotificationRow[]; total: number; unreadCount: number }>;
  /** Returns true when the row was found and belonged to the user. */
  markRead(userId: string, notificationId: string): Promise<boolean>;
  markAllRead(userId: string): Promise<void>;
  unreadCount(userId: string): Promise<number>;
}

export const NOTIFICATION_REPOSITORY = Symbol('NOTIFICATION_REPOSITORY');
