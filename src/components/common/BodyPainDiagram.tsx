import React from 'react';

interface BodyPainDiagramProps {
  selectedAreaId: string;
  onSelectArea: (areaId: string) => void;
}

export const BodyPainDiagram: React.FC<BodyPainDiagramProps> = ({
  selectedAreaId,
  onSelectArea
}) => {
  const parts = [
    { id: 'neck_shoulder', name: '颈部与上背', cx: 120, cy: 55, r: 14, color: '#f59e0b' },
    { id: 'wrist_hand', name: '手腕与双手', cx: 60, cy: 125, r: 12, color: '#38bdf8' },
    { id: 'lower_back', name: '下背与腰部', cx: 120, cy: 110, r: 16, color: '#ec4899' },
    { id: 'buttock', name: '臀部与会阴', cx: 120, cy: 145, r: 15, color: '#8b5cf6' },
    { id: 'knee', name: '膝盖关节', cx: 105, cy: 195, r: 16, color: '#10b981' },
    { id: 'foot', name: '足底与足麻', cx: 100, cy: 255, r: 13, color: '#06b6d4' },
  ];

  return (
    <div className="w-full bg-slate-50 dark:bg-slate-950/60 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-4 text-center space-y-2 transition-colors">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-800 dark:text-slate-300 font-semibold">交互式人体疼痛定位图</span>
        <span className="text-slate-500 dark:text-slate-400 text-[10px]">点击身体高亮部位切换</span>
      </div>

      <div className="flex justify-center">
        <svg viewBox="0 0 240 280" className="w-48 h-auto max-h-60 select-none">
          <defs>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Stylized Human Body Silhouette */}
          {/* Head */}
          <circle cx="120" cy="30" r="18" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-700" />
          {/* Torso */}
          <path d="M 100 50 L 140 50 L 132 140 L 108 140 Z" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" className="dark:fill-slate-800 dark:stroke-slate-700" />
          {/* Arms */}
          <path d="M 100 52 L 65 120 L 58 125" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-700" />
          <path d="M 140 52 L 175 120 L 182 125" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-700" />
          {/* Legs */}
          <path d="M 112 140 L 105 195 L 100 255" fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-700" />
          <path d="M 128 140 L 135 195 L 140 255" fill="none" stroke="#94a3b8" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="dark:stroke-slate-700" />

          {/* Interactive Clickable Hotspots */}
          {parts.map(p => {
            const isSelected = selectedAreaId === p.id;
            return (
              <g
                key={p.id}
                onClick={() => onSelectArea(p.id)}
                className="cursor-pointer group"
              >
                {/* Centered pulsing radar ring using native SVG animation (prevents SVG origin drift) */}
                {isSelected && (
                  <>
                    <circle
                      cx={p.cx}
                      cy={p.cy}
                      r={p.r}
                      fill="none"
                      stroke={p.color}
                      strokeWidth="2"
                    >
                      <animate
                        attributeName="r"
                        values={`${p.r};${p.r + 9}`}
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                      <animate
                        attributeName="opacity"
                        values="0.8;0"
                        dur="1.5s"
                        repeatCount="indefinite"
                      />
                    </circle>
                    <circle
                      cx={p.cx}
                      cy={p.cy}
                      r={p.r + 4}
                      fill={p.color}
                      opacity="0.2"
                    />
                  </>
                )}

                {/* Main Node Circle */}
                <circle
                  cx={p.cx}
                  cy={p.cy}
                  r={p.r}
                  fill={isSelected ? p.color : '#ffffff'}
                  stroke={p.color}
                  strokeWidth={isSelected ? 2.5 : 1.5}
                  filter={isSelected ? 'url(#glow)' : undefined}
                  className="transition-all duration-200 group-hover:opacity-90 dark:fill-slate-900"
                />

                {/* Label Text */}
                <text
                  x={p.cx}
                  y={p.cy + 3.5}
                  fontSize="8.5"
                  fontWeight="bold"
                  textAnchor="middle"
                  fill={isSelected ? '#020617' : p.color}
                  className="select-none pointer-events-none"
                >
                  {p.name.slice(0, 2)}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-1.5 pt-1">
        {parts.map(p => (
          <button
            key={p.id}
            onClick={() => onSelectArea(p.id)}
            className={`px-2 py-0.5 rounded-md text-[10px] font-medium transition ${
              selectedAreaId === p.id
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
};
