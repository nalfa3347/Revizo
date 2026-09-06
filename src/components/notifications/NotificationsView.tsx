import React, { useState } from 'react';
import {
  Bell,
  CheckCheck,
  BookOpen,
  Gamepad2,
  Zap,
  Sparkles,
  Clock,
  ChevronRight,
  ArrowLeft,
  Inbox,
  Trash2
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { AppNotification, NotificationType } from '../../types';

interface NotificationsViewProps {
  onBack?: () => void;
  onNavigateToContent?: (notification: AppNotification) => void;
}

export const NotificationsView: React.FC<NotificationsViewProps> = ({
  onBack,
  onNavigateToContent
}) => {
  const {
    notifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearAllNotifications
  } = useData();

  const [activeFilter, setActiveFilter] = useState<'all' | 'unread'>('all');
  const [isProcessing, setIsProcessing] = useState(false);

  const displayedNotifications = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    if (isProcessing || unreadNotificationsCount === 0) return;
    setIsProcessing(true);
    try {
      await markAllNotificationsAsRead();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearAll = async () => {
    if (isProcessing || notifications.length === 0) return;
    setIsProcessing(true);
    try {
      await clearAllNotifications();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNotificationClick = async (notif: AppNotification) => {
    if (!notif.read) {
      await markNotificationAsRead(notif.id);
    }
    if (notif.targetTab && onNavigateToContent) {
      onNavigateToContent(notif);
    }
  };

  const getTypeBadge = (type: NotificationType) => {
    switch (type) {
      case 'revision':
        return {
          icon: <BookOpen size={14} />,
          label: 'Révision',
          badgeClass: 'notif-badge-revision'
        };
      case 'reminder':
        return {
          icon: <Clock size={14} />,
          label: 'Rappel',
          badgeClass: 'notif-badge-reminder'
        };
      case 'progress':
        return {
          icon: <Zap size={14} />,
          label: 'Progression',
          badgeClass: 'notif-badge-progress'
        };
      case 'quiz':
        return {
          icon: <Gamepad2 size={14} />,
          label: 'Quiz',
          badgeClass: 'notif-badge-quiz'
        };
      case 'reward':
        return {
          icon: <Sparkles size={14} />,
          label: 'Récompense',
          badgeClass: 'notif-badge-reward'
        };
      default:
        return {
          icon: <Bell size={14} />,
          label: 'Info',
          badgeClass: 'notif-badge-default'
        };
    }
  };

  return (
    <div className="notifications-view-container" id="notifications-view-container">
      {/* En-tête des notifications */}
      <div className="notifications-header">
        <div className="notifications-header-left">
          {onBack && (
            <button
              type="button"
              className="notifications-back-btn"
              onClick={onBack}
              aria-label="Retour"
              id="btn-notifications-back"
            >
              <ArrowLeft size={20} strokeWidth={2.5} />
            </button>
          )}
          <div className="notifications-title-wrap">
            <h2 className="notifications-title">Notifications</h2>
            {unreadNotificationsCount > 0 ? (
              <span className="notifications-unread-pill" id="notifications-unread-pill">
                {unreadNotificationsCount} non lue{unreadNotificationsCount > 1 ? 's' : ''}
              </span>
            ) : (
              <span className="notifications-read-all-pill">À jour</span>
            )}
          </div>
        </div>

        <div className="notifications-header-actions">
          {unreadNotificationsCount > 0 && (
            <button
              type="button"
              className="btn-mark-all-read"
              onClick={handleMarkAllAsRead}
              disabled={isProcessing}
              id="btn-mark-all-read"
              title="Marquer toutes les notifications comme lues"
            >
              <CheckCheck size={16} strokeWidth={2.5} />
              <span>Tout marquer comme lu</span>
            </button>
          )}
          {notifications.length > 0 && (
            <button
              type="button"
              className="btn-clear-all-notifs"
              onClick={handleClearAll}
              disabled={isProcessing}
              id="btn-clear-all-notifs"
              title="Vider les notifications"
            >
              <Trash2 size={15} />
              <span>Vider</span>
            </button>
          )}
        </div>
      </div>

      {/* Barre de filtrage : Toutes / Non lues */}
      <div className="notifications-filter-bar">
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => setActiveFilter('all')}
          id="filter-notif-all"
        >
          <span>Toutes</span>
          <span className="filter-count">({notifications.length})</span>
        </button>
        <button
          type="button"
          className={`notif-filter-tab ${activeFilter === 'unread' ? 'active' : ''}`}
          onClick={() => setActiveFilter('unread')}
          id="filter-notif-unread"
        >
          <span>Non lues</span>
          {unreadNotificationsCount > 0 && (
            <span className="filter-badge-unread">{unreadNotificationsCount}</span>
          )}
        </button>
      </div>

      {/* Liste des notifications */}
      <div className="notifications-content" id="notifications-list">
        {displayedNotifications.length === 0 ? (
          <div className="notifications-empty-state" id="notifications-empty-state">
            <div className="notifications-empty-icon-box">
              <Inbox size={32} strokeWidth={1.5} />
            </div>
            <h3 className="notifications-empty-title">
              {activeFilter === 'unread'
                ? 'Aucune notification non lue'
                : 'Aucune notification pour le moment'}
            </h3>
            <p className="notifications-empty-desc">
              {activeFilter === 'unread'
                ? 'Tu as lu tous tes rappels et notifications de révision.'
                : 'Tes rappels, bilans d’apprentissage et récompenses apparaîtront ici.'}
            </p>
            {notifications.length === 0 && (
              <p className="notifications-empty-hint">
                REVIZO t’alertera dès qu’une notion mérite ton attention.
              </p>
            )}
          </div>
        ) : (
          <div className="notifications-cards-stack">
            {displayedNotifications.map(notif => {
              const badgeInfo = getTypeBadge(notif.type);
              return (
                <div
                  key={notif.id}
                  className={`notification-card ${!notif.read ? 'unread' : 'read'}`}
                  onClick={() => handleNotificationClick(notif)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      handleNotificationClick(notif);
                    }
                  }}
                  id={`notification-card-${notif.id}`}
                >
                  {/* Point indicateur non lu */}
                  <div className="notification-status-indicator">
                    {!notif.read && <span className="notification-unread-dot" title="Non lue" />}
                  </div>

                  {/* Corps de la notification */}
                  <div className="notification-main-body">
                    <div className="notification-meta-row">
                      <span className={`notification-category-badge ${badgeInfo.badgeClass}`}>
                        {badgeInfo.icon}
                        <span>{badgeInfo.label}</span>
                      </span>
                      {notif.relativeTime && (
                        <span className="notification-relative-time">{notif.relativeTime}</span>
                      )}
                    </div>

                    <h4 className="notification-card-title">{notif.title}</h4>
                    <p className="notification-card-message">{notif.message}</p>
                  </div>

                  {/* Action directe si destination */}
                  {notif.targetTab && (
                    <div className="notification-action-area">
                      <span className="notification-action-link">
                        <ChevronRight size={18} strokeWidth={2.5} />
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
