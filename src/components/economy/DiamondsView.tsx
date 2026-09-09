import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Gem,
  Zap,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Award,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { DiamondTransaction, EnergyTransaction } from '../../types';

interface DiamondsViewProps {
  onBack: () => void;
  onNavigateToSubscription?: () => void;
  onNavigateToReferral?: () => void;
}

export const DiamondsView: React.FC<DiamondsViewProps> = ({
  onBack,
  onNavigateToSubscription,
  onNavigateToReferral
}) => {
  const { economy, economyService, refreshEconomy } = useData();
  const [isConverting, setIsConverting] = useState(false);
  const [convertFeedback, setConvertFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const [diamondHistory, setDiamondHistory] = useState<DiamondTransaction[]>([]);
  const [energyHistory, setEnergyHistory] = useState<EnergyTransaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  const diamondsBalance = economy?.diamonds.balance ?? 0;
  const currentEnergy = economy?.energy.currentEnergy ?? 0;
  const maxEnergy = economy?.energy.maxEnergy ?? 3;
  const dailyRefillsUsed = economy?.energy.diamondsConvertedToday ?? economy?.energy.dailyRefillsUsed ?? 0;
  const maxDailyRefills = economy?.energy.maxDailyDiamondConversions ?? 10;

  const canConvert = diamondsBalance >= 5 && currentEnergy < maxEnergy && dailyRefillsUsed < maxDailyRefills;

  useEffect(() => {
    let mounted = true;
    const fetchHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const [dTx, eTx] = await Promise.all([
          economyService.getDiamondTransactions(),
          economyService.getEnergyTransactions()
        ]);
        if (mounted) {
          setDiamondHistory(dTx);
          setEnergyHistory(eTx);
        }
      } catch (err) {
        console.error('Erreur chargement historique économie:', err);
      } finally {
        if (mounted) {
          setIsLoadingHistory(false);
        }
      }
    };

    fetchHistory();
    return () => {
      mounted = false;
    };
  }, [economyService]);

  const handleConvert = async () => {
    if (!canConvert || isConverting) return;

    try {
      setIsConverting(true);
      setConvertFeedback(null);
      const result = await economyService.convertDiamondsToEnergy();
      if (result.success) {
        setConvertFeedback({
          type: 'success',
          message: '+1 ⚡ ajoutée à ton énergie avec succès !'
        });
        await refreshEconomy();
        // Rafraîchir l'historique
        const [dTx, eTx] = await Promise.all([
          economyService.getDiamondTransactions(),
          economyService.getEnergyTransactions()
        ]);
        setDiamondHistory(dTx);
        setEnergyHistory(eTx);
      } else {
        setConvertFeedback({
          type: 'error',
          message: result.message || 'Conversion impossible pour le moment.'
        });
      }
    } catch (err: any) {
      setConvertFeedback({
        type: 'error',
        message: err.message || 'Une erreur est survenue lors de la conversion.'
      });
    } finally {
      setIsConverting(false);
      setTimeout(() => setConvertFeedback(null), 5000);
    }
  };

  // Formatage des dates
  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      }).format(d);
    } catch {
      return iso;
    }
  };

  return (
    <div className="economy-view-container" style={{ padding: '20px', maxWidth: '720px', margin: '0 auto' }}>
      {/* En-tête avec bouton retour */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <button
          className="btn-header-back"
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '8px 14px',
            borderRadius: '999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            cursor: 'pointer',
            fontSize: '0.85rem',
            fontWeight: 600,
            color: '#374151'
          }}
        >
          <ArrowLeft size={16} />
          <span>Retour</span>
        </button>
        <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#111827', margin: 0 }}>
          Mes Diamants & Énergie
        </h1>
      </div>

      {/* Cartes de solde Diamants & Énergie */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {/* Solde Diamants */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #F3F4F6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Solde de Diamants
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Gem size={20} color="#D97706" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
              {diamondsBalance}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#D97706' }}>💎</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: '#9CA3AF' }}>
            Total gagné à ce jour : <strong>{economy?.diamonds.lifetimeEarned ?? diamondsBalance} 💎</strong>
          </div>
        </div>

        {/* Solde Énergie */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #F3F4F6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Énergie Disponible
            </span>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Zap size={20} color="#EA580C" />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '2.4rem', fontWeight: 900, color: '#111827', lineHeight: 1 }}>
              {currentEnergy}
            </span>
            <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#6B7280' }}>
              / {maxEnergy} ⚡
            </span>
          </div>
          {/* Barre de jauge */}
          <div style={{ width: '100%', height: '8px', backgroundColor: '#F3F4F6', borderRadius: '999px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, (currentEnergy / maxEnergy) * 100))}%`,
                height: '100%',
                backgroundColor: '#EA580C',
                borderRadius: '999px',
                transition: 'width 0.4s ease'
              }}
            />
          </div>
        </div>
      </div>

      {/* Module de conversion 5 💎 = 1 ⚡ */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1.5px solid #FFEDD5',
          boxShadow: '0 4px 16px rgba(234, 88, 12, 0.06)',
          marginBottom: '28px',
          position: 'relative'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <Sparkles size={20} color="#EA580C" />
          <h2 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Recharger mon énergie avec mes diamants
          </h2>
        </div>
        <p style={{ fontSize: '0.85rem', color: '#4B5563', margin: '0 0 16px 0', lineHeight: 1.5 }}>
          Convertis <strong>5 💎</strong> pour récupérer <strong>+1 ⚡</strong> d'énergie utilisable pour tes quiz et sessions d'apprentissage.
        </p>

        {/* Indicateur de limite journalière */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#FFF7ED',
            padding: '10px 16px',
            borderRadius: '12px',
            marginBottom: '16px',
            fontSize: '0.8rem',
            color: '#9A3412',
            fontWeight: 600
          }}
        >
          <span>Limite de recharge par diamants :</span>
          <span>{dailyRefillsUsed} / {maxDailyRefills} ⚡ aujourd'hui</span>
        </div>

        {convertFeedback && (
          <div
            style={{
              padding: '12px 16px',
              borderRadius: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: convertFeedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
              color: convertFeedback.type === 'success' ? '#065F46' : '#991B1B',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            {convertFeedback.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{convertFeedback.message}</span>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleConvert}
            disabled={!canConvert || isConverting}
            style={{
              backgroundColor: canConvert ? '#EA580C' : '#E5E7EB',
              color: canConvert ? '#FFFFFF' : '#9CA3AF',
              border: 'none',
              borderRadius: '14px',
              padding: '12px 24px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: canConvert ? 'pointer' : 'not-allowed',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: canConvert ? '0 4px 12px rgba(234, 88, 12, 0.25)' : 'none',
              transition: 'all 0.2s ease'
            }}
          >
            {isConverting ? (
              <>
                <RotateCcw size={16} className="spinning" />
                <span>Conversion en cours...</span>
              </>
            ) : (
              <>
                <span>Convertir 5 💎 → +1 ⚡</span>
              </>
            )}
          </button>

          {!canConvert && (
            <span style={{ fontSize: '0.8rem', color: '#6B7280' }}>
              {diamondsBalance < 5
                ? 'Solde insuffisant (minimum 5 💎 requis)'
                : currentEnergy >= maxEnergy
                ? 'Ton énergie est déjà à son maximum'
                : 'Limite quotidienne atteinte (10 ⚡ max / jour)'}
            </span>
          )}
        </div>
      </div>

      {/* Guide didactique : Comment gagner des diamants 💎 */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #F3F4F6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginBottom: '28px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Award size={20} color="#EA580C" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Comment gagner des diamants 💎
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>📖 Terminer une fiche de révision</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '999px' }}>+2 💎</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>🎯 Terminer un quiz interactif</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '999px' }}>+2 💎</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>🏆 Quiz réussi à 80% ou plus</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '999px' }}>+3 💎 bonus</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>⚡ Série de 5 bonnes réponses d'affilée</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '999px' }}>+2 💎</span>
          </div>

          <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: '#F9FAFB', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: 600 }}>📅 7 jours consécutifs d'étude</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#D97706', backgroundColor: '#FEF3C7', padding: '3px 8px', borderRadius: '999px' }}>+10 💎</span>
          </div>

          <div
            onClick={onNavigateToReferral}
            style={{
              padding: '12px 14px',
              borderRadius: '12px',
              backgroundColor: '#FFF7ED',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: onNavigateToReferral ? 'pointer' : 'default',
              border: '1px solid #FFEDD5'
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#9A3412', fontWeight: 700 }}>🤝 1er abonnement d'un ami parrainé</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#EA580C', backgroundColor: '#FFFFFF', padding: '3px 8px', borderRadius: '999px' }}>+10 💎</span>
          </div>
        </div>
      </div>

      {/* Bannière CTA vers l'abonnement si besoin de plus de révisions quotidiennes */}
      {onNavigateToSubscription && (
        <div
          onClick={onNavigateToSubscription}
          style={{
            backgroundColor: '#1E2022',
            color: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px 24px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#F29E4C', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
              Passe à la vitesse supérieure
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 800, marginBottom: '2px' }}>
              Besoin de plus de révisions par jour ?
            </div>
            <div style={{ fontSize: '0.82rem', color: '#D1D5DB' }}>
              Découvre nos formules Essentiel, Intensif et Premium dès 1 000 FCFA/mois.
            </div>
          </div>
          <ChevronRight size={22} color="#F29E4C" />
        </div>
      )}

      {/* Historique des transactions */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '24px',
          border: '1px solid #F3F4F6',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <Clock size={18} color="#4B5563" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: 0 }}>
            Historique des transactions
          </h2>
        </div>

        {isLoadingHistory ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#6B7280', fontSize: '0.85rem' }}>
            Chargement de ton historique...
          </div>
        ) : diamondHistory.length === 0 && energyHistory.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF', fontSize: '0.85rem' }}>
            Aucune transaction enregistrée pour le moment. Réalise ta première révision pour gagner des diamants !
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {diamondHistory.map(tx => {
              const isPositive = tx.amount > 0;
              return (
                <div
                  key={tx.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    backgroundColor: '#F9FAFB'
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827' }}>
                      {tx.reason || (isPositive ? 'Récompense acquise' : 'Conversion')}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      color: isPositive ? '#059669' : '#DC2626'
                    }}
                  >
                    {isPositive ? `+${tx.amount}` : tx.amount} 💎
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
