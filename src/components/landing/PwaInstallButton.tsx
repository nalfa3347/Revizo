import React, { useState, useEffect } from 'react';
import { Download, Smartphone, X, Check, Share, PlusSquare } from 'lucide-react';
import { RevizoLogo } from '../common/RevizoLogo';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export const PwaInstallButton: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Détection iOS (iPhone / iPad / iPod)
    const ua = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(ua);
    setIsIos(isAppleDevice);

    // Vérifier si l'application est déjà en mode autonome (installée)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Interception de l'événement natif d'installation PWA (Android / Chrome / Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Détection du défilement : afficher dès que l'utilisateur fait défiler un peu (environ 150px)
    const handleScroll = () => {
      if (window.scrollY > 150) {
        setIsVisible(true);
      } else {
        // Garder visible une fois découvert ou masquer doucement
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    // Vérifier également au montage si la page est déjà scrollée
    if (window.scrollY > 150) {
      setIsVisible(true);
    }

    // Écouter un déclenchement manuel (depuis le menu burger ou les boutons de l'interface)
    const handleTriggerInstall = () => {
      if (isIos || !deferredPrompt) {
        setShowIosGuide(true);
        return;
      }
      deferredPrompt.prompt().then(() => {
        deferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            setIsInstalled(true);
          }
          setDeferredPrompt(null);
        });
      }).catch(() => {
        setShowIosGuide(true);
      });
    };
    window.addEventListener('revizo:open-pwa-install', handleTriggerInstall);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('revizo:open-pwa-install', handleTriggerInstall);
    };
  }, [deferredPrompt, isIos]);

  const handleInstallClick = async () => {
    // Si on est sur iOS Safari (pas de prompt programmatique, guidage visuel immédiat)
    if (isIos) {
      setShowIosGuide(true);
      return;
    }

    // Si nous avons le prompt natif Chrome/Android
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const choiceResult = await deferredPrompt.userChoice;
        if (choiceResult.outcome === 'accepted') {
          setIsInstalled(true);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Erreur lors de l'installation PWA:", err);
      }
      return;
    }

    // Pour navigateurs où le prompt natif n'est pas encore disponible
    // Si déjà installé
    if (isInstalled) {
      alert("L'application REVIZO est déjà installée sur votre appareil !");
      return;
    }

    // Sinon, ouvrir le guide d'installation universel
    setShowIosGuide(true);
  };

  const showBanner = isVisible && !isDismissed;

  return (
    <>
      {/* BOUTON FLOTTANT D'INSTALLATION SUR MOBILE & DESKTOP */}
      {showBanner && (
        <div className={`pwa-install-banner ${isVisible ? 'is-visible' : ''}`}>
          <div className="pwa-install-content" onClick={handleInstallClick}>
            <div className="pwa-install-icon-wrapper">
              <RevizoLogo size={36} />
            </div>

            <div className="pwa-install-text">
              <span className="pwa-install-title">
                {isInstalled ? 'REVIZO est installé' : "Installer l'application REVIZO"}
              </span>
              <span className="pwa-install-desc">
                {isInstalled
                  ? 'Accès instantané depuis votre écran'
                  : 'Installez gratuitement sur votre téléphone'}
              </span>
            </div>

            <button
              type="button"
              className="pwa-install-action-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleInstallClick();
              }}
            >
              {isInstalled ? (
                <>
                  <Check size={16} strokeWidth={3} />
                  <span>Installé</span>
                </>
              ) : (
                <>
                  <Download size={16} strokeWidth={2.5} />
                  <span>Installer</span>
                </>
              )}
            </button>
          </div>

          <button
            type="button"
            className="pwa-install-close-btn"
            onClick={(e) => {
              e.stopPropagation();
              setIsDismissed(true);
            }}
            aria-label="Fermer la suggestion"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* MODAL GUIDÉE D'INSTALLATION (POUR IPHONE / IPAD & AUTRES NAVIGATEURS) */}
      {showIosGuide && (
        <div className="legal-modal-overlay" onClick={() => setShowIosGuide(false)}>
          <div
            className="legal-modal-container"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="legal-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <RevizoLogo size={34} />
                <div>
                  <h3 className="legal-modal-title">Installer REVIZO</h3>
                  <p className="legal-modal-subtitle">Sur votre écran d'accueil</p>
                </div>
              </div>
              <button
                onClick={() => setShowIosGuide(false)}
                className="legal-modal-close-btn"
                aria-label="Fermer"
                type="button"
              >
                <X size={20} />
              </button>
            </div>

            <div className="legal-modal-body">
              <div style={{ textAlign: 'center', margin: '8px 0 20px 0' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: 'var(--accent-orange-subtle)',
                  marginBottom: '12px'
                }}>
                  <Smartphone size={32} color="var(--accent-orange)" />
                </div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
                  Installation instantanée
                </h4>
                <p style={{ margin: '6px 0 0 0', fontSize: '0.9rem', color: 'var(--landing-text-muted)' }}>
                  Accédez à vos révisions même sans ouvrir votre navigateur.
                </p>
              </div>

              <div className="pwa-guide-steps">
                <div className="pwa-guide-step">
                  <div className="pwa-guide-num">1</div>
                  <div className="pwa-guide-text">
                    <strong>Sur votre navigateur mobile</strong>, appuyez sur le bouton <strong>Partager</strong>
                    <span className="pwa-guide-badge">
                      <Share size={14} /> Partager
                    </span>
                    (situé en bas sur Safari ou en haut à droite sur Chrome).
                  </div>
                </div>

                <div className="pwa-guide-step">
                  <div className="pwa-guide-num">2</div>
                  <div className="pwa-guide-text">
                    Faites défiler le menu et appuyez sur <strong>« Sur l'écran d'accueil »</strong>
                    <span className="pwa-guide-badge">
                      <PlusSquare size={14} /> Sur l'écran d'accueil
                    </span>
                  </div>
                </div>

                <div className="pwa-guide-step">
                  <div className="pwa-guide-num">3</div>
                  <div className="pwa-guide-text">
                    Appuyez sur <strong>Ajouter</strong> en haut à droite.
                    L'icône orange REVIZO s'installe immédiatement sur votre téléphone !
                  </div>
                </div>
              </div>
            </div>

            <div className="legal-modal-footer" style={{ justifyContent: 'center' }}>
              <button
                type="button"
                className="landing-hero-btn-primary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => setShowIosGuide(false)}
              >
                C'est compris !
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
