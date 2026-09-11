import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  RefreshCw,
  Share2,
  Route,
  Mountain,
  Clock,
  Flame,
  Calendar,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  Bike,
  Activity,
  Heart,
  TrendingUp,
  Award,
  Trophy,
  Link2,
  Disc,
  Sliders,
  Sun,
  Moon,
  Info
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { IOSCard, IOSCardHeader, IOSMetricTile } from '../common/IOSCard';
import { IOSToolHeader } from '../common/IOSToolHeader';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { ShareCardModal } from '../common/ShareCardModal';
import { PoweredByStravaBadge } from '../common/PoweredByStravaBadge';
import { useStrava } from '../../context/StravaContext';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';
import { StravaActivityRecord } from '../../utils/indexedDb';
import {
  TimePeriod,
  filterByPeriod,
  computeKpiMetrics,
  computePmcTimeline,
  diagnoseAthleteStatus,
  computeEddingtonNumber,
  buildHeatmapGrid,
  computeActivityRings,
  computeBioclock,
  estimateEFTP,
  computeGearFleet,
  computeMilestones,
  generateDemoStravaActivities
} from '../../utils/stravaCockpitAnalytics';
import { generateStravaCockpitPoster } from '../../utils/shareCardGenerators';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StravaDataCockpitProps {
  onNavigateTool?: (toolId: string) => void;
}

