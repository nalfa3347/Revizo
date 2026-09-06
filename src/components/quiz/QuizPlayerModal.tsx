import React, { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Trophy,
  BookOpen,
  Gem,
  RotateCcw
} from 'lucide-react';
import { Quiz, Course } from '../../types';
import { useData } from '../../context/DataContext';

interface QuizPlayerModalProps {
  quiz: Quiz;
  course: Course;
  onClose: () => void;
  onViewRevision?: (course: Course) => void;
}

export const QuizPlayerModal: React.FC<QuizPlayerModalProps> = ({
  quiz,
  course,
  onClose,
  onViewRevision
}) => {
  const { gamificationService, refreshProgress, progress } = useData();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const currentQuestion = quiz.questions[currentIndex];
  const totalQuestions = quiz.questions.length;

  const handleSelectChoice = async (index: number) => {
    if (isAnswerSubmitted) return;

    setSelectedChoice(index);
    setIsAnswerSubmitted(true);

    const isCorrect = index === currentQuestion.correctChoiceIndex;
    if (isCorrect) {
      setScore(prev => prev + 1);
      await gamificationService.awardQuizXP(20);
    } else {
      await gamificationService.deductEnergyOnMistake();
    }
    await refreshProgress();
  };

  const handleNext = async () => {
    if (currentIndex + 1 < totalQuestions) {
      setCurrentIndex(prev => prev + 1);
      setSelectedChoice(null);
      setIsAnswerSubmitted(false);
    } else {
      setIsFinished(true);
      await gamificationService.recordDailyStreak();
      await refreshProgress();
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedChoice(null);
    setIsAnswerSubmitted(false);
    setScore(0);
    setIsFinished(false);
  };

  return (
    <div
      className="quiz-player-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        backdropFilter: 'blur(8px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="quiz-player-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px 24px',
          maxWidth: '560px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.3)',
          position: 'relative',
          border: '1px solid #F0ECE6'
        }}
      >
        {/* En-tête du Quiz */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <span
              style={{
                backgroundColor: '#FDF2E7',
                color: '#C47D2B',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}
            >
              {course.subjectName}
            </span>
            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.1rem',
                fontWeight: 800,
                color: '#1E293B',
                marginTop: '4px'
              }}
            >
              {quiz.title}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#FFF7ED',
                padding: '4px 8px',
                borderRadius: '999px',
                color: '#EA580C',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              <Zap size={14} fill="currentColor" />
              <span>{progress?.energyBalance ?? 3}/3</span>
            </div>

            <button
              onClick={onClose}
              aria-label="Fermer le quiz"
              style={{
                background: '#F1EFEA',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748B'
              }}
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ÉCRAN DE FIN DE QUIZ */}
        {isFinished ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FEF3C7',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '16px'
              }}
            >
              <Trophy size={34} color="#D97706" />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#1E293B',
                marginBottom: '6px'
              }}
            >
              Quiz Terminé !
            </h3>

            <p style={{ fontSize: '0.9rem', color: '#64748B', marginBottom: '20px' }}>
              Score final : <span style={{ fontWeight: 800, color: '#C47D2B' }}>{score} / {totalQuestions}</span> bonnes réponses
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '12px',
                marginBottom: '24px'
              }}
            >
              <div style={{ backgroundColor: '#FAF8F5', padding: '12px', borderRadius: '12px', border: '1px solid #F0ECE6' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>XP GAGNÉS</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#C47D2B', marginTop: '2px' }}>
                  +{score * 20} XP
                </p>
              </div>

              <div style={{ backgroundColor: '#FAF8F5', padding: '12px', borderRadius: '12px', border: '1px solid #F0ECE6' }}>
                <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>RÉCOMPENSE</span>
                <p style={{ fontSize: '1.2rem', fontWeight: 800, color: '#F59E0B', marginTop: '2px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  <Gem size={16} /> +5
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {onViewRevision && (
                <button
                  className="btn-download-fiche"
                  style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                  onClick={() => {
                    onClose();
                    onViewRevision(course);
                  }}
                >
                  <BookOpen size={18} />
                  <span>Consulter ma fiche de révision</span>
                </button>
              )}

              <button
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '14px',
                  backgroundColor: '#FAF8F5',
                  border: '1px solid #E2E8F0',
                  color: '#475569',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  cursor: 'pointer'
                }}
                onClick={handleRestart}
              >
                <RotateCcw size={16} style={{ display: 'inline', marginRight: '6px', verticalAlign: '-2px' }} />
                Recommencer le quiz
              </button>
            </div>
          </div>
        ) : (
          /* QUESTION COURANTE */
          <div>
            {/* Barre de progression des questions */}
            <div style={{ marginBottom: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94A3B8', fontWeight: 600, marginBottom: '6px' }}>
                <span>Question {currentIndex + 1} sur {totalQuestions}</span>
                <span>Concept : {currentQuestion.conceptName}</span>
              </div>
              <div style={{ height: '6px', backgroundColor: '#F1EFEA', borderRadius: '999px', overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${((currentIndex + 1) / totalQuestions) * 100}%`,
                    backgroundColor: '#C47D2B',
                    borderRadius: '999px',
                    transition: 'width 0.3s ease'
                  }}
                />
              </div>
            </div>

            {/* Énoncé de la question */}
            <h4
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.08rem',
                fontWeight: 800,
                color: '#1E293B',
                lineHeight: '1.45',
                marginBottom: '18px'
              }}
            >
              {currentQuestion.question}
            </h4>

            {/* Choix de réponses */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {currentQuestion.choices.map((choice, idx) => {
                let btnBg = '#FFFFFF';
                let btnBorder = '#E2E8F0';
                let btnColor = '#1E293B';
                let icon = null;

                if (isAnswerSubmitted) {
                  if (idx === currentQuestion.correctChoiceIndex) {
                    btnBg = '#ECFDF5';
                    btnBorder = '#10B981';
                    btnColor = '#065F46';
                    icon = <CheckCircle2 size={18} color="#10B981" />;
                  } else if (idx === selectedChoice) {
                    btnBg = '#FEF2F2';
                    btnBorder = '#EF4444';
                    btnColor = '#991B1B';
                    icon = <XCircle size={18} color="#EF4444" />;
                  }
                } else if (selectedChoice === idx) {
                  btnBg = '#FFFBF5';
                  btnBorder = '#C47D2B';
                }

                return (
                  <button
                    key={idx}
                    className="quiz-choice-btn"
                    disabled={isAnswerSubmitted}
                    onClick={() => handleSelectChoice(idx)}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '14px 16px',
                      borderRadius: '14px',
                      backgroundColor: btnBg,
                      border: `1.5px solid ${btnBorder}`,
                      color: btnColor,
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      lineHeight: '1.4',
                      cursor: isAnswerSubmitted ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span>{choice}</span>
                    {icon}
                  </button>
                );
              })}
            </div>

            {/* Explication pédagogique immédiate */}
            {isAnswerSubmitted && (
              <div
                style={{
                  backgroundColor: selectedChoice === currentQuestion.correctChoiceIndex ? '#ECFDF5' : '#FEF2F2',
                  border: `1px solid ${selectedChoice === currentQuestion.correctChoiceIndex ? '#A7F3D0' : '#FECACA'}`,
                  borderRadius: '14px',
                  padding: '14px 16px',
                  marginBottom: '18px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                  {selectedChoice === currentQuestion.correctChoiceIndex ? (
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#047857' }}>
                      Exact ! +20 XP
                    </span>
                  ) : (
                    <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#B91C1C' }}>
                      À retenir (-1 énergie)
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.82rem', color: '#334155', lineHeight: '1.45' }}>
                  {currentQuestion.explanation}
                </p>
              </div>
            )}

            {/* Bouton Suivant */}
            {isAnswerSubmitted && (
              <button
                className="btn-download-fiche"
                style={{ width: '100%', justifyContent: 'center', padding: '13px' }}
                onClick={handleNext}
              >
                <span>{currentIndex + 1 < totalQuestions ? 'Question suivante' : 'Terminer le quiz'}</span>
                <ArrowRight size={18} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
