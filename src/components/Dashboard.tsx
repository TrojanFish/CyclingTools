import React from 'react';
import {
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
  ArrowRight,
  Sparkles,
  Search,
  X,
  Sliders,
  Dumbbell
} from 'lucide-react';
import { ToolMetadata } from '../types';
import { TOOLS_LIST } from '../data/toolsList';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';
import { IOSSegmentedControl } from './common/IOSSegmentedControl';

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
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  dynamics: {
    bg: 'bg-ios-blue/10 dark:bg-ios-blue/20',
    text: 'text-ios-blue',
    ring: 'ring-ios-blue/20'
  },
  fitting: {
    bg: 'bg-ios-purple/10 dark:bg-ios-purple/20',
    text: 'text-ios-purple',
    ring: 'ring-ios-purple/20'
  },
  route: {
    bg: 'bg-ios-mint/10 dark:bg-ios-mint/20',
    text: 'text-ios-mint',
    ring: 'ring-ios-mint/20'
  },
  health: {
    bg: 'bg-ios-red/10 dark:bg-ios-red/20',
    text: 'text-ios-red',
    ring: 'ring-ios-red/20'
  },
  utility: {
    bg: 'bg-ios-orange/10 dark:bg-ios-orange/20',
    text: 'text-ios-orange',
    ring: 'ring-ios-orange/20'
  }
};

