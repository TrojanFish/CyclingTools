import React, { useMemo, useState } from 'react';
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
  Dumbbell,
  LayoutDashboard,
  Share2
} from 'lucide-react';
import { ToolMetadata } from '../types';
import { TOOLS_LIST } from '../data/toolsList';
import { useLanguageAndUnit } from '../context/LanguageAndUnitContext';
import { useStrava } from '../context/StravaContext';
import { useRiderProfile } from '../context/RiderProfileContext';
import { generateDemoStravaActivities } from '../utils/stravaCockpitAnalytics';
import { IOSSegmentedControl } from './common/IOSSegmentedControl';
import { generateLatestRideSocialPoster, LatestRidePosterData } from '../utils/shareCardGenerators';
import { LatestRideShareModal } from './common/LatestRideShareModal';

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
  const { isConnected, activities: realActivities } = useStrava();
  const { profile, activeBike } = useRiderProfile();

  // Extract latest activity: Real Strava ride if available, or high-fidelity demo sample
  const effectiveLatestActivity = useMemo(() => {
    if (realActivities && realActivities.length > 0) {
      return [...realActivities].sort(
        (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
      )[0];
    }
    const demo = generateDemoStravaActivities();
    return demo[0] || null;
  }, [realActivities]);

  const ftpWatts = profile.ftpWatts || 240;

  const latestStats = useMemo(() => {
    if (!effectiveLatestActivity) return null;
    const act = effectiveLatestActivity;
    const distKm = parseFloat(((act.distance || 0) / 1000).toFixed(1));
    const eleM = Math.round(act.total_elevation_gain || 0);
    const movingSec = act.moving_time || 0;
    const hrs = Math.floor(movingSec / 3600);
    const mins = Math.round((movingSec % 3600) / 60);
    const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`;
    const avgSpeed = movingSec > 0 ? parseFloat(((act.distance / movingSec) * 3.6).toFixed(1)) : 0;
    const maxSpeed = act.max_speed ? parseFloat((act.max_speed * 3.6).toFixed(1)) : null;
    const np = act.weighted_average_watts || act.average_watts || 0;
    const avgP = act.average_watts || 0;
    const vi = avgP > 0 && np > 0 ? parseFloat((np / avgP).toFixed(2)) : 1.0;
    const ifVal = act.intensityFactor || (ftpWatts > 0 && np > 0 ? parseFloat((np / ftpWatts).toFixed(2)) : 0.75);
    const tss = act.tss || Math.round((movingSec / 3600) * 50);
    const avgHr = act.average_heartrate ? Math.round(act.average_heartrate) : null;
    const maxHr = act.max_heartrate ? Math.round(act.max_heartrate) : null;
    const ef = avgHr && np > 0 ? parseFloat((np / avgHr).toFixed(2)) : null;
    const calories = act.kilojoules ? Math.round(act.kilojoules) : Math.round((np || 200) * (movingSec / 3600) * 3.6 * 0.95);
    const wKg = profile.weightKg && profile.weightKg > 0 && np > 0 ? parseFloat((np / profile.weightKg).toFixed(1)) : null;

    let tacticalPace = language === 'zh-TW' ? '穩態巡航 (Steady Pace)' : '稳态巡航 (Steady Pace)';
    let tacticalTextColor = 'text-ios-blue';
    if (vi > 1.15) {
      tacticalPace = language === 'zh-TW' ? '變速突圍 / 起伏拉扯 (Variable Surge)' : '变速突围 / 起伏拉扯 (Variable Surge)';
      tacticalTextColor = 'text-ios-orange';
    } else if (ifVal >= 0.9) {
      tacticalPace = language === 'zh-TW' ? '競賽極限 / 閾值突破 (Threshold Race)' : '竞赛极限 / 阈值突破 (Threshold Race)';
      tacticalTextColor = 'text-ios-red';
    } else if (ifVal <= 0.65) {
      tacticalPace = language === 'zh-TW' ? '低強有氧 / 排酸刷脂 (Z2 Recovery)' : '低强有氧 / 排酸刷脂 (Z2 Recovery)';
      tacticalTextColor = 'text-ios-green';
    }

    return {
      name: act.name,
      dateStr: act.start_date.split('T')[0],
      distKm,
      eleM,
      timeStr,
      avgSpeed,
      maxSpeed,
      np,
      avgP,
      wKg,
      vi,
      ifVal,
      tss,
      avgHr,
      maxHr,
      calories,
      ef,
      tacticalPace,
      tacticalTextColor,
      isRealData: isConnected && realActivities.length > 0,
      sportType: act.sport_type || 'Ride'
    };
  }, [effectiveLatestActivity, ftpWatts, profile.weightKg, isConnected, realActivities.length, language]);

  const [isPosterModalOpen, setIsPosterModalOpen] = useState(false);
  const [posterUrl, setPosterUrl] = useState<string | null>(null);
  const [isGeneratingPoster, setIsGeneratingPoster] = useState(false);
  const [posterData, setPosterData] = useState<LatestRidePosterData | null>(null);

  const handleOpenSocialPoster = async () => {
    if (!latestStats) return;
    setIsGeneratingPoster(true);
    try {
      const data: LatestRidePosterData = {
        title: latestStats.name,
        dateStr: latestStats.dateStr,
        distKm: latestStats.distKm,
        eleM: latestStats.eleM,
        timeStr: latestStats.timeStr,
        avgSpeed: latestStats.avgSpeed,
        np: latestStats.np,
        avgP: latestStats.avgP,
        wKg: latestStats.wKg || undefined,
        vi: latestStats.vi,
        ifVal: latestStats.ifVal,
        tss: latestStats.tss,
        avgHr: latestStats.avgHr,
        maxHr: latestStats.maxHr,
        ef: latestStats.ef,
        caloriesKcal: latestStats.calories,
        tacticalPace: latestStats.tacticalPace,
        sportType: latestStats.sportType,
        bikeName: activeBike?.name || (language === 'zh-TW' ? '公路戰車' : '公路战车'),
        isRealData: latestStats.isRealData
      };
      setPosterData(data);
      const url = await generateLatestRideSocialPoster(data);
      setPosterUrl(url);
      setIsPosterModalOpen(true);
    } catch (err) {
      console.error('Failed to generate poster:', err);
    } finally {
      setIsGeneratingPoster(false);
    }
  };

  const categoryOptions = [
    { id: 'all', icon: Sparkles, label: language === 'zh-TW' ? '全部工具' : '全部工具' },
    { id: 'dynamics', icon: Zap, label: language === 'zh-TW' ? '動力傳動' : '动力传动' },
    { id: 'fitting', icon: Ruler, label: 'Fitting' },
    { id: 'route', icon: MapPin, label: language === 'zh-TW' ? '路線氣象' : '路线气象' },
    { id: 'health', icon: HeartPulse, label: language === 'zh-TW' ? '生理代謝' : '生理代谢' },
  ];

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* Dynamic Keynote-Style Hero Card: Latest Ride Tactical Debrief */}
      <div className="relative overflow-hidden rounded-2xl p-4 sm:p-5 border border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-br from-white via-[#F8F9FB] to-blue-50/40 dark:from-[#1C1C1E] dark:via-[#161618] dark:to-blue-950/20 shadow-ios-sm">
        <div className="absolute -right-16 -top-16 w-80 h-80 bg-ios-blue/10 dark:bg-ios-blue/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-32 bottom-0 w-64 h-64 bg-ios-purple/10 dark:bg-ios-purple/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-3 sm:space-y-4">
          {/* Top Tag & Context Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-[11px] font-bold tracking-wide">
                <span className="w-1.5 h-1.5 rounded-full bg-ios-blue" />
                <span>{language === 'zh-TW' ? '最新騎行極客深度戰報' : '最新骑行极客深度战报'}</span>
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {latestStats?.dateStr}
              </span>
              {!latestStats?.isRealData && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-ios-orange/10 text-ios-orange font-medium">
                  {language === 'zh-TW' ? '演示樣本' : '演示样本'}
                </span>
              )}
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span>{language === 'zh-TW' ? '戰術屬性: ' : '战术属性: '}</span>
              <strong className={latestStats?.tacticalTextColor}>{latestStats?.tacticalPace}</strong>
            </div>
          </div>

          {/* Ride Title & Vehicle Info */}
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight leading-tight text-slate-900 dark:text-white font-display">
              {latestStats?.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {latestStats?.sportType} · {language === 'zh-TW' ? '主力戰車: ' : '主力战车: '}{activeBike?.name || '公路战车'}
            </p>
          </div>

          {/* 6-Grid Tactical Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5 pt-0.5">
            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '單場里程' : '单场里程'}</div>
              <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tabular-nums font-mono mt-0.5">
                {latestStats?.distKm} <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">km</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {language === 'zh-TW' ? '均速' : '均速'} {latestStats?.avgSpeed}km/h
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '累計爬升' : '累计爬升'}</div>
              <div className="text-base sm:text-lg font-bold text-ios-green tabular-nums font-mono mt-0.5">
                +{latestStats?.eleM} <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">m</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {language === 'zh-TW' ? '時長' : '时长'} {latestStats?.timeStr}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '標準化 NP' : '标准化 NP'}</div>
              <div className="text-base sm:text-lg font-bold text-ios-blue tabular-nums font-mono mt-0.5">
                {latestStats?.np} <span className="text-[11px] font-normal text-slate-500 dark:text-slate-400">W</span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                AvgP {latestStats?.avgP}W{latestStats?.wKg ? ` · ${latestStats.wKg}W/kg` : ''}
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '強度係數 IF' : '强度系数 IF'}</div>
              <div className="text-base sm:text-lg font-bold text-ios-purple tabular-nums font-mono mt-0.5">
                {latestStats?.ifVal}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                VI {latestStats?.vi} · FTP比率
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '訓練負荷 TSS' : '训练负荷 TSS'}</div>
              <div className="text-base sm:text-lg font-bold text-ios-orange tabular-nums font-mono mt-0.5">
                {latestStats?.tss}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {language === 'zh-TW' ? '做功' : '做功'} {latestStats?.calories} kcal
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-white/80 dark:bg-[#252528]/80 backdrop-blur-md border border-black/[0.04] dark:border-white/[0.06] text-center">
              <div className="text-xs text-slate-600 dark:text-slate-300 font-semibold">{language === 'zh-TW' ? '效率因子 EF' : '效率因子 EF'}</div>
              <div className="text-base sm:text-lg font-bold text-ios-mint tabular-nums font-mono mt-0.5">
                {latestStats?.ef ? latestStats.ef : '--'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                {latestStats?.avgHr ? `${latestStats.avgHr}bpm${latestStats.maxHr ? ` (極${latestStats.maxHr})` : ''}` : (language === 'zh-TW' ? '有氧效率' : '有氧效率')}
              </div>
            </div>
          </div>

          {/* Quick Action Navigation Buttons */}
          <div className="pt-1.5 flex items-center gap-2 sm:gap-2.5 flex-wrap">
            <button
              onClick={() => onSelectTool('activity-analyzer')}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-ios-blue text-white text-xs font-semibold shadow-ios-sm hover:bg-ios-blue/90 active:scale-95 transition apple-touch"
            >
              <Activity className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '逐秒回放' : '逐秒回放'}</span>
            </button>

            <button
              onClick={() => onSelectTool('strava-cockpit')}
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-white dark:bg-[#2C2C2E] border border-black/10 dark:border-white/10 text-slate-800 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5 active:scale-95 transition apple-touch text-xs font-semibold shadow-ios-sm"
            >
              <LayoutDashboard className="w-4 h-4 text-ios-blue" />
              <span>{language === 'zh-TW' ? '數據羅盤' : '数据罗盘'}</span>
            </button>

            <button
              type="button"
              onClick={handleOpenSocialPoster}
              disabled={isGeneratingPoster}
              className="apple-touch w-9 h-9 rounded-xl bg-black/5 dark:bg-white/10 hover:bg-black/10 dark:hover:bg-white/15 text-slate-700 dark:text-slate-300 hover:text-ios-blue dark:hover:text-ios-blue transition flex items-center justify-center shadow-2xs shrink-0 disabled:opacity-50"
              title={language === 'zh-TW' ? '生成分享海報' : '生成分享海报'}
              aria-label={language === 'zh-TW' ? '生成分享海報' : '生成分享海报'}
            >
              <Share2 className={`w-4 h-4 ${isGeneratingPoster ? 'animate-spin text-ios-blue' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* iOS Segmented Navigation & Spotlight Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white/70 dark:bg-[#1C1C1E]/70 backdrop-blur-2xl rounded-2xl border border-black/[0.05] dark:border-white/[0.08] shadow-ios-sm">
        <div className="overflow-x-auto py-0.5 no-scrollbar">
          <IOSSegmentedControl
            options={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            size="md"
          />
        </div>

        {/* Spotlight Quick Search - Standard h-9 height matching segmented control */}
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchPrompt')}
            className="w-full h-9 bg-black/[0.04] dark:bg-white/[0.07] border border-transparent focus:border-ios-blue rounded-xl pl-9 pr-8 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none transition"
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
        <div className="p-4 sm:p-5 py-8 sm:py-10 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl text-center space-y-3 shadow-ios-sm">
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
              setSelectedCategory('dynamics');
            }}
            className="h-9 px-4 rounded-xl bg-ios-blue text-white text-xs font-semibold shadow-ios-sm hover:opacity-90 active:scale-95 transition apple-touch"
          >
            {language === 'zh-TW' ? '重設篩選條件' : '重置筛选条件'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
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
                          <span className="text-[11px] font-bold">Strava</span>
                        </span>
                      )}
                      {toolBadge && (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 font-medium border border-black/[0.04] dark:border-white/[0.06]">
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

      {/* 3:4 High-Resolution Social Share Modal */}
      <LatestRideShareModal
        isOpen={isPosterModalOpen}
        onClose={() => setIsPosterModalOpen(false)}
        posterUrl={posterUrl}
        data={posterData}
      />
    </div>
  );
};
