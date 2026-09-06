import React from 'react';
import { createPortal } from 'react-dom';
import {
  Target,
  Gem,
  Flame,
  Calculator,
  BookOpen,
  FlaskConical,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Target3DIllustration } from '../common/Target3DIllustration';

interface HomeViewProps {
  onNavigateToCourses: () => void;
  onStartRevision: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateToCourses, onStartRevision }) => {
  const { profile, progress } = useData();

  // Données de progression (valeurs par défaut fidèles aux captures)
  const currentStreak = progress?.currentStreak ?? 12;
  const diamonds = progress?.diamondsBalance ?? 24;
  const level = progress?.level ?? 8;
  const xpToNext = progress?.xpToNextLevel ?? 260;
  const dailyGoalMinutes = progress?.dailyGoalMinutes ?? 15;
  const dailyProgressPct = 70; // 7 segments sur 10

  // 10 segments pour la barre de progression
  const segments = Array.from({ length: 10 }, (_, i) => i < 7);

  // Jours de la semaine
  const days = [
    { label: 'L', completed: true },
    { label: 'M', completed: true },
    { label: 'M', completed: true },
    { label: 'J', completed: true },
    { label: 'V', completed: true },
    { label: 'S', completed: true },
    { label: 'D', completed: false }
  ];

  return (
    <div className="home-view">
      {/* 1. Titre & Message d'accueil */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Bonjour, <strong>{profile?.displayName || 'Nasser'}</strong> 👋
        </p>
        <h1 style={{ fontSize: '1.9rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
          Prêt pour ta révision ?
        </h1>
      </div>

      {/* 2. Section Supérieure : Hero Card (Objectif du jour) + Stats Card */}
      <div className="home-top-grid" style={{ display: 'grid', gap: 'var(--space-5)', marginBottom: 'var(--space-8)' }}>
        {/* CARTE HERO SOMBRE : OBJECTIF DU JOUR */}
        <div className="hero-card">
          <div>
            <div className="hero-header">
              <Target size={18} color="#F59E0B" />
              <span>Objectif du jour</span>
            </div>

            <div className="hero-title-row">
              <span className="hero-title-large">{dailyGoalMinutes} min</span>
              <span className="hero-title-suffix">de révision</span>
            </div>

            {/* Barre segmentée (10 segments) */}
            <div className="segmented-progress-row">
              <div className="segmented-progress-bar">
                {segments.map((filled, idx) => (
                  <div
                    key={idx}
                    className={`progress-segment ${filled ? 'filled' : ''}`}
                  />
                ))}
              </div>
              <span className="progress-pct-label">{dailyProgressPct} %</span>
            </div>

            <p className="hero-subtitle">
              Encore 5 minutes pour atteindre ton objectif !
            </p>
          </div>

          {/* Bouton principal "Réviser →" */}
          <button className="btn-hero-action" onClick={onStartRevision}>
            <span>Réviser</span>
            <ArrowRight size={18} strokeWidth={2.5} />
          </button>

          {/* Illustration 3D Target en arrière-plan à droite */}
          <div className="hero-target-illustration">
            <Target3DIllustration size={145} />
          </div>
        </div>

        {/* STATS CARD DESKTOP (Affichée sur écran large) */}
        <div className="card-white desktop-stats-card desktop-only-block">
          {/* Ligne 1 : Diamants */}
          <div className="stat-row-item">
            <div className="stat-icon-badge stat-icon-diamond">
              <Gem size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">{diamonds}</div>
              <div className="stat-label-muted">Diamants</div>
            </div>
          </div>

          {/* Ligne 2 : Série en cours */}
          <div className="stat-row-item">
            <div className="stat-icon-badge stat-icon-streak">
              <Flame size={20} />
            </div>
            <div className="stat-content">
              <div className="stat-value-large">{currentStreak} jours</div>
              <div className="stat-label-muted">Série en cours</div>
              <div className="weekly-days-row">
                {days.map((day, idx) => (
                  <span
                    key={idx}
                    className={`day-pill ${day.completed ? 'completed' : ''}`}
                  >
                    {day.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Ligne 3 : Niveau */}
          <div className="stat-row-item" style={{ borderBottom: 'none' }}>
            <div className="stat-icon-badge stat-icon-level">
              {level}
            </div>
            <div className="stat-content">
              <div className="stat-value-large">Niveau {level}</div>
              <div className="stat-label-muted">{xpToNext} XP avant le niveau {level + 1}</div>
              <div className="level-progress-bar">
                <div className="level-progress-fill" style={{ width: '65%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* STATS CARD MOBILE (3 colonnes compactes) */}
      <div className="card-white mobile-stats-card mobile-only-block">
        <div className="mobile-stat-col">
          <div className="mobile-stat-icon stat-icon-diamond">
            <Gem size={16} />
          </div>
          <div className="mobile-stat-info">
            <div className="mobile-stat-val">{diamonds}</div>
            <div className="mobile-stat-lbl">Diamants</div>
          </div>
        </div>

        <div className="mobile-stat-col">
          <div className="mobile-stat-icon stat-icon-streak">
            <Flame size={16} />
          </div>
          <div className="mobile-stat-info">
            <div className="mobile-stat-val">{currentStreak} jours</div>
            <div className="mobile-stat-lbl">Série en cours</div>
          </div>
        </div>

        <div className="mobile-stat-col">
          <div className="mobile-stat-icon stat-icon-level" style={{ width: '28px', height: '28px', fontSize: '12px' }}>
            {level}
          </div>
          <div className="mobile-stat-info">
            <div className="mobile-stat-val">Niveau {level}</div>
            <div className="mobile-stat-lbl">{xpToNext} XP restants</div>
          </div>
        </div>
      </div>

      {/* 3. Section "Mes matières" */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <h2 className="section-title">Mes matières</h2>
          <button className="section-link" onClick={onNavigateToCourses}>
            <span>Voir tout</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Grille Desktop / Liste Mobile */}
        <div className="subjects-container">
          {/* Matière 1 : Mathématiques */}
          <div className="card-white card-white-interactive subject-card" onClick={onNavigateToCourses}>
            <div className="subject-icon-box" style={{ backgroundColor: 'var(--subject-math-bg)', color: 'var(--subject-math)' }}>
              <Calculator size={22} />
            </div>
            <div className="subject-content">
              <div className="subject-title">Mathématiques</div>
              <div className="subject-mastery" style={{ color: 'var(--subject-math-text)' }}>
                78 % <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>maîtrisé</span>
              </div>
              <div className="subject-progress-track">
                <div className="subject-progress-fill" style={{ width: '78%', backgroundColor: 'var(--subject-math)' }} />
              </div>
            </div>
            <div className="subject-level-pill" style={{ backgroundColor: 'var(--subject-math-badge)', color: 'var(--subject-math-text)' }}>
              ★ Niveau 6
            </div>
          </div>

          {/* Matière 2 : Français */}
          <div className="card-white card-white-interactive subject-card" onClick={onNavigateToCourses}>
            <div className="subject-icon-box" style={{ backgroundColor: 'var(--subject-french-bg)', color: 'var(--subject-french)' }}>
              <BookOpen size={22} />
            </div>
            <div className="subject-content">
              <div className="subject-title">Français</div>
              <div className="subject-mastery" style={{ color: 'var(--subject-french-text)' }}>
                64 % <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>maîtrisé</span>
              </div>
              <div className="subject-progress-track">
                <div className="subject-progress-fill" style={{ width: '64%', backgroundColor: 'var(--subject-french)' }} />
              </div>
            </div>
            <div className="subject-level-pill" style={{ backgroundColor: 'var(--subject-french-badge)', color: 'var(--subject-french-text)' }}>
              Niveau 5
            </div>
          </div>

          {/* Matière 3 : Sciences */}
          <div className="card-white card-white-interactive subject-card" onClick={onNavigateToCourses}>
            <div className="subject-icon-box" style={{ backgroundColor: 'var(--subject-science-bg)', color: 'var(--subject-science)' }}>
              <FlaskConical size={22} />
            </div>
            <div className="subject-content">
              <div className="subject-title">Sciences</div>
              <div className="subject-mastery" style={{ color: 'var(--subject-science-text)' }}>
                42 % <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>maîtrisé</span>
              </div>
              <div className="subject-progress-track">
                <div className="subject-progress-fill" style={{ width: '42%', backgroundColor: 'var(--subject-science)' }} />
              </div>
            </div>
            <div className="subject-level-pill" style={{ backgroundColor: 'var(--subject-science-badge)', color: 'var(--subject-science-text)' }}>
              ⬡ Niveau 3
            </div>
          </div>
        </div>
      </div>

      {/* 4. Groupe Pinned / Fixe "Relever les défis" (attaché directement au body pour un fixed 100% viewport) */}
      {createPortal(
        <div className="pinned-challenge-container">
          <div className="pinned-challenge-box">
            <div className="pinned-challenge-info">
              <div className="pinned-challenge-icon">
                <Target3DIllustration size={44} withSparkles={false} />
              </div>
              <div className="pinned-challenge-text">
                <div className="pinned-challenge-badge">
                  <Flame size={14} color="#EA580C" />
                  <span>Défi du jour</span>
                  <span className="pinned-challenge-xp">+50 XP</span>
                </div>
                <p className="pinned-challenge-title">
                  Réponds correctement à 10 questions de mathématiques.
                </p>
              </div>
            </div>

            <button className="btn-breathe-challenge" onClick={onStartRevision}>
              <span>Relever les défis</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