interface DashboardProps {
  onSelectTool: (id: string) => void;
  filteredTools: ToolMetadata[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectTool,
  filteredTools,
  selectedCategory,
  setSelectedCategory,
  searchTerm,
  setSearchTerm
}) => {
  const { language, t } = useLanguageAndUnit();

  const categoryOptions = [
    { id: 'all', label: language === 'zh-TW' ? `全部 (${TOOLS_LIST.length})` : `全部 (${TOOLS_LIST.length})` },
    { id: 'dynamics', icon: Zap, label: language === 'zh-TW' ? '動力傳動' : '动力传动' },
    { id: 'fitting', icon: Ruler, label: 'Fitting' },
    { id: 'route', icon: MapPin, label: language === 'zh-TW' ? '路線氣象' : '路线气象' },
    { id: 'health', icon: HeartPulse, label: language === 'zh-TW' ? '生理代謝' : '生理代谢' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* iOS Large Title Header (Mobile Only, Apple HIG Style) */}
      <div className="md:hidden pt-0.5 pb-1">
        <span className="text-[11px] font-bold text-ios-blue dark:text-ios-blue-dark uppercase tracking-wider">
          {language === 'zh-TW' ? '科學單車動力學' : '科学骑行动力学'}
        </span>
        <h1 className="text-lg sm:text-xl font-bold font-display text-slate-900 dark:text-white tracking-tight">
          {language === 'zh-TW' ? '專業工具箱' : '专业工具箱'}
        </h1>
      </div>

      {/* Apple Keynote Style Hero Banner */}
      <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-br from-white via-[#F8F9FB] to-blue-50/40 dark:from-[#1C1C1E] dark:via-[#161618] dark:to-blue-950/20 shadow-ios-sm">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-ios-blue/10 dark:bg-ios-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-ios-purple/10 dark:bg-ios-purple/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl space-y-3 sm:space-y-4">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 sm:px-3 sm:py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-[11px] sm:text-xs font-semibold tracking-wide">
            <Sparkles className="w-3.5 h-3.5" />
            <span>
              {language === 'zh-TW'
                ? `科學單車計算與動力學工坊 · ${TOOLS_LIST.length} 大專業工具`
                : `科学骑行计算与动力学工坊 · ${TOOLS_LIST.length} 大专业工具`}
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white font-display">
            {language === 'zh-TW' ? (
              <>
                精準計算每一瓦 <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ios-blue via-blue-500 to-ios-purple">
                  數據驅動的科學單車與擬合模擬
                </span>
              </>
            ) : (
              <>
                精准计算每一瓦 <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-ios-blue via-blue-500 to-ios-purple">
                  数据驱动的科学骑行与拟合仿真
                </span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      {/* iOS Segmented Navigation & Spotlight Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-2 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-2xl border border-black/[0.05] dark:border-white/[0.08] shadow-ios-sm">
        <div className="overflow-x-auto py-0.5 no-scrollbar">
          <IOSSegmentedControl
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            size="md"
          />
        </div>

        {/* Spotlight Quick Search */}
        <div className="relative flex-1 lg:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPrompt')}
            className="w-full bg-black/[0.04] dark:bg-white/[0.07] border border-transparent focus:border-ios-blue rounded-xl pl-9 pr-8 py-2 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full bg-black/10 dark:bg-white/20 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white transition apple-touch"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="p-8 sm:p-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl text-center space-y-3 shadow-ios-sm">
          <div className="w-11 h-11 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            {language === 'zh-TW' ? '未找到匹配的單車工具' : '未找到匹配的骑行工具'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
            {language === 'zh-TW' ? '請嘗試清除搜尋關鍵字或切換分類查看。' : '请尝试清除搜索关键词或切换分类查看。'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="h-8.5 px-4 rounded-xl bg-ios-blue text-white text-xs font-semibold shadow-ios-sm hover:opacity-90 active:scale-95 transition apple-touch"
          >
            {language === 'zh-TW' ? '重設篩選條件' : '重置筛选条件'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
          {filteredTools.map((tool) => {
            const IconComp = ICONS_MAP[tool.icon] || Zap;
            const toolTitle = language === 'zh-TW' && tool.titleTw ? tool.titleTw : tool.title;
            const toolSubtitle = language === 'zh-TW' && tool.subtitleTw ? tool.subtitleTw : tool.subtitle;
            const toolBadge = language === 'zh-TW' && tool.badgeTw ? tool.badgeTw : tool.badge;
            const toolDesc = language === 'zh-TW' && tool.descriptionTw ? tool.descriptionTw : tool.description;
            const colorTheme = CATEGORY_COLORS[tool.category] || CATEGORY_COLORS.dynamics;

            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="group relative flex flex-col justify-between p-4 sm:p-5 rounded-2xl bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl border border-black/[0.05] dark:border-white/[0.08] shadow-ios-sm hover:shadow-ios-card active:scale-[0.985] transition-all duration-200 cursor-pointer apple-touch"
              >
                <div className="space-y-3.5">
                  <div className="flex items-start justify-between">
                    <div className={`w-11 h-11 rounded-xl ${colorTheme.bg} ${colorTheme.text} flex items-center justify-center ring-1 ${colorTheme.ring} group-hover:scale-105 transition duration-200`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      {tool.hasStravaIntegration && (
                        <span
                          className="px-2 py-0.5 rounded-full bg-[#FC4C02]/10 text-[#FC4C02] font-semibold border border-[#FC4C02]/20 flex items-center gap-1 shrink-0"
                          title={language === 'zh-TW' ? '支援 Strava 雲端數據即時連動' : '支持 Strava 云端数据实时联动'}
                        >
                          <svg className="w-3 h-3 fill-[#FC4C02] shrink-0" viewBox="0 0 24 24" role="img">
                            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0l-7.925 15.632h4.17" />
                          </svg>
                          <span className="text-[10px] font-bold">Strava</span>
                        </span>
                      )}
                      {toolBadge && (
                        <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-medium border border-black/[0.04] dark:border-white/[0.06]">
                          {toolBadge}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-semibold text-slate-900 dark:text-white tracking-tight group-hover:text-ios-blue transition">
                      {toolTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                      {toolSubtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300/80 mt-2.5 leading-relaxed line-clamp-3">
                      {toolDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between text-xs font-semibold text-ios-blue dark:text-blue-400">
                  <span className="group-hover:translate-x-0.5 transition-transform">
                    {language === 'zh-TW' ? '進入使用' : '进入使用'}
                  </span>
                  <div className="w-6 h-6 rounded-full bg-ios-blue/10 dark:bg-ios-blue/20 flex items-center justify-center text-ios-blue dark:text-blue-400 group-hover:translate-x-1 group-hover:bg-ios-blue group-hover:text-white transition-all duration-200">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
