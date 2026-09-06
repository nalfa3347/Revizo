import React from 'react';

// Icône Document PDF avec étiquette "PDF" intégrée en bas à droite
export const PdfDocIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = '#C47D2B' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 8C12 6.89543 12.8954 6 14 6H26L36 16V40C36 41.1046 35.1046 42 34 42H14C12.8954 42 12 41.1046 12 40V8Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M26 6V16H36" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    {/* Badge PDF */}
    <rect x="20" y="26" width="18" height="12" rx="3" fill={color} />
    <text x="29" y="35" textAnchor="middle" fill="#FFFFFF" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
      PDF
    </text>
  </svg>
);

// Icône Appareil Photo outline
export const CameraDocIcon: React.FC<{ size?: number; color?: string }> = ({ size = 40, color = '#C47D2B' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M8 16C8 14.8954 8.89543 14 10 14H16L18 10H30L32 14H38C39.1046 14 40 14.8954 40 16V38C40 39.1046 39.1046 40 38 40H10C8.89543 40 8 39.1046 8 38V16Z"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="24" cy="27" r="7" stroke={color} strokeWidth="2.5" />
    <circle cx="33" cy="19" r="1.5" fill={color} />
  </svg>
);

// Icône Médaille / Trophée dans la carte "Continuer ma dernière révision"
export const MedalAwardIcon: React.FC<{ size?: number; color?: string }> = ({ size = 36, color = '#C47D2B' }) => (
  <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="24" cy="19" r="13" stroke={color} strokeWidth="2.5" />
    <path
      d="M24 13L25.8 16.8L30 17.4L27 20.3L27.7 24.5L24 22.5L20.3 24.5L21 20.3L18 17.4L22.2 16.8L24 13Z"
      fill={color}
    />
    <path
      d="M17 30L14 41L24 36L34 41L31 30"
      stroke={color}
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
