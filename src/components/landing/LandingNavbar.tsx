import React, { useState } from 'react';
import { Globe, ArrowRight, Menu, X } from 'lucide-react';
import { RevizoLogo } from '../common/RevizoLogo';

interface LandingNavbarProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenAuth,
  onNavigateSection
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLinkClick = (id: string) => {
    setIsMobileMenuOpen(false);
    onNavigateSection(id);
  };

  return (
    <header className="landing-nav-sticky">
      <div className="landing-container">
        <div className="landing-nav-inner">
          {/* LOGO REVIZO STRICTEMENT IDENTIQUE AU FAVICON & EN COULEUR D'ACCENT */}
          <div className="landing-brand" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <RevizoLogo size={34} />
            <span className="landing-brand-text">
              Revizo<span className="landing-brand-sparkle">✦</span>
            </span>
          </div>

          {/* LIENS CENTRAUX */}
          <nav>
            <ul className="landing-nav-links">
              <li>
                <a
                  href="#features"
                  className="landing-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('features');
                  }}
                >
                  Fonctionnalités
                </a>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="landing-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('how-it-works');
                  }}
                >
                  Comment ça marche
                </a>
              </li>
              <li>
                <a
                  href="#pricing"
                  className="landing-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('pricing');
                  }}
                >
                  Tarifs
                </a>
              </li>
              <li>
                <a
                  href="#faq"
                  className="landing-nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick('faq');
                  }}
                >
                  FAQ
                </a>
              </li>
            </ul>
          </nav>

          {/* ACTIONS À DROITE */}
          <div className="landing-nav-actions">
            <button className="landing-lang-btn" title="Langue : Français" type="button">
              <Globe size={16} />
              <span>FR</span>
            </button>

            <button
              className="landing-btn-login"
              onClick={() => onOpenAuth('login')}
              type="button"
            >
              Connexion
            </button>

            <button
              className="landing-btn-primary-pill"
              onClick={() => onOpenAuth('signup')}
              type="button"
            >
              <span>Commencer</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>

            {/* BOUTON BURGER MOBILE */}
            <button
              className="landing-burger-btn"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label="Menu"
              type="button"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* MENU DÉROULANT MOBILE */}
      {isMobileMenuOpen && (
        <div className="landing-mobile-menu is-open">
          <a
            href="#features"
            className="landing-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('features');
            }}
          >
            Fonctionnalités
          </a>
          <a
            href="#how-it-works"
            className="landing-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('how-it-works');
            }}
          >
            Comment ça marche
          </a>
          <a
            href="#pricing"
            className="landing-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('pricing');
            }}
          >
            Tarifs
          </a>
          <a
            href="#faq"
            className="landing-nav-link"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('faq');
            }}
          >
            FAQ
          </a>

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              className="landing-btn-login"
              style={{ flex: 1, border: '1px solid var(--landing-border-subtle)', textAlign: 'center' }}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuth('login');
              }}
              type="button"
            >
              Connexion
            </button>
            <button
              className="landing-btn-primary-pill"
              style={{ flex: 1, justifyContent: 'center' }}
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenAuth('signup');
              }}
              type="button"
            >
              Commencer →
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
