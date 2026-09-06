import React from 'react';

interface BikeDiagramProps {
  ett: number;
  saddleHeight: number;
  stemLength: number;
  handlebarWidth: number;
  saddleSetback?: number;
  saddleDrop?: number;
}

export const BikeDiagram: React.FC<BikeDiagramProps> = ({
  ett,
  saddleHeight,
  stemLength,
  handlebarWidth,
  saddleSetback = 6.5,
  saddleDrop = 6.0
}) => {
  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 relative overflow-hidden transition-colors">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-semibold text-slate-800 dark:text-slate-300">公路车几何与设定拟合可视化</span>
        <span className="text-[10px] text-ios-blue dark:text-ios-blue-dark font-mono font-semibold">SVG 矢量动力学模型</span>
      </div>

      <svg viewBox="0 0 500 280" className="w-full h-auto max-h-60 select-none">
        <defs>
          <linearGradient id="frameGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00AFFF" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
          <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Wheels */}
        {/* Rear Wheel: Center at (100, 210), R=50 */}
        <circle cx="100" cy="210" r="50" fill="none" stroke="#64748b" strokeWidth="4" />
        <circle cx="100" cy="210" r="44" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="100" cy="210" r="6" fill="#475569" />

        {/* Front Wheel: Center at (400, 210), R=50 */}
        <circle cx="400" cy="210" r="50" fill="none" stroke="#64748b" strokeWidth="4" />
        <circle cx="400" cy="210" r="44" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="400" cy="210" r="6" fill="#475569" />

        {/* Ground Line */}
        <line x1="30" y1="260" x2="470" y2="260" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Bottom Bracket (BB): (220, 210) */}
        {/* Chainstay: (100, 210) to (220, 210) */}
        <line x1="100" y1="210" x2="220" y2="210" stroke="#64748b" strokeWidth="3.5" />

        {/* Seat Tube Cluster: (195, 120) */}
        {/* Seat Tube: (220, 210) to (195, 120) */}
        <line x1="220" y1="210" x2="195" y2="120" stroke="url(#frameGrad)" strokeWidth="4.5" />

        {/* Seatstays: (100, 210) to (195, 120) */}
        <line x1="100" y1="210" x2="195" y2="120" stroke="#64748b" strokeWidth="3.5" />

        {/* Head Tube: Top at (345, 95), Bottom at (355, 145) */}
        <line x1="355" y1="145" x2="345" y2="95" stroke="url(#frameGrad)" strokeWidth="5.5" />

        {/* Fork: (355, 145) to (400, 210) */}
        <line x1="355" y1="145" x2="400" y2="210" stroke="#64748b" strokeWidth="4" />

        {/* Top Tube: (195, 120) to (345, 95) */}
        <line x1="195" y1="120" x2="345" y2="95" stroke="url(#frameGrad)" strokeWidth="4.5" />

        {/* Down Tube: (220, 210) to (355, 145) */}
        <line x1="220" y1="210" x2="355" y2="145" stroke="url(#frameGrad)" strokeWidth="5" />

        {/* BB circle */}
        <circle cx="220" cy="210" r="10" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />

        {/* Seatpost & Saddle */}
        {/* Seatpost extending from (195, 120) towards (175, 55) */}
        <line x1="195" y1="120" x2="175" y2="55" stroke="#94a3b8" strokeWidth="4" />
        {/* Saddle: (150, 52) to (200, 52) */}
        <path d="M 150 54 Q 175 48 200 54 Q 175 58 150 54 Z" fill="#38bdf8" />

        {/* Stem & Handlebars */}
        {/* Stem: (345, 95) to (385, 80) */}
        <line x1="345" y1="95" x2="385" y2="80" stroke="#94a3b8" strokeWidth="4" />
        {/* Drop Bar Curve */}
        <path d="M 385 80 C 400 80, 405 95, 395 115 C 388 125, 375 125, 370 120" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" />

        {/* Dimension Callouts */}
        {/* 1. ETT Dimension Line (Cyan) */}
        <line x1="195" y1="85" x2="345" y2="85" stroke="#00AFFF" strokeWidth="1.5" strokeDasharray="3 3" />
        <circle cx="195" cy="85" r="2.5" fill="#00AFFF" />
        <circle cx="345" cy="85" r="2.5" fill="#00AFFF" />
        <text x="270" y="80" fill="#00AFFF" fontSize="10" textAnchor="middle" fontWeight="bold">
          ETT: {ett} cm
        </text>

        {/* 2. Saddle Height Dimension Line (Emerald) */}
        <line x1="220" y1="210" x2="175" y2="55" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
        <text x="175" y="145" fill="#10b981" fontSize="10" textAnchor="end" fontWeight="bold">
          坐高: {saddleHeight} cm
        </text>

        {/* 3. Stem Dimension Callout (Sky) */}
        <text x="375" y="68" fill="#38bdf8" fontSize="9" textAnchor="middle">
          把立: {stemLength}mm
        </text>

        {/* 4. Handlebar Width Callout (Rose) */}
        <text x="410" y="125" fill="#f43f5e" fontSize="9" textAnchor="start">
          弯把: {handlebarWidth}mm
        </text>
      </svg>
    </div>
  );
};
