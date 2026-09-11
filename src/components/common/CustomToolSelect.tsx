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
  LayoutDashboard,
  ChevronDown,
  Check
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/toolsList';
import { smoothScrollToTop } from '../../utils/toolNavHelper';

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
  Dumbbell,
  LayoutDashboard
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

  const mobileTitle = useMemo(() => {
    if (!currentToolId) return '';
    const titles: Record<string, { zh: string; tw: string }> = {
      'power-calc': { zh: '功率与速度计算', tw: '功率與速度計算' },
      'tire-pressure': { zh: '智能胎压计算器', tw: '智能胎壓計算器' },
      'gear-calculator': { zh: '齿比-速度-踏频', tw: '齒比-速度-踏頻' },
      'chain-calculator': { zh: '链长与齿容量', tw: '鏈長與齒容量' },
      'climb-pacing': { zh: '爬坡路段配速规划', tw: '爬坡路段配速規劃' },
      'upgrade-roi': { zh: '零件升级省瓦ROI', tw: '零件升級省瓦ROI' },
      'tubeless-sealant': { zh: '真空胎自补液计算', tw: '無內胎補液計算' },
      'spoke-calculator': { zh: '编轮与辐条长度', tw: '編輪與輻條長度' },
      'mtb-suspension': { zh: '山地避震与 SAG', tw: '山地避震與 SAG' },
      'bike-fitter': { zh: '公路车 Fitting', tw: '公路車 Fitting' },
      'pain-checker': { zh: '骑行疼痛自诊排查', tw: '騎乘疼痛自診排查' },
      'roadbook-library': { zh: '经典路书精选库', tw: '經典路書精選庫' },
      'gpx-creator': { zh: 'GPX 路线工坊', tw: 'GPX 路線工坊' },
      'group-ride': { zh: '团骑阻力与战术', tw: '團騎阻力與戰術' },
      'weather-advisor': { zh: '骑行天气顾问', tw: '騎乘天氣顧問' },
      'power-radar': { zh: '功率能力雷达', tw: '功率能力雷達' },
      'health-calculator': { zh: '运动健康计算', tw: '運動健康計算' },
      'activity-analyzer': { zh: 'FIT 航迹深度解析', tw: 'FIT 航跡深度解析' },
      'workout-builder': { zh: '科学间歇课表工坊', tw: '科學間歇課表工坊' },
    };
    const m = titles[currentToolId];
    if (m) {
      return language === 'zh-TW' ? m.tw : m.zh;
    }
    return currentTitle;
  }, [currentToolId, language, currentTitle]);

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
        className="h-9 px-2 sm:px-3 rounded-xl bg-slate-100 dark:bg-[#1C1C1E] border border-slate-200/80 dark:border-white/10 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between gap-1.5 sm:gap-2 flex-1 min-w-0 max-w-[195px] sm:max-w-[270px] truncate apple-touch hover:border-ios-blue focus:outline-none focus:ring-2 focus:ring-ios-blue/20 transition shadow-2xs"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-1.5 truncate min-w-0">
          <CurrentIcon className="w-3.5 h-3.5 text-ios-blue shrink-0" />
          <span className="truncate hidden sm:inline">{currentTitle}</span>
          <span className="truncate sm:hidden">{mobileTitle}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {currentToolMeta?.hasStravaIntegration && (
            <span
              className="p-0.5 rounded bg-[#FC4C02]/10 border border-[#FC4C02]/20 hidden sm:inline-flex"
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
          className="absolute right-0 top-full mt-1.5 z-50 w-72 sm:w-80 max-w-[calc(100vw-24px)] max-h-[65vh] overflow-y-auto rounded-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-2xl border border-black/[0.08] dark:border-white/[0.12] shadow-ios-popover p-1.5 space-y-2 animate-in fade-in zoom-in-95 duration-150"
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
                      smoothScrollToTop();
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
