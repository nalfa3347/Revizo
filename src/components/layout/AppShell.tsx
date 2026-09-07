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

export type TabKey = 'home' | 'revisions' | 'courses' | 'quizzes' | 'profile' | 'search' | 'notifications' | 'settings' | 'diamonds' | 'subscription' | 'referral';

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
  onBackFromDiamonds?: () => void;
  onBackFromSubscription?: () => void;
  onBackFromReferral?: () => void;
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
  onBackFromNotifications,
  onBackFromDiamonds,
  onBackFromSubscription,
  onBackFromReferral
}) => {
  const { profile, progress, notifications, unreadNotificationsCount, economy } = useData();
  const unreadCount = unreadNotificationsCount !== undefined ? unreadNotificationsCount : notifications.filter(n => !n.read).length;
  const userInitial = (profile?.displayName || 'Élève').charAt(0).toUpperCase();

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
                {profile?.avatarUrl ? (
                  <img src={profile.avatarUrl} alt={profile.displayName} />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #EA580C, #F97316)',
                      color: '#FFFFFF',
                      fontWeight: 700,
                      fontSize: '13px',
                      borderRadius: '50%'
                    }}
                  >
                    {userInitial}
                  </div>
                )}
              </div>
              <div className="sidebar-profile-info">
                <span className="sidebar-name">{profile?.displayName || 'Élève'}</span>
                <span className="sidebar-level">Niveau {progress?.level ?? 1}</span>
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
          ) : currentTab === 'diamonds' ? (
            onBackFromDiamonds ? (
              <button
                className="btn-header-back"
                onClick={onBackFromDiamonds}
                title="Retour"
                id="btn-diamonds-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Mes diamants</h1>
            )
          ) : currentTab === 'subscription' ? (
            onBackFromSubscription ? (
              <button
                className="btn-header-back"
                onClick={onBackFromSubscription}
                title="Retour"
                id="btn-subscription-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Abonnement</h1>
            )
          ) : currentTab === 'referral' ? (
            onBackFromReferral ? (
              <button
                className="btn-header-back"
                onClick={onBackFromReferral}
                title="Retour"
                id="btn-referral-header-back"
              >
                <ArrowLeft size={18} strokeWidth={2.5} />
                <span>Retour</span>
              </button>
            ) : (
              <h1 className="header-revision-title">Parrainage</h1>
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

          {/* Actions : Diamants & Énergie, Recherche, Notifications, Profil (Mobile) */}
          <div className="header-actions">
            {/* Badges Économie 💎 & ⚡ */}
            <div className="header-economy-pills" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginRight: '4px' }}>
              <button
                className="economy-header-pill pill-diamonds"
                onClick={() => onNavigate('diamonds')}
                title="Consulter mes diamants"
                id="header-diamonds-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#FFFBEB',
                  border: '1px solid #FDE68A',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#B45309',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>💎</span>
                <span>{economy?.diamonds.balance ?? progress?.diamondsBalance ?? 0}</span>
              </button>

              <button
                className="economy-header-pill pill-energy"
                onClick={() => onNavigate('diamonds')}
                title="Consulter mon énergie"
                id="header-energy-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  backgroundColor: '#FFF7ED',
                  border: '1px solid #FFEDD5',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  color: '#C2410C',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>⚡</span>
                <span>{economy?.energy.currentEnergy ?? progress?.energyBalance ?? 10}/{economy?.energy.maxEnergy ?? 10}</span>
              </button>
            </div>

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
              {profile?.avatarUrl ? (
                <img src={profile.avatarUrl} alt={profile.displayName} />
              ) : (
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #EA580C, #F97316)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    fontSize: '13px',
                    borderRadius: '50%'
                  }}
                >
                  {userInitial}
                </div>
              )}
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
