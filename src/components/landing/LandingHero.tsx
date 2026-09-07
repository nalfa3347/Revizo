import React from 'react';
import { ArrowRight } from 'lucide-react';
import { LandingPhoneMockup } from './LandingPhoneMockup';


interface LandingHeroProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
  onNavigateSection: (sectionId: string) => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenAuth,
  onNavigateSection
}) => {
  return (
    <section className="landing-hero-section">
      {/* Halo lumineux en arrière-plan */}
      <div className="landing-hero-aura" />

      <div className="landing-hero-content">
        {/* BADGE PILULE DU HAUT */}
        <div className="landing-hero-badge">
          <span>🎓</span>
          <span>Pour les étudiants ambitieux</span>
        </div>

        {/* TITRE PRINCIPAL H1 */}
        <h1 className="landing-hero-title">
          Transformez vos cours en <br />
          <span className="landing-hero-accent">fiches intelligentes</span>
        </h1>

        {/* SOUS-TITRE PERCUTANT */}
        <p className="landing-hero-subtitle">
          Importez vos documents. Revizo génère automatiquement résumés, fiches et quiz personnalisés pour réussir vos examens.
        </p>

        {/* BOUTONS D'ACTION (SANS PREUVE SOCIALE D'ÉTOILES NI AVATARS) */}
        <div className="landing-hero-ctas">
          <button
            className="landing-hero-btn-primary"
            onClick={() => onOpenAuth('signup')}
            type="button"
          >
            <span>Essayer gratuitement</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          <button
            className="landing-hero-btn-secondary"
            onClick={() => onNavigateSection('how-it-works')}
            type="button"
          >
            Voir comment ça marche
          </button>
        </div>

        {/* APERÇU INTERACTIF SMARTPHONE REVIZO AVEC CARTES FLOTTANTES & FLÈCHES COURBÉES */}
        <LandingPhoneMockup />

      </div>
    </section>
  );
};
