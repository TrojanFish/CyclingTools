import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Zap,
  Gauge,
  Cog,
  Link,
  Mountain,
  Scale,
  Ruler,
  Activity,
  Compass,
  MapPin,
  Users,
  CloudSun,
  Target,
  HeartPulse,
  LineChart,
  Droplets,
  Disc,
  Sliders,
  Dumbbell,
  ChevronDown,
  Check
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/toolsList';

export const StravaLogo: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5' }) => (
  <svg className={`${className} fill-[#FC4C02] shrink-0`} viewBox="0 0 24 24" role="img" aria-label="Strava">
    <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.925 15.632h4.17" />
  </svg>
);

const ICONS_MAP: Record<string, React.ElementType> = {
  Zap,
  Gauge,
  Cog,
  Link,
  Mountain,
  Scale,
  Ruler,
  Activity,
  Compass,
  MapPin,
  Users,
  CloudSun,
  Target,
  HeartPulse,
  LineChart,
  Droplets,
  Disc,
  Sliders,
  Dumbbell
};

interface CustomToolSelectProps {
  currentToolId: string | null;
  onSelectTool: (id: string) => void;
  language: string;
}

export const CustomToolSelect: React.FC<CustomToolSelectProps> = ({
  currentToolId,
  onSelectTool,
  language
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or Esc
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const currentToolMeta = useMemo(() => {
    return TOOLS_LIST.find((t) => t.id === currentToolId);
  }, [currentToolId]);

  const currentTitle = useMemo(() => {
    if (!currentToolMeta) return '';
    return language === 'zh-TW' && currentToolMeta.titleTw
      ? currentToolMeta.titleTw
      : currentToolMeta.title;
  }, [currentToolMeta, language]);

  const CurrentIcon = currentToolMeta ? (ICONS_MAP[currentToolMeta.icon] || Zap) : Zap;

  // Group tools by domain category
  const toolGroups = useMemo(() => {
    const categoryConfigs: {
      category: string;
      labelZh: string;
      labelTw: string;
    }[] = [
      { category: 'dynamics', labelZh: '动力学与传动', labelTw: '動力學與傳動' },
      { category: 'fitting', labelZh: 'Fitting与工效', labelTw: 'Fitting與工效' },
      { category: 'route', labelZh: '路线战术气象', labelTw: '路線戰術氣象' },
      { category: 'health', labelZh: '生理与代谢', labelTw: '生理與代謝' },
    ];

    return categoryConfigs
      .map((cat) => ({
        category: cat.category,
        label: language === 'zh-TW' ? cat.labelTw : cat.labelZh,
        tools: TOOLS_LIST.filter((t) => t.category === cat.category),
      }))
      .filter((g) => g.tools.length > 0);
  }, [language]);

  return (
    <div className={`relative ${isOpen ? 'z-50' : ''}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 sm:h-9 px-2 sm:px-3 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 sm:gap-2 w-auto min-w-[120px] max-w-[165px] sm:max-w-[270px] truncate apple-touch hover:border-ios-blue focus:outline-none focus:ring-2 focus:ring-ios-blue/20 transition shadow-2xs"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <CurrentIcon className="w-3.5 h-3.5 text-ios-blue shrink-0" />
          <span className="truncate">{currentTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {currentToolMeta?.hasStravaIntegration && (
            <span
              className="p-0.5 rounded bg-[#FC4C02]/10 border border-[#FC4C02]/20"
              title="Strava"
            >
              <StravaLogo className="w-3 h-3" />
            </span>
          )}
          <ChevronDown
            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div
          role="listbox"
          className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 max-w-[calc(100vw-24px)] max-h-[65vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-2xl p-1.5 space-y-2 animate-in fade-in zoom-in-95 duration-150"
        >
          {toolGroups.map((group) => (
            <div key={group.category} className="space-y-0.5">
              <div className="px-2.5 py-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                {group.label}
              </div>
              {group.tools.map((tItem) => {
                const isSelected = tItem.id === currentToolId;
                const Icon = ICONS_MAP[tItem.icon] || Zap;
                const displayTitle =
                  language === 'zh-TW' && tItem.titleTw
                    ? tItem.titleTw
                    : tItem.title;

                return (
                  <button
                    key={tItem.id}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onSelectTool(tItem.id);
                      setIsOpen(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs text-left transition apple-touch ${
                      isSelected
                        ? 'bg-ios-blue/15 text-ios-blue dark:text-ios-blue-dark font-bold shadow-2xs'
                        : 'hover:bg-slate-100 dark:hover:bg-white/10 text-slate-700 dark:text-slate-300 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      <Icon
                        className={`w-3.5 h-3.5 shrink-0 ${
                          isSelected ? 'text-ios-blue' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate">{displayTitle}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {tItem.hasStravaIntegration && (
                        <span
                          className="p-1 rounded-md bg-[#FC4C02]/10 border border-[#FC4C02]/20 shadow-2xs flex items-center justify-center"
                          title="Strava"
                        >
                          <StravaLogo className="w-3 h-3" />
                        </span>
                      )}
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-ios-blue shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
