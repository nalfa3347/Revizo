import React from 'react';
import { Check, ArrowRight } from 'lucide-react';
import { ORDERED_PLANS } from '../../config/subscriptionPlans';

interface LandingPricingProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onOpenAuth }) => {
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

        <div className="landing-pricing-grid">
          {ORDERED_PLANS.map((plan) => {
            const formattedPrice = plan.priceFcfa === 0 
              ? '0' 
              : plan.priceFcfa.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
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
                  <span>{plan.btnText || 'Commencer'}</span>
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
