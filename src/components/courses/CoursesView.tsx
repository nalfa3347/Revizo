import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Plus,
  X,
  BookOpen,
  Download,
  Clock,
  Sparkles,
  ArrowRight,
  FolderOpen,
  SearchX,
  RotateCw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Course } from '../../types';
import { Skeleton } from '../common/Skeleton';
import { FriendlyNotice } from '../common/FriendlyNotice';

interface CoursesViewProps {
  onAddCourse: () => void;
  onOpenCourse: (course: Course) => void;
}

export const CoursesView: React.FC<CoursesViewProps> = ({ onAddCourse, onOpenCourse }) => {
  const { courseService, network } = useData();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // Chargement des cours depuis la couche de données
  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await courseService.getAllCourses();
      setCourses(data);
    } catch (err) {
      console.error('Erreur de chargement des cours:', err);
      if (!network.isOnline) {
        setError('Tu es actuellement hors connexion. Reconnecte-toi à Internet pour synchroniser tes cours.');
      } else {
        setError('Impossible de charger tes cours pour l’instant. Réessaie dans quelques instants.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [courseService]);

  const handleAddCourse = () => {
    if (!network.isOnline) {
      setOfflineNotice("Une connexion Internet est requise pour ajouter et analyser un nouveau cours avec l’IA.");
      return;
    }
    setOfflineNotice(null);
    onAddCourse();
  };

  const handleCourseClick = (course: Course) => {
    if (!network.isOnline && !course.isDownloaded) {
      setOfflineNotice(`Le cours "${course.title}" n’a pas encore été téléchargé sur ton appareil. Une connexion Internet est requise pour le consulter.`);
      return;
    }
    setOfflineNotice(null);
    onOpenCourse(course);
  };

  // Extraction unique des matières disponibles pour les filtres
  const subjects = useMemo(() => {
    const list = Array.from(new Set(courses.map(c => c.subjectName))).filter(Boolean);
    return ['all', ...list];
  }, [courses]);

  // Filtrage combiné (Recherche texte insensible à la casse + Matière sélectionnée)
  const filteredCourses = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return courses.filter(course => {
      const matchSubject = selectedSubject === 'all' || course.subjectName === selectedSubject;
      const matchText =
        !query ||
        course.title.toLowerCase().includes(query) ||
        course.subjectName.toLowerCase().includes(query) ||
        (course.summary && course.summary.toLowerCase().includes(query));
      return matchSubject && matchText;
    });
  }, [courses, searchQuery, selectedSubject]);

  // Détection du ou des cours récemment importés (tri par date décroissante)
  const recentCourses = useMemo(() => {
    if (courses.length === 0) return [];
    return [...courses]
      .sort((a, b) => new Date(b.createdAt || b.updatedAt).getTime() - new Date(a.createdAt || a.updatedAt).getTime())
      .slice(0, 2);
  }, [courses]);

  // Formatage propre et convivial de la date sans inventer
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return null;
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short'
      });
    } catch {
      return null;
    }
  };

  // Styles de couleur par matière
  const getSubjectColorStyles = (subjectName: string) => {
    switch (subjectName.toLowerCase()) {
      case 'mathématiques':
      case 'maths':
        return { color: '#C47D2B', bg: '#FFF8F0', border: '#FCE7D0', bar: '#C47D2B' };
      case 'français':
        return { color: '#10B981', bg: '#ECFDF5', border: '#D1FAE5', bar: '#10B981' };
      case 'sciences':
      case 'svt':
        return { color: '#8B5CF6', bg: '#F5F3FF', border: '#EDE9FE', bar: '#8B5CF6' };
      case 'histoire-géo':
      case 'histoire':
        return { color: '#EA580C', bg: '#FFF3E8', border: '#FFD8BA', bar: '#EA580C' };
      default:
        return { color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7', bar: '#D97706' };
    }
  };

  return (
    <div className="courses-view">
      {/* 1. HEADER DESKTOP */}
      <div className="courses-header-desktop">
        <div className="courses-title-group">
          <h1 className="courses-main-title">Mes cours</h1>
          <p className="courses-subtitle">
            {loading
              ? 'Chargement de tes cours...'
              : `${courses.length} cours analysés et prêts pour la révision`}
          </p>
        </div>

        <button
          className="btn-add-course-primary"
          onClick={handleAddCourse}
          title="Ajouter un cours (PDF, photo)"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span>Ajouter un cours</span>
        </button>
      </div>

      {/* 2. TOP BAR MOBILE (Action Ajouter un cours) */}
      <div className="courses-mobile-top-bar">
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
          {loading ? 'Chargement...' : `${courses.length} cours enregistrés`}
        </p>
        <button
          className="btn-add-course-primary"
          onClick={handleAddCourse}
          style={{ padding: '8px 16px', fontSize: '13px' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Ajouter</span>
        </button>
      </div>

      {/* Bannière d'avertissement hors connexion contextuelle */}
      {offlineNotice && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <FriendlyNotice
            type="offline"
            message={offlineNotice}
            actionText="Fermer"
            onAction={() => setOfflineNotice(null)}
          />
        </div>
      )}

      {/* 3. BARRE DE RECHERCHE */}
      <div className="courses-search-wrapper">
        <Search size={18} className="courses-search-icon" />
        <input
          type="text"
          className="courses-search-input"
          placeholder="Rechercher par titre ou matière..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          aria-label="Rechercher un cours"
        />
        {searchQuery && (
          <button
            className="courses-search-clear"
            onClick={() => setSearchQuery('')}
            title="Effacer la recherche"
            aria-label="Effacer la recherche"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* 4. PILULES DE FILTRES PAR MATIÈRE */}
      {subjects.length > 2 && (
        <div className="courses-filter-pills" role="tablist">
          {subjects.map(subj => {
            const count =
              subj === 'all'
                ? courses.length
                : courses.filter(c => c.subjectName === subj).length;
            const label = subj === 'all' ? 'Tous les cours' : subj;
            const isActive = selectedSubject === subj;

            return (
              <button
                key={subj}
                className={`courses-filter-pill ${isActive ? 'active' : ''}`}
                onClick={() => setSelectedSubject(subj)}
                role="tab"
                aria-selected={isActive}
              >
                <span>{label}</span>
                <span className="courses-filter-pill-count">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 5. GESTION DES ERREURS */}
      {error && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <FriendlyNotice type="warning" message={error} />
          <button
            className="btn btn-secondary btn-sm"
            onClick={fetchCourses}
            style={{ marginTop: 'var(--space-2)' }}
          >
            <RotateCw size={14} /> Réessayer
          </button>
        </div>
      )}

      {/* 6. ÉTAT DE CHARGEMENT SKELETON */}
      {loading && (
        <div className="courses-grid" aria-busy="true">
          {[1, 2, 3, 4].map(idx => (
            <div key={idx} className="course-card" style={{ height: '180px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <Skeleton width="90px" height="24px" borderRadius="12px" />
                <Skeleton width="70px" height="20px" borderRadius="10px" />
              </div>
              <Skeleton width="85%" height="20px" borderRadius="4px" style={{ marginBottom: '8px' }} />
              <Skeleton width="60%" height="16px" borderRadius="4px" style={{ marginBottom: '16px' }} />
              <div style={{ marginTop: 'auto' }}>
                <Skeleton width="100%" height="8px" borderRadius="4px" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 7. ÉTAT VIDE GLOBAL (0 cours au total dans le système) */}
      {!loading && !error && courses.length === 0 && (
        <div className="courses-empty-state">
          <div className="courses-empty-icon">
            <FolderOpen size={30} strokeWidth={2.2} />
          </div>
          <h2 className="courses-empty-title">Aucun cours pour le moment</h2>
          <p className="courses-empty-desc">
            Importe ton premier cours et REVIZO créera automatiquement ta fiche de révision structurée et ton quiz interactif.
          </p>
          <button className="btn-add-course-primary" onClick={onAddCourse}>
            <Plus size={18} strokeWidth={2.5} />
            <span>+ Ajouter un cours</span>
          </button>
        </div>
      )}

      {/* 8. ÉTAT VIDE DE RECHERCHE (Recherche sans résultat) */}
      {!loading && !error && courses.length > 0 && filteredCourses.length === 0 && (
        <div className="courses-empty-state">
          <div className="courses-empty-icon" style={{ backgroundColor: '#F3F4F6', color: '#6B7280' }}>
            <SearchX size={28} />
          </div>
          <h2 className="courses-empty-title">Aucun cours trouvé</h2>
          <p className="courses-empty-desc">
            Aucun cours ne correspond à « <strong>{searchQuery}</strong> »{selectedSubject !== 'all' ? ` dans la matière ${selectedSubject}` : ''}. Essaie avec d'autres mots-clés ou modifie le filtre.
          </p>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => {
              setSearchQuery('');
              setSelectedSubject('all');
            }}
          >
            Effacer la recherche
          </button>
        </div>
      )}

      {/* 9. SECTION : COURS RÉCEMMENT IMPORTÉ (Visible si pas de filtre actif) */}
      {!loading && !error && !searchQuery && selectedSubject === 'all' && recentCourses.length > 0 && (
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div className="courses-section-header">
            <h3 className="courses-section-title">
              <Sparkles size={16} color="#EA580C" />
              <span>Dernier cours ajouté</span>
            </h3>
          </div>

          {recentCourses.slice(0, 1).map(course => {
            const style = getSubjectColorStyles(course.subjectName);
            const formattedDate = formatDate(course.createdAt || course.updatedAt);
            const progressPct = course.progressPercentage ?? 0;

            return (
              <div
                key={`featured-${course.id}`}
                className="courses-featured-card"
                onClick={() => handleCourseClick(course)}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') handleCourseClick(course);
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="course-subject-pill"
                      style={{ backgroundColor: style.bg, color: style.color, border: `1px solid ${style.border}` }}
                    >
                      {course.subjectName}
                    </span>
                    <span className="badge" style={{ backgroundColor: '#FFF3E8', color: '#EA580C', fontWeight: 700, fontSize: '11px' }}>
                      Récemment importé
                    </span>
                  </div>

                  {course.isDownloaded ? (
                    <span className="course-status-pill downloaded">
                      <Download size={12} strokeWidth={2.5} /> Téléchargé
                    </span>
                  ) : (
                    <span className="course-status-pill online" style={!network.isOnline ? { opacity: 0.6 } : undefined}>
                      {network.isOnline ? 'En ligne' : 'En ligne uniquement'}
                    </span>
                  )}
                </div>

                <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px' }}>
                  {course.title}
                </h4>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: '1.5', marginBottom: 'var(--space-4)' }}>
                  {course.summary}
                </p>

                <div className="course-card-progress-box">
                  <div className="course-card-progress-labels">
                    <span className="course-card-progress-title">Progression de révision</span>
                    <span className="course-card-progress-value" style={{ color: style.color }}>
                      {progressPct}%
                    </span>
                  </div>
                  <div className="course-card-progress-track">
                    <div
                      className="course-card-progress-fill"
                      style={{ width: `${progressPct}%`, backgroundColor: style.bar }}
                    />
                  </div>
                </div>

                <div className="course-card-footer">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {formattedDate && (
                      <>
                        <Clock size={12} />
                        <span>Ajouté le {formattedDate}</span>
                      </>
                    )}
                  </div>
                  <span className="course-card-action-link" style={{ color: style.color }}>
                    Consulter la fiche <ArrowRight size={14} />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 10. GRILLE COMPLÈTE DE TOUS LES COURS */}
      {!loading && !error && filteredCourses.length > 0 && (
        <div>
          <div className="courses-section-header">
            <h3 className="courses-section-title">
              <BookOpen size={16} color="var(--text-secondary)" />
              <span>
                {searchQuery || selectedSubject !== 'all'
                  ? `Résultats (${filteredCourses.length})`
                  : `Tous les cours (${filteredCourses.length})`}
              </span>
            </h3>
          </div>

          <div className="courses-grid">
            {filteredCourses.map(course => {
              const style = getSubjectColorStyles(course.subjectName);
              const formattedDate = formatDate(course.updatedAt || course.createdAt);
              const progressPct = course.progressPercentage ?? 0;

              return (
                <div
                  key={course.id}
                  className="course-card"
                  onClick={() => handleCourseClick(course)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleCourseClick(course);
                  }}
                  aria-label={`Ouvrir le cours ${course.title}`}
                >
                  <div className="course-card-top-row">
                    <span
                      className="course-subject-pill"
                      style={{
                        backgroundColor: style.bg,
                        color: style.color,
                        border: `1px solid ${style.border}`
                      }}
                    >
                      {course.subjectName}
                    </span>

                    {course.isDownloaded ? (
                      <span className="course-status-pill downloaded">
                        <Download size={11} strokeWidth={2.5} /> Téléchargé
                      </span>
                    ) : (
                      <span className="course-status-pill online" style={!network.isOnline ? { opacity: 0.6 } : undefined}>
                        {network.isOnline ? 'En ligne' : 'En ligne uniquement'}
                      </span>
                    )}
                  </div>

                  <h4 className="course-card-title">{course.title}</h4>
                  <p className="course-card-desc">{course.summary}</p>

                  <div className="course-card-progress-box">
                    <div className="course-card-progress-labels">
                      <span className="course-card-progress-title">Progression</span>
                      <span className="course-card-progress-value" style={{ color: style.color }}>
                        {progressPct}%
                      </span>
                    </div>
                    <div className="course-card-progress-track">
                      <div
                        className="course-card-progress-fill"
                        style={{ width: `${progressPct}%`, backgroundColor: style.bar }}
                      />
                    </div>
                  </div>

                  <div className="course-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      {formattedDate && (
                        <>
                          <Clock size={12} />
                          <span>{formattedDate}</span>
                        </>
                      )}
                    </div>
                    <span className="course-card-action-link" style={{ color: style.color }}>
                      Réviser <ArrowRight size={13} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
