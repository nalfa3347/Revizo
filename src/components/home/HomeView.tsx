import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Target,
  Gem,
  Flame,
  Calculator,
  BookOpen,
  FlaskConical,
  GraduationCap,
  ArrowRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Target3DIllustration } from '../common/Target3DIllustration';
import { Subject, CourseConcept } from '../../types';

interface HomeViewProps {
  onNavigateToCourses: () => void;
  onStartRevision: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onNavigateToCourses, onStartRevision }) => {
  const { profile, progress, courseService, dataProvider } = useData();

  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [coursesCount, setCoursesCount] = useState<number>(0);
  const [weakConcepts, setWeakConcepts] = useState<CourseConcept[]>([]);

  useEffect(() => {
    let mounted = true;
    const fetchHomeData = async () => {
      try {
        const [subList, crsList, weaks] = await Promise.all([
          courseService.getSubjects(),
          courseService.getAllCourses(),
          dataProvider.getWeakConcepts()
        ]);
        if (mounted) {
          setSubjects(subList);
          setCoursesCount(crsList.length);
          setWeakConcepts(weaks);
        }
      } catch (err) {
        console.error('Erreur de chargement des données réelles d’accueil :', err);
      }
    };

    fetchHomeData();
    return () => {
      mounted = false;
    };
  }, [courseService, dataProvider]);

  // Données de progression réelles du profil Supabase
  const currentStreak = progress?.currentStreak ?? 1;
  const diamonds = progress?.diamondsBalance ?? 10;
  const level = progress?.level ?? 1;
  const xpToNext = progress?.xpToNextLevel ?? 100;
  const dailyGoalMinutes = progress?.dailyGoalMinutes ?? 15;
  const dailyProgressMinutes = progress?.dailyGoalProgressMinutes ?? 0;
  const dailyProgressPct = Math.min(
    100,
    Math.max(0, Math.round((dailyProgressMinutes / (dailyGoalMinutes || 1)) * 100))
  );
  const remainingMinutes = Math.max(0, dailyGoalMinutes - dailyProgressMinutes);

  // 10 segments pour la barre de progression (calculé d'après les minutes réelles)
  const segments = Array.from({ length: 10 }, (_, i) => i < Math.round(dailyProgressPct / 10));

  // Jours de la semaine d'après l'activité réelle enregistrée
  const dayLabels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const weeklyDaysArray = progress?.weeklyDays || [false, false, false, false, false, false, false];
  const days = dayLabels.map((label, idx) => ({
    label,
    completed: Boolean(weeklyDaysArray[idx])
  }));

  // Icône dynamique par matière
  const getSubjectIcon = (iconName?: string, name?: string) => {
    const n = (name || '').toLowerCase();
    if (n.includes('math') || iconName === 'Calculator') return <Calculator size={22} />;
    if (n.includes('fran') || iconName === 'BookOpen') return <BookOpen size={22} />;
    if (n.includes('sci') || n.includes('svt') || iconName === 'FlaskConical') return <FlaskConical size={22} />;
    return <GraduationCap size={22} />;
  };

  // Titre du défi quotidien dynamique
  const challengeTitle =
    weakConcepts.length > 0
      ? `Consolide la notion « ${weakConcepts[0].name} » pour booster ta maîtrise.`
      : coursesCount > 0
      ? 'Effectue ta session de révision quotidienne pour maintenir ta série active.'
      : 'Ajoute ton premier cours pour commencer tes révisions et débloquer les quiz.';

  return (
    <div className="home-view">
      {/* 1. Titre & Message d'accueil */}
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <p style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Bonjour, <strong>{profile?.displayName || 'Élève'}</strong> 👋
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

            {/* Barre segmentée (10 segments réels) */}
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
              {remainingMinutes > 0
                ? `Encore ${remainingMinutes} minutes pour atteindre ton objectif !`
                : 'Objectif quotidien atteint ! Félicitations 🎉'}
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
                <div
                  className="level-progress-fill"
                  style={{
                    width: `${Math.min(100, Math.max(5, 100 - (xpToNext / ((level * 150) || 100)) * 100))}%`
                  }}
                />
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

      {/* 3. Section "Mes matières" (Entièrement dynamique) */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <div className="section-header">
          <h2 className="section-title">Mes matières</h2>
          <button className="section-link" onClick={onNavigateToCourses}>
            <span>Voir tout</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {coursesCount === 0 ? (
          /* État vide si l'élève n'a pas encore de cours dans Supabase */
          <div
            className="card-white"
            style={{
              textAlign: 'center',
              padding: 'var(--space-8) var(--space-4)',
              border: '1px dashed var(--border-color)',
              backgroundColor: 'var(--surface)'
            }}
          >
            <p style={{ color: 'var(--text-secondary)', marginBottom: 'var(--space-4)', fontSize: '0.95rem' }}>
              Tu n’as pas encore de cours importé. Ajoute ton premier cours pour commencer tes révisions personnalisées.
            </p>
            <button
              className="btn btn-primary"
              onClick={onNavigateToCourses}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>Ajouter un cours</span>
              <ArrowRight size={16} />
            </button>
          </div>
        ) : (
          /* Grille des matières réelles de l'élève */
          <div className="subjects-container">
            {subjects.map(subj => {
              const mastery = Math.max(0, Math.min(100, subj.masteryScore ?? 0));
              return (
                <div
                  key={subj.id}
                  className="card-white card-white-interactive subject-card"
                  onClick={onNavigateToCourses}
                >
                  <div
                    className="subject-icon-box"
                    style={{
                      backgroundColor: `${subj.color}18`,
                      color: subj.color
                    }}
                  >
                    {getSubjectIcon(subj.icon, subj.name)}
                  </div>
                  <div className="subject-content">
                    <div className="subject-title">{subj.name}</div>
                    <div className="subject-mastery" style={{ color: subj.color }}>
                      {mastery} % <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>maîtrisé</span>
                    </div>
                    <div className="subject-progress-track">
                      <div
                        className="subject-progress-fill"
                        style={{ width: `${mastery}%`, backgroundColor: subj.color }}
                      />
                    </div>
                  </div>
                  <div
                    className="subject-level-pill"
                    style={{
                      backgroundColor: `${subj.color}15`,
                      color: subj.color
                    }}
                  >
                    Niveau {subj.level}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. Groupe Pinned / Fixe "Relever les défis" */}
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
                  {challengeTitle}
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
