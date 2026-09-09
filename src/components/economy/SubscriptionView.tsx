import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Zap,
  ShieldCheck,
  Crown,
  Flame,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useData } from '../../context/DataContext';
import { SubscriptionPlan, SUBSCRIPTION_PLANS } from '../../types';

interface SubscriptionViewProps {
  onBack: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({ onBack }) => {
  const { economy, monetizationService, refreshEconomy } = useData();
  const [activatingPlan, setActivatingPlan] = useState<SubscriptionPlan | null>(null);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const currentPlan = economy?.subscription.plan ?? 'free';
  const currentStatus = economy?.subscription.status ?? 'free';
  const dailyLimit = economy?.subscription.dailyRevisionLimit ?? 3;
  const dailyUsed = economy?.energy.dailyRevisionUsed ?? economy?.subscription.dailyRevisionUsed ?? 0;

  // Détection du retour après paiement FedaPay (callback ou success)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const paymentStatus = params.get('payment');
    const planParam = params.get('plan') as SubscriptionPlan | null;

    if (paymentStatus === 'success' || paymentStatus === 'callback') {
      refreshEconomy();
      const planName = planParam && SUBSCRIPTION_PLANS[planParam] ? SUBSCRIPTION_PLANS[planParam].name : 'REVIZO';
      setNotice({
        type: 'success',
        message: `Félicitations ! Ton paiement a été validé avec succès. Ton offre ${planName} est désormais active !`
      });
      // Nettoyer l'URL proprement sans recharger
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'canceled' || paymentStatus === 'declined') {
      setNotice({
        type: 'error',
        message: 'Le paiement FedaPay a été interrompu ou annulé. Aucun débit n’a été effectué.'
      });
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleSubscribe = async (plan: SubscriptionPlan) => {
    if (plan === 'free' || plan === currentPlan) return;

    try {
      setActivatingPlan(plan);
      setNotice(null);

      // Création de la session sécurisée FedaPay (Mobile Money MTN, Moov, Orange, Wave / Cartes)
      const res = await monetizationService.createCheckoutSession(plan);

      if (!res.success) {
        setNotice({
          type: 'error',
          message: res.message || "Impossible d'initialiser le guichet de paiement FedaPay."
        });
        setActivatingPlan(null);
        return;
      }

      // Si URL de paiement FedaPay directe retournée
      if (res.checkoutUrl && !res.simulated) {
        setNotice({
          type: 'success',
          message: 'Redirection sécurisée vers le guichet FedaPay (Mobile Money & Cartes)...'
        });
        window.location.href = res.checkoutUrl;
        return;
      }

      // Si mode simulation / développement
      if (res.simulated) {
        await monetizationService.activateSubscription(plan, res.transactionId || `sim-${Date.now()}`);
        setNotice({
          type: 'success',
          message: `Félicitations ! Ton abonnement ${SUBSCRIPTION_PLANS[plan].name} est activé avec succès.`
        });
        await refreshEconomy();
      }
    } catch (err: any) {
      setNotice({
        type: 'error',
        message: err.message || 'Une erreur est survenue lors de la connexion à FedaPay.'
      });
    } finally {
      setActivatingPlan(null);
      setTimeout(() => setNotice(null), 8000);
    }
  };

  const formatDate = (iso?: string | null) => {
    if (!iso) return '';
    try {
      return new Intl.DateTimeFormat('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  };

  return (
    <div className="subscription-view-container" style={{ padding: '20px', maxWidth: '840px', margin: '0 auto' }}>
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
          Abonnements REVIZO
        </h1>
      </div>

      {/* Carte d'état actuel */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '20px',
          padding: '20px 24px',
          border: '1px solid #E5E7EB',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          marginBottom: '28px',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px'
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Ton offre actuelle :
            </span>
            <span
              style={{
                backgroundColor: currentPlan === 'free' ? '#F3F4F6' : currentPlan === 'intensif' ? '#FFF3E8' : currentPlan === 'premium' ? '#FEF3C7' : '#EFF6FF',
                color: currentPlan === 'free' ? '#4B5563' : currentPlan === 'intensif' ? '#EA580C' : currentPlan === 'premium' ? '#B45309' : '#1D4ED8',
                fontWeight: 800,
                fontSize: '0.78rem',
                padding: '3px 10px',
                borderRadius: '999px',
                textTransform: 'uppercase'
              }}
            >
              {SUBSCRIPTION_PLANS[currentPlan]?.name ?? 'Gratuit'}
            </span>
            {currentStatus === 'active' && (
              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Check size={14} /> Actif
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.9rem', color: '#374151' }}>
            Quota du jour : <strong>{dailyUsed} / {dailyLimit} révisions utilisées</strong>
          </div>
          {economy?.subscription.expiresAt && currentStatus === 'active' && (
            <div style={{ fontSize: '0.78rem', color: '#9CA3AF', marginTop: '2px' }}>
              Valide jusqu’au {formatDate(economy.subscription.expiresAt)}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: '#6B7280', fontWeight: 600 }}>Énergie max</div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#EA580C' }}>
              {economy?.energy.maxEnergy ?? 10} ⚡
            </div>
          </div>
        </div>
      </div>

      {notice && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: notice.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: notice.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.88rem',
            fontWeight: 600
          }}
        >
          {notice.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{notice.message}</span>
        </div>
      )}

      {/* Les 3 offres officielles REVIZO */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* 1. ESSENTIEL */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: currentPlan === 'essentiel' ? '2px solid #EA580C' : '1px solid #E5E7EB',
            boxShadow: currentPlan === 'essentiel' ? '0 8px 24px rgba(234, 88, 12, 0.12)' : '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={20} color="#2563EB" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                ESSENTIEL
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>1 000</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6B7280' }}> FCFA / mois</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '20px' }}>
              Idéal pour suivre le rythme des cours et réviser chaque matière régulièrement.
            </p>

            {/* Avantages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>4 révisions</strong> intelligentes par jour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>10 💎</strong> offerts à l'inscription</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span>Accès illimité aux fiches téléchargées</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('essentiel')}
            disabled={activatingPlan !== null || currentPlan === 'essentiel'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: currentPlan === 'essentiel' ? '#F3F4F6' : '#111827',
              color: currentPlan === 'essentiel' ? '#9CA3AF' : '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: currentPlan === 'essentiel' ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {activatingPlan === 'essentiel' ? (
              <RotateCcw size={16} className="spinning" />
            ) : currentPlan === 'essentiel' ? (
              'Offre active'
            ) : (
              'Choisir Essentiel'
            )}
          </button>
        </div>

        {/* 2. INTENSIF — LE PLUS POPULAIRE */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: '2px solid #EA580C',
            boxShadow: '0 12px 32px rgba(234, 88, 12, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          {/* Badge le plus populaire */}
          <div
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#EA580C',
              color: '#FFFFFF',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '4px 14px',
              borderRadius: '999px',
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)'
            }}
          >
            Le plus populaire
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', marginTop: '6px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#FFF3E8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Flame size={20} color="#EA580C" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                INTENSIF
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EA580C' }}>3 000</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6B7280' }}> FCFA / mois</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '20px' }}>
              Pour préparer sereinement ses devoirs, contrôles et examens avec plusieurs cours par jour.
            </p>

            {/* Avantages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>10 révisions</strong> intelligentes par jour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>30 💎</strong> offerts à l'inscription</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span>Quiz et exercices renforcés</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('intensif')}
            disabled={activatingPlan !== null || currentPlan === 'intensif'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: currentPlan === 'intensif' ? '#F3F4F6' : '#EA580C',
              color: currentPlan === 'intensif' ? '#9CA3AF' : '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: currentPlan === 'intensif' ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              boxShadow: currentPlan === 'intensif' ? 'none' : '0 4px 14px rgba(234, 88, 12, 0.3)'
            }}
          >
            {activatingPlan === 'intensif' ? (
              <RotateCcw size={16} className="spinning" />
            ) : currentPlan === 'intensif' ? (
              'Offre active'
            ) : (
              'Choisir Intensif'
            )}
          </button>
        </div>

        {/* 3. PREMIUM — EXPÉRIENCE LA PLUS COMPLÈTE */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            padding: '24px',
            border: currentPlan === 'premium' ? '2px solid #D97706' : '1px solid #E5E7EB',
            boxShadow: currentPlan === 'premium' ? '0 8px 24px rgba(217, 119, 6, 0.15)' : '0 4px 12px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '12px', backgroundColor: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Crown size={20} color="#D97706" />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#111827', margin: 0 }}>
                PREMIUM
              </h3>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#111827' }}>5 000</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#6B7280' }}> FCFA / mois</span>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#4B5563', lineHeight: 1.45, marginBottom: '20px' }}>
              L'expérience REVIZO intégrale. Priorité totale, révisions approfondies et support complet.
            </p>

            {/* Avantages */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>18 révisions</strong> intelligentes par jour</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span><strong>60 💎</strong> offerts à l'inscription</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', color: '#1F2937' }}>
                <Check size={16} color="#10B981" strokeWidth={2.5} />
                <span>Traitement IA prioritaire ultra-rapide</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => handleSubscribe('premium')}
            disabled={activatingPlan !== null || currentPlan === 'premium'}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: '14px',
              backgroundColor: currentPlan === 'premium' ? '#F3F4F6' : '#111827',
              color: currentPlan === 'premium' ? '#9CA3AF' : '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: currentPlan === 'premium' ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            {activatingPlan === 'premium' ? (
              <RotateCcw size={16} className="spinning" />
            ) : currentPlan === 'premium' ? (
              'Offre active'
            ) : (
              'Choisir Premium'
            )}
          </button>
        </div>
      </div>

      {/* Note d'architecture paiements Fedapay */}
      <div
        style={{
          backgroundColor: '#F9FAFB',
          borderRadius: '16px',
          padding: '16px 20px',
          border: '1px solid #E5E7EB',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px'
        }}
      >
        <ShieldCheck size={20} color="#059669" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#111827', marginBottom: '2px' }}>
            Paiements sécurisés via FedaPay
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.45 }}>
            Accepte <strong>MTN Mobile Money, Moov Money, Orange Money, Wave</strong>.
            Chaque transaction est traitée sur le guichet crypté officiel de FedaPay. Vos abonnements et quotas sont activés instantanément dès confirmation.
          </div>
        </div>
      </div>
    </div>
  );
};
