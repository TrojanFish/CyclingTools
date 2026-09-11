import React, { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Zap,
  Ruler,
  Gauge,
  Cog,
  Link,
  Mountain,
  Scale,
  Target,
  Activity,
  MapPin,
  Users,
  CloudSun,
  HeartPulse,
  Compass,
  LineChart,
  Droplets,
  Disc,
  Sliders,
  Dumbbell,
  Search,
  Settings,
  User,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Bike
} from 'lucide-react';
import { TOOLS_LIST } from '../../data/toolsList';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { smoothScrollToTop } from '../../utils/toolNavHelper';

const ICONS_MAP: Record<string, React.ElementType> = {
  Zap,
  Ruler,
  Gauge,
  Cog,
  Link,
  Mountain,
  Scale,
  Target,
  Activity,
  MapPin,
  Users,
  CloudSun,
  HeartPulse,
  Compass,
  LineChart,
  Droplets,
  Disc,
  Sliders,
  Dumbbell,
  LayoutDashboard,
};

interface MacosSidebarProps {
  currentToolId: string | null;
  onSelectTool: (id: string | null) => void;
  onOpenProfile: () => void;
  isCollapsed?: boolean;
}

export const MacosSidebar: React.FC<MacosSidebarProps> = ({
  currentToolId,
  onSelectTool,
  onOpenProfile,
  isCollapsed = false
}) => {
  const { language, t } = useLanguageAndUnit();
  const { activeRider, activeBike } = useRiderProfile();
  const [sidebarFilter, setSidebarFilter] = useState('');

  // Category definitions matching macOS Finder / Notes / Settings style
  const categories = useMemo(() => [
    { id: 'dynamics', label: language === 'zh-TW' ? '動力傳動' : '动力传动', icon: Zap, color: 'text-ios-blue' },
    { id: 'fitting', label: 'Fitting & 姿態', icon: Ruler, color: 'text-ios-purple' },
    { id: 'route', label: language === 'zh-TW' ? '路線氣象' : '路线气象', icon: MapPin, color: 'text-ios-mint' },
    { id: 'health', label: language === 'zh-TW' ? '生理健康' : '生理健康', icon: HeartPulse, color: 'text-ios-red' }
  ], [language]);

  // Filter tools based on search input
  const filteredTools = useMemo(() => {
    if (!sidebarFilter.trim()) return TOOLS_LIST;
    const q = sidebarFilter.toLowerCase();
    return TOOLS_LIST.filter(t =>
      t.title.toLowerCase().includes(q) ||
      (t.titleTw && t.titleTw.toLowerCase().includes(q)) ||
      t.tags.some(tag => tag.toLowerCase().includes(q))
    );
  }, [sidebarFilter]);

  if (isCollapsed) return null;

  const wkg = activeRider.weightKg > 0
    ? (activeRider.ftpWatts / activeRider.weightKg).toFixed(1)
    : '--';

  return (
    <aside className="w-64 h-full flex flex-col justify-between shrink-0 bg-slate-100/70 dark:bg-[#161618]/80 backdrop-blur-2xl border-r border-black/[0.06] dark:border-white/[0.08] transition-all select-none">
      {/* Top Search & Navigation Section */}
      <div className="p-3 space-y-2 overflow-y-auto overscroll-contain no-scrollbar flex-1">
        {/* macOS Window Traffic Lights Decoration (Native Mac Accent) */}
        <div className="flex items-center justify-between px-1.5 pb-2 pt-0.5 border-b border-black/[0.04] dark:border-white/[0.06]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56] border border-[#E0443E]/50 shadow-2xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E] border border-[#DEA123]/50 shadow-2xs inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F] border border-[#1AAB29]/50 shadow-2xs inline-block" />
          </div>
          <span className="text-[10px] font-mono tracking-wider font-semibold text-slate-400 dark:text-slate-500 uppercase">
            macOS Studio
          </span>
        </div>

        {/* Sidebar Spotlight Filter */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={sidebarFilter}
            onChange={(e) => setSidebarFilter(e.target.value)}
            placeholder={language === 'zh-TW' ? '過濾工具...' : '过滤工具...'}
            className="w-full bg-white/70 dark:bg-[#252528]/80 border border-black/[0.06] dark:border-white/[0.08] rounded-lg pl-8 pr-2 py-1 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-ios-blue transition-all"
          />
        </div>

        {/* Home / Overview Item */}
        <button
          onClick={() => {
            onSelectTool(null);
            smoothScrollToTop();
          }}
          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
            currentToolId === null
              ? 'bg-ios-blue text-white shadow-xs font-semibold'
              : 'text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] dark:hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <LayoutDashboard className={`w-4 h-4 ${currentToolId === null ? 'text-white' : 'text-ios-blue'}`} />
            <span className="truncate">{language === 'zh-TW' ? '工具總覽看板' : '工具总览看板'}</span>
          </div>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            currentToolId === null ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-500 dark:text-slate-400'
          }`}>
            {TOOLS_LIST.length}
          </span>
        </button>

        {/* Grouped Tool Categories */}
        <div className="space-y-3 pt-1">
          {categories.map((category) => {
            const catTools = filteredTools.filter((t) => t.category === category.id);
            if (catTools.length === 0) return null;
            const CategoryIcon = category.icon;

            return (
              <div key={category.id} className="space-y-0.5">
                {/* Category Header */}
                <div className="flex items-center justify-between px-2 py-1 text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                  <div className="flex items-center gap-1.5">
                    <CategoryIcon className={`w-3.5 h-3.5 ${category.color}`} />
                    <span>{category.label}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{catTools.length}</span>
                </div>

                {/* Tool Items in this Category */}
                <div className="space-y-0.5">
                  {catTools.map((tool) => {
                    const ToolIcon = ICONS_MAP[tool.icon] || Zap;
                    const isActive = currentToolId === tool.id;
                    const toolTitle = language === 'zh-TW' && tool.titleTw ? tool.titleTw : tool.title;

                    return (
                      <button
                        key={tool.id}
                        onClick={() => {
                          onSelectTool(tool.id);
                          smoothScrollToTop();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'bg-ios-blue text-white shadow-xs font-medium'
                            : 'text-slate-600 dark:text-slate-300 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={tool.subtitle}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <ToolIcon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 dark:text-slate-500'}`} />
                          <span className="truncate">{toolTitle}</span>
                        </div>
                        {tool.badge && (
                          <span className={`text-[9px] px-1 py-0.2 rounded font-mono shrink-0 ml-1 ${
                            isActive ? 'bg-white/20 text-white' : 'bg-black/5 dark:bg-white/10 text-slate-400 dark:text-slate-500'
                          }`}>
                            {language === 'zh-TW' && tool.badgeTw ? tool.badgeTw : tool.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Rider Profile Quick Card (macOS Status Bar style) */}
      <div className="p-2.5 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/40 dark:bg-[#1C1C1E]/40">
        <button
          onClick={onOpenProfile}
          className="apple-touch w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#252528] border border-black/[0.05] dark:border-white/[0.08] hover:border-ios-blue/40 shadow-xs transition-all text-left group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-ios-blue/10 dark:bg-ios-blue/20 text-ios-blue flex items-center justify-center font-bold text-xs shrink-0">
              <User className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                {activeRider.name}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1.5 truncate">
                <span className="text-ios-blue font-bold">{wkg} W/kg</span>
                <span>•</span>
                <span className="truncate">{activeBike.name.split('/')[0]}</span>
              </div>
            </div>
          </div>
          <Settings className="w-3.5 h-3.5 text-slate-400 group-hover:text-ios-blue group-hover:rotate-45 transition-transform shrink-0" />
        </button>
      </div>
    </aside>
  );
};
