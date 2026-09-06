import { IDataProvider } from '../contracts/IDataProvider';
import { AppSettings } from '../types';

export class SettingsService {
  constructor(private dataProvider: IDataProvider) {}

  async getSettings(): Promise<AppSettings> {
    const settings = await this.dataProvider.getSettings();
    this.applyAnimationPreference(settings.animationsEnabled);
    return settings;
  }

  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    const updated = await this.dataProvider.updateSettings(updates);
    if (typeof updates.animationsEnabled === 'boolean') {
      this.applyAnimationPreference(updates.animationsEnabled);
    }
    return updated;
  }

  async toggleAnimations(enabled: boolean): Promise<AppSettings> {
    return this.updateSettings({ animationsEnabled: enabled });
  }

  async updateNotificationPreferences(prefs: {
    notificationsRevision?: boolean;
    notificationsDailyReminders?: boolean;
    notificationsRewards?: boolean;
  }): Promise<AppSettings> {
    return this.updateSettings(prefs);
  }

  private applyAnimationPreference(animationsEnabled: boolean): void {
    if (typeof document !== 'undefined') {
      if (!animationsEnabled) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
    }
  }
}
