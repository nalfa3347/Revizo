import React from 'react';
import {
  Home,
  BookOpen,
  FolderClosed,
  Gamepad2,
  Search,
  Bell,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { NetworkBar } from '../common/NetworkBar';

export type TabKey = 'home' | 'revisions' | 'courses' | 'quizzes' | 'profile' | 'search' | 'notifications' | 'settings';

interface AppShellProps {
  currentTab: TabKey;
  onNavigate: (tab: TabKey) => void;
  children: React.ReactNode;
  isReadingRevision?: boolean;
  onBackFromReading?: () => void;
  onBackFromProfile?: () => void;
  onBackFromSettings?: () => void;
  onBackFromSearch?: () => void;
  onBackFromNotifications?: () => void;
}

export const AppShell: React.FC<AppShellProps> = ({ 
  currentTab, 
  onNavigate, 
  children,
  isReadingRevision,
  onBackFromReading,
  onBackFromProfile,
  onBackFromSettings,
  onBackFromSearch,
  onBackFromNotifications
}) => {
  const { profile, notifications, unreadNotificationsCount } = useData();
  const unreadCount = unreadNotificationsCount !== undefined ? unreadNotificationsCount : notifications.filter(n => !n.read).length;

  return (
    <div className="app-shell">
      {/* DESKTOP SIDEBAR BLANCHE (Fixe à gauche, masquée sur Mobile) */}
      <aside className="desktop-sidebar">
        {/* Logo REVIZO✦ */}
        <div className="sidebar-header">
          <span className="sidebar-logo-text">
            REVIZO<span className="brand-sparkle">✦</span>
          </span>
        </div>

        {/* Navigation principale Desktop */}
        <nav className="sidebar-nav">
          <button
            className={`sidebar-nav-item ${currentTab === 'home' ? 'active' : ''}`}
            onClick={() => onNavigate('home')}
          >
            <Home size={18} fill={currentTab === 'home' ? '#EA580C' : 'none'} />
            <span>Accueil</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'revisions' ? 'active' : ''}`}
            onClick={() => onNavigate('revisions')}
          >
            <BookOpen size={18} />
            <span>Révision</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'courses' ? 'active' : ''}`}
            onClick={() => onNavigate('courses')}
          >
            <FolderClosed size={18} />
            <span>Mes cours</span>
          </button>

          <button
            className={`sidebar-nav-item ${currentTab === 'quizzes' ? 'active' : ''}`}
            onClick={() => onNavigate('quizzes')}
          >
            <Gamepad2 size={18} />
            <span>Quiz</span>
          </button>
        </nav>

        {/* Profil en bas de la sidebar Desktop */}
        <div className="sidebar-footer">
          <div
            className={`sidebar-profile-card ${currentTab === 'profile' ? 'active' : ''}`}
            onClick={() => onNavigate('profile')}
            title="Mon profil"
            id="desktop-sidebar-profile"
          >
            <div className="sidebar-profile-left">
              <div className="sidebar-avatar">
                <img
                  src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                  alt={profile?.displayName || 'Nasser'}
                />
              </div>
              <div className="sidebar-profile-info">
                <span className="sidebar-name">{profile?.displayName || 'Nasser'}</span>
                <span className="sidebar-level">Niveau {profile ? 8 : 8}</span>
              </div>
            </div>
            <ChevronRight size={16} color="var(--text-muted)" />
          </div>
        </div>
      </aside>

      {/* ZONE PRINCIPALE */}
      <main className="app-main">
        {/* Bandeau Hors Connexion si applicable */}
        <NetworkBar />

        {/* Header supérieur */}
        <header className="app-header">
          {/* Mobile Logo REVIZO✦ ou Titre de Page Révision ou Bouton Retour */}
          {currentTab === 'revisions' ? (
            isReadingRevision && onBackFromReading ? (
              <button
                className="btn-header-back"
                onClick={onBackFromReading}
                title="Retour à Révision"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Révision</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Révision</h1>
            )
          ) : currentTab === 'courses' ? (
            <h1 className="header-revision-title">Mes cours</h1>
          ) : currentTab === 'quizzes' ? (
            <h1 className="header-revision-title">Quiz</h1>
          ) : currentTab === 'profile' ? (
            onBackFromProfile ? (
              <button
                className="btn-header-back"
                onClick={onBackFromProfile}
                title="Retour"
                id="btn-mobile-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Profil</h1>
            )
          ) : currentTab === 'settings' ? (
            onBackFromSettings ? (
              <button
                className="btn-header-back"
                onClick={onBackFromSettings}
                title="Retour au profil"
                id="btn-settings-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Profil</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Paramètres</h1>
            )
          ) : currentTab === 'search' ? (
            onBackFromSearch ? (
              <button
                className="btn-header-back"
                onClick={onBackFromSearch}
                title="Retour"
                id="btn-search-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Recherche</h1>
            )
          ) : currentTab === 'notifications' ? (
            onBackFromNotifications ? (
              <button
                className="btn-header-back"
                onClick={onBackFromNotifications}
                title="Retour"
                id="btn-notifications-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Notifications</h1>
            )
          ) : (
            <div className="header-brand">
              <span className="brand-title-text">
                REVIZO<span className="brand-sparkle">✦</span>
              </span>
            </div>
          )}

          {/* Espace flexible pour repousser les actions à droite */}
          <div style={{ flex: 1 }} />

          {/* Actions : Recherche, Notifications, Profil (Mobile) */}
          <div className="header-actions">
            <button
              className={`header-icon-btn ${currentTab === 'search' ? 'active' : ''}`}
              onClick={() => onNavigate('search')}
              title="Recherche"
              id="header-search-btn"
            >
              <Search size={20} strokeWidth={2} />
            </button>

            <button
              className={`header-icon-btn ${currentTab === 'notifications' ? 'active' : ''}`}
              onClick={() => onNavigate('notifications')}
              title="Notifications"
              id="header-notifications-btn"
            >
              <Bell size={20} strokeWidth={2} />
              {unreadCount > 0 && (
                <span className="notification-count-badge">{unreadCount}</span>
              )}
            </button>

            {/* Profil visible dans le header sur Mobile */}
            <div
              className={`header-avatar ${currentTab === 'profile' ? 'active' : ''}`}
              onClick={() => onNavigate('profile')}
              title="Profil"
              id="header-profile-avatar"
            >
              <img
                src={profile?.avatarUrl || 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'}
                alt={profile?.displayName || 'Nasser'}
              />
            </div>
          </div>
        </header>

        {/* Contenu de la page courante */}
        <div className="page-container page-view">
          {children}
        </div>
      </main>

      {/* MOBILE BOTTOM NAVIGATION — 4 ONGLETS STRICTS */}
      <nav className="mobile-bottom-nav">
        <button
          className={`mobile-nav-item ${currentTab === 'home' ? 'active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          <Home size={22} fill={currentTab === 'home' ? '#EA580C' : 'none'} />
          <span>Accueil</span>
          {currentTab === 'home' && <span className="mobile-active-indicator" />}
        </button>

        <button
          className={`mobile-nav-item ${currentTab === 'revisions' ? 'active' : ''}`}
          onClick={() => onNavigate('revisions')}
        >
          <BookOpen size={22} />
          <span>Révision</span>
          {currentTab === 'revisions' && <span className="mobile-active-indicator" />}
        </button>

        <button
          className={`mobile-nav-item ${currentTab === 'courses' ? 'active' : ''}`}
          onClick={() => onNavigate('courses')}
        >
          <FolderClosed size={22} />
          <span>Mes cours</span>
          {currentTab === 'courses' && <span className="mobile-active-indicator" />}
        </button>

        <button
          className={`mobile-nav-item ${currentTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => onNavigate('quizzes')}
        >
          <Gamepad2 size={22} />
          <span>Quiz</span>
          {currentTab === 'quizzes' && <span className="mobile-active-indicator" />}
        </button>
      </nav>
    </div>
  );
};
