import React from 'react';

interface Target3DIllustrationProps {
  size?: number;
  className?: string;
  withSparkles?: boolean;
}

export const Target3DIllustration: React.FC<Target3DIllustrationProps> = ({
  size = 140,
  className = '',
  withSparkles = true
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Ombres et dégradés 3D */}
        <radialGradient id="targetOuterGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="60%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </radialGradient>

        <radialGradient id="targetWhiteGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="85%" stopColor="#F3F4F6" />
          <stop offset="100%" stopColor="#E5E7EB" />
        </radialGradient>

        <radialGradient id="targetBullseyeGrad" cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#374151" />
          <stop offset="80%" stopColor="#1F2937" />
          <stop offset="100%" stopColor="#111827" />
        </radialGradient>

        <filter id="dropShadowTarget" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="4" dy="8" stdDeviation="6" floodColor="#000000" floodOpacity="0.3" />
        </filter>
      </defs>

      {/* Cible principale inclinée en perspective 3D */}
      <g filter="url(#dropShadowTarget)" transform="translate(10, 10)">
        {/* Anneau 1 (Extérieur doré/ambre) */}
        <ellipse cx="90" cy="90" rx="72" ry="72" fill="url(#targetOuterGrad)" />

        {/* Anneau 2 (Blanc / crème) */}
        <ellipse cx="90" cy="90" rx="54" ry="54" fill="url(#targetWhiteGrad)" />

        {/* Anneau 3 (Doré / ambre intérieur) */}
        <ellipse cx="90" cy="90" rx="36" ry="36" fill="url(#targetOuterGrad)" />

        {/* Anneau 4 (Blanc centre) */}
        <ellipse cx="90" cy="90" rx="20" ry="20" fill="url(#targetWhiteGrad)" />

        {/* Cœur de cible (Noir / Dark Slate) */}
        <ellipse cx="90" cy="90" rx="10" ry="10" fill="url(#targetBullseyeGrad)" />
      </g>

      {/* Flèche plantée au centre */}
      <g transform="rotate(38 95 95)">
        {/* Tige de la flèche */}
        <line x1="95" y1="95" x2="165" y2="25" stroke="#1F2937" strokeWidth="5" strokeLinecap="round" />
        {/* Empennage doré */}
        <path d="M155 35 L170 20 L160 15 Z" fill="#F59E0B" />
        <path d="M165 45 L180 30 L170 25 Z" fill="#EA580C" />
      </g>

      {/* Étoiles étincelles dorées (Sparkles) */}
      {withSparkles && (
        <>
          {/* Étoile haut gauche */}
          <path
            d="M50 20 Q50 30 40 30 Q50 30 50 40 Q50 30 60 30 Q50 30 50 20 Z"
            fill="#FBBF24"
            opacity="0.9"
          />
          {/* Étoile bas droite */}
          <path
            d="M175 125 Q175 132 168 132 Q175 132 175 139 Q175 132 182 132 Q175 132 175 125 Z"
            fill="#FDE68A"
            opacity="0.8"
          />
          {/* Étoile haut droite */}
          <path
            d="M130 15 Q130 20 125 20 Q130 20 130 25 Q130 20 135 20 Q130 20 130 15 Z"
            fill="#F59E0B"
            opacity="0.7"
          />
        </>
      )}
    </svg>
  );
};
