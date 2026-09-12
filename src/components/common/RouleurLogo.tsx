import React from 'react';

interface RouleurLogoProps {
  className?: string;
  size?: number;
  /**
   * 'glyph' renders the pure vector mark (transparent background, inherits stroke or gradient).
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

          <linearGradient id="rouleurMetalStroke" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="65%" stopColor="#E0F2FE" />
            <stop offset="100%" stopColor="#BAE6FD" />
          </linearGradient>

          <filter id="rouleurBadgeShadow" x="-10%" y="-10%" width="125%" height="125%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#002D6C" floodOpacity="0.45" />
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#002D6C" floodOpacity="0.25" />
          </filter>

          <filter id="rouleurGlyphGlow" x="-15%" y="-15%" width="130%" height="130%">
            <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#03306B" floodOpacity="0.5" />
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

        {/* Rouleur Aero Emblem */}
        <g filter="url(#rouleurGlyphGlow)" transform="translate(10, 0)">
          {/* Deep-Section Aero Rim Arc */}
          <path
            d="M 250 96 A 154 154 0 1 1 120 306"
            fill="none"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="26"
            strokeLinecap="round"
          />

          {/* Inner High-Velocity Aero Track */}
          <path
            d="M 226 128 A 122 122 0 0 1 354 218"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray="14 10"
            opacity="0.85"
          />

          {/* Radial Aero Spoke Chords */}
          <path
            d="M 144 234 L 216 250"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.75"
          />
          <path
            d="M 174 158 L 226 216"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="12"
            strokeLinecap="round"
            opacity="0.6"
          />

          {/* Dynamic Rouleur 'R' Monogram Spine */}
          <path
            d="M 200 162 L 200 342"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="30"
            strokeLinecap="round"
          />

          {/* Upper Teardrop Wheel Loop */}
          <path
            d="M 200 162 H 272 C 318 162 344 186 344 222 C 344 258 316 278 270 278 H 200"
            fill="none"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="30"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Power Stroke Forward Drive Leg */}
          <path
            d="M 256 278 L 332 342"
            stroke="url(#rouleurMetalStroke)"
            strokeWidth="32"
            strokeLinecap="round"
          />

          {/* Aerodynamic Wake Streamlines */}
          <path
            d="M 324 188 Q 364 192 396 176"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 342 232 Q 380 236 414 224"
            fill="none"
            stroke="#7DD3FC"
            strokeWidth="11"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M 318 276 Q 366 284 394 302"
            fill="none"
            stroke="#38BDF8"
            strokeWidth="9"
            strokeLinecap="round"
            opacity="0.7"
          />
        </g>
      </svg>
    );
  }

  // Standalone vector glyph (optimized for 16px - 48px rendering)
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Rouleur Logo"
    >
      {/* Outer Aero Wheel Velocity Arc */}
      <path
        d="M 50 12 A 38 38 0 1 1 18 64"
        strokeWidth="6.5"
        strokeLinecap="round"
      />
      {/* Aero Rim Velocity Track */}
      <path
        d="M 44 20 A 30 30 0 0 1 76 42"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.65"
      />
      {/* Spoke Chord */}
      <path
        d="M 24 46 L 42 50"
        strokeWidth="3.5"
        strokeLinecap="round"
        opacity="0.8"
      />
      {/* Rouleur 'R' Vertical Spine (Aero Blade) */}
      <path
        d="M 38 28 L 38 72"
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      {/* Rouleur 'R' Upper Loop (Aero Wheel Teardrop) */}
      <path
        d="M 38 28 H 56 C 67 28 73 34 73 43 C 73 52 66 57 55 57 H 38"
        strokeWidth="7.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Rouleur 'R' Power Drive Leg */}
      <path
        d="M 52 57 L 70 72"
        strokeWidth="8"
        strokeLinecap="round"
      />
      {/* Aero Streamlines */}
      <path
        d="M 68 34 Q 78 35 84 31"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
      <path
        d="M 72 45 Q 81 46 88 43"
        strokeWidth="3"
        strokeLinecap="round"
        opacity="0.75"
      />
    </svg>
  );
};
