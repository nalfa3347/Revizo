import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { SettingsService } from '../services/SettingsService';

describe('SettingsService', () => {
  let provider: MockDataProvider;
  let settingsService: SettingsService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    settingsService = new SettingsService(provider);
  });

  it('fournit les paramètres par défaut conformes à REVIZO', async () => {
    const settings = await settingsService.getSettings();
    expect(settings.theme).toBe('light');
    expect(settings.animationsEnabled).toBe(true);
    expect(settings.language).toBe('fr');
    expect(settings.notificationsRevision).toBe(true);
    expect(settings.notificationsDailyReminders).toBe(true);
    expect(settings.notificationsRewards).toBe(true);
  });

  it('permet d’activer et désactiver les micro-animations', async () => {
    const disabled = await settingsService.toggleAnimations(false);
    expect(disabled.animationsEnabled).toBe(false);

    const fresh = await settingsService.getSettings();
    expect(fresh.animationsEnabled).toBe(false);

    const enabled = await settingsService.toggleAnimations(true);
    expect(enabled.animationsEnabled).toBe(true);
  });

  it('permet de modifier les 3 préférences de notifications indépendamment', async () => {
    const updated = await settingsService.updateNotificationPreferences({
      notificationsRevision: false,
      notificationsDailyReminders: true,
      notificationsRewards: false
    });

    expect(updated.notificationsRevision).toBe(false);
    expect(updated.notificationsDailyReminders).toBe(true);
    expect(updated.notificationsRewards).toBe(false);

    const fresh = await settingsService.getSettings();
    expect(fresh.notificationsRevision).toBe(false);
    expect(fresh.notificationsRewards).toBe(false);
  });
});
