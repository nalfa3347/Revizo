import React from 'react';
import { Check, ArrowRight } from 'lucide-react';

interface LandingPricingProps {
  onOpenAuth: (mode: 'login' | 'signup') => void;
}

export const LandingPricing: React.FC<LandingPricingProps> = ({ onOpenAuth }) => {
  const plans = [
    {
      name: "Découverte",
      price: "0",
      period: "gratuit à vie",
      desc: "Idéal pour tester l'efficacité de REVIZO sur vos premiers cours.",
      popular: false,
      features: [
        "Jusqu'à 2 cours complets",
        "Génération de fiches synthétiques",
        "Quiz d'auto-évaluation",
        "3 énergies quotidiennes ⚡",
        "Accès sur mobile et ordinateur"
      ],
      btnText: "Commencer gratuitement"
    },
    {
      name: "Essentiel",
      price: "1 000",
      period: "FCFA / mois",
      desc: "Pour les élèves réguliers qui veulent progresser chaque semaine.",
      popular: false,
      features: [
        "10 cours analysés par mois",
        "Fiches et quiz complets illimités",
        "Recharge d'énergie rapide",
        "Mode révision ciblée sur les erreurs",
        "Paiement Mobile Money & Carte"
      ],
      btnText: "Choisir Essentiel"
    },
    {
      name: "Intensif",
      price: "3 000",
      period: "FCFA / mois",
      desc: "La formule recommandée pour préparer le Brevet, le Bac ou les partiels.",
      popular: true,
      features: [
        "Cours importés en illimité",
        "Traitement prioritaire par l'IA",
        "Génération illimitée de quiz",
        "Énergie continue ⚡",
        "Statistiques détaillées de maîtrise",
        "Paiement sécurisé FedaPay"
      ],
      btnText: "Choisir Intensif"
    },
    {
      name: "Premium",
      price: "5 000",
      period: "FCFA / mois",
      desc: "Pour les étudiants exigeants visant l'excellence académique.",
      popular: false,
      features: [
        "Tout ce qui est dans Intensif",
        "Explications approfondies pas à pas",
        "Support pédagogique prioritaire 7j/7",
        "Accès en avant-première aux nouveautés",
        "Export et impression des fiches"
      ],
      btnText: "Choisir Premium"
    }
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
            Tarifs simples en Francs CFA, payables facilement par MTN Mobile Money, Moov, Orange, Wave ou Carte bancaire.
          </p>
        </div>

        <div className="landing-pricing-grid">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`landing-pricing-card ${plan.popular ? 'is-popular' : ''}`}
            >
              {plan.popular && (
                <div className="landing-popular-tag">Recommandé</div>
              )}

              <div>
                <h3 className="landing-pricing-name">{plan.name}</h3>
                <p className="landing-pricing-desc">{plan.desc}</p>

                <div className="landing-pricing-price">
                  <span className="landing-pricing-amount">{plan.price}</span>
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
                className={plan.popular ? 'landing-hero-btn-primary' : 'landing-btn-login'}
                style={
                  plan.popular
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
                <span>{plan.btnText}</span>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
