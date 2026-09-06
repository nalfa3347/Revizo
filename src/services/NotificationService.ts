import { IDataProvider } from '../contracts/IDataProvider';
import { AppNotification } from '../types';

/**
 * REVIZO — NotificationService
 * Gère le cycle de vie des notifications élèves : consultation, état lu/non lu, marquage global.
 */
export class NotificationService {
  constructor(private dataProvider: IDataProvider) {}

  /**
   * Récupère la liste des notifications
   */
  async getNotifications(): Promise<AppNotification[]> {
    return this.dataProvider.getNotifications();
  }

  /**
   * Marque une notification spécifique comme lue
   */
  async markAsRead(id: string): Promise<AppNotification[]> {
    await this.dataProvider.markNotificationAsRead(id);
    return this.dataProvider.getNotifications();
  }

  /**
   * Marque l'ensemble des notifications comme lues
   */
  async markAllAsRead(): Promise<AppNotification[]> {
    await this.dataProvider.markAllNotificationsAsRead();
    return this.dataProvider.getNotifications();
  }

  /**
   * Supprime/Vide toutes les notifications (état vide)
   */
  async clearAll(): Promise<void> {
    await this.dataProvider.clearAllNotifications();
  }

  /**
   * Calcule le nombre de notifications non lues
   */
  async getUnreadCount(): Promise<number> {
    const notifs = await this.dataProvider.getNotifications();
    return notifs.filter(n => !n.read).length;
  }
}
