import React from 'react';
import { Check, ArrowRight, Sparkles } from 'lucide-react';
import { SUBSCRIPTION_PLANS } from '../../config/subscriptionPlans';

interface LandingPricingProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onOpenAuth }) => {
  const freePlan = SUBSCRIPTION_PLANS.free;
  const paidPlans = [
    SUBSCRIPTION_PLANS.essentiel,
    SUBSCRIPTION_PLANS.intensif,
    SUBSCRIPTION_PLANS.premium
  ];

  return (
    <section id="pricing" className="landing-section landing-section-alt">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-tag">Tarifs</span>
          <h2 className="landing-section-title">
            Des formules adaptées à votre réussite
          </h2>
          <p className="landing-section-desc">
            Tarifs simples en Francs CFA, payables facilement par Mobile Money (MTN, Moov, Orange, Wave).
          </p>
        </div>

        {/* 1. BANDEAU ESSAI GRATUIT */}
        <div className="landing-free-trial-banner">
          <div className="landing-free-trial-content">
            <div className="landing-free-trial-header">
              <span className="landing-free-trial-badge">
                <Sparkles size={14} />
                {freePlan.name}
              </span>
              <span className="landing-free-trial-price">0 FCFA — Gratuit à vie</span>
            </div>
            <h3 className="landing-free-trial-title">
              1 cours d'essai complet gratuit à vie
            </h3>
            <p className="landing-free-trial-desc">{freePlan.desc}</p>
            <ul className="landing-free-trial-features">
              {freePlan.features.map((feat, idx) => (
                <li key={idx} className="landing-free-trial-feature-item">
                  <Check size={16} className="landing-feature-check" />
                  <span>{feat}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-free-trial-action">
            <button
              className="landing-hero-btn-primary"
              onClick={() => onOpenAuth('signup')}
              type="button"
            >
              <span>{freePlan.btnText || 'Commencer gratuitement'}</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>

        {/* 2. GRILLE DES 3 CARTES PAYANTES */}
        <div className="landing-pricing-grid">
          {paidPlans.map((plan) => {
            const formattedPrice = plan.priceFcfa.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
            const isPopular = Boolean(plan.isPopular);

            return (
              <div
                key={plan.id}
                className={`landing-pricing-card ${isPopular ? 'is-popular' : ''}`}
              >
                {isPopular && (
                  <div className="landing-popular-tag">{plan.badge || 'Recommandé'}</div>
                )}

                <div>
                  <h3 className="landing-pricing-name">{plan.name}</h3>
                  <p className="landing-pricing-desc">{plan.desc}</p>

                  <div className="landing-pricing-price">
                    <span className="landing-pricing-amount">{formattedPrice}</span>
                    <span className="landing-pricing-period">{plan.period}</span>
                  </div>

                  <ul className="landing-pricing-features">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="landing-pricing-feature-item">
                        <Check size={16} className="landing-feature-check" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  className={isPopular ? 'landing-hero-btn-primary' : 'landing-btn-login'}
                  style={
                    isPopular
                      ? { width: '100%', justifyContent: 'center' }
                      : {
                          width: '100%',
                          border: '1px solid var(--landing-border-subtle)',
                          textAlign: 'center',
                          padding: '12px 18px',
                          background: '#FFFFFF'
                        }
                  }
                  onClick={() => onOpenAuth('signup')}
                  type="button"
                >
                  <span>{plan.btnText || 'Choisir'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
