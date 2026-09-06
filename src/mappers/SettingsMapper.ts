import { AppSettings } from '../types';
import { SupabaseSettingsRow } from '../types/database.types';

export class SettingsMapper {
  static toDomain(row: SupabaseSettingsRow): AppSettings {
    return {
      theme: 'light',
      animationsEnabled: row.animations_enabled ?? true,
      language: 'fr',
      notificationsRevision: row.notifications_revision ?? true,
      notificationsDailyReminders: row.notifications_daily_reminders ?? true,
      notificationsRewards: row.notifications_rewards ?? true
    };
  }

  static toRow(settings: Partial<AppSettings>, userId?: string): Partial<SupabaseSettingsRow> {
    const row: Partial<SupabaseSettingsRow> = {};
    if (userId !== undefined) row.user_id = userId;
    if (settings.theme !== undefined) row.theme = settings.theme;
    if (settings.animationsEnabled !== undefined) row.animations_enabled = settings.animationsEnabled;
    if (settings.language !== undefined) row.language = settings.language;
    if (settings.notificationsRevision !== undefined) row.notifications_revision = settings.notificationsRevision;
    if (settings.notificationsDailyReminders !== undefined) row.notifications_daily_reminders = settings.notificationsDailyReminders;
    if (settings.notificationsRewards !== undefined) row.notifications_rewards = settings.notificationsRewards;
    return row;
  }
}
