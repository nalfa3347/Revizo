import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  BookOpen,
  Gamepad2,
  X,
  AlertCircle
} from 'lucide-react';
import { PipelineProgress, PipelineResult } from '../../services/ai/AIOrchestrator';
import { Course, Revision, Quiz } from '../../types';

interface ImportProcessingModalProps {
  progress: PipelineProgress | null;
  result: PipelineResult | null;
  fileName: string | null;
  onClose: () => void;
  onViewRevision: (course: Course, revision: Revision) => void;
  onStartQuiz: (course: Course, quiz: Quiz) => void;
  onNavigateToSubscription?: () => void;
}

export const ImportProcessingModal: React.FC<ImportProcessingModalProps> = ({
  progress,
  result,
  fileName,
  onClose,
  onViewRevision,
  onStartQuiz,
  onNavigateToSubscription
}) => {
  if (!progress && !result) return null;

  const isProcessing = progress && progress.stage !== 'completed' && progress.stage !== 'error';
  const isCompleted = result && (!progress || progress.stage === 'completed');
  const isError = progress && progress.stage === 'error';

  return (
    <div
      className="import-modal-backdrop"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        className="import-modal-card"
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '32px 24px',
          maxWidth: '520px',
          width: '100%',
          boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.25)',
          position: 'relative',
          border: '1px solid #F0ECE6'
        }}
      >
        {/* Bouton fermeture si terminé ou en erreur */}
        {!isProcessing && (
          <button
            onClick={onClose}
            aria-label="Fermer"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: '#F5F3EF',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#6B7280'
            }}
          >
            <X size={16} />
          </button>
        )}

        {/* 1. ÉTAT DE CHARGEMENT / PROGRESSION ÉLÉGANTE */}
        {isProcessing && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: '#FFFBF5',
                border: '2px solid #F3EBE1',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '20px'
              }}
            >
              <Sparkles size={30} color="#C47D2B" className="animate-pulse" />
            </div>

            <h3
              style={{
                fontFamily: 'var(--font-family-display)',
                fontSize: '1.35rem',
                fontWeight: 800,
                color: '#1E293B',
                marginBottom: '8px'
              }}
            >
              {progress.message}
            </h3>

            {fileName && (
              <p style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '24px' }}>
                Document : <span style={{ fontWeight: 600, color: '#334155' }}>{fileName}</span>
              </p>
            )}

            {/* Barre de progression fluide */}
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#F1EFEA',
                borderRadius: '999px',
                overflow: 'hidden',
                marginBottom: '14px'
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${progress.percent}%`,
                  backgroundColor: '#C47D2B',
                  borderRadius: '999px',
                  transition: 'width 0.4s ease'
                }}
              />
            </div>

            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: '#94A3B8',
                fontWeight: 600
              }}
            >
              <span>
                {progress.stage === 'reading' || progress.stage === 'extracting'
                  ? 'Étape 1/7'
                  : progress.stage === 'understanding' || progress.stage === 'analyzing'
                  ? 'Étape 2/7'
                  : progress.stage === 'prioritizing'
                  ? 'Étape 3/7'
                  : progress.stage === 'generating_rev'
                  ? 'Étape 4/7'
                  : progress.stage === 'generating_questions'
                  ? 'Étape 5/7'
                  : progress.stage === 'generating_quiz'
                  ? 'Étape 6/7'
                  : progress.stage === 'generating_exercises'
                  ? 'Étape 7/7'
                  : 'Traitement'}
              </span>
              <span>{progress.percent}%</span>
            </div>
          </div>
        )}

        {/* 2. ÉTAT SUCCÈS : « TON COURS EST PRÊT ! » */}
        {isCompleted && result && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: '#ECFDF5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '12px'
                }}
              >
                <CheckCircle2 size={32} color="#10B981" />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '1.45rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  marginBottom: '4px'
                }}
              >
                Ton cours est prêt !
              </h3>
              <p style={{ fontSize: '0.88rem', color: '#64748B' }}>
                L'analyse est terminée. Ta révision et ton quiz sont prêts.
              </p>
            </div>

            {/* Fiche récapitulative du cours importé */}
            <div
              style={{
                backgroundColor: '#FAF8F5',
                border: '1px solid #F0ECE6',
                borderRadius: '16px',
                padding: '18px 20px',
                marginBottom: '24px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span
                  style={{
                    backgroundColor: '#FDF2E7',
                    color: '#C47D2B',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: '999px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em'
                  }}
                >
                  {result.course.subjectName}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>
                  • {result.analysis?.concepts?.length ?? 0} notions identifiées
                </span>
              </div>

              <h4
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  marginBottom: '6px'
                }}
              >
                {result.course.title}
              </h4>

              <p
                style={{
                  fontSize: '0.82rem',
                  color: '#475569',
                  lineHeight: '1.5',
                  marginBottom: '12px'
                }}
              >
                {result.analysis?.summary || result.course.summary}
              </p>

              {/* Notions clés identifiées */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {(result.analysis?.concepts || []).map(concept => (
                  <span
                    key={concept.id}
                    style={{
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      padding: '3px 8px',
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      color: '#334155'
                    }}
                  >
                    ✓ {concept.name}
                  </span>
                ))}
              </div>
            </div>

            {/* Deux boutons d'action principaux exigés */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-download-fiche"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '14px',
                  borderRadius: '14px',
                  fontSize: '0.95rem'
                }}
                onClick={() => onViewRevision(result.course, result.revision)}
              >
                <BookOpen size={18} strokeWidth={2.2} />
                <span>Voir ma révision</span>
              </button>

              <button
                style={{
                  width: '100%',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#C47D2B',
                  border: '1.5px solid #C47D2B',
                  borderRadius: '14px',
                  padding: '13px',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease'
                }}
                onClick={() => onStartQuiz(result.course, result.quiz)}
              >
                <Gamepad2 size={18} strokeWidth={2.2} />
                <span>Commencer le quiz</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. ÉTAT ERREUR BIENVEILLANTE SANS JARGON TECHNIQUE */}
        {isError && (() => {
          const msg = progress?.message || '';
          const isTrialExhausted = msg.includes('essai gratuit') || msg.includes('Choisis un forfait');
          const isTooManyPages = msg.includes('limite de 20 pages') || msg.includes('dépasse 20 pages') || msg.includes('Découpe-le');
          const isDailyLimit = msg.includes('limite de révisions') || msg.includes('quota');

          let errorTitle = 'Lecture du document interrompue';
          if (isTrialExhausted) {
            errorTitle = 'Essai gratuit terminé';
          } else if (isTooManyPages) {
            errorTitle = 'Document trop long (> 20 pages)';
          } else if (isDailyLimit) {
            errorTitle = 'Limite quotidienne atteinte';
          }

          return (
            <div style={{ textAlign: 'center', padding: '12px 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  backgroundColor: isTrialExhausted ? '#FFF7ED' : '#FEF2F2',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px'
                }}
              >
                <AlertCircle size={30} color={isTrialExhausted ? '#EA580C' : '#EF4444'} />
              </div>

              <h3
                style={{
                  fontFamily: 'var(--font-family-display)',
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  color: '#1E293B',
                  marginBottom: '8px'
                }}
              >
                {errorTitle}
              </h3>

              <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.5', marginBottom: '20px' }}>
                {msg || 'Nous n’avons pas pu lire le contenu de ce document. Assure-toi que le fichier est un PDF ou une photo lisible.'}
              </p>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap' }}>
                {(isTrialExhausted || isDailyLimit) && onNavigateToSubscription ? (
                  <>
                    <button
                      style={{
                        backgroundColor: '#EA580C',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 22px',
                        fontSize: '0.95rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
                      }}
                      onClick={() => {
                        onClose();
                        onNavigateToSubscription();
                      }}
                    >
                      {isTrialExhausted ? 'Choisir un forfait' : 'Voir les forfaits'}
                    </button>
                    <button
                      style={{
                        backgroundColor: '#F3F4F6',
                        color: '#4B5563',
                        border: 'none',
                        borderRadius: '12px',
                        padding: '12px 18px',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                      onClick={onClose}
                    >
                      Fermer
                    </button>
                  </>
                ) : isTooManyPages ? (
                  <button
                    style={{
                      backgroundColor: '#1E293B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '12px 24px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={onClose}
                  >
                    J'ai compris
                  </button>
                ) : (
                  <button
                    style={{
                      backgroundColor: '#C47D2B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '10px 20px',
                      fontSize: '0.9rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                    onClick={onClose}
                  >
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
