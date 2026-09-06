import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataProvider } from '../providers/mock/MockDataProvider';
import { NotificationService } from '../services/NotificationService';

describe('NotificationService', () => {
  let provider: MockDataProvider;
  let notificationService: NotificationService;

  beforeEach(() => {
    provider = new MockDataProvider(0);
    notificationService = new NotificationService(provider);
  });

  it('charge la liste des notifications avec les types du domaine REVIZO', async () => {
    const notifs = await notificationService.getNotifications();
    expect(notifs.length).toBeGreaterThanOrEqual(5);

    const types = notifs.map(n => n.type);
    expect(types).toContain('revision');
    expect(types).toContain('reminder');
    expect(types).toContain('progress');
    expect(types).toContain('quiz');
    expect(types).toContain('reward');
  });

  it('calcule exactement le nombre de notifications non lues', async () => {
    const unread = await notificationService.getUnreadCount();
    const notifs = await notificationService.getNotifications();
    const manualCount = notifs.filter(n => !n.read).length;
    expect(unread).toBe(manualCount);
    expect(unread).toBe(3); // 3 non lues initialement dans les fixtures
  });

  it('permet de marquer une notification individuelle comme lue', async () => {
    const initialUnread = await notificationService.getUnreadCount();
    const notifs = await notificationService.getNotifications();
    const firstUnread = notifs.find(n => !n.read);
    expect(firstUnread).toBeDefined();

    await notificationService.markAsRead(firstUnread!.id);

    const updatedNotifs = await notificationService.getNotifications();
    const updatedTarget = updatedNotifs.find(n => n.id === firstUnread!.id);
    expect(updatedTarget?.read).toBe(true);

    const newUnread = await notificationService.getUnreadCount();
    expect(newUnread).toBe(initialUnread - 1);
  });

  it('permet de tout marquer comme lu (Tout marquer comme lu)', async () => {
    await notificationService.markAllAsRead();

    const notifs = await notificationService.getNotifications();
    const hasUnread = notifs.some(n => !n.read);
    expect(hasUnread).toBe(false);

    const unread = await notificationService.getUnreadCount();
    expect(unread).toBe(0);
  });

  it('permet de vider l’ensemble des notifications pour tester l’état vide', async () => {
    await notificationService.clearAll();

    const notifs = await notificationService.getNotifications();
    expect(notifs).toEqual([]);

    const unread = await notificationService.getUnreadCount();
    expect(unread).toBe(0);
  });
});
