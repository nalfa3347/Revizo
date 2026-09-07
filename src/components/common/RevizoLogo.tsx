import React from 'react';

interface RevizoLogoProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Logo officiel REVIZO — Strictement identique au favicon et à l'icône de l'application
 * Palette d'accent officielle REVIZO : Dégradé Orange (#EA580C -> #F97316), tracé R blanc et accents or
 */
export const RevizoLogo: React.FC<RevizoLogoProps> = ({
  size = 32,
  className = '',
  style = {}
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: `${(size * 12) / 48}px`,
        flexShrink: 0,
        boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)',
        ...style
      }}
      aria-label="Logo REVIZO"
    >
      <defs>
        <linearGradient id="revizoOrangeGradCmp" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EA580C" />
          <stop offset="100%" stopColor="#F97316" />
        </linearGradient>
      </defs>
      <rect width="48" height="48" rx="12" fill="url(#revizoOrangeGradCmp)" />
      <path
        d="M14 14H34V20C34 23.3137 31.3137 26 28 26H20C16.6863 26 14 28.6863 14 32V34H34"
        stroke="white"
        strokeWidth="4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="34" cy="34" r="3" fill="#FEF08A" />
      <circle cx="14" cy="14" r="3" fill="#FFFFFF" />
    </svg>
  );
};