export const StravaDataCockpit: React.FC<StravaDataCockpitProps> = ({ onNavigateTool }) => {
  const { isConnected, athlete, activities: realActivities, isSyncing, syncActivities } = useStrava();
  const { profile, bikes: userBikes } = useRiderProfile();
  const { language, unitSystem, convertDistance, convertElevation } = useLanguageAndUnit();
  const { showToast } = useToast();

  // Mode: Use Demo Data vs Live Data
  const [useDemoMode, setUseDemoMode] = useState<boolean>(() => {
    return !isConnected || realActivities.length === 0;
  });

  // Selected Time Period
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod>('all-time');

  // MMP Curve Unit: Watts vs W/kg
  const [mmpUnit, setMmpUnit] = useState<'watts' | 'wkg'>('watts');

  // Bioclock sub-tab: 'time' vs 'day'
  const [bioclockTab, setBioclockTab] = useState<'time' | 'day'>('time');

  // Selected Bike Index for fleet view
  const [selectedBikeIdx, setSelectedBikeIdx] = useState<number>(0);

  // Activity Ring Targets
  const [ringTargets, setRingTargets] = useState({ distanceKm: 150, elevationM: 1500, tss: 350 });

  // Share Poster Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);

  // Demo Activities Cache
  const demoActivities = useMemo(() => generateDemoStravaActivities(), []);

  // Effective Activities Array
  const effectiveActivities: StravaActivityRecord[] = useMemo(() => {
    if (useDemoMode || !isConnected || realActivities.length === 0) {
      return demoActivities;
    }
    return realActivities;
  }, [useDemoMode, isConnected, realActivities, demoActivities]);

  // Filtered by selected period
  const periodFilteredActivities = useMemo(() => {
    return filterByPeriod(effectiveActivities, selectedPeriod);
  }, [effectiveActivities, selectedPeriod]);

  // 1. KPI Metrics
  const kpi = useMemo(() => {
    return computeKpiMetrics(periodFilteredActivities);
  }, [periodFilteredActivities]);

  // 2. PMC Fitness & Freshness Timeline
  const ftpWatts = profile.ftpWatts || athlete?.ftp || 240;
  const weightKg = profile.weightKg || athlete?.weight || 68;

  const pmcTimeline = useMemo(() => {
    return computePmcTimeline(effectiveActivities, ftpWatts, 90);
  }, [effectiveActivities, ftpWatts]);

  const latestPmc = pmcTimeline[pmcTimeline.length - 1] || { ctl: 65, atl: 68, tsb: -3 };
  const athleteDiagnosis = useMemo(() => {
    return diagnoseAthleteStatus(latestPmc.tsb, pmcTimeline);
  }, [latestPmc.tsb, pmcTimeline]);

  // 3. Eddington Number
  const eddington = useMemo(() => {
    return computeEddingtonNumber(effectiveActivities);
  }, [effectiveActivities]);

  // 4. Heatmap & Streaks (91-day / 13-week)
  const { grid: heatmapGrid, stats: streakStats } = useMemo(() => {
    return buildHeatmapGrid(effectiveActivities, 13);
  }, [effectiveActivities]);

  // 5. Activity Rings
  const ringData = useMemo(() => {
    return computeActivityRings(effectiveActivities, ringTargets);
  }, [effectiveActivities, ringTargets]);

  // 6. Bioclock & Habit Insights
  const bioclock = useMemo(() => {
    return computeBioclock(periodFilteredActivities);
  }, [periodFilteredActivities]);

  // 7. eFTP & MMP Peak Powers
  const eftp = useMemo(() => {
    let p5s = 980;
    let p1m = 520;
    let p5m = 340;
    let p20m = Math.round(ftpWatts * 1.05);

    for (const a of effectiveActivities) {
      const np = a.weighted_average_watts || a.average_watts || 0;
      if (np > 0) {
        if (np * 3.2 > p5s) p5s = Math.round(np * 3.2);
        if (np * 1.8 > p1m) p1m = Math.round(np * 1.8);
        if (np * 1.25 > p5m) p5m = Math.round(np * 1.25);
        if (np * 1.05 > p20m) p20m = Math.round(np * 1.05);
      }
    }
    return estimateEFTP(p5s, p1m, p5m, p20m, weightKg);
  }, [effectiveActivities, ftpWatts, weightKg]);

  // 8. Gear Fleet
  const combinedBikes = useMemo(() => {
    if (athlete?.bikes && athlete.bikes.length > 0) {
      return athlete.bikes;
    }
    if (userBikes && userBikes.length > 0) {
      return userBikes.map(b => ({
        id: b.id,
        name: b.name,
        distance: (b.mileageKm || 0) * 1000,
        primary: false
      }));
    }
    return [];
  }, [athlete?.bikes, userBikes]);

  const fleet = useMemo(() => {
    return computeGearFleet(combinedBikes, effectiveActivities);
  }, [combinedBikes, effectiveActivities]);

  const activeBike = fleet[selectedBikeIdx] || fleet[0];

  // 9. Milestones & PRs
  const milestones = useMemo(() => {
    return computeMilestones(effectiveActivities);
  }, [effectiveActivities]);

  // 10. Recent Activities & Latest Ride Spotlight
  const recentActivities = useMemo(() => {
    return [...effectiveActivities]
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime())
      .slice(0, 10);
  }, [effectiveActivities]);

  // Sync Strava Data Trigger
  const handleSync = async () => {
    if (!isConnected) {
      showToast('请先在个人设置中连接 Strava', 'info');
      return;
    }
    try {
      showToast('正在从 Strava 同步最新骑行活动...', 'info');
      const res = await syncActivities(false);
      setUseDemoMode(false);
      showToast(`同步完成，成功刷新 ${res.count} 场骑行记录！`, 'success');
    } catch (err: any) {
      showToast(`同步失败: ${err.message || '网络异常'}`, 'error');
    }
  };

  // Generate Share Poster
  const handleGeneratePoster = async () => {
    showToast('正在渲染 Retina 高清车手战报海报...', 'info');
    try {
      const athleteName = athlete ? `${athlete.firstname} ${athlete.lastname}` : profile.name || 'SoloRider 车手';
      const posterUrl = await generateStravaCockpitPoster({
        periodLabel: selectedPeriod === 'all-time' ? '全生涯历史总览' : selectedPeriod === 'ytd' ? '本年度骑行战报' : selectedPeriod === '30d' ? '近30天体能速报' : '近7天周报',
        athleteName,
        totalDistanceKm: kpi.totalDistanceKm,
        totalElevationM: kpi.totalElevationM,
        totalMovingTimeMin: kpi.totalMovingTimeMin,
        totalCaloriesKcal: kpi.totalCaloriesKcal,
        totalRides: kpi.totalRides,
        avgNpWatts: kpi.avgNpWatts,
        avgSpeedKmh: kpi.avgSpeedKmh,
        eddingtonE: eddington.E,
        ctl: latestPmc.ctl,
        atl: latestPmc.atl,
        tsb: latestPmc.tsb,
        tsbLabel: athleteDiagnosis.label,
        streakDays: streakStats.currentStreak,
        riderPattern: bioclock.riderPattern,
        everestCount: kpi.everestRatio
      });
      setSharePosterUrl(posterUrl);
      setIsShareModalOpen(true);
    } catch (err) {
      console.error(err);
      showToast('海报生成失败', 'error');
    }
  };

  // Charts Options & Data
  // 1. PMC Chart
  const pmcChartData = useMemo(() => {
    const labels = pmcTimeline.map(p => p.shortDate);
    const ctlData = pmcTimeline.map(p => p.ctl);
    const atlData = pmcTimeline.map(p => p.atl);
    const tsbData = pmcTimeline.map(p => p.tsb);

    return {
      labels,
      datasets: [
        {
          label: 'CTL (长期体能)',
          data: ctlData,
          borderColor: '#007AFF',
          backgroundColor: 'rgba(0, 122, 255, 0.12)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'ATL (急性疲劳)',
          data: atlData,
          borderColor: '#FF9500',
          backgroundColor: 'rgba(255, 149, 0, 0.1)',
          fill: true,
          tension: 0.35,
          borderWidth: 2,
          pointRadius: 0
        },
        {
          label: 'TSB (竞技状态)',
          data: tsbData,
          borderColor: '#34C759',
          borderWidth: 1.5,
          borderDash: [4, 4],
          fill: false,
          tension: 0.3,
          pointRadius: 0
        }
      ]
    };
  }, [pmcTimeline]);

  const pmcChartOptions = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index' as const, intersect: false },
      plugins: {
        legend: {
          display: true,
          position: 'top' as const,
          labels: { boxWidth: 10, font: { size: 11 } }
        },
        tooltip: {
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          titleFont: { size: 12 },
          bodyFont: { size: 11 }
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 8, font: { size: 10 } }
        },
        y: {
          grid: { color: 'rgba(120, 120, 128, 0.12)' },
          ticks: { font: { size: 10 } }
        }
      }
    };
  }, []);

  // 2. Eddington Histogram Chart
  const eddingtonChartData = useMemo(() => {
    const labels = eddington.histogramData.map(h => `${h.distanceKm}k`);
    const counts = eddington.histogramData.map(h => h.cumulativeCount);
    const thresholds = eddington.histogramData.map(h => h.distanceKm);

    return {
      labels,
      datasets: [
        {
          type: 'bar' as const,
          label: '达标场次',
          data: counts,
          backgroundColor: eddington.histogramData.map(h => h.isAboveThreshold ? '#007AFF' : '#AEAEB2'),
          borderRadius: 4
        },
        {
          type: 'line' as const,
          label: 'y=x 达标线',
          data: thresholds,
          borderColor: '#FF9500',
          borderWidth: 2,
          borderDash: [5, 5],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [eddington]);

  // 3. Bioclock Time Doughnut Data
  const bioclockDoughnutData = useMemo(() => {
    return {
      labels: bioclock.byTimeSlot.map(s => s.label),
      datasets: [
        {
          data: bioclock.byTimeSlot.map(s => s.rides),
          backgroundColor: ['#FF9500', '#FFCC00', '#007AFF', '#5856D6', '#AF52DE'],
          borderWidth: 0
        }
      ]
    };
  }, [bioclock]);

  // 4. Bioclock Day Bar Data
  const bioclockDayBarData = useMemo(() => {
    return {
      labels: bioclock.byDayOfWeek.map(d => d.label),
      datasets: [
        {
          label: '骑行里程 (km)',
          data: bioclock.byDayOfWeek.map(d => d.distanceKm),
          backgroundColor: '#007AFF',
          borderRadius: 6
        }
      ]
    };
  }, [bioclock]);

  // 5. MMP Curve Data
  const mmpCurveData = useMemo(() => {
    const points = [
      { sec: 5, label: '5s 冲刺', w: eftp.p5s },
      { sec: 60, label: '1m 无氧', w: eftp.p1m },
      { sec: 300, label: '5m VO2', w: eftp.p5m },
      { sec: 1200, label: '20m 阈值', w: eftp.p20m },
      { sec: 3600, label: '60m 耐力', w: Math.round(eftp.eFTP * 0.96) }
    ];

    const factor = mmpUnit === 'wkg' ? 1 / weightKg : 1;

    return {
      labels: points.map(p => p.label),
      datasets: [
        {
          label: mmpUnit === 'wkg' ? '峰值推重比 (W/kg)' : '峰值功率 (Watts)',
          data: points.map(p => parseFloat((p.w * factor).toFixed(2))),
          borderColor: '#007AFF',
          backgroundColor: 'rgba(0, 122, 255, 0.15)',
          fill: true,
          tension: 0.35,
          pointRadius: 5,
          pointBackgroundColor: '#007AFF'
        },
        {
          label: 'eFTP 阈值线',
          data: points.map(() => parseFloat((eftp.eFTP * factor).toFixed(2))),
          borderColor: '#FF9500',
          borderWidth: 1.5,
          borderDash: [4, 4],
          pointRadius: 0,
          fill: false
        }
      ]
    };
  }, [eftp, mmpUnit, weightKg]);

  const renderComponentIcon = (key: 'chain' | 'tire' | 'brake') => {
    if (key === 'chain') return <Link2 className="w-3.5 h-3.5 text-ios-blue shrink-0" />;
    if (key === 'tire') return <Disc className="w-3.5 h-3.5 text-ios-green shrink-0" />;
    return <Sliders className="w-3.5 h-3.5 text-ios-orange shrink-0" />;
  };

  const renderMilestoneIcon = (id: string, achieved: boolean) => {
    let Icon = Award;
    let colorClass = achieved ? 'text-ios-blue' : 'text-slate-400';
    let bgClass = achieved ? 'bg-ios-blue/10' : 'bg-slate-100 dark:bg-white/5';

    if (id === 'imperial_century') {
      Icon = Trophy;
      colorClass = achieved ? 'text-ios-yellow' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-yellow/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'double_century') {
      Icon = Sparkles;
      colorClass = achieved ? 'text-ios-purple' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-purple/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'everest_challenge') {
      Icon = Mountain;
      colorClass = achieved ? 'text-ios-green' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-green/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'dawn_patrol') {
      Icon = Sun;
      colorClass = achieved ? 'text-ios-orange' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-orange/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'pr_distance') {
      Icon = Route;
      colorClass = achieved ? 'text-ios-blue' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-blue/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'pr_elevation') {
      Icon = TrendingUp;
      colorClass = achieved ? 'text-ios-teal' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-teal/10' : 'bg-slate-100 dark:bg-white/5';
    } else if (id === 'pr_power') {
      Icon = Zap;
      colorClass = achieved ? 'text-ios-pink' : 'text-slate-400';
      bgClass = achieved ? 'bg-ios-pink/10' : 'bg-slate-100 dark:bg-white/5';
    }

    return (
      <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 ${bgClass} ${colorClass}`}>
        <Icon className="w-4 h-4" />
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-5 pb-12">
      {/* 1. Header with Actions & Live/Demo Indicator */}
      <IOSToolHeader
        title={language === 'zh-TW' ? 'Strava 單車數據羅盤' : 'Strava 骑行数据罗盘'}
        description={language === 'zh-TW' ? '宏觀數據看板 · 運動生理診斷 · 愛丁頓數 · 戰車管家' : '宏观数据看板 · 运动生理诊断 · 爱丁顿数 · 战车管家'}
        category={language === 'zh-TW' ? '生理與代謝' : '生理与代谢'}
        categoryIcon={LayoutDashboard}
        tint="blue"
        onShare={handleGeneratePoster}
        shareTitle={language === 'zh-TW' ? '生成數據羅盤海報' : '生成数据罗盘海报'}
        actions={
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Demo Toggle Pill */}
            <button
              onClick={() => setUseDemoMode(!useDemoMode)}
              className="h-9 px-3 rounded-xl text-xs font-medium bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 apple-touch transition flex items-center gap-1.5"
              title={language === 'zh-TW' ? '切換真實數據與演示樣本' : '切换真实数据与演示样本'}
            >
              <Sparkles className="w-3.5 h-3.5 text-ios-blue" />
              <span>{useDemoMode ? (language === 'zh-TW' ? '切回真實' : '切回真实') : (language === 'zh-TW' ? '載入演示' : '载入演示')}</span>
            </button>

            {/* Sync Button */}
            {isConnected && (
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="h-9 px-3 rounded-xl text-xs font-medium bg-ios-blue text-white hover:bg-ios-blue/90 disabled:opacity-50 apple-touch transition flex items-center gap-1.5 shadow-ios-sm"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? (language === 'zh-TW' ? '同步中' : '同步中') : (language === 'zh-TW' ? '同步' : '同步')}</span>
              </button>
            )}
          </div>
        }
      />

      {/* 2. Top Banner: Strava Connection Status & Period Segmented Control */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-md p-3 sm:p-4 rounded-2xl border border-black/[0.05] dark:border-white/[0.08] shadow-ios-card">
        <div className="flex items-center gap-2.5">
          <PoweredByStravaBadge />
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {useDemoMode ? '当前展示 90 天高保真演示数据集' : `已连接车手: ${athlete?.firstname || profile.name || '车手'}`}
          </span>
        </div>

        <IOSSegmentedControl
          value={selectedPeriod}
          onChange={(val) => setSelectedPeriod(val as TimePeriod)}
          options={[
            { value: 'all-time', label: '全生涯' },
            { value: 'ytd', label: '本年度' },
            { value: '30d', label: '近30天' },
            { value: '7d', label: '近7天' }
          ]}
        />
      </div>

      {/* 3. 6 Key Metric Tiles Array */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <IOSMetricTile
          label="总骑行里程"
          value={convertDistance(kpi.totalDistanceKm).formatted}
          subtext={`已绕地球 ${kpi.earthCircumferencePct}%`}
          icon={<Route className="w-3.5 h-3.5 text-ios-blue" />}
          accentColor="blue"
        />
        <IOSMetricTile
          label="累计总爬升"
          value={convertElevation(kpi.totalElevationM).formatted}
          subtext={`相当于 ${kpi.everestRatio} 座珠峰攀升`}
          icon={<Mountain className="w-3.5 h-3.5 text-ios-green" />}
          accentColor="green"
        />
        <IOSMetricTile
          label="鞍上总时长"
          value={`${Math.floor(kpi.totalMovingTimeMin / 60)}h ${kpi.totalMovingTimeMin % 60}m`}
          subtext={`场均 ${(kpi.totalMovingTimeMin / Math.max(1, kpi.totalRides) / 60).toFixed(1)} 小时`}
          icon={<Clock className="w-3.5 h-3.5 text-ios-orange" />}
          accentColor="orange"
        />
        <IOSMetricTile
          label="活跃卡路里"
          value={`${kpi.totalCaloriesKcal.toLocaleString()}`}
          unit="kcal"
          subtext={`约 ${kpi.bananasBurned} 根香蕉等效能量`}
          icon={<Flame className="w-3.5 h-3.5 text-ios-red" />}
          accentColor="red"
        />
        <IOSMetricTile
          label="出勤总场次"
          value={`${kpi.totalRides}`}
          unit="次"
          subtext={`月度活跃 ${streakStats.thisMonthActiveDays} 天`}
          icon={<Calendar className="w-3.5 h-3.5 text-ios-purple" />}
          accentColor="purple"
        />
        <IOSMetricTile
          label="加权平均功率"
          value={kpi.avgNpWatts > 0 ? `${kpi.avgNpWatts}` : '--'}
          unit="W NP"
          subtext={`均速 ${kpi.avgSpeedKmh} km/h`}
          icon={<Zap className="w-3.5 h-3.5 text-ios-mint" />}
          accentColor="mint"
        />
      </div>

      {/* 4. Intelligent Contextual Recommendation Banner */}
      {athleteDiagnosis.rampRateWarning && (
        <div className="p-3.5 rounded-2xl bg-ios-orange/10 border border-ios-orange/20 text-xs text-slate-800 dark:text-slate-200 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-ios-orange shrink-0" />
            <span>{athleteDiagnosis.rampRateWarning}</span>
          </div>
          {onNavigateTool && (
            <button
              onClick={() => onNavigateTool('workout-builder')}
              className="shrink-0 h-8 px-2.5 rounded-lg bg-ios-orange text-white font-medium hover:bg-ios-orange/90 apple-touch text-[11px] flex items-center gap-1"
            >
              <span>生成排酸课表</span>
              <ChevronRight className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      {/* 5. Two Big Cards: PMC Matrix + Eddington Number */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left 7 cols: PMC Matrix (Intervals.icu Model) */}
        <IOSCard className="lg:col-span-7 space-y-3.5">
          <IOSCardHeader
            title="PMC 体能状态动力学 (Intervals.icu 模型)"
            subtitle="90天体能 (CTL) · 急性疲劳 (ATL) · 竞技状态 (TSB)"
            icon={TrendingUp}
            iconColor="text-ios-blue bg-ios-blue/10"
            action={
              <div className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 ${athleteDiagnosis.badgeBg} ${athleteDiagnosis.badgeText}`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                <span>{athleteDiagnosis.label}</span>
              </div>
            }
          />

          {/* Tri-metrics readout */}
          <div className="grid grid-cols-3 gap-2.5 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] text-center">
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">CTL 长期体能</div>
              <div className="text-xl sm:text-2xl font-bold text-ios-blue tabular-nums">{latestPmc.ctl}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">42天 EWMA 积淀</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">ATL 急性疲劳</div>
              <div className="text-xl sm:text-2xl font-bold text-ios-orange tabular-nums">{latestPmc.atl}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">7天负荷累加</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">TSB 竞技状态</div>
              <div className={`text-xl sm:text-2xl font-bold tabular-nums ${latestPmc.tsb >= 0 ? 'text-ios-green' : 'text-ios-red'}`}>
                {latestPmc.tsb > 0 ? `+${latestPmc.tsb}` : latestPmc.tsb}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">CTL - ATL</div>
            </div>
          </div>

          <div className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-ios-blue/5 p-2.5 rounded-xl border border-ios-blue/10 flex items-start gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-ios-blue shrink-0 mt-0.5" />
            <div>
              <strong>运动生理诊断:</strong> {athleteDiagnosis.advice}
            </div>
          </div>

          {/* PMC Chart */}
          <div className="h-56 sm:h-64 w-full">
            <Line data={pmcChartData} options={pmcChartOptions} />
          </div>
        </IOSCard>

        {/* Right 5 cols: Eddington Number Hero */}
        <IOSCard className="lg:col-span-5 space-y-3.5">
          <IOSCardHeader
            title="爱丁顿骑行数 (Eddington Number)"
            subtitle="全球严肃骑行者耐力终极勋章"
            icon={Award}
            iconColor="text-ios-blue bg-ios-blue/10"
          />

          {/* Hero E readout */}
          <div className="p-4 rounded-xl bg-gradient-to-br from-ios-blue/10 via-transparent to-ios-purple/10 border border-ios-blue/20 text-center space-y-1">
            <div className="text-xs font-semibold text-ios-blue tracking-wide uppercase">当前耐力爱丁顿数</div>
            <div className="text-5xl sm:text-6xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              E = {eddington.E}
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              代表车手一生中至少有 <strong className="text-ios-blue">{eddington.E}</strong> 天，单日骑行突破了 <strong className="text-ios-blue">{eddington.E} km</strong>。
            </p>
          </div>

          {/* Next E+1 Target Countdown */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                冲级至 <strong className="text-ios-blue">E = {eddington.nextE}</strong>
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-mono">
                差 <strong>{eddington.ridesNeededForNextE}</strong> 场 ≥ {eddington.nextE}km 骑行
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-ios-blue rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (eddington.qualifyingRidesForNext / Math.max(1, eddington.nextE)) * 100)}%` }}
              />
            </div>
          </div>

          {/* Eddington Histogram */}
          <div className="h-44 w-full">
            <Bar
              data={eddingtonChartData as any}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                  tooltip: { backgroundColor: 'rgba(28, 28, 30, 0.95)' }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 10 } },
                  y: { grid: { color: 'rgba(120, 120, 128, 0.12)' }, ticks: { font: { size: 9 } } }
                }
              }}
            />
          </div>
        </IOSCard>
      </div>

      {/* 6. Heatmap Grid & Activity Rings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left 8 cols: 91-Day Heatmap Grid */}
        <IOSCard className="lg:col-span-8 space-y-3.5">
          <IOSCardHeader
            title="出勤打卡热力墙 (91天历史)"
            subtitle="每日里程热力阶梯 · 连击打卡记录"
            icon={Calendar}
            iconColor="text-ios-green bg-ios-green/10"
            action={
              <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                <span>当前连击: <strong className="text-ios-blue font-mono">{streakStats.currentStreak} 天</strong></span>
                <span>最长连击: <strong className="text-ios-green font-mono">{streakStats.longestStreak} 天</strong></span>
              </div>
            }
          />

          {/* Grid Container */}
          <div className="overflow-x-auto pb-2">
            <div className="inline-flex flex-col gap-1 min-w-[580px]">
              <div className="flex gap-1">
                {heatmapGrid.map((week, wIdx) => (
                  <div key={wIdx} className="flex flex-col gap-1">
                    {week.map((cell) => {
                      const colorClass =
                        cell.level === 4
                          ? 'bg-ios-blue dark:bg-ios-blue'
                          : cell.level === 3
                          ? 'bg-ios-blue/70 dark:bg-ios-blue/65'
                          : cell.level === 2
                          ? 'bg-ios-blue/45 dark:bg-ios-blue/40'
                          : cell.level === 1
                          ? 'bg-ios-blue/20 dark:bg-ios-blue/20'
                          : 'bg-slate-100 dark:bg-[#2C2C2E]/60';

                      return (
                        <div
                          key={cell.date}
                          className={`w-3.5 h-3.5 rounded-[3px] ${colorClass} transition-all hover:scale-125 cursor-pointer`}
                          title={`${cell.date}: ${cell.distanceKm} km, +${cell.elevationM} m (${cell.rides} 场)`}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>

              {/* Legend row */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                <span>13 周前</span>
                <div className="flex items-center gap-1.5">
                  <span>休整</span>
                  <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-[#2C2C2E]" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-ios-blue/20" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-ios-blue/45" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-ios-blue/70" />
                  <div className="w-2.5 h-2.5 rounded-sm bg-ios-blue" />
                  <span>破百大强度</span>
                </div>
                <span>本周</span>
              </div>
            </div>
          </div>
        </IOSCard>

        {/* Right 4 cols: Apple Fitness Style Activity Rings */}
        <IOSCard className="lg:col-span-4 space-y-3.5">
          <IOSCardHeader
            title="周度运动目标三环"
            subtitle="Apple Fitness 风格同心圆环"
            icon={Activity}
            iconColor="text-ios-red bg-ios-red/10"
          />

          <div className="flex items-center justify-center py-2">
            {/* SVG Concentric Rings */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                {/* Outer Ring: Distance (Red #FF2D55) */}
                <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="7" fill="transparent" className="text-ios-red/15" />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  stroke="#FF2D55"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 42}`}
                  strokeDashoffset={`${2 * Math.PI * 42 * (1 - Math.min(1, ringData.distance.pct))}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Middle Ring: Elevation (Green #34C759) */}
                <circle cx="50" cy="50" r="32" stroke="currentColor" strokeWidth="7" fill="transparent" className="text-ios-green/15" />
                <circle
                  cx="50"
                  cy="50"
                  r="32"
                  stroke="#34C759"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - Math.min(1, ringData.elevation.pct))}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />

                {/* Inner Ring: TSS (Blue #007AFF) */}
                <circle cx="50" cy="50" r="22" stroke="currentColor" strokeWidth="7" fill="transparent" className="text-ios-blue/15" />
                <circle
                  cx="50"
                  cy="50"
                  r="22"
                  stroke="#007AFF"
                  strokeWidth="7"
                  strokeDasharray={`${2 * Math.PI * 22}`}
                  strokeDashoffset={`${2 * Math.PI * 22 * (1 - Math.min(1, ringData.tss.pct))}`}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">周综合</span>
                <span className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {Math.round(((ringData.distance.pct + ringData.elevation.pct + ringData.tss.pct) / 3) * 100)}%
                </span>
              </div>
            </div>
          </div>

          {/* Legends */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-ios-pink font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-ios-pink" />
                <span>里程</span>
              </div>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {ringData.distance.current} / {ringData.distance.target} km ({Math.round(ringData.distance.pct * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-ios-green font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-ios-green" />
                <span>爬升</span>
              </div>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                +{ringData.elevation.current} / +{ringData.elevation.target} m ({Math.round(ringData.elevation.pct * 100)}%)
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-ios-blue font-medium">
                <div className="w-2.5 h-2.5 rounded-full bg-ios-blue" />
                <span>负荷</span>
              </div>
              <span className="font-mono tabular-nums text-slate-700 dark:text-slate-300">
                {ringData.tss.current} / {ringData.tss.target} TSS ({Math.round(ringData.tss.pct * 100)}%)
              </span>
            </div>
          </div>
        </IOSCard>
      </div>

      {/* 7. Bioclock & MMP Power Duration Curve Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-5">
        {/* Left 6 cols: Bioclock & Habit Insights */}
        <IOSCard className="lg:col-span-6 space-y-3.5">
          <IOSCardHeader
            title="生物钟与周内出勤画像"
            subtitle={`判定车手类型: ${bioclock.riderPattern}`}
            icon={Sun}
            iconColor="text-ios-orange bg-ios-orange/10"
            action={
              <IOSSegmentedControl
                value={bioclockTab}
                onChange={(v) => setBioclockTab(v as 'time' | 'day')}
                options={[
                  { value: 'time', label: '时段分布' },
                  { value: 'day', label: '周度规律' }
                ]}
              />
            }
          />

          <div className="h-56 w-full flex items-center justify-center">
            {bioclockTab === 'time' ? (
              <Doughnut
                data={bioclockDoughnutData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'right' as const, labels: { boxWidth: 10, font: { size: 11 } } }
                  }
                }}
              />
            ) : (
              <Bar
                data={bioclockDayBarData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: {
                    x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                    y: { grid: { color: 'rgba(120, 120, 128, 0.12)' }, ticks: { font: { size: 10 } } }
                  }
                }}
              />
            )}
          </div>
        </IOSCard>

        {/* Right 6 cols: MMP Power Curve & eFTP */}
        <IOSCard className="lg:col-span-6 space-y-3.5">
          <IOSCardHeader
            title="全域功率持续曲线 & eFTP"
            subtitle={`估算 FTP: ${eftp.eFTP}W (${eftp.eFTPWkg} W/kg) · W' ${eftp.wPrimeKj} kJ`}
            icon={Zap}
            iconColor="text-ios-blue bg-ios-blue/10"
            action={
              <IOSSegmentedControl
                value={mmpUnit}
                onChange={(v) => setMmpUnit(v as 'watts' | 'wkg')}
                options={[
                  { value: 'watts', label: '瓦特' },
                  { value: 'wkg', label: 'W/kg' }
                ]}
              />
            }
          />

          <div className="h-56 w-full">
            <Line
              data={mmpCurveData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: true, position: 'top' as const, labels: { boxWidth: 10, font: { size: 11 } } }
                },
                scales: {
                  x: { grid: { display: false }, ticks: { font: { size: 10 } } },
                  y: { grid: { color: 'rgba(120, 120, 128, 0.12)' }, ticks: { font: { size: 10 } } }
                }
              }}
            />
          </div>
        </IOSCard>
      </div>

      {/* 8. Fleet Management & Component Health */}
      <IOSCard className="space-y-4">
        <IOSCardHeader
          title="战车机队全景与零部件损耗管家"
          subtitle="各车出勤里程统计 · 链条/外胎/刹车健康度寿命预警"
          icon={Bike}
          iconColor="text-ios-blue bg-ios-blue/10"
          action={
            <div className="flex items-center gap-1.5">
              {fleet.map((b, idx) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBikeIdx(idx)}
                  className={`h-7 px-2.5 rounded-lg text-xs font-medium transition apple-touch ${
                    selectedBikeIdx === idx
                      ? 'bg-ios-blue text-white shadow-2xs'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {b.name.split(' ')[0]}
                </button>
              ))}
            </div>
          }
        />

        {activeBike && (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-ios-blue/10 flex items-center justify-center text-ios-blue">
                  <Bike className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">{activeBike.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    最后出勤: {activeBike.lastRideDate} · 共出勤 {activeBike.totalRides} 场
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
                  {activeBike.totalDistanceKm.toLocaleString()} km
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">占全队总里程 {activeBike.distancePct}%</div>
              </div>
            </div>

            {/* Components Wear Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {activeBike.components.map((comp) => (
                <div
                  key={comp.name}
                  className="p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] space-y-2"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                      {renderComponentIcon(comp.componentKey)}
                      <span>{comp.name}</span>
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                        comp.status === 'critical'
                          ? 'bg-ios-red/10 text-ios-red'
                          : comp.status === 'warn'
                          ? 'bg-ios-orange/10 text-ios-orange'
                          : 'bg-ios-green/10 text-ios-green'
                      }`}
                    >
                      {comp.status === 'critical' ? '超期预警' : comp.status === 'warn' ? '接近保养' : '健康'}
                    </span>
                  </div>

                  <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        comp.status === 'critical' ? 'bg-ios-red' : comp.status === 'warn' ? 'bg-ios-orange' : 'bg-ios-green'
                      }`}
                      style={{ width: `${Math.min(100, (comp.currentKm / comp.criticalKm) * 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 tabular-nums">
                    <span>已骑 {comp.currentKm} km</span>
                    <span>上限 {comp.criticalKm} km</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </IOSCard>

      {/* 9. Milestones & Trophy Cabinet */}
      <IOSCard className="space-y-4">
        <IOSCardHeader
          title="车手里程碑与荣誉殿堂"
          subtitle="破百勋章 · 珠峰攀登 · 生涯最高战力记录"
          icon={Award}
          iconColor="text-ios-yellow bg-ios-yellow/10"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {milestones.map((m) => (
            <div
              key={m.id}
              className={`p-3.5 rounded-xl border transition-all ${
                m.achieved
                  ? 'bg-white dark:bg-[#2C2C2E] border-black/[0.06] dark:border-white/10 shadow-2xs'
                  : 'bg-slate-50/60 dark:bg-white/[0.02] border-dashed border-black/[0.08] dark:border-white/[0.08] opacity-60'
              }`}
            >
              {renderMilestoneIcon(m.id, m.achieved)}
              <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{m.title}</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{m.subtitle}</div>
              {m.count !== undefined && (
                <div className="mt-2 text-xs font-bold text-ios-blue tabular-nums">达成 {m.count} 次</div>
              )}
            </div>
          ))}
        </div>
      </IOSCard>

      {/* 10. Recent Activities List & Drilldown to FitActivityAnalyzer */}
      <IOSCard className="space-y-3.5">
        <IOSCardHeader
          title="近期 Strava 骑行活动流"
          subtitle="点击「深度解析」可直接联动 FitActivityAnalyzer 逐秒回放"
          icon={Route}
          iconColor="text-ios-blue bg-ios-blue/10"
        />

        <div className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
          {recentActivities.map((act) => {
            const distKm = parseFloat(((act.distance || 0) / 1000).toFixed(1));
            const eleM = Math.round(act.total_elevation_gain || 0);
            const hrs = Math.floor((act.moving_time || 0) / 3600);
            const mins = Math.round(((act.moving_time || 0) % 3600) / 60);

            return (
              <div
                key={act.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-black/[0.01] dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-xl transition"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900 dark:text-white">{act.name}</span>
                    {act.gear_id && (
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300">
                        {act.sport_type || 'Ride'}
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2.5 tabular-nums">
                    <span>{act.start_date.split('T')[0]}</span>
                    <span>·</span>
                    <span>{distKm} km</span>
                    <span>·</span>
                    <span>+{eleM} m</span>
                    <span>·</span>
                    <span>{hrs > 0 ? `${hrs}h ${mins}m` : `${mins}m`}</span>
                    {act.weighted_average_watts && (
                      <>
                        <span>·</span>
                        <span className="text-ios-blue font-medium">{act.weighted_average_watts}W NP</span>
                      </>
                    )}
                  </div>
                </div>

                {onNavigateTool && (
                  <button
                    onClick={() => onNavigateTool('activity-analyzer')}
                    className="self-start sm:self-auto h-8 px-3 rounded-lg bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue text-xs font-medium apple-touch transition flex items-center gap-1 shrink-0"
                  >
                    <span>深度分析</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </IOSCard>

      {/* Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        posterUrl={sharePosterUrl}
        title="车手战报海报"
      />
    </div>
  );
};
