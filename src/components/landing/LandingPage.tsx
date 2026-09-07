import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { LandingHero } from './LandingHero';
import { LandingFeatures } from './LandingFeatures';
import { LandingHowItWorks } from './LandingHowItWorks';
import { LandingPricing } from './LandingPricing';
import { LandingFaq } from './LandingFaq';
import { LandingFooter } from './LandingFooter';
import { PwaInstallButton } from './PwaInstallButton';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  const handleNavigateSection = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-wrapper">
      {/* NAVBAR AVEC LOGO REVIZO IDENTIQUE AU FAVICON */}
      <LandingNavbar
        onOpenAuth={onOpenAuth}
        onNavigateSection={handleNavigateSection}
      />

      {/* HERO SECTION CONFORME AU SCREENSHOT */}
      <main>
        <LandingHero
          onOpenAuth={onOpenAuth}
          onNavigateSection={handleNavigateSection}
        />

        {/* FONCTIONNALITÉS PHARES */}
        <LandingFeatures />

        {/* COMMENT ÇA MARCHE */}
        <LandingHowItWorks />

        {/* GRILLE TARIFAIRE OFFICIELLE EN FCFA */}
        <LandingPricing onOpenAuth={onOpenAuth} />

        {/* FOIRE AUX QUESTIONS */}
        <LandingFaq />
      </main>

      {/* PIED DE PAGE SOBRE & ÉLÉGANT AVEC CONTACTS DIRECTS ET MENTIONS LÉGALES */}
      <LandingFooter
        onOpenAuth={onOpenAuth}
        onNavigateSection={handleNavigateSection}
      />

      {/* BOUTON FLOTTANT D'INSTALLATION INSTANTANÉE AU DÉFILEMENT (PWA) */}
      <PwaInstallButton />
    </div>
  );
};
