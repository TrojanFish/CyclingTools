import React from 'react';

interface RouleurLogoProps {
  className?: string;
  size?: number;
  /**
   * 'glyph' renders the pure vector mark (transparent background, inherits text-color).
   * 'badge' renders the complete Apple HIG squircle icon with gradient background.
   */
  variant?: 'glyph' | 'badge';
}

export const RouleurLogo: React.FC<RouleurLogoProps> = ({
  className = 'w-5 h-5',
  size,
  variant = 'glyph',
}) => {
  const style = size ? { width: size, height: size } : undefined;

  if (variant === 'badge') {
    return (
      <svg
        viewBox="0 0 512 512"
        className={className}
        style={style}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Rouleur Pro Logo"
      >
        <defs>
          <linearGradient id="rouleurBadgeBg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0284C7" />
            <stop offset="45%" stopColor="#007AFF" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          <filter id="rouleurBadgeShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#002D6C" floodOpacity="0.45" />
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#002D6C" floodOpacity="0.25" />
          </filter>

          <filter id="rouleurGlyphGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#03306B" floodOpacity="0.4" />
          </filter>
        </defs>

        {/* Continuous iOS 18 Squircle */}
        <rect
          x="24"
          y="24"
          width="464"
          height="464"
          rx="108"
          fill="url(#rouleurBadgeBg)"
          filter="url(#rouleurBadgeShadow)"
        />

        {/* Apple HIG Specular Rim Light */}
        <rect
          x="24"
          y="24"
          width="464"
          height="464"
          rx="108"
          fill="none"
          stroke="#FFFFFF"
          strokeWidth="3.5"
          strokeOpacity="0.35"
        />

        {/* Breakaway Rouleur Silhouette Group */}
        <g filter="url(#rouleurGlyphGlow)" transform="translate(48, 48) scale(4.16)" fill="#FFFFFF">
          {/* Rear Aero Wheel */}
          <circle cx="26" cy="65" r="16" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
          <circle cx="26" cy="65" r="6.5" fill="#FFFFFF" opacity="0.35" />

          {/* Front Aero Wheel */}
          <circle cx="74" cy="65" r="16" fill="none" stroke="#FFFFFF" strokeWidth="4.5" />
          <circle cx="74" cy="65" r="6.5" fill="#FFFFFF" opacity="0.35" />

          {/* Aero Road Frame & Fork */}
          <path d="M 26 65 L 48 65 L 61 46 L 74 65" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 48 65 L 38 42 L 34 42" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 48 65 L 61 46 L 40 46" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M 74 65 L 62 39 L 68 37" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

          {/* Rouleur Cyclist in Aggressive Aero Breakaway Tuck */}
          <path d="M 53 25 C 57 23 62 25 64 29 C 62 31.5 58 32.5 53 30.5 Z" fill="#FFFFFF" />
          <path d="M 37 40 C 44 32.5 52 29.5 58 31.5 L 67 36.5 L 64 40.5 L 56 36.5 C 50 34.5 44 37.5 39 42.5 Z" fill="#FFFFFF" />
          <path d="M 39 42.5 L 44 53.5 L 48 65" fill="none" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    );
  }

  // Standalone vector glyph (optimized for 16px - 48px rendering, inherits text-color)
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rouleur Logo"
    >
      {/* Rear Aero Wheel */}
      <circle cx="26" cy="65" r="16" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <circle cx="26" cy="65" r="6.5" fill="currentColor" opacity="0.35" />

      {/* Front Aero Wheel */}
      <circle cx="74" cy="65" r="16" fill="none" stroke="currentColor" strokeWidth="4.5" />
      <circle cx="74" cy="65" r="6.5" fill="currentColor" opacity="0.35" />

      {/* Aero Road Frame & Fork */}
      <path d="M 26 65 L 48 65 L 61 46 L 74 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 48 65 L 38 42 L 34 42" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 48 65 L 61 46 L 40 46" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M 74 65 L 62 39 L 68 37" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />

      {/* Rouleur Cyclist in Aggressive Aero Breakaway Tuck */}
      <path d="M 53 25 C 57 23 62 25 64 29 C 62 31.5 58 32.5 53 30.5 Z" fill="currentColor" />
      <path d="M 37 40 C 44 32.5 52 29.5 58 31.5 L 67 36.5 L 64 40.5 L 56 36.5 C 50 34.5 44 37.5 39 42.5 Z" fill="currentColor" />
      <path d="M 39 42.5 L 44 53.5 L 48 65" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
};
