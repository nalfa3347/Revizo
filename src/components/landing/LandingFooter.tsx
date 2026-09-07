import React, { useState } from 'react';
import { ArrowRight, Mail, MessageCircle } from 'lucide-react';
import { RevizoLogo } from '../common/RevizoLogo';
import { LegalModals, LegalModalType } from './LegalModals';

interface LandingFooterProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onOpenAuth,
  onNavigateSection
}) => {
  const [activeModal, setActiveModal] = useState<LegalModalType>(null);

  return (
    <>
      <footer className="landing-footer">
        <div className="landing-container">
          {/* BANNIÈRE CTA DE PIED DE PAGE */}
          <div
            style={{
              background: 'var(--landing-bg-subtle)',
              borderRadius: '24px',
              padding: '48px 32px',
              textAlign: 'center',
              marginBottom: '60px',
              border: '1px solid var(--landing-border-subtle)'
            }}
          >
            <h2
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: 'clamp(1.8rem, 3.5vw, 2.5rem)',
                fontWeight: 800,
                marginBottom: '16px',
                color: 'var(--landing-text-main)'
              }}
            >
              Prêt à transformer votre manière de réviser ?
            </h2>
            <p
              style={{
                fontSize: '1.05rem',
                color: 'var(--landing-text-muted)',
                maxWidth: '560px',
                margin: '0 auto 28px auto',
                lineHeight: 1.6
              }}
            >
              Importez votre premier document gratuitement et découvrez la puissance de REVIZO dès aujourd’hui.
            </p>
            <button
              className="landing-hero-btn-primary"
              onClick={() => onOpenAuth('signup')}
              type="button"
            >
              <span>Créer mon compte gratuit</span>
              <ArrowRight size={18} strokeWidth={2.5} />
            </button>
          </div>

          {/* CONTACT RAPIDE CRÉATEUR */}
          <div className="landing-footer-creator-strip">
            <div className="creator-strip-info">
              <span className="creator-badge">Assistance directe & créateur</span>
              <span className="creator-text">
                Un problème ou une suggestion ? Contactez directement le concepteur :
              </span>
            </div>
            <div className="creator-strip-actions">
              <a
                href="https://wa.me/22892880010"
                target="_blank"
                rel="noopener noreferrer"
                className="creator-contact-btn whatsapp"
                title="Écrire sur WhatsApp"
              >
                <MessageCircle size={15} />
                <span>+228 92 88 00 10</span>
              </a>
              <a
                href="mailto:nasserpillar4@gmail.com"
                className="creator-contact-btn email"
                title="Envoyer un email"
              >
                <Mail size={15} />
                <span>nasserpillar4@gmail.com</span>
              </a>
            </div>
          </div>

          {/* LIENS DU BAS & NAVIGATION */}
          <div className="landing-footer-bottom">
            {/* LOGO STRICTEMENT IDENTIQUE AU FAVICON */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <RevizoLogo size={28} />
              <span style={{ fontWeight: 800, fontSize: '1.15rem' }}>
                Revizo<span className="landing-brand-sparkle">✦</span>
              </span>
            </div>

            {/* SECTIONS DE NAVIGATION */}
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
              <a
                href="#features"
                className="landing-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateSection('features');
                }}
              >
                Fonctionnalités
              </a>
              <a
                href="#how-it-works"
                className="landing-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateSection('how-it-works');
                }}
              >
                Comment ça marche
              </a>
              <a
                href="#pricing"
                className="landing-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateSection('pricing');
                }}
              >
                Tarifs
              </a>
              <a
                href="#faq"
                className="landing-nav-link"
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateSection('faq');
                }}
              >
                FAQ
              </a>
            </div>

            {/* LIENS LÉGAUX & CONTACTS */}
            <div className="landing-footer-legal-links">
              <button
                type="button"
                className="landing-legal-link-btn"
                onClick={() => setActiveModal('mentions')}
              >
                Mentions Légales
              </button>
              <span className="landing-legal-sep">•</span>
              <button
                type="button"
                className="landing-legal-link-btn"
                onClick={() => setActiveModal('cgu')}
              >
                Conditions d'Utilisation
              </button>
              <span className="landing-legal-sep">•</span>
              <button
                type="button"
                className="landing-legal-link-btn"
                onClick={() => setActiveModal('confidentialite')}
              >
                Confidentialité
              </button>
            </div>

            <div className="landing-footer-copy">
              © {new Date().getFullYear()} REVIZO. Tous droits réservés.
            </div>
          </div>
        </div>
      </footer>

      {/* MODAL MENTIONS LÉGALES & CGU */}
      <LegalModals
        activeModal={activeModal}
        onClose={() => setActiveModal(null)}
        onSelectTab={(tab) => setActiveModal(tab)}
      />
    </>
  );
};
