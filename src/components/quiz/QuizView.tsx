import React, { useState, useEffect, useMemo } from 'react';
import {
  Gamepad2,
  Zap,
  Gem,
  Flame,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  BookOpen,
  WifiOff,
  Sparkles,
  Trophy,
  AlertCircle,
  HelpCircle,
  Check
} from 'lucide-react';
import { Quiz, QuizQuestion, Course, CourseConcept, QuizSession } from '../../types';
import { useData } from '../../context/DataContext';
import { FriendlyNotice } from '../common/FriendlyNotice';
import { Skeleton } from '../common/Skeleton';

interface QuizViewProps {
  initialCourse?: Course | null;
  onNavigateToRevision?: (course: Course) => void;
  onNavigateToCourses?: () => void;
}

type ViewMode = 'hub' | 'preparation' | 'playing' | 'finished' | 'targeted_revision' | 'retesting';

interface AnsweredQuestionRecord {
  questionId: string;
  selectedChoiceIndex: number;
  isCorrect: boolean;
  explanation: string;
  conceptId: string;
  conceptName: string;
}

export const QuizView: React.FC<QuizViewProps> = ({
  initialCourse,
  onNavigateToRevision,
  onNavigateToCourses
}) => {
  const {
    quizService,
    courseService,
    dataProvider,
    gamificationService,
    refreshProgress,
    progress,
    network
  } = useData();

  // États principaux
  const [viewMode, setViewMode] = useState<ViewMode>('hub');
  const [courses, setCourses] = useState<Course[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [weakConcepts, setWeakConcepts] = useState<CourseConcept[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [noticeMsg, setNoticeMsg] = useState<string | null>(null);

  // État du quiz en cours ou préparé
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);
  const [activeSession, setActiveSession] = useState<QuizSession | null>(null);

  // État joueur (Question courante)
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<Map<number, AnsweredQuestionRecord>>(new Map());

  // Révision ciblée & Retest
  const [activeConcept, setActiveConcept] = useState<CourseConcept | null>(null);
  const [retestQuestions, setRetestQuestions] = useState<QuizQuestion[]>([]);

  // 1. CHARGEMENT INITIAL DES DONNÉES DEPUIS LE PROVIDER LOCAL
  const loadData = async () => {
    try {
      setLoading(true);
      const [crsList, qzList, weakList] = await Promise.all([
        courseService.getAllCourses(),
        quizService.getAllQuizzes(),
        dataProvider.getWeakConcepts()
      ]);
      setCourses(crsList);
      setQuizzes(qzList);
      setWeakConcepts(weakList);

      // Si un cours initial est demandé (ex: depuis Révision ou Mes cours)
      if (initialCourse) {
        const matchingQuiz = qzList.find(q => q.courseId === initialCourse.id);
        if (matchingQuiz) {
          setActiveCourse(initialCourse);
          setActiveQuiz(matchingQuiz);
          setViewMode('preparation');
        }
      }
    } catch {
      setNoticeMsg("Impossible de charger les quiz pour l'instant. Réessaie dans un instant.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [initialCourse]);

  // Sujets uniques disponibles
  const subjects = useMemo(() => {
    const subs = new Set<string>();
    courses.forEach(c => subs.add(c.subjectName));
    return Array.from(subs);
  }, [courses]);

  // Quiz filtrés par sujet
  const filteredQuizzes = useMemo(() => {
    if (selectedSubject === 'all') return quizzes;
    const courseIdsForSubject = new Set(
      courses.filter(c => c.subjectName === selectedSubject).map(c => c.id)
    );
    return quizzes.filter(q => courseIdsForSubject.has(q.courseId));
  }, [quizzes, selectedSubject, courses]);

  // 2. ACTIONS DU HUB
  const handleOpenPreparation = (quiz: Quiz) => {
    const course = courses.find(c => c.id === quiz.courseId) || null;
    setActiveQuiz(quiz);
    setActiveCourse(course);
    setViewMode('preparation');
    setNoticeMsg(null);
  };

  // Recharger l'énergie avec 10 diamants (Gamification)
  const handleRefillEnergy = async () => {
    try {
      await gamificationService.refillEnergyWithDiamonds();
      await refreshProgress();
      setNoticeMsg('⚡ Tes 3 énergies ont été entièrement rechargées !');
    } catch {
      setNoticeMsg('Diamants insuffisants pour recharger ton énergie (10 diamants requis).');
    }
  };

  // Démarrer la session active
  const handleStartSession = async (quizToPlay: Quiz, isRetest: boolean = false) => {
    // RÈGLE ABSOLUE N°17 : HORS CONNEXION
    if (!network.isOnline) {
      setNoticeMsg('Connecte-toi pour commencer ce quiz. Tes réponses et ta progression doivent être enregistrées en ligne.');
      return;
    }

    // Vérification de l'énergie disponible
    if ((progress?.energyBalance ?? 3) <= 0) {
      setNoticeMsg("Plus d'énergie disponible. Recharge tes 3 énergies avec tes diamants.");
      return;
    }

    try {
      setNoticeMsg(null);
      const session = await quizService.startQuiz(quizToPlay.id, network.isOnline);
      setActiveSession(session);
      setCurrentIndex(0);
      setSelectedChoice(null);
      setIsAnswerSubmitted(false);
      setUserAnswers(new Map());
      setViewMode(isRetest ? 'retesting' : 'playing');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors du lancement du quiz.';
      setNoticeMsg(msg);
    }
  };

  // 3. ACTIONS DU JOUEUR (QUESTION EN COURS)
  const currentQuestionsList = viewMode === 'retesting' && retestQuestions.length > 0
    ? retestQuestions
    : activeQuiz?.questions || [];

  const currentQuestion = currentQuestionsList[currentIndex];
  const totalQuestions = currentQuestionsList.length;

  // Sélection d'une réponse
  const handleSelectChoice = (choiceIndex: number) => {
    if (isAnswerSubmitted) return;
    setSelectedChoice(choiceIndex);
  };

  // Validation d'une réponse
  const handleValidateAnswer = async () => {
    if (selectedChoice === null || isAnswerSubmitted || !currentQuestion) return;

    if (!network.isOnline) {
      setNoticeMsg('Connexion requise pour valider ta réponse.');
      return;
    }

    try {
      const isCorrect = selectedChoice === currentQuestion.correctChoiceIndex;

      // Soumission via le service métier
      if (activeSession) {
        await quizService.submitAnswer(
          activeSession.id,
          {
            questionId: currentQuestion.id,
            conceptId: currentQuestion.conceptId,
            selectedChoiceIndex: selectedChoice
          },
          network.isOnline
        );
      }

      // Enregistrement de la réponse dans la mémoire de navigation locale
      const record: AnsweredQuestionRecord = {
        questionId: currentQuestion.id,
        selectedChoiceIndex: selectedChoice,
        isCorrect,
        explanation: currentQuestion.explanation,
        conceptId: currentQuestion.conceptId,
        conceptName: currentQuestion.conceptName
      };

      setUserAnswers(prev => new Map(prev).set(currentIndex, record));
      setIsAnswerSubmitted(true);
      await refreshProgress();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Erreur lors de la validation.';
      setNoticeMsg(msg);
    }
  };

  // Passer à la question suivante ou terminer
  const handleNextQuestion = async () => {
    if (currentIndex + 1 < totalQuestions) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      // Restaurer l'état si déjà répondu
      const prevAnswer = userAnswers.get(nextIndex);
      if (prevAnswer) {
        setSelectedChoice(prevAnswer.selectedChoiceIndex);
        setIsAnswerSubmitted(true);
      } else {
        setSelectedChoice(null);
        setIsAnswerSubmitted(false);
      }
    } else {
      // Fin du quiz
      await gamificationService.recordDailyStreak();
      await refreshProgress();
      // Recharger les notions fragiles à jour
      const weaks = await dataProvider.getWeakConcepts();
      setWeakConcepts(weaks);
      setViewMode('finished');
    }
  };

  // Revenir à la question précédente
  const handlePreviousQuestion = () => {
    if (currentIndex > 0) {
      const prevIdx = currentIndex - 1;
      setCurrentIndex(prevIdx);
      const prevAnswer = userAnswers.get(prevIdx);
      if (prevAnswer) {
        setSelectedChoice(prevAnswer.selectedChoiceIndex);
        setIsAnswerSubmitted(true);
      } else {
        setSelectedChoice(null);
        setIsAnswerSubmitted(false);
      }
    }
  };

  // 4. RÉVISION CIBLÉE & RETEST
  const handleStartTargetedRevision = async (conceptId: string) => {
    try {
      // Trouver le concept dans les concepts ou les questions
      const allConcepts = await dataProvider.getConceptsByCourseId(activeCourse?.id || '');
      let concept = allConcepts.find(c => c.id === conceptId);
      if (!concept) {
        concept = weakConcepts.find(c => c.id === conceptId);
      }
      if (!concept && currentQuestion?.conceptId === conceptId) {
        concept = {
          id: currentQuestion.conceptId,
          courseId: activeCourse?.id || '',
          name: currentQuestion.conceptName,
          summary: currentQuestion.explanation,
          importance: 5,
          masteryScore: 40,
          keyPoints: [
            currentQuestion.explanation,
            'Applique rigoureusement la formule et vérifie les signes avant de répondre.'
          ],
          isWeak: true
        };
      }

      if (concept) {
        setActiveConcept(concept);
        setViewMode('targeted_revision');
      }
    } catch {
      setNoticeMsg('Impossible de charger la révision ciblée.');
    }
  };

  // Retest ciblée sur un concept
  const handleStartRetest = async () => {
    if (!activeConcept) return;

    if (!network.isOnline) {
      setNoticeMsg('Connecte-toi pour démarrer le retest.');
      return;
    }

    // Filtrer les questions associées à ce concept
    const matchingQuestions = (activeQuiz?.questions || []).filter(
      q => q.conceptId === activeConcept.id
    );

    if (matchingQuestions.length === 0) {
      setNoticeMsg('Aucune question disponible pour cette notion précise.');
      return;
    }

    setRetestQuestions(matchingQuestions);
    if (activeQuiz) {
      await handleStartSession(activeQuiz, true);
    }
  };

  // Calcul du score final
  const answersList = Array.from(userAnswers.values());
  const correctCount = answersList.filter(a => a.isCorrect).length;
  const incorrectList = answersList.filter(a => !a.isCorrect);

  // Groupement des erreurs par notion
  const errorsByConcept = useMemo(() => {
    const map = new Map<string, { conceptId: string; conceptName: string; count: number; explanations: string[] }>();
    incorrectList.forEach(item => {
      const existing = map.get(item.conceptId);
      if (existing) {
        existing.count += 1;
        existing.explanations.push(item.explanation);
      } else {
        map.set(item.conceptId, {
          conceptId: item.conceptId,
          conceptName: item.conceptName,
          count: 1,
          explanations: [item.explanation]
        });
      }
    });
    return Array.from(map.values());
  }, [incorrectList]);

  // Concepts maîtrisés lors de ce quiz
  const masteredConcepts = useMemo(() => {
    const correctConceptIds = new Set(answersList.filter(a => a.isCorrect).map(a => a.conceptName));
    return Array.from(correctConceptIds);
  }, [answersList]);

  // =========================================================================
  // VUE 1 : PRÉPARATION DU QUIZ
  // =========================================================================
  if (viewMode === 'preparation' && activeQuiz) {
    const course = activeCourse || courses.find(c => c.id === activeQuiz.courseId);
    return (
      <div className="quiz-view-container">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button
            className="quiz-btn-nav-secondary"
            onClick={() => {
              setViewMode('hub');
              setNoticeMsg(null);
            }}
          >
            <ArrowLeft size={16} />
            <span>Retour aux quiz</span>
          </button>
        </div>

        {noticeMsg && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <FriendlyNotice type="warning" message={noticeMsg} actionText="Fermer" onAction={() => setNoticeMsg(null)} />
          </div>
        )}

        <div className="quiz-prep-card">
          <div className="quiz-prep-header">
            <div className="quiz-prep-badge-row">
              <span
                className="quiz-card-subject-pill"
                style={{
                  backgroundColor: '#FFF7ED',
                  color: '#EA580C',
                  border: '1px solid #FFEDD5'
                }}
              >
                {course?.subjectName || 'Général'}
              </span>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  backgroundColor: '#F1EFEA',
                  color: '#64748B',
                  padding: '4px 10px',
                  borderRadius: '999px'
                }}
              >
                Niveau : {activeQuiz.difficulty === 1 ? 'Facile' : activeQuiz.difficulty === 2 ? 'Intermédiaire' : 'Avancé'}
              </span>
            </div>

            <h2 className="quiz-prep-title">{activeQuiz.title}</h2>
            {course && (
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                Cours : <strong>{course.title}</strong>
              </p>
            )}
          </div>

          <div className="quiz-prep-meta-grid">
            <div className="quiz-prep-meta-item">
              <span className="quiz-prep-meta-label">Questions</span>
              <span className="quiz-prep-meta-value">{activeQuiz.totalQuestions} questions</span>
            </div>
            <div className="quiz-prep-meta-item">
              <span className="quiz-prep-meta-label">Durée estimée</span>
              <span className="quiz-prep-meta-value">~{activeQuiz.totalQuestions * 1.5} minutes</span>
            </div>
            <div className="quiz-prep-meta-item">
              <span className="quiz-prep-meta-label">Règle d’énergie</span>
              <span className="quiz-prep-meta-value">1 erreur = -1 énergie ⚡</span>
            </div>
            <div className="quiz-prep-meta-item">
              <span className="quiz-prep-meta-label">Récompenses</span>
              <span className="quiz-prep-meta-value">+25 XP / réponse + 5 💎</span>
            </div>
          </div>

          {/* Notions évaluées */}
          <div className="quiz-prep-notions-box">
            <h4 className="quiz-prep-notions-title">
              <Sparkles size={16} color="#EA580C" />
              <span>Notions évaluées dans ce quiz</span>
            </h4>
            <ul className="quiz-prep-notions-list">
              {Array.from(new Set(activeQuiz.questions.map(q => q.conceptName))).map((conceptName, i) => (
                <li key={i} className="quiz-prep-notion-item">
                  <span className="quiz-prep-notion-dot" />
                  <span>{conceptName}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Actions */}
          <div className="quiz-prep-actions">
            <button
              className="quiz-btn-start"
              style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
              onClick={() => handleStartSession(activeQuiz)}
            >
              <Gamepad2 size={20} />
              <span>Commencer le quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 2 : JOUEUR DE QUESTION ACTIVE & RETEST
  // =========================================================================
  if ((viewMode === 'playing' || viewMode === 'retesting') && currentQuestion) {
    const isRetestMode = viewMode === 'retesting';
    return (
      <div className="quiz-view-container">
        {noticeMsg && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <FriendlyNotice type="warning" message={noticeMsg} actionText="Fermer" onAction={() => setNoticeMsg(null)} />
          </div>
        )}

        <div className="quiz-player-container">
          {/* Barre supérieure du joueur */}
          <div className="quiz-player-top-bar">
            <button
              className="quiz-btn-nav-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              onClick={() => {
                if (window.confirm('Veux-tu vraiment quitter ce quiz ? Ta progression actuelle sera perdue.')) {
                  setViewMode('hub');
                }
              }}
            >
              Quitter
            </button>

            <span className="quiz-player-progress-label">
              {isRetestMode ? 'Retest : ' : ''}Question {currentIndex + 1} / {totalQuestions}
            </span>

            <div className="quiz-stat-pill energy" style={{ padding: '4px 10px', fontSize: '0.8rem' }}>
              <Zap size={14} fill="currentColor" />
              <span>{progress?.energyBalance ?? 3}/3</span>
            </div>
          </div>

          {/* Barre de progression horizontale */}
          <div className="quiz-progress-bar-wrap">
            <div
              className="quiz-progress-bar-fill"
              style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          {/* Badge de notion évaluée */}
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <span className="quiz-player-concept-badge">
              Notion : {currentQuestion.conceptName}
            </span>
          </div>

          {/* Énoncé de la question */}
          <div className="quiz-question-box">
            <h3 className="quiz-question-text">{currentQuestion.question}</h3>
          </div>

          {/* Choix de réponses */}
          <div className="quiz-choices-list">
            {currentQuestion.choices.map((choice, idx) => {
              const letter = String.fromCharCode(65 + idx);
              let cardClass = 'quiz-choice-card';
              let icon = null;

              if (isAnswerSubmitted) {
                if (idx === currentQuestion.correctChoiceIndex) {
                  cardClass += ' correct';
                  icon = <CheckCircle2 size={20} color="#10B981" />;
                } else if (idx === selectedChoice) {
                  cardClass += ' incorrect';
                  icon = <XCircle size={20} color="#EF4444" />;
                }
              } else if (selectedChoice === idx) {
                cardClass += ' selected';
              }

              return (
                <button
                  key={idx}
                  className={cardClass}
                  disabled={isAnswerSubmitted}
                  onClick={() => handleSelectChoice(idx)}
                >
                  <div className="quiz-choice-left">
                    <span className="quiz-choice-letter">{letter}</span>
                    <span className="quiz-choice-text">{choice}</span>
                  </div>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Explication pédagogique immédiate */}
          {isAnswerSubmitted && (
            <div className={`quiz-feedback-card ${selectedChoice === currentQuestion.correctChoiceIndex ? 'correct' : 'incorrect'}`}>
              <div className="quiz-feedback-status-row">
                <div className="quiz-feedback-status-title">
                  {selectedChoice === currentQuestion.correctChoiceIndex ? (
                    <>
                      <CheckCircle2 size={18} />
                      <span>Bonne réponse ! (+25 XP)</span>
                    </>
                  ) : (
                    <>
                      <XCircle size={18} />
                      <span>Pas tout à fait (-1 énergie)</span>
                    </>
                  )}
                </div>
              </div>

              <div className="quiz-feedback-explanation-title">
                Pourquoi cette réponse est-elle correcte ?
              </div>
              <p className="quiz-feedback-explanation-body">
                {currentQuestion.explanation}
              </p>

              {/* Action immédiate de remédiation en cas d'erreur */}
              {selectedChoice !== currentQuestion.correctChoiceIndex && (
                <button
                  className="quiz-btn-review-concept"
                  onClick={() => handleStartTargetedRevision(currentQuestion.conceptId)}
                >
                  <BookOpen size={14} />
                  <span>Revoir cette notion</span>
                </button>
              )}
            </div>
          )}

          {/* Navigation et validation en bas */}
          <div className="quiz-player-nav-row">
            <button
              className="quiz-btn-nav-secondary"
              disabled={currentIndex === 0}
              onClick={handlePreviousQuestion}
            >
              <ArrowLeft size={16} />
              <span>Question précédente</span>
            </button>

            {!isAnswerSubmitted ? (
              <button
                className="quiz-btn-nav-primary"
                disabled={selectedChoice === null}
                onClick={handleValidateAnswer}
              >
                <span>Valider ma réponse</span>
                <Check size={16} />
              </button>
            ) : (
              <button
                className="quiz-btn-nav-primary"
                onClick={handleNextQuestion}
              >
                <span>{currentIndex + 1 < totalQuestions ? 'Question suivante' : 'Terminer le quiz'}</span>
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 3 : FIN DU QUIZ (RÉSULTATS, ANALYSE DES ERREURS, RÉVISION CIBLÉE)
  // =========================================================================
  if (viewMode === 'finished') {
    const isGameOver = (progress?.energyBalance ?? 3) <= 0;
    const percentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;
    const xpGained = correctCount * 25;

    return (
      <div className="quiz-view-container">
        <div className="quiz-results-card">
          <div className="quiz-results-trophy-wrap">
            {isGameOver ? <AlertCircle size={38} color="#DC2626" /> : <Trophy size={38} />}
          </div>

          <h2 className="quiz-results-title">
            {isGameOver ? 'Session interrompue !' : 'Quiz terminé !'}
          </h2>

          <p style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: 'var(--space-4)' }}>
            {isGameOver
              ? 'Plus d’énergie disponible. Découvre tes notions à renforcer pour progresser.'
              : `Félicitations pour ton engagement sur ${activeQuiz?.courseTitle || 'ce cours'} !`}
          </p>

          <div className="quiz-results-score-row">
            <span>{correctCount} / {totalQuestions}</span>
            <span className="quiz-results-score-percent">({percentage}%)</span>
          </div>

          <div className="quiz-results-rewards-row">
            <div className="quiz-reward-box">
              <span className="quiz-reward-label">XP Gagnés</span>
              <p className="quiz-reward-value" style={{ color: '#EA580C' }}>+{xpGained} XP</p>
            </div>
            <div className="quiz-reward-box">
              <span className="quiz-reward-label">Récompense</span>
              <p className="quiz-reward-value" style={{ color: '#D97706', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Gem size={16} /> {percentage >= 60 ? '+5' : '0'}
              </p>
            </div>
            <div className="quiz-reward-box">
              <span className="quiz-reward-label">Série</span>
              <p className="quiz-reward-value" style={{ color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                <Flame size={16} /> {progress?.currentStreak ?? 1} j
              </p>
            </div>
          </div>

          {/* SECTION « À REVOIR » (ANALYSE DES ERREURS PAR NOTION) */}
          {errorsByConcept.length > 0 ? (
            <div className="quiz-errors-box">
              <h3 className="quiz-errors-title">
                <AlertCircle size={18} />
                <span>À revoir ({errorsByConcept.length} notion{errorsByConcept.length > 1 ? 's' : ''})</span>
              </h3>
              <p style={{ fontSize: '0.85rem', color: '#7C2D12', marginBottom: 'var(--space-3)' }}>
                Chaque erreur est une opportunité d’apprendre. Révise les notions fragiles avant de retester.
              </p>

              {errorsByConcept.map(err => (
                <div key={err.conceptId} className="quiz-errors-item">
                  <div className="quiz-errors-item-info">
                    <p className="quiz-errors-item-name">{err.conceptName}</p>
                    <span className="quiz-errors-item-badge">
                      {err.count} erreur{err.count > 1 ? 's' : ''} commise{err.count > 1 ? 's' : ''}
                    </span>
                  </div>
                  <button
                    className="quiz-btn-targeted"
                    onClick={() => handleStartTargetedRevision(err.conceptId)}
                  >
                    <BookOpen size={14} />
                    <span>Revoir la notion</span>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="quiz-mastered-box">
              <h3 className="quiz-mastered-title">
                <CheckCircle2 size={18} />
                <span>Score parfait !</span>
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#166534' }}>
                Toutes les notions de ce quiz ont été validées avec brio. Continue ainsi !
              </p>
            </div>
          )}

          {/* Concepts maîtrisés */}
          {masteredConcepts.length > 0 && errorsByConcept.length > 0 && (
            <div className="quiz-mastered-box">
              <h4 className="quiz-mastered-title" style={{ fontSize: '0.95rem' }}>
                <CheckCircle2 size={16} />
                <span>Concepts validés ({masteredConcepts.length})</span>
              </h4>
              <ul className="quiz-mastered-list">
                {masteredConcepts.map((cName, idx) => (
                  <li key={idx} className="quiz-mastered-item">
                    <Check size={14} />
                    <span>{cName}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions de fin */}
          <div className="quiz-results-actions">
            {activeCourse && onNavigateToRevision && (
              <button
                className="quiz-btn-nav-primary"
                style={{ justifyContent: 'center' }}
                onClick={() => onNavigateToRevision(activeCourse)}
              >
                <BookOpen size={18} />
                <span>Consulter la fiche de révision complète</span>
              </button>
            )}

            <button
              className="quiz-btn-nav-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => {
                if (activeQuiz) {
                  handleStartSession(activeQuiz);
                }
              }}
            >
              <RotateCcw size={16} />
              <span>Recommencer le quiz</span>
            </button>

            <button
              className="quiz-btn-nav-secondary"
              style={{ justifyContent: 'center', border: 'none' }}
              onClick={() => {
                setViewMode('hub');
                setNoticeMsg(null);
              }}
            >
              <span>Retour à l’accueil des quiz</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 4 : MINI-RÉVISION CIBLÉE & RETEST DE NOTION
  // =========================================================================
  if (viewMode === 'targeted_revision' && activeConcept) {
    return (
      <div className="quiz-view-container">
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <button
            className="quiz-btn-nav-secondary"
            onClick={() => setViewMode(userAnswers.size > 0 ? 'finished' : 'hub')}
          >
            <ArrowLeft size={16} />
            <span>Retour</span>
          </button>
        </div>

        {noticeMsg && (
          <div style={{ marginBottom: 'var(--space-4)' }}>
            <FriendlyNotice type="warning" message={noticeMsg} actionText="Fermer" onAction={() => setNoticeMsg(null)} />
          </div>
        )}

        <div className="quiz-targeted-card">
          <div className="quiz-targeted-header">
            <span className="quiz-targeted-badge">Révision Ciblée</span>
            <h2 className="quiz-targeted-title">{activeConcept.name}</h2>
            <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
              {activeConcept.summary}
            </p>
          </div>

          <div className="quiz-targeted-content-box">
            <h4 className="quiz-targeted-section-title">
              <Sparkles size={16} />
              <span>Points clés à retenir</span>
            </h4>
            <ul className="quiz-targeted-keypoints-list">
              {(activeConcept.keyPoints || []).map((kp, idx) => (
                <li key={idx} style={{ marginBottom: '6px' }}>{kp}</li>
              ))}
            </ul>

            {activeConcept.rulesFormulas && activeConcept.rulesFormulas.length > 0 && (
              <>
                <h4 className="quiz-targeted-section-title" style={{ marginTop: 'var(--space-4)' }}>
                  <HelpCircle size={16} />
                  <span>Règles & Formules fondamentales</span>
                </h4>
                {activeConcept.rulesFormulas.map((rf, idx) => (
                  <div key={idx} className="quiz-targeted-formulas-box">
                    {rf}
                  </div>
                ))}
              </>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="quiz-btn-start"
              style={{ justifyContent: 'center', padding: '14px', fontSize: '1rem' }}
              onClick={handleStartRetest}
            >
              <RotateCcw size={18} />
              <span>Retester cette notion</span>
            </button>

            <button
              className="quiz-btn-nav-secondary"
              style={{ justifyContent: 'center' }}
              onClick={() => setViewMode(userAnswers.size > 0 ? 'finished' : 'hub')}
            >
              <span>Terminer la révision ciblée</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // VUE 5 : ÉCRAN D'ACCUEIL DU QUIZ (HUB)
  // =========================================================================
  return (
    <div className="quiz-view-container">
      {/* 1. HEADER DESKTOP */}
      <div className="quiz-header-desktop">
        <h1 className="quiz-main-title">Quiz</h1>
        <p className="quiz-subtitle">
          Les quiz vérifient ce que tu as réellement compris et mémorisé pour cibler tes révisions.
        </p>
      </div>

      {/* 2. BANDEAU DE NOTIFICATIONS / FEEDBACK */}
      {noticeMsg && (
        <div style={{ marginBottom: 'var(--space-4)' }}>
          <FriendlyNotice
            type="warning"
            message={noticeMsg}
            actionText="Fermer"
            onAction={() => setNoticeMsg(null)}
          />
        </div>
      )}

      {/* 3. BANNIÈRE DISCRÈTE HORS-CONNEXION */}
      {!network.isOnline && (
        <div className="quiz-offline-banner">
          <WifiOff size={20} color="#64748B" />
          <span>
            Mode consultation hors connexion : tu peux explorer les quiz et leurs fiches, mais la connexion est obligatoire pour démarrer une évaluation.
          </span>
        </div>
      )}

      {/* 4. BANDEAU DISCRET DE GAMIFICATION */}
      <div className="quiz-gamification-bar">
        <div className="quiz-gamification-stats">
          <div className={`quiz-stat-pill energy ${(progress?.energyBalance ?? 3) <= 0 ? 'empty' : ''}`}>
            <Zap size={16} fill="currentColor" />
            <span>{progress?.energyBalance ?? 3} / 3 énergies</span>
          </div>

          <div className="quiz-stat-pill diamonds">
            <Gem size={16} />
            <span>{progress?.diamondsBalance ?? 0} diamants</span>
          </div>

          <div className="quiz-stat-pill streak">
            <Flame size={16} />
            <span>{progress?.currentStreak ?? 0} jours de série</span>
          </div>
        </div>

        {(progress?.energyBalance ?? 3) <= 0 && (
          <button className="quiz-refill-btn" onClick={handleRefillEnergy}>
            <Zap size={14} fill="currentColor" />
            <span>Recharger (10 💎)</span>
          </button>
        )}
      </div>

      {/* 5. FILTRES PAR MATIÈRE */}
      <div className="quiz-filter-pills">
        <button
          className={`quiz-pill-btn ${selectedSubject === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedSubject('all')}
        >
          <span>Tous les quiz</span>
          <span className="quiz-pill-badge">{quizzes.length}</span>
        </button>

        {subjects.map(sub => {
          const count = quizzes.filter(q => {
            const crs = courses.find(c => c.id === q.courseId);
            return crs?.subjectName === sub;
          }).length;

          return (
            <button
              key={sub}
              className={`quiz-pill-btn ${selectedSubject === sub ? 'active' : ''}`}
              onClick={() => setSelectedSubject(sub)}
            >
              <span>{sub}</span>
              <span className="quiz-pill-badge">{count}</span>
            </button>
          );
        })}
      </div>

      {/* 6. LISTE DES QUIZ DISPONIBLES (OU SKELETONS) */}
      {loading ? (
        <div className="quiz-grid">
          {[1, 2, 3, 4].map(k => (
            <div key={k} className="quiz-card" style={{ height: '220px' }}>
              <Skeleton width="90px" height="24px" borderRadius="999px" />
              <div style={{ margin: '14px 0' }}>
                <Skeleton width="60%" height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton width="95%" height="22px" />
              </div>
              <Skeleton width="100%" height="42px" borderRadius="999px" />
            </div>
          ))}
        </div>
      ) : filteredQuizzes.length === 0 ? (
        /* ÉTAT VIDE : AUCUN QUIZ */
        <div
          style={{
            backgroundColor: 'var(--surface)',
            border: '1px dashed var(--border-color)',
            borderRadius: 'var(--radius-2xl)',
            padding: 'var(--space-10) var(--space-6)',
            textAlign: 'center',
            marginBottom: 'var(--space-8)'
          }}
        >
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#FFF7ED',
              color: '#EA580C',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 'var(--space-4)'
            }}
          >
            <Gamepad2 size={32} />
          </div>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '6px' }}>
            Aucun quiz disponible pour le moment
          </h3>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto var(--space-5)' }}>
            Importe un nouveau cours pour que REVIZO analyse tes documents et génère automatiquement des quiz personnalisés.
          </p>
          {onNavigateToCourses && (
            <button
              className="quiz-btn-start"
              onClick={onNavigateToCourses}
            >
              <span>Voir mes cours</span>
              <ArrowRight size={16} />
            </button>
          )}
        </div>
      ) : (
        /* GRILLE DE QUIZ DISPONIBLES */
        <div className="quiz-grid">
          {filteredQuizzes.map(quiz => {
            const course = courses.find(c => c.id === quiz.courseId);
            const isMath = course?.subjectName.includes('Math');
            const isFr = course?.subjectName.includes('Fran');
            const isSvt = course?.subjectName.includes('SVT');
            const isHist = course?.subjectName.includes('Hist');

            const badgeBg = isMath ? '#FFF7ED' : isFr ? '#ECFDF5' : isSvt ? '#F5F3FF' : isHist ? '#FFFBEB' : '#F1EFEA';
            const badgeColor = isMath ? '#EA580C' : isFr ? '#059669' : isSvt ? '#7C3AED' : isHist ? '#D97706' : '#475569';

            return (
              <div key={quiz.id} className="quiz-card">
                <div>
                  <div className="quiz-card-header">
                    <span
                      className="quiz-card-subject-pill"
                      style={{ backgroundColor: badgeBg, color: badgeColor }}
                    >
                      {course?.subjectName || 'Général'}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      Niveau {quiz.difficulty === 1 ? 'Facile' : quiz.difficulty === 2 ? 'Intermédiaire' : 'Avancé'}
                    </span>
                  </div>

                  <p className="quiz-card-course-title">
                    {quiz.courseTitle || course?.title}
                  </p>

                  <h3 className="quiz-card-title">{quiz.title}</h3>

                  <div className="quiz-card-meta-row">
                    <span className="quiz-meta-item">
                      <HelpCircle size={14} />
                      <span>{quiz.totalQuestions} questions</span>
                    </span>
                    {quiz.bestScore !== undefined && (
                      <span className="quiz-meta-item">
                        <Trophy size={14} color="#D97706" />
                        <span>Progression : {quiz.bestScore} %</span>
                      </span>
                    )}
                  </div>
                </div>

                <div className="quiz-card-footer">
                  <span className="quiz-card-progress">
                    {quiz.bestScore ? `Meilleur score : ${quiz.bestScore}%` : 'Prêt à tester'}
                  </span>

                  <button
                    className="quiz-btn-start"
                    onClick={() => handleOpenPreparation(quiz)}
                  >
                    <Gamepad2 size={16} />
                    <span>Commencer</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 7. SECTION « NOTIONS À RENFORCER » (RÉVISIONS CIBLÉES EN ATTENTE) */}
      {weakConcepts.length > 0 && (
        <div className="quiz-weak-section">
          <div className="quiz-weak-header">
            <h3 className="quiz-weak-title">
              <Sparkles size={20} />
              <span>Notions à renforcer ({weakConcepts.length})</span>
            </h3>
            <span style={{ fontSize: '0.8rem', color: '#9A3412', fontWeight: 600 }}>
              Ciblées selon tes derniers quiz
            </span>
          </div>

          <div className="quiz-weak-grid">
            {weakConcepts.slice(0, 3).map(concept => (
              <div key={concept.id} className="quiz-weak-card">
                <div>
                  <h4 className="quiz-weak-name">{concept.name}</h4>
                  <p className="quiz-weak-summary">{concept.summary}</p>
                </div>
                <button
                  className="quiz-btn-targeted"
                  onClick={() => handleStartTargetedRevision(concept.id)}
                >
                  <BookOpen size={14} />
                  <span>Révision ciblée</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
