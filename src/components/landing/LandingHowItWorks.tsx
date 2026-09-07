import React from 'react';

export const LandingHowItWorks: React.FC = () => {
  const steps = [
    {
      number: "1",
      title: "Importez vos cours",
      desc: "Téléversez vos polycopiés PDF ou prenez vos cahiers en photo. REVIZO analyse la structure complète du cours."
    },
    {
      number: "2",
      title: "Génération automatique",
      desc: "En quelques instants, le moteur pédagogique crée votre fiche de révision synthétique et votre série de quiz ciblés."
    },
    {
      number: "3",
      title: "Révisez et réussissez",
      desc: "Pratiquez le rappel actif avec les quiz, comprenez vos erreurs immédiatement et validez chaque notion pour vos examens."
    }
  ];

  return (
    <section id="how-it-works" className="landing-section">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-tag">Comment ça marche</span>
          <h2 className="landing-section-title">
            Simple, rapide et redoutablement efficace
          </h2>
          <p className="landing-section-desc">
            Passez d'un cours de 40 pages à une maîtrise parfaite en 3 étapes guidées.
          </p>
        </div>

        <div className="landing-steps-grid">
          {steps.map((step, idx) => (
            <div key={idx} className="landing-step-item">
              <div className="landing-step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
