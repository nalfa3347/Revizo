import React from 'react';
import { BookOpen, Sparkles, Zap, Trophy } from 'lucide-react';


export const LandingFeatures: React.FC = () => {
  const features = [
    {
      icon: <BookOpen size={26} />,
      title: "Import Instantané & Multi-formats",
      desc: "Glissez vos PDF de cours ou prenez simplement en photo vos notes manuscrites. REVIZO traite le document en quelques secondes."
    },
    {
      icon: <Sparkles size={26} />,
      title: "Fiches de Révision Ultra-Ciblées",
      desc: "L'IA extrait uniquement les notions clés, formules et définitions essentielles. Une synthèse fidèle, concise et facile à retenir."
    },
    {
      icon: <Zap size={26} />,
      title: "Quiz Interactifs sur-mesure",
      desc: "Vérifiez immédiatement votre compréhension grâce à des quiz adaptatifs. Chaque erreur est analysée avec une explication claire."
    },
    {
      icon: <Trophy size={26} />,
      title: "Gamification & Séries Stimulantes",
      desc: "Gagnez des diamants 💎, maintenez votre série quotidienne 🔥 et progressez à votre rythme sans jamais perdre la motivation."
    }
  ];

  return (
    <section id="features" className="landing-section landing-section-alt">
      <div className="landing-container">
        <div className="landing-section-header">
          <span className="landing-section-tag">Fonctionnalités</span>
          <h2 className="landing-section-title">
            Tout pour réviser plus vite et réussir vos examens
          </h2>
          <p className="landing-section-desc">
            REVIZO remplace des heures de relecture passive par une méthode d'apprentissage active éprouvée scientifiquement.
          </p>
        </div>

        <div className="landing-features-grid">
          {features.map((item, index) => (
            <div key={index} className="landing-feature-card">
              <div className="landing-feature-icon-box">
                {item.icon}
              </div>
              <h3>{item.title}</h3>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
