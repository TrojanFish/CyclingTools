import React from 'react';
import { Home, Zap, Gauge, Compass, Ruler } from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

interface MobileBottomNavProps {
  currentToolId: string | null;
  onNavigateHome: () => void;
  onSelectTool: (id: string) => void;
  onOpenProfile?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentToolId,
  onNavigateHome,
  onSelectTool,
  onOpenProfile
}) => {
  const { language } = useLanguageAndUnit();

  const navItems = [
    {
      id: 'home',
      label: language === 'en' ? 'Home' : language === 'zh-TW' ? '首頁' : '首页',
      icon: Home,
      isActive: currentToolId === null,
      onClick: onNavigateHome
    },
    {
      id: 'power-calc',
      label: language === 'en' ? 'Power' : language === 'zh-TW' ? '功率' : '功率',
      icon: Zap,
      isActive: currentToolId === 'power-calc',
      onClick: () => onSelectTool('power-calc')
    },
    {
      id: 'tire-pressure',
      label: language === 'en' ? 'Tire' : language === 'zh-TW' ? '胎壓' : '胎压',
      icon: Gauge,
      isActive: currentToolId === 'tire-pressure',
      onClick: () => onSelectTool('tire-pressure')
    },
    {
      id: 'roadbook-library',
      label: language === 'en' ? 'Routes' : language === 'zh-TW' ? '路書' : '路书',
      icon: Compass,
      isActive: currentToolId === 'roadbook-library',
      onClick: () => onSelectTool('roadbook-library')
    },
    {
      id: 'bike-fitter',
      label: language === 'en' ? 'Fit' : 'Fitting',
      icon: Ruler,
      isActive: currentToolId === 'bike-fitter',
      onClick: () => onSelectTool('bike-fitter')
    }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/92 dark:bg-slate-950/92 border-t border-slate-200 dark:border-slate-800/80 backdrop-blur-xl px-2 py-1.5 shadow-lg shadow-black/10 no-print" style={{ paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 6px)' }}>
      <div className="flex items-center justify-around gap-1 max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = item.isActive;

          return (
            <button
              key={item.id}
              onClick={item.onClick}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition active:scale-90 ${
                active
                  ? 'text-cyan-600 dark:text-cyan-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <div className={`p-1 rounded-xl transition ${active ? 'bg-cyan-500/15' : ''}`}>
                <Icon className={`w-4 h-4 ${active ? 'stroke-[2.5]' : 'stroke-2'}`} />
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
