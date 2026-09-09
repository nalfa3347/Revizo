import React, { useState } from 'react';
import {
  ArrowLeft,
  Share2,
  Copy,
  Check,
  Users,
  AlertCircle,
  ShieldCheck,
  Send
} from 'lucide-react';
import { useData } from '../../context/DataContext';

interface ReferralViewProps {
  onBack: () => void;
}

export const ReferralView: React.FC<ReferralViewProps> = ({ onBack }) => {
  const { economy, referralService, refreshEconomy } = useData();
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [isSubmittingCode, setIsSubmittingCode] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const referralCode = economy?.referral.referralCode || 'REV-REVIZO';
  const referralsCount = economy?.referral.totalReferrals ?? economy?.referral.referralsCount ?? 0;
  const rewardsEarnedCount = economy?.referral.rewardedReferrals ?? economy?.referral.rewardsEarnedCount ?? 0;
  const totalDiamondsEarned = referralsCount * 5 + rewardsEarnedCount * 10;
  const hasReferrer = !!economy?.referral.referredByUserId;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleShare = async () => {
    const shareText = `Rejoins-moi sur REVIZO, l'application intelligente pour réussir tes cours et examens ! Utilise mon code de parrainage : ${referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'REVIZO — Révise intelligemment',
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        // Annulation ou non-support
      }
    } else {
      await handleCopyCode();
      setFeedback({
        type: 'success',
        message: 'Message copié dans le presse-papier ! Tu peux maintenant le coller à tes amis.'
      });
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const handleApplyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = inputCode.trim().toUpperCase();
    if (!cleanCode) return;

    try {
      setIsSubmittingCode(true);
      setFeedback(null);
      const res = await referralService.applyReferralCode(cleanCode);
      if (res.success) {
        setFeedback({
          type: 'success',
          message: res.message || 'Code de parrainage validé ! Vous avez reçu +5 💎 chacun.'
        });
        setInputCode('');
        await refreshEconomy();
      } else {
        setFeedback({
          type: 'error',
          message: res.message || 'Code de parrainage invalide ou déjà utilisé.'
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Une erreur est survenue.'
      });
    } finally {
      setIsSubmittingCode(false);
      setTimeout(() => setFeedback(null), 6000);
    }
  };

  return (
    <div className="referral-view-container" style={{ padding: '20px', maxWidth: '720px', margin: '0 auto' }}>
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
          Invite tes amis
        </h1>
      </div>

      {feedback && (
        <div
          style={{
            padding: '14px 18px',
            borderRadius: '14px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: feedback.type === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: feedback.type === 'success' ? '#065F46' : '#991B1B',
            fontSize: '0.88rem',
            fontWeight: 600
          }}
        >
          {feedback.type === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Hero card parrainage */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: '28px 24px',
          border: '1.5px solid #FFEDD5',
          boxShadow: '0 8px 24px rgba(234, 88, 12, 0.08)',
          marginBottom: '24px',
          textAlign: 'center'
        }}
      >
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            backgroundColor: '#FFF3E8',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '16px'
          }}
        >
          <Users size={32} color="#EA580C" />
        </div>

        <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#111827', marginBottom: '8px' }}>
          Gagne des diamants en invitant tes camarades !
        </h2>

        <p style={{ fontSize: '0.9rem', color: '#4B5563', maxWidth: '520px', margin: '0 auto 24px auto', lineHeight: 1.5 }}>
          Invite un ami sur REVIZO : vous recevez immédiatement <strong>+5 💎 chacun</strong> dès son inscription. Puis, lorsqu’il souscrit à son premier abonnement payant, tu reçois un bonus de <strong>+10 💎</strong> supplémentaires !
        </p>

        {/* Bloc du code unique */}
        <div
          style={{
            backgroundColor: '#F9FAFB',
            border: '2px dashed #E5E7EB',
            borderRadius: '18px',
            padding: '18px 24px',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            maxWidth: '360px',
            width: '100%',
            marginBottom: '20px'
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ton code de parrainage unique
          </span>
          <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#EA580C', letterSpacing: '0.08em' }}>
            {referralCode}
          </span>
        </div>

        {/* Boutons d'action : Copier et Partager */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={handleCopyCode}
            style={{
              padding: '12px 20px',
              borderRadius: '14px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #E5E7EB',
              color: '#374151',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            {copied ? <Check size={18} color="#059669" /> : <Copy size={18} />}
            <span>{copied ? 'Copié !' : 'Copier le code'}</span>
          </button>

          <button
            onClick={handleShare}
            style={{
              padding: '12px 24px',
              borderRadius: '14px',
              backgroundColor: '#EA580C',
              border: 'none',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.88rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(234, 88, 12, 0.3)'
            }}
          >
            <Share2 size={18} />
            <span>Partager REVIZO</span>
          </button>
        </div>
      </div>

      {/* Cartes de statistiques de parrainage */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #F3F4F6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>
            Filleuls inscrits
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#111827' }}>
            {referralsCount}
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            Amis ayant rejoint avec ton code
          </div>
        </div>

        <div
          style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '20px',
            border: '1px solid #F3F4F6',
            boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#6B7280', marginBottom: '6px' }}>
            Diamants de parrainage gagnés
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#D97706' }}>
            +{totalDiamondsEarned} 💎
          </div>
          <div style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>
            {referralsCount} ami(s) inscrit(s) • {rewardsEarnedCount} abonné(s) payant(s)
          </div>
        </div>
      </div>

      {/* Formulaire "Tu as un code de parrainage ?" */}
      {!hasReferrer && (
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
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111827', margin: '0 0 6px 0' }}>
            Tu as reçu un code d'invitation ?
          </h3>
          <p style={{ fontSize: '0.82rem', color: '#6B7280', margin: '0 0 16px 0' }}>
            Saisis le code de ton camarade ci-dessous pour le désigner comme parrain.
          </p>

          <form onSubmit={handleApplyCode} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="REV-XXXXXX"
              value={inputCode}
              onChange={e => setInputCode(e.target.value.toUpperCase())}
              disabled={isSubmittingCode}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1.5px solid #E5E7EB',
                fontSize: '0.9rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase'
              }}
            />
            <button
              type="submit"
              disabled={!inputCode.trim() || isSubmittingCode}
              style={{
                padding: '12px 20px',
                borderRadius: '12px',
                backgroundColor: inputCode.trim() ? '#111827' : '#E5E7EB',
                color: inputCode.trim() ? '#FFFFFF' : '#9CA3AF',
                border: 'none',
                fontWeight: 700,
                fontSize: '0.88rem',
                cursor: inputCode.trim() ? 'pointer' : 'default',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Send size={16} />
              <span>Valider</span>
            </button>
          </form>
        </div>
      )}

      {/* Règles d'intégrité et anti-fraude */}
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
            Règles de sécurité & intégrité
          </div>
          <div style={{ fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.45 }}>
            Chaque compte ne peut utiliser qu’un seul code de parrainage, une seule fois à vie. L'auto-parrainage est strictement interdit. Le bonus de +5 💎 est attribué immédiatement à l'inscription pour les deux comptes, et le bonus de +10 💎 supplémentaires est automatiquement crédité dès confirmation du premier abonnement payant (Essentiel, Intensif ou Premium) du filleul.
          </div>
        </div>
      </div>
    </div>
  );
};
