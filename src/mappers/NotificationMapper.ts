import { AppNotification, NotificationType } from '../types';
import { SupabaseNotificationRow } from '../types/database.types';

export class NotificationMapper {
  static toDomain(row: SupabaseNotificationRow): AppNotification {
    return {
      id: row.id,
      type: (row.type as NotificationType) || 'reminder',
      title: row.title,
      message: row.message,
      read: row.read,
      createdAt: row.created_at,
      relativeTime: row.relative_time || undefined,
      targetTab: (row.target_tab as 'revisions' | 'courses' | 'quizzes' | 'profile') || undefined,
      targetId: row.target_id || undefined
    };
  }

  static toRow(notification: Partial<AppNotification>, userId?: string): Partial<SupabaseNotificationRow> {
    const row: Partial<SupabaseNotificationRow> = {};
    if (notification.id !== undefined) row.id = notification.id;
    if (userId !== undefined) row.user_id = userId;
    if (notification.type !== undefined) row.type = notification.type;
    if (notification.title !== undefined) row.title = notification.title;
    if (notification.message !== undefined) row.message = notification.message;
    if (notification.read !== undefined) row.read = notification.read;
    if (notification.relativeTime !== undefined) row.relative_time = notification.relativeTime || null;
    if (notification.targetTab !== undefined) row.target_tab = notification.targetTab || null;
    if (notification.targetId !== undefined) row.target_id = notification.targetId || null;
    if (notification.createdAt !== undefined) row.created_at = notification.createdAt;
    return row;
  }
}
