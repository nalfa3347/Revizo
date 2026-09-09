import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

export const LandingFaq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: "Quels types de documents puis-je importer dans REVIZO ?",
      a: "Vous pouvez importer des polycopiés au format PDF, mais également prendre directement en photo vos feuilles de cours, cahiers manuscrits ou les notes prises au tableau. REVIZO extrait le texte, les formules et les tableaux."
    },
    {
      q: "L'intelligence artificielle peut-elle inventer des informations fausses ?",
      a: "Non. Le moteur pédagogique de REVIZO applique une règle stricte de fidélité au cours : les synthèses et les quiz sont rigoureusement générés à partir des notions présentes dans votre document original, sans extrapolation."
    },
    {
      q: "Quels sont les moyens de paiement acceptés pour les abonnements ?",
      a: "REVIZO intègre la passerelle sécurisée FedaPay. Vous pouvez payer en toute simplicité en Francs CFA par Mobile Money (MTN, Moov, Orange, Wave, Celtiis)."
    },
    {
      q: "Puis-je utiliser REVIZO sur mon téléphone portable ?",
      a: "Absolument. REVIZO a été conçu selon les standards du mobile-first. L'expérience est ultra-fluide sur smartphone Android et iPhone, ainsi que sur ordinateur portable et tablette."
    },
    {
      q: "Comment fonctionne le système d'énergie et de quiz ?",
      a: "Chaque élève dispose d'une jauge d'énergie ⚡ pour réaliser ses quiz. Une bonne réponse valide la notion et fait gagner des diamants 💎. En cas d'erreur, une explication immédiate vous aide à comprendre et à progresser."
    }
  ];

  const toggleFaq = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="landing-section">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-tag">FAQ</span>
          <h2 className="landing-section-title">
            Questions fréquemment posées
          </h2>
          <p className="landing-section-desc">
            Tout ce que vous devez savoir pour démarrer sereinement avec REVIZO.
          </p>
        </div>

        <div className="landing-faq-list">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="landing-faq-item">
                <button
                  className="landing-faq-question"
                  onClick={() => toggleFaq(idx)}
                  type="button"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp size={20} color="#6B7280" /> : <ChevronDown size={20} color="#6B7280" />}
                </button>
                {isOpen && (
                  <div className="landing-faq-answer">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
