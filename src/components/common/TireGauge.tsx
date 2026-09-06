import React from 'react';

interface TireGaugeProps {
  label: string;
  psi: number;
  minPsi: number;
  maxPsi: number;
  unit: string;
  displayValue: string;
}

export const TireGauge: React.FC<TireGaugeProps> = ({
  label,
  psi,
  minPsi,
  maxPsi,
  unit,
  displayValue
}) => {
  // Gauge range from 0 to 120 PSI
  const maxScale = 120;
  const angle = Math.min(180, Math.max(0, (psi / maxScale) * 180));
  // Needle coordinates: center at (100, 100), length = 60
  const rad = ((180 - angle) * Math.PI) / 180;
  const nx = 100 + 60 * Math.cos(rad);
  const ny = 100 - 60 * Math.sin(rad);

  return (
    <div className="flex flex-col items-center justify-center p-3 bg-slate-950/50 rounded-2xl border border-slate-800/80 text-center">
      <span className="text-[11px] font-semibold text-slate-300">{label}</span>

      <svg viewBox="0 0 200 120" className="w-40 h-auto select-none">
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="60%" stopColor="#10b981" />
            <stop offset="85%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#ef4444" />
          </linearGradient>
        </defs>

        {/* Outer track arc */}
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke="#1e293b"
          strokeWidth="12"
          strokeLinecap="round"
        />

        {/* Value colored arc */}
        <path
          d="M 30 100 A 70 70 0 0 1 170 100"
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray="220"
          strokeDashoffset={220 - (angle / 180) * 220}
        />

        {/* Needle */}
        <line
          x1="100"
          y1="100"
          x2={nx}
          y2={ny}
          stroke="#00AFFF"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="100" cy="100" r="5" fill="#00AFFF" />
      </svg>

      <div className="-mt-3">
        <span className="text-xl font-bold font-mono text-ios-blue">{displayValue}</span>
        <span className="text-[10px] text-slate-400 uppercase ml-1">{unit}</span>
      </div>
    </div>
  );
};
