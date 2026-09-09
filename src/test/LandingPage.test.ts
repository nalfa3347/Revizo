import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { LandingPage } from '../components/landing/LandingPage';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { LandingHero } from '../components/landing/LandingHero';
import { LandingPricing } from '../components/landing/LandingPricing';
import { LandingFaq } from '../components/landing/LandingFaq';

describe('REVIZO — Tests Unitaires & Intégrité de la Landing Page', () => {
  it('rend correctement le Header / Navbar avec le logo REVIZO✦ et les 4 rubriques de navigation', () => {
    const handleAuth = vi.fn();
    const handleNav = vi.fn();
    const html = renderToString(
      React.createElement(LandingNavbar, {
        onOpenAuth: handleAuth,
        onNavigateSection: handleNav
      })
    );

    // Vérification du logo
    expect(html).toContain('Revizo');
    expect(html).toContain('✦');

    // Vérification des liens de navigation
    expect(html).toContain('Fonctionnalités');
    expect(html).toContain('Comment ça marche');
    expect(html).toContain('Tarifs');
    expect(html).toContain('FAQ');

    // Vérification sélecteur de langue et boutons
    expect(html).toContain('FR');
    expect(html).toContain('Connexion');
    expect(html).toContain('Commencer');
  });

  it('rend fidèlement le Hero selon la capture : badge haut, H1 avec accent or, sous-titre et CTAs', () => {
    const handleAuth = vi.fn();
    const handleNav = vi.fn();
    const html = renderToString(
      React.createElement(LandingHero, {
        onOpenAuth: handleAuth,
        onNavigateSection: handleNav
      })
    );

    // Badge haut
    expect(html).toContain('Pour les étudiants ambitieux');

    // Titre H1 avec fiches intelligentes
    expect(html).toContain('Transformez vos cours en');
    expect(html).toContain('fiches intelligentes');
    expect(html).toContain('landing-hero-accent');

    // Sous-titre
    expect(html).toContain('Importez vos documents');
    expect(html).toContain('quiz personnalisés');

    // CTAs
    expect(html).toContain('Essayer gratuitement');
    expect(html).toContain('Voir comment ça marche');

    // Mockup Smartphone REVIZO & Tableau de bord mobile riche (Cartes réelles)
    expect(html).toContain('landing-phone-chassis');
    expect(html).toContain('mock-hero-card');
    expect(html).toContain('mock-stats-card');
    expect(html).toContain('mock-subject-card');
    expect(html).toContain('mock-challenge-card');
    expect(html).toContain('Objectif du jour');
    expect(html).toContain('Mathématiques');
    expect(html).toContain('Français');
    expect(html).toContain('Sciences &amp; SVT');
    expect(html).toContain('85 %');

    // 4 Cartes Flottantes & Flèches
    expect(html).toContain('Réviser 3x plus vite');
    expect(html).toContain('Quiz de mémorisation active');
    expect(html).toContain('85% de taux de rétention');
    expect(html).toContain('Motivation &amp; Séries');
    expect(html).toContain('landing-arrow');
  });

  it('RÈGLE STRICTE UTILISATEUR : Supprime complètement la preuve sociale (aucune étoile ni 10 000 étudiants)', () => {
    const handleAuth = vi.fn();
    const handleNav = vi.fn();
    const html = renderToString(
      React.createElement(LandingHero, {
        onOpenAuth: handleAuth,
        onNavigateSection: handleNav
      })
    );

    // Vérification qu'aucune mention d'avis / étoiles / 10 000 n'est présente
    expect(html).not.toContain('10 000');
    expect(html).not.toContain('10000');
    expect(html).not.toContain('4.8');
    expect(html).not.toContain('étoiles');
    expect(html).not.toContain('avis');
  });

  it('affiche les 4 formules tarifaires officielles en FCFA (Essai Gratuit, Essentiel, Intensif, Premium)', () => {
    const handleAuth = vi.fn();
    const html = renderToString(
      React.createElement(LandingPricing, { onOpenAuth: handleAuth })
    );

    expect(html).toContain('Essai Gratuit');
    expect(html).toContain('Essentiel');
    expect(html).toContain('Intensif');
    expect(html).toContain('Premium');

    expect(html).toContain('1 000');
    expect(html).toContain('3 000');
    expect(html).toContain('5 000');
    expect(html).toContain('FCFA / mois');
    expect(html).not.toContain('bancaire');
    expect(html).not.toContain('Carte');
  });

  it('affiche les questions fréquentes dans la section FAQ', () => {
    const html = renderToString(React.createElement(LandingFaq));
    expect(html).toContain('Quels types de documents puis-je importer');
    expect(html).toContain('moyens de paiement acceptés');
    expect(html).toContain('polycopiés au format PDF');
  });

  it('rend la Landing Page complète avec toutes ses sections intégrées', () => {
    const handleAuth = vi.fn();
    const html = renderToString(
      React.createElement(LandingPage, { onOpenAuth: handleAuth })
    );

    expect(html).toContain('landing-wrapper');
    expect(html).toContain('features');
    expect(html).toContain('how-it-works');
    expect(html).toContain('pricing');
    expect(html).toContain('faq');
    expect(html).toContain('Tous droits réservés');
  });

  it('affiche le logo REVIZO orange officiel (strictement cohérent avec le favicon)', async () => {
    const { RevizoLogo } = await import('../components/common/RevizoLogo');
    const html = renderToString(React.createElement(RevizoLogo, { size: 36 }));

    // Vérifie le dégradé orange officiel
    expect(html).toContain('#EA580C');
    expect(html).toContain('#F97316');
    // Vérifie le tracé R blanc officiel
    expect(html).toContain('M14 14H34V20C34 23.3137 31.3137 26 28 26H20C16.6863 26 14 28.6863 14 32V34H34');
    expect(html).toContain('stroke="white"');
  });

  it('affiche les contacts directs du créateur et les mentions légales dans le footer sans société enregistrée', async () => {
    const { LandingFooter } = await import('../components/landing/LandingFooter');
    const handleAuth = vi.fn();
    const handleNav = vi.fn();
    const html = renderToString(
      React.createElement(LandingFooter, {
        onOpenAuth: handleAuth,
        onNavigateSection: handleNav
      })
    );

    // Vérifie les contacts directs obligatoires
    expect(html).toContain('+228 92 88 00 10');
    expect(html).toContain('nasserpillar4@gmail.com');

    // Vérifie les liens légaux
    expect(html).toContain('Mentions Légales');
    expect(html).toMatch(/Conditions d('|&#x27;)Utilisation/);
    expect(html).toContain('Confidentialité');
  });

  it('rend la modal des Mentions Légales avec les contacts exacts, statut indépendant et hébergeurs (Vercel & Supabase)', async () => {
    const { LegalModals } = await import('../components/landing/LegalModals');
    const handleClose = vi.fn();
    const handleTab = vi.fn();
    const html = renderToString(
      React.createElement(LegalModals, {
        activeModal: 'mentions',
        onClose: handleClose,
        onSelectTab: handleTab
      })
    );

    // Contenu conforme aux exigences de l'utilisateur
    expect(html).toContain('Mentions Légales');
    expect(html).toContain('+228 92 88 00 10');
    expect(html).toContain('nasserpillar4@gmail.com');
    expect(html).toContain('Nasser');
    expect(html).toContain('Développeur indépendant');
    expect(html).toContain('Vercel');
    expect(html).toContain('Supabase');
  });

  it('vérifie la présence de l’icône officielle Apple Touch pour iPhone (apple-touch-icon.png)', async () => {
    const fs = await import('fs');
    const path = await import('path');
    const appleIconPath = path.resolve(__dirname, '../../public/apple-touch-icon.png');
    const manifestPath = path.resolve(__dirname, '../../public/manifest.json');
    const indexPath = path.resolve(__dirname, '../../index.html');

    // L'icône iPhone doit exister et être non vide
    expect(fs.existsSync(appleIconPath)).toBe(true);
    const stats = fs.statSync(appleIconPath);
    expect(stats.size).toBeGreaterThan(1000);

    // index.html doit déclarer apple-touch-icon
    const indexContent = fs.readFileSync(indexPath, 'utf-8');
    expect(indexContent).toContain('rel="apple-touch-icon"');
    expect(indexContent).toContain('/apple-touch-icon.png');

    // manifest.json doit pointer vers ?source=pwa
    const manifestContent = fs.readFileSync(manifestPath, 'utf-8');
    expect(manifestContent).toContain('"start_url": "/?source=pwa"');
  });
});


