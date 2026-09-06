import React, { useState, useEffect } from 'react';
import {
  User,
  Gem,
  Flame,
  Award,
  BookOpen,
  Target,
  Sparkles,
  Settings,
  Bell,
  LogOut,
  ChevronRight,
  Check,
  X,
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { UserGoal } from '../../services/UserService';
import { SchoolLevel } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { FriendlyNotice } from '../common/FriendlyNotice';

interface ProfileViewProps {
  onBack?: () => void;
  onNavigateToNotifications?: () => void;
  onNavigateToSettings?: () => void;
  onLogoutSuccess?: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  onBack,
  onNavigateToNotifications,
  onNavigateToSettings,
  onLogoutSuccess
}) => {
  const {
    profile,
    progress,
    userService,
    updateProfile,
    isLoading: contextLoading
  } = useData();

  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [isLoadingGoals, setIsLoadingGoals] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Formulaire d'édition de profil
  const [editDisplayName, setEditDisplayName] = useState('');
  const [editGradeLevel, setEditGradeLevel] = useState<SchoolLevel>('3e');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [saveSuccessNotice, setSaveSuccessNotice] = useState(false);

  useEffect(() => {
    let mounted = true;
    const fetchGoals = async () => {
      try {
        setIsLoadingGoals(true);
        const data = await userService.getGoals();
        if (mounted) {
          setGoals(data);
        }
      } catch (err) {
        if (mounted) {
          setErrorMessage('Impossible de charger les objectifs d’apprentissage pour le moment.');
        }
      } finally {
        if (mounted) {
          setIsLoadingGoals(false);
        }
      }
    };

    fetchGoals();
    return () => {
      mounted = false;
    };
  }, [userService]);

  useEffect(() => {
    if (profile) {
      setEditDisplayName(profile.displayName);
      setEditGradeLevel(profile.gradeLevel);
    }
  }, [profile]);

  const handleOpenEditModal = () => {
    if (profile) {
      setEditDisplayName(profile.displayName);
      setEditGradeLevel(profile.gradeLevel);
    }
    setIsEditModalOpen(true);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editDisplayName.trim()) return;

    try {
      setIsSavingProfile(true);
      await updateProfile({
        displayName: editDisplayName.trim(),
        gradeLevel: editGradeLevel
      });
      setIsEditModalOpen(false);
      setSaveSuccessNotice(true);
      setTimeout(() => setSaveSuccessNotice(false), 3500);
    } catch (err) {
      setErrorMessage('La mise à jour de ton profil a rencontré une difficulté. Réessaie dans un instant.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await userService.logout();
      setIsLogoutModalOpen(false);
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch (err) {
      setIsLogoutModalOpen(false);
    }
  };

  // Formatage de la date d'inscription
  const formattedJoinedDate = profile?.joinedAt
    ? new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(profile.joinedAt))
    : 'août 2026';

  const isLoading = contextLoading || !profile || !progress;

  if (errorMessage) {
    return (
      <div className="profile-view-container">
        <FriendlyNotice
          title="Information profil momentanément indisponible"
          message={errorMessage}
          actionText="Actualiser"
          onAction={() => {
            setErrorMessage(null);
            window.location.reload();
          }}
        />
      </div>
    );
  }

  return (
    <div className="profile-view-container">
      {/* Bouton retour optionnel sur Desktop */}
      {onBack && (
        <div className="profile-back-row">
          <button className="btn-profile-back" onClick={onBack} title="Retour">
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Retour</span>
          </button>
        </div>
      )}

      {/* Message de succès lors de la sauvegarde du profil */}
      {saveSuccessNotice && (
        <div className="profile-toast-success animate-fade-in">
          <Check size={18} color="#10B981" />
          <span>Profil mis à jour avec succès !</span>
        </div>
      )}

      {/* 1. CARTE D'IDENTITÉ UTILISATEUR */}
      {isLoading ? (
        <div className="card-white profile-identity-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <Skeleton width={80} height={80} borderRadius="var(--radius-full)" />
            <div style={{ flex: 1 }}>
              <Skeleton width="45%" height="24px" style={{ marginBottom: '8px' }} />
              <Skeleton width="60%" height="16px" style={{ marginBottom: '8px' }} />
              <Skeleton width="30%" height="20px" borderRadius="12px" />
            </div>
          </div>
        </div>
      ) : (
        <div className="card-white profile-identity-card">
          <div className="profile-identity-main">
            <div className="profile-avatar-wrapper">
              <img
                src={
                  profile.avatarUrl ||
                  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80'
                }
                alt={profile.displayName}
                className="profile-avatar-img"
              />
              <div className="profile-avatar-badge" title={`Niveau ${progress.level}`}>
                {progress.level}
              </div>
            </div>

            <div className="profile-identity-info">
              <div className="profile-name-row">
                <h2 className="profile-user-name">{profile.displayName}</h2>
                <span className="profile-grade-badge">Classe de {profile.gradeLevel}</span>
              </div>
              <p className="profile-user-email">{profile.email || profile.phone}</p>
              <div className="profile-joined-row">
                <Calendar size={13} color="var(--text-muted)" />
                <span>Élève REVIZO depuis {formattedJoinedDate}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SYNTHÈSE DE PROGRESSION (4 INDICATEURS CLÉS) */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          <Award size={18} color="#EA580C" />
          <span>Progression globale</span>
        </h3>
        <p className="profile-section-subtitle">
          Un aperçu clair de ton investissement et de tes acquis récents.
        </p>

        {isLoading ? (
          <div className="profile-stats-grid">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="profile-stat-card">
                <Skeleton width="60%" height="14px" style={{ marginBottom: '6px' }} />
                <Skeleton width="80%" height="24px" />
              </div>
            ))}
          </div>
        ) : (
          <div className="profile-stats-grid">
            {/* 1. Niveau & XP */}
            <div className="profile-stat-card">
              <div className="profile-stat-header">
                <span className="profile-stat-label">Niveau d’apprentissage</span>
                <span className="profile-stat-badge-xp">+{progress.totalXp} XP</span>
              </div>
              <div className="profile-stat-value">Niveau {progress.level}</div>
              <div className="profile-stat-subtext">
                {progress.xpToNextLevel ? `${progress.xpToNextLevel} XP avant le niveau ${progress.level + 1}` : 'Progression continue'}
              </div>
            </div>

            {/* 2. Série de révision */}
            <div className="profile-stat-card">
              <div className="profile-stat-header">
                <span className="profile-stat-label">Série en cours</span>
                <Flame size={16} color="#EA580C" />
              </div>
              <div className="profile-stat-value" style={{ color: '#EA580C' }}>
                {progress.currentStreak} jours
              </div>
              <div className="profile-stat-subtext">
                Record : {progress.longestStreak || progress.currentStreak} jours consécutifs
              </div>
            </div>

            {/* 3. Diamants */}
            <div className="profile-stat-card">
              <div className="profile-stat-header">
                <span className="profile-stat-label">Diamants collectés</span>
                <Gem size={16} color="#F59E0B" />
              </div>
              <div className="profile-stat-value" style={{ color: '#C47D2B' }}>
                {progress.diamondsBalance} 💎
              </div>
              <div className="profile-stat-subtext">
                3 énergies actives pour les quiz
              </div>
            </div>

            {/* 4. Cours & Révisions */}
            <div className="profile-stat-card">
              <div className="profile-stat-header">
                <span className="profile-stat-label">Cours actifs</span>
                <BookOpen size={16} color="#10B981" />
              </div>
              <div className="profile-stat-value" style={{ color: '#0F766E' }}>
                4 cours
              </div>
              <div className="profile-stat-subtext">
                3 matières en révision régulière
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. SECTION « MES OBJECTIFS » */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          <Target size={18} color="#EA580C" />
          <span>Mes objectifs</span>
        </h3>
        <p className="profile-section-subtitle">
          Des repères pédagogiques réguliers pour progresser à ton propre rythme.
        </p>

        {isLoadingGoals || isLoading ? (
          <div className="profile-goals-list">
            {[1, 2, 3].map(i => (
              <div key={i} className="card-white profile-goal-card">
                <Skeleton width="40%" height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton width="70%" height="14px" style={{ marginBottom: '12px' }} />
                <Skeleton width="100%" height="8px" borderRadius="4px" />
              </div>
            ))}
          </div>
        ) : (
          <div className="profile-goals-list">
            {goals.map(goal => (
              <div key={goal.id} className="card-white profile-goal-card">
                <div className="profile-goal-header">
                  <div className="profile-goal-title-group">
                    {goal.icon === 'Target' && <Target size={18} color="#EA580C" />}
                    {goal.icon === 'Flame' && <Flame size={18} color="#EA580C" />}
                    {goal.icon === 'Sparkles' && <Sparkles size={18} color="#C47D2B" />}
                    <h4 className="profile-goal-title">{goal.title}</h4>
                  </div>
                  <span className={`profile-goal-status-pill ${goal.status}`}>
                    {goal.status === 'completed' ? 'Validé ✓' : 'En cours'}
                  </span>
                </div>

                <p className="profile-goal-desc">{goal.description}</p>

                {/* Si c'est l'objectif de streak hebdomadaire, afficher les jours */}
                {goal.category === 'streak' && progress?.weeklyDays && (
                  <div className="profile-weekly-days-row">
                    {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, idx) => {
                      const isDone = progress.weeklyDays?.[idx];
                      return (
                        <div
                          key={idx}
                          className={`profile-day-pill ${isDone ? 'done' : ''}`}
                          title={isDone ? `${day} : révision validée` : `${day} : à venir`}
                        >
                          {day}
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="profile-goal-progress-wrap">
                  <div className="profile-goal-bar-bg">
                    <div
                      className="profile-goal-bar-fill"
                      style={{ width: `${Math.min(100, goal.progressPct)}%` }}
                    />
                  </div>
                  <div className="profile-goal-values">
                    <span>{goal.currentValue}</span>
                    <span>Cible : {goal.targetValue}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. SECTION « COMPTE & PRÉFÉRENCES » */}
      <div className="profile-section">
        <h3 className="profile-section-title">
          <Settings size={18} color="#EA580C" />
          <span>Compte & Préférences</span>
        </h3>
        <p className="profile-section-subtitle">
          Gérer ton identité, tes alertes d'étude et la session de l'appareil.
        </p>

        <div className="card-white profile-menu-card">
          {/* Action 1 : Modifier mon profil */}
          <button
            className="profile-menu-item"
            onClick={handleOpenEditModal}
            id="btn-edit-profile"
          >
            <div className="profile-menu-item-left">
              <div className="profile-menu-icon-box" style={{ background: '#FFF4ED', color: '#EA580C' }}>
                <User size={18} />
              </div>
              <div className="profile-menu-texts">
                <span className="profile-menu-label">Modifier mon profil</span>
                <span className="profile-menu-caption">Prénom, nom et classe scolaire</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>

          {/* Action 2 : Paramètres */}
          <button
            className="profile-menu-item"
            onClick={() => {
              if (onNavigateToSettings) {
                onNavigateToSettings();
              } else {
                setIsSettingsModalOpen(true);
              }
            }}
            id="btn-open-settings"
          >
            <div className="profile-menu-item-left">
              <div className="profile-menu-icon-box" style={{ background: '#F1F5F9', color: '#475569' }}>
                <Settings size={18} />
              </div>
              <div className="profile-menu-texts">
                <span className="profile-menu-label">Paramètres</span>
                <span className="profile-menu-caption">Thème, affichage et options de lecture</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>

          {/* Action 3 : Notifications */}
          <button
            className="profile-menu-item"
            onClick={() => {
              if (onNavigateToNotifications) {
                onNavigateToNotifications();
              }
            }}
            id="btn-profile-notifications"
          >
            <div className="profile-menu-item-left">
              <div className="profile-menu-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                <Bell size={18} />
              </div>
              <div className="profile-menu-texts">
                <span className="profile-menu-label">Notifications</span>
                <span className="profile-menu-caption">Rappels d’étude et alertes de série</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>

          {/* Action 4 : Se déconnecter */}
          <button
            className="profile-menu-item danger"
            onClick={() => setIsLogoutModalOpen(true)}
            id="btn-logout"
          >
            <div className="profile-menu-item-left">
              <div className="profile-menu-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <LogOut size={18} />
              </div>
              <div className="profile-menu-texts">
                <span className="profile-menu-label danger">Se déconnecter</span>
                <span className="profile-menu-caption">Fermer la session sur cet appareil</span>
              </div>
            </div>
            <ChevronRight size={18} color="#DC2626" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          MODALE : MODIFIER MON PROFIL
          ========================================================================= */}
      {isEditModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsEditModalOpen(false)}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">Modifier mon profil</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsEditModalOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="profile-form">
              <div className="form-group">
                <label htmlFor="edit-name" className="form-label">
                  Prénom / Nom d'affichage
                </label>
                <input
                  id="edit-name"
                  type="text"
                  className="form-input"
                  value={editDisplayName}
                  onChange={e => setEditDisplayName(e.target.value)}
                  placeholder="Ex : Nasser"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-grade" className="form-label">
                  Niveau scolaire / Classe
                </label>
                <select
                  id="edit-grade"
                  className="form-select"
                  value={editGradeLevel}
                  onChange={e => setEditGradeLevel(e.target.value as SchoolLevel)}
                >
                  <option value="6e">6ème (Collège)</option>
                  <option value="5e">5ème (Collège)</option>
                  <option value="4e">4ème (Collège)</option>
                  <option value="3e">3ème (Collège / Brevet)</option>
                  <option value="2nde">Seconde Générale</option>
                  <option value="1ere">Première</option>
                  <option value="Terminale">Terminale (Baccalauréat)</option>
                  <option value="Superieur">Enseignement Supérieur</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-email" className="form-label">
                  Adresse email
                </label>
                <input
                  id="edit-email"
                  type="email"
                  className="form-input"
                  value={profile?.email || 'nasser@revizo.app'}
                  disabled
                />
                <span className="form-helper-text">
                  L’adresse email sert d'identifiant unique pour tes données et cours.
                </span>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={isSavingProfile}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSavingProfile || !editDisplayName.trim()}
                >
                  {isSavingProfile ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE : CONFIRMATION DE DÉCONNEXION
          ========================================================================= */}
      {isLogoutModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsLogoutModalOpen(false)}>
          <div
            className="modal-card modal-card-sm"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="logout-modal-icon-wrap">
              <LogOut size={26} color="#DC2626" />
            </div>

            <h3 className="logout-modal-title">Se déconnecter ?</h3>
            <p className="logout-modal-text">
              Tu pourras te reconnecter à tout moment pour retrouver l’ensemble de tes cours, tes révisions et tes quiz.
            </p>

            <div className="modal-actions-stacked">
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleConfirmLogout}
                id="btn-confirm-logout"
              >
                Se déconnecter
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLogoutModalOpen(false)}
                id="btn-cancel-logout"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE : PARAMÈTRES (APERÇU SOIGNÉ)
          ========================================================================= */}
      {isSettingsModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsSettingsModalOpen(false)}>
          <div
            className="modal-card"
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="modal-header">
              <h3 className="modal-title">Paramètres de l'application</h3>
              <button
                className="modal-close-btn"
                onClick={() => setIsSettingsModalOpen(false)}
                aria-label="Fermer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="settings-preview-list">
              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Thème visuel</div>
                  <div className="settings-row-sub">Clair et doux (Défaut REVIZO)</div>
                </div>
                <span className="settings-badge">Actif</span>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Vibrations & Animations</div>
                  <div className="settings-row-sub">Micro-animations pédagogiques</div>
                </div>
                <span className="settings-badge">Activées</span>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Langue de révision</div>
                  <div className="settings-row-sub">Français (France)</div>
                </div>
                <span className="settings-badge">FR</span>
              </div>

              <div className="settings-row">
                <div>
                  <div className="settings-row-label">Version de l'application</div>
                  <div className="settings-row-sub">REVIZO 2.0 (Architecture locale certifiée)</div>
                </div>
                <span className="settings-badge-muted">v2.0.0</span>
              </div>
            </div>

            <p className="settings-footnote">
              Les préférences utilisateur avancées seront configurables dans la phase dédiée aux Paramètres.
            </p>

            <div className="modal-actions" style={{ justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsSettingsModalOpen(false)}
              >
                Compris
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
