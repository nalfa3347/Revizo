import React from 'react';
import {
  Wifi,
  Battery,
  Sparkles,
  Flame,
  Zap,
  BookOpen,
  Folder,
  CheckCircle2,
  TrendingUp,
  Target,
  Award,
  ArrowRight,
  Calculator,
  FlaskConical,
  Gem
} from 'lucide-react';

export const LandingPhoneMockup: React.FC = () => {
  return (
    <div className="landing-mockup-showcase">
      {/* ====================================================================
          CARTE FLOTTANTE 1 (HAUT-GAUCHE) : RÉVISER 3X PLUS VITE
          ==================================================================== */}
      <div className="landing-floating-card landing-card-top-left">
        <div className="landing-card-icon-box landing-icon-amber">
          <Sparkles size={20} />
        </div>
        <div className="landing-card-text">
          <h4>Réviser 3x plus vite</h4>
          <p>40 pages de cours transformées en fiches concises, précises et mémorables.</p>
        </div>
        {/* Flèche courbée pointant vers le smartphone */}
        <svg className="landing-arrow landing-arrow-top-left" viewBox="0 0 80 60" fill="none">
          <path
            d="M 10 20 C 35 5, 55 15, 68 42"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 58 40 L 70 45 L 72 32"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ====================================================================
          CARTE FLOTTANTE 2 (BAS-GAUCHE) : QUIZ DE MÉMORISATION ACTIVE
          ==================================================================== */}
      <div className="landing-floating-card landing-card-bottom-left">
        <div className="landing-card-icon-box landing-icon-emerald">
          <Target size={20} />
        </div>
        <div className="landing-card-text">
          <h4>Quiz de mémorisation active</h4>
          <p>Validez chaque concept clé avec des questions ciblées et explications immédiates.</p>
        </div>
        {/* Flèche courbée pointant vers le smartphone */}
        <svg className="landing-arrow landing-arrow-bottom-left" viewBox="0 0 80 60" fill="none">
          <path
            d="M 15 48 C 35 48, 55 35, 66 18"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 55 18 L 68 15 L 68 28"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ====================================================================
          SMARTPHONE CENTRAL IPHONE (TABLEAU DE BORD OFFICIEL RICHE REVIZO)
          ==================================================================== */}
      <div className="landing-phone-container">
        <div className="landing-phone-chassis">
          {/* Dynamic Island */}
          <div className="landing-phone-island">
            <span className="landing-island-camera" />
          </div>

          {/* Écran Intérieur du Téléphone */}
          <div className="landing-phone-screen">
            {/* Barre de statut iOS */}
            <div className="landing-phone-status-bar">
              <span className="landing-status-time">9:41</span>
              <div className="landing-status-icons">
                <Wifi size={13} strokeWidth={2.5} />
                <Battery size={15} strokeWidth={2.5} />
              </div>
            </div>

            {/* Zone de Défilement Interne du Tableau de Bord */}
            <div className="landing-phone-scrollable-content">
              {/* En-tête de bienvenue élève */}
              <div className="landing-phone-app-header">
                <div>
                  <span className="landing-phone-greeting">Bonjour, <strong>Julien</strong> 👋</span>
                  <span className="landing-phone-headline">Prêt pour ta révision ?</span>
                </div>
                <div className="landing-phone-avatar">JD</div>
              </div>

              {/* CARTE 1 : STATS CARD (3 COLONNES COMPACTES COMME REVIZO) */}
              <div className="mock-card mock-stats-card">
                <div className="mock-stat-col">
                  <div className="mock-stat-icon-box icon-diamond">
                    <Gem size={13} />
                  </div>
                  <div>
                    <div className="mock-stat-val">24</div>
                    <div className="mock-stat-lbl">Diamants</div>
                  </div>
                </div>

                <div className="mock-stat-col">
                  <div className="mock-stat-icon-box icon-streak">
                    <Flame size={13} />
                  </div>
                  <div>
                    <div className="mock-stat-val">5 jours</div>
                    <div className="mock-stat-lbl">Série active</div>
                  </div>
                </div>

                <div className="mock-stat-col">
                  <div className="mock-stat-icon-box icon-level">
                    4
                  </div>
                  <div>
                    <div className="mock-stat-val">Niveau 4</div>
                    <div className="mock-stat-lbl">3e Brevet</div>
                  </div>
                </div>
              </div>

              {/* CARTE 2 : CARTE HERO SOMBRE "OBJECTIF DU JOUR" */}
              <div className="mock-card mock-hero-card">
                <div className="mock-hero-header">
                  <div className="mock-hero-label">
                    <Target size={14} color="#F59E0B" />
                    <span>Objectif du jour</span>
                  </div>
                  <span className="mock-hero-badge">70 %</span>
                </div>

                <div className="mock-hero-metric">
                  <span className="mock-hero-metric-val">15 min</span>
                  <span className="mock-hero-metric-sub">de révision</span>
                </div>

                {/* 10 segments de progression de l'objectif */}
                <div className="mock-segmented-bar">
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment filled" />
                  <span className="mock-segment empty" />
                  <span className="mock-segment empty" />
                  <span className="mock-segment empty" />
                </div>

                <div className="mock-hero-footer">
                  <p className="mock-hero-text">Encore 5 minutes pour atteindre ton objectif !</p>
                  <button className="mock-hero-btn" type="button">
                    <span>Réviser</span>
                    <ArrowRight size={12} strokeWidth={2.5} />
                  </button>
                </div>
              </div>

              {/* TITRE SECTION "MES MATIÈRES" */}
              <div className="mock-section-header">
                <span className="mock-section-title">Mes matières</span>
                <span className="mock-section-link">Voir tout →</span>
              </div>

              {/* CARTE 3 : MATIÈRE MATHÉMATIQUES */}
              <div className="mock-card mock-subject-card subject-math">
                <div className="mock-subject-icon-box box-math">
                  <Calculator size={18} />
                </div>
                <div className="mock-subject-info">
                  <div className="mock-subject-top">
                    <span className="mock-subject-name">Mathématiques</span>
                    <span className="mock-subject-pill pill-math">Niveau 3e</span>
                  </div>
                  <div className="mock-subject-mastery color-math">
                    <strong>85 %</strong> maîtrisé • 32 notions
                  </div>
                  <div className="mock-progress-track">
                    <div className="mock-progress-fill bar-math" style={{ width: '85%' }} />
                  </div>
                </div>
              </div>

              {/* CARTE 4 : MATIÈRE FRANÇAIS */}
              <div className="mock-card mock-subject-card subject-french">
                <div className="mock-subject-icon-box box-french">
                  <BookOpen size={18} />
                </div>
                <div className="mock-subject-info">
                  <div className="mock-subject-top">
                    <span className="mock-subject-name">Français</span>
                    <span className="mock-subject-pill pill-french">Niveau 3e</span>
                  </div>
                  <div className="mock-subject-mastery color-french">
                    <strong>92 %</strong> maîtrisé • 28 notions
                  </div>
                  <div className="mock-progress-track">
                    <div className="mock-progress-fill bar-french" style={{ width: '92%' }} />
                  </div>
                </div>
              </div>

              {/* CARTE 5 : MATIÈRE SCIENCES & SVT */}
              <div className="mock-card mock-subject-card subject-science">
                <div className="mock-subject-icon-box box-science">
                  <FlaskConical size={18} />
                </div>
                <div className="mock-subject-info">
                  <div className="mock-subject-top">
                    <span className="mock-subject-name">Sciences &amp; SVT</span>
                    <span className="mock-subject-pill pill-science">Niveau 3e</span>
                  </div>
                  <div className="mock-subject-mastery color-science">
                    <strong>78 %</strong> maîtrisé • 20 notions
                  </div>
                  <div className="mock-progress-track">
                    <div className="mock-progress-fill bar-science" style={{ width: '78%' }} />
                  </div>
                </div>
              </div>

              {/* CARTE 6 : DÉFI DU JOUR (PINNED CHALLENGE BOX) */}
              <div className="mock-card mock-challenge-card">
                <div className="mock-challenge-icon-box">
                  <Flame size={18} color="#EA580C" />
                </div>
                <div className="mock-challenge-content">
                  <div className="mock-challenge-badge">
                    <span>Défi du jour</span>
                    <span className="mock-challenge-xp">+50 XP</span>
                  </div>
                  <p className="mock-challenge-desc">Consolide la notion « Fonctions affines »</p>
                </div>
                <button className="mock-challenge-btn" type="button">
                  <span>Relever</span>
                </button>
              </div>
            </div>

            {/* Barre de navigation inférieure officielle (4 onglets REVIZO) */}
            <div className="landing-phone-bottom-nav">
              <div className="landing-phone-nav-item active">
                <BookOpen size={16} />
                <span>Accueil</span>
              </div>
              <div className="landing-phone-nav-item">
                <CheckCircle2 size={16} />
                <span>Révision</span>
              </div>
              <div className="landing-phone-nav-item">
                <Folder size={16} />
                <span>Mes cours</span>
              </div>
              <div className="landing-phone-nav-item">
                <Zap size={16} />
                <span>Quiz</span>
              </div>
            </div>

            {/* Barre Home Indicator iPhone */}
            <div className="landing-phone-home-indicator" />
          </div>
        </div>
      </div>

      {/* ====================================================================
          CARTE FLOTTANTE 3 (HAUT-DROITE) : 85% DE TAUX DE RÉTENTION
          ==================================================================== */}
      <div className="landing-floating-card landing-card-top-right">
        <div className="landing-card-icon-box landing-icon-indigo">
          <TrendingUp size={20} />
        </div>
        <div className="landing-card-text">
          <h4>85% de taux de rétention</h4>
          <p>Suivez votre progression en direct et ciblez vos lacunes sans perte de temps.</p>
        </div>
        {/* Flèche courbée pointant vers le smartphone */}
        <svg className="landing-arrow landing-arrow-top-right" viewBox="0 0 80 60" fill="none">
          <path
            d="M 65 20 C 45 5, 25 15, 12 42"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 22 40 L 10 45 L 8 32"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* ====================================================================
          CARTE FLOTTANTE 4 (BAS-DROITE) : MOTIVATION & SÉRIES QUOTIDIENNES
          ==================================================================== */}
      <div className="landing-floating-card landing-card-bottom-right">
        <div className="landing-card-icon-box landing-icon-orange">
          <Award size={20} />
        </div>
        <div className="landing-card-text">
          <h4>Motivation & Séries</h4>
          <p>Gagnez des diamants 💎, conservez vos 3 énergies ⚡ et gardez votre série 🔥.</p>
        </div>
        {/* Flèche courbée pointant vers le smartphone */}
        <svg className="landing-arrow landing-arrow-bottom-right" viewBox="0 0 80 60" fill="none">
          <path
            d="M 65 48 C 45 48, 25 35, 14 18"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d="M 25 18 L 12 15 L 12 28"
            stroke="#1E2022"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
};
