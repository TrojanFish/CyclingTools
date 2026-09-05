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
  Search
} from 'lucide-react';
import { ToolMetadata } from '../types';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';

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

  const categories = [
    { id: 'all', label: '全部 (18)' },
    { id: 'dynamics', label: language === 'zh-TW' ? '⚡ 動力傳動' : '⚡ 动力传动' },
    { id: 'fitting', label: '📐 Fitting' },
    { id: 'route', label: language === 'zh-TW' ? '🗺️ 路線氣象' : '🗺️ 路线气象' },
    { id: 'health', label: language === 'zh-TW' ? '❤️ 生理代謝' : '❤️ 生理代谢' },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-cyan-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/40">
        <div className="absolute right-0 top-0 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'zh-TW'
              ? '科學單車計算與動力學工坊 · 18 大全能專業工具工坊'
              : '科学骑行计算与动力学工坊 · 18 大全能专业工具工坊'}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight text-slate-900 dark:text-slate-100">
            {language === 'zh-TW' ? (
              <>
                精準計算每一瓦 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  數據驅動的科學單車與擬合模擬
                </span>
              </>
            ) : (
              <>
                精准计算每一瓦 <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                  数据驱动的科学骑行与拟合仿真
                </span>
              </>
            )}
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
            {t('heroSubtitle')}
          </p>
        </div>
      </div>

      {/* Unified Single Category Navigation Bar */}
      <div className="glass-panel p-2 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Quick Search on Dashboard */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchPrompt')}
              className="w-full bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Tools Grid */}
      {filteredTools.length === 0 ? (
        <div className="glass-panel p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-500">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            {language === 'zh-TW' ? '未找到匹配的單車工具' : '未找到匹配的骑行工具'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {language === 'zh-TW' ? '請嘗試清除搜尋關鍵字或切換分類查看。' : '请尝试清除搜索关键词或切换分类查看。'}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="px-4 py-1.5 rounded-xl bg-cyan-500 text-slate-950 text-xs font-semibold"
          >
            {language === 'zh-TW' ? '重設篩選條件' : '重置筛选条件'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredTools.map((tool) => {
            const IconComp = ICONS_MAP[tool.icon] || Zap;
            const toolTitle = language === 'zh-TW' && tool.titleTw ? tool.titleTw : tool.title;
            const toolSubtitle = language === 'zh-TW' && tool.subtitleTw ? tool.subtitleTw : tool.subtitle;
            const toolBadge = language === 'zh-TW' && tool.badgeTw ? tool.badgeTw : tool.badge;
            const toolDesc = language === 'zh-TW' && tool.descriptionTw ? tool.descriptionTw : tool.description;

            return (
              <div
                key={tool.id}
                onClick={() => onSelectTool(tool.id)}
                className="glass-card p-6 rounded-2xl border border-slate-200 dark:border-slate-800/80 cursor-pointer flex flex-col justify-between group relative overflow-hidden transition duration-300"
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500 group-hover:text-white dark:group-hover:text-slate-950 transition duration-300 shadow-sm">
                      <IconComp className="w-6 h-6" />
                    </div>
                    {toolBadge && (
                      <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-medium">
                        {toolBadge}
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition">
                      {toolTitle}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                      {toolSubtitle}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400/90 mt-2.5 leading-relaxed line-clamp-3">
                      {toolDesc}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs text-cyan-600 dark:text-cyan-400 font-semibold group-hover:translate-x-1 transition duration-200">
                  <span>{language === 'zh-TW' ? '進入使用該工具' : '进入使用该工具'}</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
