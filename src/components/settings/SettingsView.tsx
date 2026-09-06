import React, { useState } from 'react';
import {
  Sun,
  Sparkles,
  Globe,
  Bell,
  ShieldCheck,
  Database,
  User,
  LogOut,
  ChevronRight,
  ArrowLeft,
  X,
  Check,
  FileText,
  Lock,
  Download
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Skeleton } from '../common/Skeleton';
import { FriendlyNotice } from '../common/FriendlyNotice';

interface SettingsViewProps {
  onBack: () => void;
  onNavigateToProfile: () => void;
  onLogoutSuccess?: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  onBack,
  onNavigateToProfile,
  onLogoutSuccess
}) => {
  const {
    settings,
    updateSettings,
    userService,
    isLoading: contextLoading
  } = useData();

  // Modales
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleAnimations = async () => {
    if (!settings) return;
    try {
      const nextVal = !settings.animationsEnabled;
      await updateSettings({ animationsEnabled: nextVal });
      showToast(nextVal ? 'Micro-animations activées' : 'Micro-animations réduites');
    } catch {
      setErrorMessage('Impossible d’enregistrer cette préférence.');
    }
  };

  const handleToggleNotification = async (
    key: 'notificationsRevision' | 'notificationsDailyReminders' | 'notificationsRewards'
  ) => {
    if (!settings) return;
    try {
      const nextVal = !settings[key];
      await updateSettings({ [key]: nextVal });
      showToast('Préférence de notification mise à jour');
    } catch {
      setErrorMessage('Impossible d’enregistrer cette préférence.');
    }
  };

  const handleConfirmLogout = async () => {
    try {
      await userService.logout();
      setIsLogoutModalOpen(false);
      if (onLogoutSuccess) {
        onLogoutSuccess();
      }
    } catch {
      setIsLogoutModalOpen(false);
    }
  };

  const isLoading = contextLoading || !settings;

  if (errorMessage) {
    return (
      <div className="settings-view-container">
        <FriendlyNotice
          title="Préférences momentanément indisponibles"
          message={errorMessage}
          actionText="Réessayer"
          onAction={() => setErrorMessage(null)}
        />
      </div>
    );
  }

  return (
    <div className="settings-view-container">
      {/* Bouton retour Desktop vers Profil */}
      <div className="settings-back-row">
        <button
          className="btn-settings-back"
          onClick={onBack}
          title="Retour au profil"
          id="btn-desktop-settings-back"
        >
          <ArrowLeft size={16} strokeWidth={2.5} />
          <span>Profil</span>
        </button>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div className="settings-toast-success animate-fade-in">
          <Check size={18} color="#10B981" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* SECTION 1 : APPARENCE */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Sun size={18} color="#EA580C" />
          <span>Apparence</span>
        </h3>
        <p className="settings-section-subtitle">
          Personnalise le style visuel de l'interface.
        </p>

        <div className="card-white settings-card">
          {isLoading ? (
            <div style={{ padding: '16px 20px' }}>
              <Skeleton width="40%" height="16px" style={{ marginBottom: '8px' }} />
              <Skeleton width="60%" height="14px" />
            </div>
          ) : (
            <div className="settings-row-item">
              <div className="settings-row-left">
                <div className="settings-icon-box" style={{ background: '#FFF4ED', color: '#EA580C' }}>
                  <Sun size={18} />
                </div>
                <div className="settings-texts">
                  <span className="settings-label">Thème de l’application</span>
                  <span className="settings-caption">Palette claire sobre et chaleureuse</span>
                </div>
              </div>
              <div className="settings-badge-active">
                <span>Clair (Défaut)</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 2 : EXPÉRIENCE & MICRO-ANIMATIONS */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Sparkles size={18} color="#EA580C" />
          <span>Expérience</span>
        </h3>
        <p className="settings-section-subtitle">
          Adapte le dynamisme visuel pour ton confort de travail.
        </p>

        <div className="card-white settings-card">
          {isLoading ? (
            <div style={{ padding: '16px 20px' }}>
              <Skeleton width="40%" height="16px" style={{ marginBottom: '8px' }} />
              <Skeleton width="70%" height="14px" />
            </div>
          ) : (
            <div className="settings-row-item">
              <div className="settings-row-left">
                <div className="settings-icon-box" style={{ background: '#FFF7ED', color: '#F59E0B' }}>
                  <Sparkles size={18} />
                </div>
                <div className="settings-texts">
                  <span className="settings-label">Micro-animations</span>
                  <span className="settings-caption">Fluidité et respirations douces des boutons</span>
                </div>
              </div>
              <label className="switch-toggle" id="toggle-animations">
                <input
                  type="checkbox"
                  checked={settings.animationsEnabled}
                  onChange={handleToggleAnimations}
                  aria-label="Activer ou désactiver les micro-animations"
                />
                <span className="switch-slider" />
              </label>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3 : LANGUE */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Globe size={18} color="#EA580C" />
          <span>Langue</span>
        </h3>
        <p className="settings-section-subtitle">
          Langue utilisée pour les cours, révisions et quiz.
        </p>

        <div className="card-white settings-card">
          {isLoading ? (
            <div style={{ padding: '16px 20px' }}>
              <Skeleton width="40%" height="16px" style={{ marginBottom: '8px' }} />
              <Skeleton width="50%" height="14px" />
            </div>
          ) : (
            <div className="settings-row-item">
              <div className="settings-row-left">
                <div className="settings-icon-box" style={{ background: '#F0FDF4', color: '#10B981' }}>
                  <Globe size={18} />
                </div>
                <div className="settings-texts">
                  <span className="settings-label">Langue de l’application</span>
                  <span className="settings-caption">Français (France)</span>
                </div>
              </div>
              <div className="settings-badge-active" style={{ background: '#ECFDF5', color: '#10B981', borderColor: '#A7F3D0' }}>
                <Check size={14} style={{ marginRight: '4px' }} />
                <span>Français</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 : NOTIFICATIONS */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <Bell size={18} color="#EA580C" />
          <span>Notifications</span>
        </h3>
        <p className="settings-section-subtitle">
          Choisis les alertes et encouragements que tu souhaites recevoir.
        </p>

        <div className="card-white settings-card">
          {isLoading ? (
            <div style={{ padding: '16px 20px' }}>
              <Skeleton width="50%" height="16px" style={{ marginBottom: '8px' }} />
              <Skeleton width="80%" height="14px" />
            </div>
          ) : (
            <>
              {/* Option 1 : Notifications de révision */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-icon-box" style={{ background: '#FFF4ED', color: '#EA580C' }}>
                    <FileText size={18} />
                  </div>
                  <div className="settings-texts">
                    <span className="settings-label">Notifications de révision</span>
                    <span className="settings-caption">Rappels pour revoir tes notions fragiles</span>
                  </div>
                </div>
                <label className="switch-toggle" id="toggle-notif-revision">
                  <input
                    type="checkbox"
                    checked={settings.notificationsRevision}
                    onChange={() => handleToggleNotification('notificationsRevision')}
                    aria-label="Activer les notifications de révision"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* Option 2 : Rappels quotidiens */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-icon-box" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <Bell size={18} />
                  </div>
                  <div className="settings-texts">
                    <span className="settings-label">Rappels quotidiens</span>
                    <span className="settings-caption">Alerte douce pour préserver ta série en cours</span>
                  </div>
                </div>
                <label className="switch-toggle" id="toggle-notif-daily">
                  <input
                    type="checkbox"
                    checked={settings.notificationsDailyReminders}
                    onChange={() => handleToggleNotification('notificationsDailyReminders')}
                    aria-label="Activer les rappels quotidiens"
                  />
                  <span className="switch-slider" />
                </label>
              </div>

              {/* Option 3 : Récompenses et progression */}
              <div className="settings-row-item">
                <div className="settings-row-left">
                  <div className="settings-icon-box" style={{ background: '#ECFDF5', color: '#059669' }}>
                    <Sparkles size={18} />
                  </div>
                  <div className="settings-texts">
                    <span className="settings-label">Récompenses et progression</span>
                    <span className="settings-caption">Gains de diamants et passages de niveau</span>
                  </div>
                </div>
                <label className="switch-toggle" id="toggle-notif-rewards">
                  <input
                    type="checkbox"
                    checked={settings.notificationsRewards}
                    onChange={() => handleToggleNotification('notificationsRewards')}
                    aria-label="Activer les alertes de récompenses"
                  />
                  <span className="switch-slider" />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 5 : CONFIDENTIALITÉ ET DONNÉES */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <ShieldCheck size={18} color="#EA580C" />
          <span>Confidentialité et données</span>
        </h3>
        <p className="settings-section-subtitle">
          Protection de tes documents scolaires et respect de ta vie privée.
        </p>

        <div className="card-white settings-card">
          {/* Action 1 : Politique de confidentialité */}
          <button
            className="settings-action-row"
            onClick={() => setIsPrivacyModalOpen(true)}
            id="btn-open-privacy"
          >
            <div className="settings-row-left">
              <div className="settings-icon-box" style={{ background: '#F1F5F9', color: '#475569' }}>
                <Lock size={18} />
              </div>
              <div className="settings-texts">
                <span className="settings-label">Politique de confidentialité</span>
                <span className="settings-caption">Nos engagements stricts pour les élèves</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>

          {/* Action 2 : Gestion de mes données */}
          <button
            className="settings-action-row"
            onClick={() => setIsDataModalOpen(true)}
            id="btn-open-data"
          >
            <div className="settings-row-left">
              <div className="settings-icon-box" style={{ background: '#F1F5F9', color: '#475569' }}>
                <Database size={18} />
              </div>
              <div className="settings-texts">
                <span className="settings-label">Gestion de mes données</span>
                <span className="settings-caption">Consulter et exporter tes données d’étude</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>
        </div>
      </div>

      {/* SECTION 6 : COMPTE */}
      <div className="settings-section">
        <h3 className="settings-section-title">
          <User size={18} color="#EA580C" />
          <span>Compte</span>
        </h3>
        <p className="settings-section-subtitle">
          Accéder à ton profil ou terminer ta session sur cet appareil.
        </p>

        <div className="card-white settings-card">
          {/* Mon profil */}
          <button
            className="settings-action-row"
            onClick={onNavigateToProfile}
            id="btn-settings-to-profile"
          >
            <div className="settings-row-left">
              <div className="settings-icon-box" style={{ background: '#FFF4ED', color: '#EA580C' }}>
                <User size={18} />
              </div>
              <div className="settings-texts">
                <span className="settings-label">Mon profil</span>
                <span className="settings-caption">Consulter ton identité et tes objectifs</span>
              </div>
            </div>
            <ChevronRight size={18} color="var(--text-muted)" />
          </button>

          {/* Se déconnecter */}
          <button
            className="settings-action-row danger"
            onClick={() => setIsLogoutModalOpen(true)}
            id="btn-settings-logout"
          >
            <div className="settings-row-left">
              <div className="settings-icon-box" style={{ background: '#FEE2E2', color: '#DC2626' }}>
                <LogOut size={18} />
              </div>
              <div className="settings-texts">
                <span className="settings-label danger">Se déconnecter</span>
                <span className="settings-caption">Fermer la session sur cet appareil</span>
              </div>
            </div>
            <ChevronRight size={18} color="#DC2626" />
          </button>
        </div>
      </div>

      {/* SECTION 7 : VERSION OFFICIELLE */}
      <div className="settings-version-footer">
        <div className="settings-version-brand">
          REVIZO<span className="brand-sparkle">✦</span>
        </div>
        <div className="settings-version-number">Version 2.0.0</div>
        <div className="settings-version-sub">Environnement d'exécution local certifié</div>
      </div>

      {/* =========================================================================
          MODALE : POLITIQUE DE CONFIDENTIALITÉ
          ========================================================================= */}
      {isPrivacyModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsPrivacyModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">Politique de confidentialité</h3>
              <button className="modal-close-btn" onClick={() => setIsPrivacyModalOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="privacy-modal-content">
              <div className="privacy-item">
                <div className="privacy-item-title">1. Protection stricte des données des élèves</div>
                <p className="privacy-item-text">
                  REVIZO est conçu exclusivement pour servir la réussite scolaire. Aucune donnée personnelle,
                  aucun document de cours importé n'est revendu, partagé ou utilisé à des fins publicitaires.
                </p>
              </div>

              <div className="privacy-item">
                <div className="privacy-item-title">2. Traitement pédagogique des cours</div>
                <p className="privacy-item-text">
                  Les documents importés (PDF, images, photos) sont analysés dans le seul but de générer
                  des synthèses précises, des notions clés et des quiz d'évaluation pour l'élève.
                </p>
              </div>

              <div className="privacy-item">
                <div className="privacy-item-title">3. Isolation et sécurité</div>
                <p className="privacy-item-text">
                  Chaque élève a un accès strictement privé et cloisonné à ses données de progression,
                  ses notes et ses fiches de révision.
                </p>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsPrivacyModalOpen(false)}
              >
                J’ai compris
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE : GESTION DE MES DONNÉES
          ========================================================================= */}
      {isDataModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsDataModalOpen(false)}>
          <div className="modal-card" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="modal-header">
              <h3 className="modal-title">Gestion de mes données</h3>
              <button className="modal-close-btn" onClick={() => setIsDataModalOpen(false)} aria-label="Fermer">
                <X size={18} />
              </button>
            </div>

            <div className="data-modal-summary">
              <p className="data-modal-intro">
                Voici le récapitulatif des données associées à ton espace d'apprentissage local :
              </p>

              <div className="data-stat-row">
                <span>Profil & Niveau scolaire</span>
                <strong>Nasser (Classe de 3e)</strong>
              </div>
              <div className="data-stat-row">
                <span>Cours & documents importés</span>
                <strong>4 cours actifs</strong>
              </div>
              <div className="data-stat-row">
                <span>Progression & Gamification</span>
                <strong>Niveau 8 • 12 jours de série • 24 💎</strong>
              </div>
              <div className="data-stat-row">
                <span>Fiches de révision locales</span>
                <strong>Fiches conformes & téléchargeables</strong>
              </div>
            </div>

            <div className="modal-actions" style={{ justifyContent: 'space-between', marginTop: '20px' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  showToast('Synthèse des données préparée');
                  setIsDataModalOpen(false);
                }}
              >
                <Download size={14} style={{ marginRight: '6px' }} />
                Exporter ma synthèse
              </button>

              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsDataModalOpen(false)}
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODALE : CONFIRMATION DE DÉCONNEXION
          ========================================================================= */}
      {isLogoutModalOpen && (
        <div className="modal-overlay animate-fade-in" onClick={() => setIsLogoutModalOpen(false)}>
          <div className="modal-card modal-card-sm" onClick={e => e.stopPropagation()} role="dialog" aria-modal="true">
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
                id="btn-confirm-settings-logout"
              >
                Se déconnecter
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setIsLogoutModalOpen(false)}
                id="btn-cancel-settings-logout"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
