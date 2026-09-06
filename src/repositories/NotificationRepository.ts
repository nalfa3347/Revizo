import { SupabaseClient } from '@supabase/supabase-js';
import { Database, SupabaseNotificationRow } from '../types/database.types';
import { AppNotification } from '../types';
import { NotificationMapper } from '../mappers/NotificationMapper';

export class NotificationRepository {
  constructor(private client: SupabaseClient<Database>) {}

  async listByUserId(userId: string): Promise<AppNotification[]> {
    const { data, error } = await this.client
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[NotificationRepository.listByUserId] Erreur Supabase :', error);
      return [];
    }
    return (data as SupabaseNotificationRow[]).map(NotificationMapper.toDomain);
  }

  async markAsRead(id: string, userId: string): Promise<void> {
    const { error } = await this.client
      .from('notifications')
      .update({ read: true })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) {
      console.error('[NotificationRepository.markAsRead] Erreur :', error);
    }
  }

  async markAllAsRead(userId: string): Promise<void> {
    const { error } = await this.client
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[NotificationRepository.markAllAsRead] Erreur :', error);
    }
  }

  async clearAll(userId: string): Promise<void> {
    const { error } = await this.client
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) {
      console.error('[NotificationRepository.clearAll] Erreur :', error);
    }
  }

  async countUnread(userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) {
      console.error('[NotificationRepository.countUnread] Erreur :', error);
      return 0;
    }
    return count || 0;
  }
}
