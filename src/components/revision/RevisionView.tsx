import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  FileText,
  HelpCircle,
  CheckSquare,
  Pencil,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Calculator,
  BookOpen,
  FlaskConical,
  Download,
  Check,
  RotateCw,
  FileUp
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { Course, Revision, Quiz } from '../../types';
import { PdfDocIcon, CameraDocIcon, MedalAwardIcon } from './RevisionIcons';
import { FriendlyNotice } from '../common/FriendlyNotice';
import { ImportProcessingModal } from '../import/ImportProcessingModal';
import { QuizPlayerModal } from '../quiz/QuizPlayerModal';
import { PipelineProgress, PipelineResult } from '../../services/ai/AIOrchestrator';

interface RevisionViewProps {
  onNavigateToCourses: () => void;
  onStartQuiz: (course: Course) => void;
  onReadingChange?: (isReading: boolean) => void;
  registerBackHandler?: (handler: () => void) => void;
  initialCourse?: Course | null;
}

export const RevisionView: React.FC<RevisionViewProps> = ({
  onNavigateToCourses,
  onStartQuiz,
  onReadingChange,
  registerBackHandler,
  initialCourse
}) => {
  const { revisionService, courseService, network, aiOrchestrator, profile } = useData();

  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeRevision, setActiveRevision] = useState<Revision | null>(null);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [offlineNotice, setOfflineNotice] = useState<string | null>(null);

  // États du pipeline d'importation et d'orchestration IA
  const [pipelineProgress, setPipelineProgress] = useState<PipelineProgress | null>(null);
  const [pipelineResult, setPipelineResult] = useState<PipelineResult | null>(null);
  const [importingFileName, setImportingFileName] = useState<string | null>(null);
  const [importedCourses, setImportedCourses] = useState<Course[]>([]);
  const [realCourses, setRealCourses] = useState<Course[]>([]);
  const [activeQuizToPlay, setActiveQuizToPlay] = useState<{ course: Course; quiz: Quiz } | null>(null);

  const fileInputPdfRef = useRef<HTMLInputElement>(null);
  const fileInputCameraRef = useRef<HTMLInputElement>(null);

  const handleBack = () => {
    setSelectedCourse(null);
    setActiveRevision(null);
    onReadingChange?.(false);
  };

  useEffect(() => {
    if (registerBackHandler) {
      registerBackHandler(handleBack);
    }
  }, [registerBackHandler]);

  useEffect(() => {
    let mounted = true;
    const fetchCourses = async () => {
      try {
        const crs = await courseService.getAllCourses();
        if (mounted) {
          setRealCourses(crs);
        }
      } catch (err) {
        console.error('Erreur lors du chargement des cours :', err);
      }
    };
    fetchCourses();
    return () => {
      mounted = false;
    };
  }, [courseService, pipelineResult]);

  useEffect(() => {
    if (initialCourse) {
      handleOpenCourse(initialCourse.id, initialCourse.title, initialCourse.subjectName);
    } else {
      setSelectedCourse(null);
      setActiveRevision(null);
      onReadingChange?.(false);
    }
  }, [initialCourse]);

  const getCourseStyle = (subjectName: string) => {
    const s = (subjectName || '').toLowerCase();
    if (s.includes('math')) return { color: '#C47D2B', bgColor: '#FDF2E7', icon: Calculator };
    if (s.includes('fran')) return { color: '#10B981', bgColor: '#ECFDF5', icon: BookOpen };
    if (s.includes('sci') || s.includes('svt')) return { color: '#8B5CF6', bgColor: '#F5F3FF', icon: FlaskConical };
    return { color: '#EA580C', bgColor: '#FFF3E8', icon: FileText };
  };

  // Fusionner les cours enregistrés avec les cours nouvellement importés lors de la session
  const combinedCourses = [
    ...importedCourses,
    ...realCourses.filter(rc => !importedCourses.some(ic => ic.id === rc.id))
  ];

  const allRecentCourses = combinedCourses.map(c => {
    const style = getCourseStyle(c.subjectName);
    return {
      id: c.id,
      subjectName: c.subjectName,
      title: c.title,
      progress: c.progressPercentage || 0,
      color: style.color,
      bgColor: style.bgColor,
      icon: style.icon
    };
  });

  // Gestion de l'ouverture d'un cours pour lire sa fiche détaillée
  const handleOpenCourse = async (courseId: string, courseTitle: string, subjectName: string) => {
    let rev = await revisionService.getRevisionForCourse(courseId);
    if (!rev) {
      rev = {
        id: `rev-${courseId}`,
        courseId,
        courseTitle,
        title: `Fiche Essentielle — ${courseTitle}`,
        summary: `Synthèse pédagogique structurée pour réviser efficacement ${courseTitle} en ${subjectName}.`,
        sections: [
          {
            id: 'sec-1',
            order: 1,
            title: '1. Notions Fondamentales',
            content: `Définitions et principes clés à retenir pour maîtriser le chapitre "${courseTitle}".`,
            keyTakeaways: [
              'Comprendre les mécanismes principaux.',
              'Identifier les étapes clés de la méthode.',
              'Savoir appliquer la démarche dans les exercices types.'
            ]
          }
        ],
        totalSections: 1,
        keyConcepts: [courseTitle],
        rulesFormulas: [],
        isDownloaded: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Garde hors-connexion (Phase 13 & 25)
    if (!network.isOnline && !rev.isDownloaded) {
      setOfflineNotice(`La fiche "${courseTitle}" n’a pas encore été téléchargée sur votre appareil. Une connexion Internet est requise pour la consulter.`);
      return;
    }

    setOfflineNotice(null);
    setSelectedCourse({
      id: courseId,
      userId: profile?.id || '',
      subjectId: `sbj-${subjectName.toLowerCase()}`,
      subjectName,
      title: courseTitle,
      summary: rev.summary,
      difficulty: 3,
      status: 'ready',
      conceptsCount: 4,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setActiveRevision(rev);
    onReadingChange?.(true);
  };

  // Téléchargement réel du PDF sur l'appareil
  const handleDownloadPDF = async (rev: Revision) => {
    setIsDownloading(true);
    const ok = await revisionService.downloadRevisionPDF(rev);
    setIsDownloading(false);
    if (ok) {
      setDownloadSuccessMsg(`Révision "${rev.title}" téléchargée sur votre appareil.`);
      setActiveRevision(prev => prev ? { ...prev, isDownloaded: true } : null);
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    }
  };

  // Déclencheurs des boutons d'action d'import avec garde hors-connexion (Phase 25)
  const handleTriggerPdf = () => {
    if (!network.isOnline) {
      setOfflineNotice("Une connexion Internet est requise pour importer et analyser un cours avec l’IA.");
      return;
    }
    setOfflineNotice(null);
    fileInputPdfRef.current?.click();
  };

  const handleTriggerCamera = () => {
    if (!network.isOnline) {
      setOfflineNotice("Une connexion Internet est requise pour photographier et analyser un cours avec l’IA.");
      return;
    }
    setOfflineNotice(null);
    fileInputCameraRef.current?.click();
  };

  // Traitement réel de bout en bout du fichier importé
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, _source: 'pdf' | 'photo') => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Réinitialisation du champ pour permettre de re-sélectionner le même fichier si besoin
    e.target.value = '';

    setImportingFileName(file.name);
    setPipelineResult(null);

    // Initialisation du statut de traitement
    setPipelineProgress({
      stage: 'extracting',
      message: 'Lecture et analyse de ton cours…',
      percent: 20
    });

    try {
      const result = await aiOrchestrator.processCourseDocument(file, profile!.id, (p) => {
        setPipelineProgress(p);
      });
      setPipelineResult(result);
      setImportedCourses(prev => [result.course, ...prev]);
    } catch (err: any) {
      console.error('Erreur lors du traitement du document :', err);
      setPipelineProgress({
        stage: 'error',
        message: 'Impossible de lire le document. Vérifie son format et réessaie.',
        percent: 0
      });
    }
  };

  // Ouverture directe de la fiche de révision générée
  const handleViewImportedRevision = (course: Course, revision: Revision) => {
    setPipelineProgress(null);
    setPipelineResult(null);
    setSelectedCourse(course);
    setActiveRevision(revision);
    onReadingChange?.(true);
  };

  // Démarrage direct du quiz interactif généré à partir des concepts
  const handleStartImportedQuiz = (course: Course, quiz: Quiz) => {
    setPipelineProgress(null);
    setPipelineResult(null);
    if (onStartQuiz) {
      onStartQuiz(course);
    }
    setActiveQuizToPlay({ course, quiz });
  };

  // VUE DE LECTURE DE FICHE RÉVISÉE (Éditoriale, Premium, Confortable)
  if (selectedCourse && activeRevision) {
    // Si hors connexion et fiche non téléchargée : écran de garde élégant sans jargon
    if (!network.isOnline && !activeRevision.isDownloaded) {
      return (
        <div className="fiche-reader-container">
          <div className="desktop-reader-header">
            <button
              className="btn-desktop-back"
              onClick={handleBack}
              title="Retour à l'espace Révision"
            >
              <ArrowLeft size={16} strokeWidth={2.5} />
              <span>Révision</span>
            </button>
          </div>
          <div style={{ marginTop: 'var(--space-6)', maxWidth: '640px', margin: 'var(--space-6) auto' }}>
            <FriendlyNotice
              type="offline"
              title="Fiche non enregistrée sur cet appareil"
              message="Cette fiche de révision n’a pas encore été téléchargée. Une connexion Internet est requise pour la consulter."
              actionText="Retour aux révisions"
              onAction={handleBack}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="fiche-reader-container">
        {/* Navigation retour Desktop (discrète et élégante, masquée sur mobile où le header supérieur l'affiche) */}
        <div className="desktop-reader-header">
          <button
            className="btn-desktop-back"
            onClick={handleBack}
            title="Retour à l'espace Révision"
          >
            <ArrowLeft size={16} strokeWidth={2.5} />
            <span>Révision</span>
          </button>
        </div>

        {/* Message de notification si téléchargé */}
        {downloadSuccessMsg && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <FriendlyNotice
              type="success"
              title="Téléchargement réussi"
              message={downloadSuccessMsg}
            />
          </div>
        )}

        {/* FEUILLE / DOCUMENT DE LA FICHE PÉDAGOGIQUE UNIFIÉE */}
        <article className="fiche-document-sheet">
          {/* EN-TÊTE D'IDENTITÉ DE LA FICHE */}
          <header className="fiche-identity-header">
            {/* 1. Matière */}
            <div className="fiche-subject-badge">
              <span>{selectedCourse.subjectName}</span>
            </div>

            {/* 2. Titre de la fiche */}
            <h1 className="fiche-main-title">
              {activeRevision.title}
            </h1>

            {/* 3. Information secondaire */}
            <p className="fiche-course-subtitle">
              Cours : {activeRevision.courseTitle}
            </p>

            {/* Indicateur de disponibilité hors connexion */}
            {!network.isOnline && activeRevision.isDownloaded && (
              <div style={{ marginTop: 'var(--space-2)' }}>
                <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', fontWeight: 600, fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <Check size={13} strokeWidth={2.5} /> Fiche consultable hors-ligne (Enregistrée sur cet appareil)
                </span>
              </div>
            )}

            {/* 4. Action de Téléchargement Principale */}
            <div className="fiche-action-row">
              <button
                className={`btn-download-fiche ${activeRevision.isDownloaded ? 'downloaded' : ''}`}
                onClick={() => handleDownloadPDF(activeRevision)}
                disabled={isDownloading || !network.isOnline}
                aria-label="Télécharger la révision"
              >
                {isDownloading ? (
                  <>
                    <RotateCw size={18} className="animate-spin" />
                    <span>Préparation du document...</span>
                  </>
                ) : activeRevision.isDownloaded ? (
                  <>
                    <Check size={18} strokeWidth={2.5} />
                    <span>
                      {!network.isOnline
                        ? "Fiche disponible hors-ligne (Enregistrée)"
                        : "Fiche enregistrée sur l'appareil (Re-télécharger)"}
                    </span>
                  </>
                ) : (
                  <>
                    <Download size={18} strokeWidth={2.5} />
                    <span>Télécharger la révision</span>
                  </>
                )}
              </button>
            </div>
          </header>

          {/* SÉPARATION ÉLÉGANTE */}
          <div className="fiche-divider" />

          {/* 7. CARTE : RÉSUMÉ ESSENTIEL */}
          <section className="resume-essentiel-box" aria-label="Résumé essentiel">
            <div className="resume-essentiel-header">
              <Sparkles size={16} color="#C47D2B" strokeWidth={2.2} />
              <h2 className="resume-essentiel-title">Résumé essentiel</h2>
            </div>
            <p className="resume-essentiel-text">
              {activeRevision.summary}
            </p>
          </section>

          {/* 8. SECTIONS ÉDITORIALES DE RÉVISION */}
          <div className="fiche-sections-flow">
            {activeRevision.sections.map((section) => (
              <section key={section.id} className="fiche-editorial-section">
                {/* Titre de la section */}
                <h3 className="fiche-section-title">
                  {section.title}
                </h3>

                {/* Texte explicatif fluide */}
                <p className="fiche-section-content">
                  {section.content}
                </p>

                {/* Bloc « À retenir » bienveillant et structuré */}
                {section.keyTakeaways && section.keyTakeaways.length > 0 && (
                  <div className="fiche-takeaways-box">
                    <div className="fiche-takeaways-header">
                      <span className="fiche-takeaways-tag">À retenir</span>
                    </div>
                    <ul className="fiche-takeaways-list">
                      {section.keyTakeaways.map((item, idx) => (
                        <li key={idx} className="fiche-takeaways-item">
                          <span className="fiche-takeaways-bullet">•</span>
                          <span className="fiche-takeaways-text">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        </article>
      </div>
    );
  }

  // VUE PRINCIPALE CONFORME À LA RÉFÉRENCE VISUELLE OFFICIELLE
  return (
    <div className="revision-main-container">
      {/* Inputs cachés pour l'import réel */}
      <input
        type="file"
        ref={fileInputPdfRef}
        accept="application/pdf"
        style={{ display: 'none' }}
        onChange={e => handleFileChange(e, 'pdf')}
      />
      <input
        type="file"
        ref={fileInputCameraRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={e => handleFileChange(e, 'photo')}
      />

      {/* Titre Desktop uniquement (sur mobile, il est dans le header de page) */}
      <div className="desktop-only-block" style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
          Révision
        </h1>
      </div>

      {/* Bannière d'avertissement hors-connexion contextuelle */}
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

      {/* 1. GRANDE CARTE : "COMMENCE UNE NOUVELLE RÉVISION" */}
      <div className="revision-hero-card">
        <div className="revision-hero-headings">
          <h2 className="revision-hero-title">
            Commence une<br />nouvelle révision
          </h2>
          <p className="revision-hero-desc">
            Importe ton cours et laisse RÉVIZO<br />
            créer ton parcours de révision avec l’IA.
          </p>
        </div>

        {/* 2 ACTIONS CÔTE À CÔTE */}
        <div className="import-cards-row">
          {/* Action 1 : IMPORTER UN PDF */}
          <div className="import-action-card" onClick={handleTriggerPdf} role="button" tabIndex={0}>
            <div className="import-card-icon">
              <PdfDocIcon size={42} color="#C47D2B" />
            </div>
            <div className="import-card-title">IMPORTER UN PDF</div>
            <p className="import-card-sub">
              Importer un cours depuis<br />ton téléphone
            </p>
          </div>

          {/* Action 2 : PRENDRE UNE PHOTO */}
          <div className="import-action-card" onClick={handleTriggerCamera} role="button" tabIndex={0}>
            <div className="import-card-icon">
              <CameraDocIcon size={42} color="#C47D2B" />
            </div>
            <div className="import-card-title">PRENDRE UNE PHOTO</div>
            <p className="import-card-sub">
              Photographier une page<br />de ton cours
            </p>
          </div>
        </div>

        {/* Mention des formats supportés */}
        <div className="import-supported-formats">
          <FileUp size={14} color="#9CA3AF" />
          <span>PDF, JPG ou PNG</span>
        </div>
      </div>

      {/* 2. GRANDE CARTE : "✨ RÉVISION INTELLIGENTE" */}
      <div className="revision-smart-card">
        <div className="smart-card-header">
          <div className="smart-card-title-row">
            <Sparkles size={16} color="#D97706" />
            <span className="smart-card-title">Révision intelligente</span>
          </div>
          <p className="smart-card-subtitle">
            L’IA transforme automatiquement ton cours en :
          </p>
        </div>

        {/* 4 cartes horizontales */}
        <div className="smart-features-grid">
          <div className="smart-feature-item">
            <FileText size={20} color="#C47D2B" strokeWidth={2.2} />
            <span className="smart-feature-label">Résumé</span>
          </div>

          <div className="smart-feature-item">
            <HelpCircle size={20} color="#C47D2B" strokeWidth={2.2} />
            <span className="smart-feature-label">Questions</span>
          </div>

          <div className="smart-feature-item">
            <CheckSquare size={20} color="#C47D2B" strokeWidth={2.2} />
            <span className="smart-feature-label">Quiz</span>
          </div>

          <div className="smart-feature-item">
            <Pencil size={20} color="#C47D2B" strokeWidth={2.2} />
            <span className="smart-feature-label">Exercices</span>
          </div>
        </div>
      </div>

      {/* 3. SECTION : "MES COURS RÉCENTS" */}
      <div className="recent-courses-section">
        <div className="recent-courses-header">
          <h3 className="recent-courses-title">Mes cours récents</h3>
          <button className="recent-courses-link" onClick={onNavigateToCourses}>
            <span>Voir tout</span>
            <ChevronRight size={15} />
          </button>
        </div>

        {/* Boîte listant les cours réels ou état vide */}
        {allRecentCourses.length === 0 ? (
          <div
            className="recent-courses-box"
            style={{
              padding: 'var(--space-6)',
              textAlign: 'center',
              backgroundColor: 'var(--surface)',
              border: '1px dashed var(--border-color)',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: 'var(--space-2)' }}>
              Aucun cours récent pour le moment.
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              Importe un PDF ou prends une photo ci-dessus pour créer ta première fiche de révision.
            </p>
          </div>
        ) : (
          <div className="recent-courses-box">
            {allRecentCourses.map(c => {
              const IconComponent = c.icon;
              return (
                <div
                  key={c.id}
                  className="recent-course-item"
                  onClick={() => handleOpenCourse(c.id, c.title, c.subjectName)}
                  role="button"
                  tabIndex={0}
                >
                  {/* Icône matière */}
                  <div className="recent-course-icon" style={{ backgroundColor: c.bgColor, color: c.color }}>
                    <IconComponent size={22} />
                  </div>

                  {/* Nom matière & Titre cours */}
                  <div className="recent-course-info">
                    <div className="recent-course-subject">{c.subjectName}</div>
                    <div className="recent-course-title">{c.title}</div>
                  </div>

                  {/* Barre de progression & Pourcentage */}
                  <div className="recent-course-progress-side">
                    <div className="recent-progress-bar">
                      <div
                        className="recent-progress-fill"
                        style={{ width: `${c.progress}%`, backgroundColor: c.color }}
                      />
                    </div>
                    <span className="recent-progress-pct" style={{ color: c.color }}>
                      {c.progress} %
                    </span>
                    <ChevronRight size={16} color="#9CA3AF" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 4. CARTE : "CONTINUER MA DERNIÈRE RÉVISION" (Affichée uniquement si un cours existe) */}
      {allRecentCourses.length > 0 && (() => {
        const lastCourse = allRecentCourses[0];
        return (
          <div className="continue-last-card">
            <div className="continue-last-left">
              <div className="continue-medal-box">
                <MedalAwardIcon size={34} color={lastCourse.color} />
              </div>

              <div className="continue-last-texts">
                <div className="continue-badge-text">Dernier cours ajouté</div>
                <div className="continue-subject-title">{lastCourse.subjectName}</div>
                <div className="continue-course-title">{lastCourse.title}</div>
                <div className="continue-step-text">Prêt pour la révision</div>
              </div>
            </div>

            <button
              className="btn-continue-gold"
              onClick={() => handleOpenCourse(lastCourse.id, lastCourse.title, lastCourse.subjectName)}
            >
              <span>CONTINUER</span>
              <ArrowRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        );
      })()}

      {/* Modal de progression de l'import et écran "Ton cours est prêt !" */}
      <ImportProcessingModal
        progress={pipelineProgress}
        result={pipelineResult}
        fileName={importingFileName}
        onClose={() => {
          setPipelineProgress(null);
          setPipelineResult(null);
          setImportingFileName(null);
        }}
        onViewRevision={handleViewImportedRevision}
        onStartQuiz={handleStartImportedQuiz}
      />

      {/* Modal de session de Quiz interactif */}
      {activeQuizToPlay && (
        <QuizPlayerModal
          quiz={activeQuizToPlay.quiz}
          course={activeQuizToPlay.course}
          onClose={() => setActiveQuizToPlay(null)}
          onViewRevision={async (crs) => {
            setActiveQuizToPlay(null);
            const rev = await revisionService.getRevisionForCourse(crs.id);
            if (rev) {
              setSelectedCourse(crs);
              setActiveRevision(rev);
              onReadingChange?.(true);
            }
          }}
        />
      )}
    </div>
  );
};
