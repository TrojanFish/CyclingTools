import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart as LineChartIcon,
  Upload,
  FileSpreadsheet,
  Activity,
  Zap,
  Heart,
  Timer,
  TrendingUp,
  Mountain,
  Flame,
  Award,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Gauge,
  Layers,
  BarChart3,
  Printer,
  Cloud,
  RefreshCw,
  Battery,
  Sliders,
  ArrowRight,
  Dumbbell,
  X,
  Share2
} from 'lucide-react';
import { PoweredByStravaBadge } from '../common/PoweredByStravaBadge';
import { WORKOUT_TEMPLATES, WorkoutTemplate, WorkoutSegment } from './WorkoutBuilder';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler
} from 'chart.js';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { NumberStepper } from '../common/NumberStepper';
import { ShareCardModal } from '../common/ShareCardModal';
import { generateFitActivityPoster } from '../../utils/shareCardGenerators';
import {
  ActivityAnalysis,
  ActivityPoint,
  parseFitFile,
  parseGpxFile,
  parseTcxFile,
  generateRealisticDemoRide,
  analyzePoints,
  COGGAN_BENCHMARKS,
  CogganBenchmarkLevel,
  calculateSkibaWPrimeBalance,
  WPrimeBalanceResult
} from '../../utils/activityParser';
import {
  generatePmcSeries,
  getTsbZoneInfo,
  predictTaperDays,
  PmcMesocycleType,
  PmcDayData,
  BaselineFitnessLevel,
  ManualTssEntry,
  BASELINE_FITNESS_OPTIONS
} from '../../utils/pmcCalculator';
import { useStrava } from '../../context/StravaContext';
import { StravaActivityRecord } from '../../utils/indexedDb';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

interface FitActivityAnalyzerProps {
  onNavigateTool?: (toolId: string) => void;
}

export const FitActivityAnalyzer: React.FC<FitActivityAnalyzerProps> = ({ onNavigateTool }) => {
  const { profile } = useRiderProfile();
  const { unitSystem, language, convertDistance, convertElevation, convertSpeed, convertWeight } = useLanguageAndUnit();
  const { showToast } = useToast();
  const isImperial = unitSystem === 'imperial';

  // Rider Physiological Anchors
  const [ftpWatts, setFtpWatts] = useState<number>(profile.ftpWatts || 240);
  const [weightKg, setWeightKg] = useState<number>(profile.weightKg || 68);
  const [maxHr, setMaxHr] = useState<number>(profile.maxHr || 185);

  useEffect(() => {
    if (profile.ftpWatts) setFtpWatts(profile.ftpWatts);
    if (profile.weightKg) setWeightKg(profile.weightKg);
    if (profile.maxHr) setMaxHr(profile.maxHr);
  }, [profile.ftpWatts, profile.weightKg, profile.maxHr]);

  // MMP & W' Balance State
  const [mmpUnit, setMmpUnit] = useState<'wkg' | 'watts'>('wkg');
  const [mmpSubView, setMmpSubView] = useState<'mmp_curve' | 'w_balance'>('mmp_curve');
  const [selectedCogganTier, setSelectedCogganTier] = useState<string>('all');
  const [cpWatts, setCpWatts] = useState<number>(profile.ftpWatts || 240);
  const [wPrimeKj, setWPrimeKj] = useState<number>(20);

  useEffect(() => {
    if (profile.ftpWatts) setCpWatts(profile.ftpWatts);
  }, [profile.ftpWatts]);

  // Activity State
  const [analysis, setAnalysis] = useState<ActivityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'zones' | 'mmp' | 'coaching' | 'pmc'>('trends');
  const [smartWorkoutModalOpen, setSmartWorkoutModalOpen] = useState<boolean>(false);
  const [selectedSmartTemplateId, setSelectedSmartTemplateId] = useState<string>('');
  const [pmcMesocycle, setPmcMesocycle] = useState<PmcMesocycleType>('build');
  const [targetTsbForPeak, setTargetTsbForPeak] = useState<number>(15);
  const [baselineFitness, setBaselineFitness] = useState<BaselineFitnessLevel>('club');
  const [manualTssEntries, setManualTssEntries] = useState<ManualTssEntry[]>(() => {
    try {
      const saved = localStorage.getItem('yolo_cycling_pmc_manual_tss');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [newManualTss, setNewManualTss] = useState<number>(80);
  const [newManualTitle, setNewManualTitle] = useState<string>('');
  const [newManualDayOffset, setNewManualDayOffset] = useState<number>(0);

  useEffect(() => {
    try {
      localStorage.setItem('yolo_cycling_pmc_manual_tss', JSON.stringify(manualTssEntries));
    } catch (e) {
      console.warn('Failed to save manual TSS:', e);
    }
  }, [manualTssEntries]);

  const handleAddManualTss = () => {
    const entry: ManualTssEntry = {
      id: Date.now().toString(),
      dayOffset: newManualDayOffset,
      tss: Math.max(1, newManualTss),
      title: newManualTitle.trim() || (newManualDayOffset === 0 ? '今日手动训练' : newManualDayOffset === -1 ? '昨日手动训练' : '前日手动训练')
    };
    setManualTssEntries(prev => [...prev.filter(e => e.dayOffset !== newManualDayOffset), entry]);
    setNewManualTitle('');
    showToast(`已成功录入 ${entry.tss} TSS 训练负荷！`, 'success');
  };

  const handleRemoveManualTss = (id: string) => {
    setManualTssEntries(prev => prev.filter(e => e.id !== id));
    showToast('已移除手动训练负荷', 'info');
  };

  const {
    isConnected: isStravaConnected,
    activities: stravaActivities,
    getActivityStreams,
    isSyncing: isStravaSyncing,
    syncActivities: syncStravaActivities
  } = useStrava();

  const [selectedStravaActivityId, setSelectedStravaActivityId] = useState<string>('');

  const handleLoadStravaActivity = async (activityIdStr: string) => {
    const actId = parseInt(activityIdStr, 10);
    if (isNaN(actId)) return;
    const act = stravaActivities.find(a => a.id === actId);
    if (!act) return;

    setSelectedStravaActivityId(activityIdStr);
    setIsLoading(true);
    try {
      showToast(`正在从 Strava 载入「${act.name}」秒级数据流...`, 'info');
      const streams = await getActivityStreams(act.id);
      if (!streams || !streams.time || streams.time.length === 0) {
        showToast('该骑行暂无秒级详细流数据（可能无码表传感器记录）', 'warning');
        return;
      }

      let cumDistanceMeters = 0;
      const baseTime = new Date(act.start_date).getTime();
      const points: ActivityPoint[] = streams.time.map((tSec, i) => {
        const dt = i > 0 ? (streams.time![i] - streams.time![i - 1]) : 1;
        const velMs = streams.velocity_smooth ? (streams.velocity_smooth[i] || 0) : 0;
        cumDistanceMeters += velMs * dt;

        return {
          time: tSec,
          timestamp: new Date(baseTime + tSec * 1000),
          distance: cumDistanceMeters,
          power: streams.watts ? streams.watts[i] : undefined,
          heartRate: streams.heartrate ? streams.heartrate[i] : undefined,
          cadence: streams.cadence ? streams.cadence[i] : undefined,
          speed: velMs > 0 ? parseFloat((velMs * 3.6).toFixed(1)) : undefined,
          altitude: streams.altitude ? streams.altitude[i] : undefined,
          lat: streams.latlng && streams.latlng[i] ? streams.latlng[i][0] : undefined,
          lon: streams.latlng && streams.latlng[i] ? streams.latlng[i][1] : undefined
        };
      });

      const parsed = analyzePoints(points, act.name, 'fit', ftpWatts, weightKg, maxHr);
      setAnalysis(parsed);
      setActiveTab('trends');
      showToast(`成功载入 Strava 骑行「${act.name}」！`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`载入 Strava 骑行流失败: ${err.message || '网络异常'}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // PMC Calculation (automatically driven by real Strava activities if connected)
  const pmcData = useMemo(() => {
    return generatePmcSeries(
      pmcMesocycle,
      analysis?.tss,
      baselineFitness,
      manualTssEntries,
      isStravaConnected ? stravaActivities : undefined
    );
  }, [pmcMesocycle, analysis?.tss, baselineFitness, manualTssEntries, isStravaConnected, stravaActivities]);

  const latestPmcDay = pmcData[pmcData.length - 1];
  const currentTsbZone = getTsbZoneInfo(latestPmcDay ? latestPmcDay.tsb : 0);
  const taperPrediction = predictTaperDays(
    latestPmcDay ? latestPmcDay.ctl : 50,
    latestPmcDay ? latestPmcDay.atl : 40,
    targetTsbForPeak
  );

  const pmcChartData = useMemo(() => {
    return {
      labels: pmcData.map(d => d.date),
      datasets: [
        {
          label: 'CTL (体能 / 42天均线)',
          data: pmcData.map(d => d.ctl),
          borderColor: '#00AFFF',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 1,
          yAxisID: 'y'
        },
        {
          label: 'ATL (疲劳 / 7天均线)',
          data: pmcData.map(d => d.atl),
          borderColor: '#f43f5e',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          tension: 0.3,
          pointRadius: 1,
          yAxisID: 'y'
        },
        {
          label: 'TSB (竞技状态 / CTL - ATL)',
          data: pmcData.map(d => d.tsb),
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          borderWidth: 1.5,
          fill: true,
          tension: 0.3,
          pointRadius: 1,
          yAxisID: 'y1'
        }
      ]
    };
  }, [pmcData]);

  // Chart Channel Visibility Toggles
  const [showPower, setShowPower] = useState<boolean>(true);
  const [showHeartRate, setShowHeartRate] = useState<boolean>(true);
  const [showElevation, setShowElevation] = useState<boolean>(true);
  const [showSpeed, setShowSpeed] = useState<boolean>(false);
  const [showCadence, setShowCadence] = useState<boolean>(false);

  // Automatically load demo ride on first render so user has immediate rich data
  useEffect(() => {
    if (!analysis) {
      try {
        const demo = generateRealisticDemoRide(ftpWatts, weightKg, maxHr);
        setAnalysis(demo);
      } catch (err) {
        console.error(err);
      }
    }
  }, []);

  // When FTP/Weight/MaxHR changes, re-analyze current activity points
  const handleProfileRecompute = () => {
    if (!analysis) return;
    try {
      const updated = analyzePoints(
        analysis.points,
        analysis.fileName,
        analysis.fileType,
        ftpWatts,
        weightKg,
        maxHr
      );
      setAnalysis(updated);
      showToast(
        '已基于调整后的车手生理指标重新计算所有数据',
        'success'
      );
    } catch (err: any) {
      showToast(err.message || '重算失败', 'error');
    }
  };

  // File Upload Handlers
  const handleFileUpload = async (file: File) => {
    setIsLoading(true);
    const ext = file.name.split('.').pop()?.toLowerCase();

    try {
      let result: ActivityAnalysis;
      if (ext === 'fit') {
        result = await parseFitFile(file, ftpWatts, weightKg, maxHr);
      } else if (ext === 'gpx') {
        result = await parseGpxFile(file, ftpWatts, weightKg, maxHr);
      } else if (ext === 'tcx') {
        result = await parseTcxFile(file, ftpWatts, weightKg, maxHr);
      } else {
        throw new Error(
          '格式不支持！仅支持上传 .fit, .gpx, 或 .tcx 文件'
        );
      }

      setAnalysis(result);
      showToast(
        `解析成功！共包含 ${result.totalDistanceKm}km 骑行数据`,
        'success'
      );
    } catch (error: any) {
      console.error(error);
      showToast(error.message || '文件解析失败，请检查文件是否损坏', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleLoadDemo = () => {
    setIsLoading(true);
    setTimeout(() => {
      const demo = generateRealisticDemoRide(ftpWatts, weightKg, maxHr);
      setAnalysis(demo);
      setIsLoading(false);
      showToast(
        '已成功加载千岛湖丘陵经典实测样本航迹！',
        'info'
      );
    }, 150);
  };

  // Format Helper: Seconds to HH:MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  // Time-Series Trend Line Chart Data
  const trendChartData = useMemo(() => {
    if (!analysis) return { labels: [], datasets: [] };

    const pts = analysis.sampledPoints;
    const labels = pts.map(p => {
      const m = Math.floor(p.time / 60);
      const s = p.time % 60;
      return `${m}:${s < 10 ? '0' : ''}${s}`;
    });

    const datasets: any[] = [];

    if (showPower) {
      datasets.push({
        type: 'line' as const,
        label: '功率 (W)',
        data: pts.map(p => p.power ?? null),
        borderColor: '#06b6d4', // cyan-500
        backgroundColor: 'rgba(6, 182, 212, 0.08)',
        fill: true,
        yAxisID: 'yPower',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.1
      });
    }

    if (showHeartRate) {
      datasets.push({
        type: 'line' as const,
        label: '心率 (bpm)',
        data: pts.map(p => p.heartRate ?? null),
        borderColor: '#f43f5e', // rose-500
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        yAxisID: 'yHr',
        pointRadius: 0,
        tension: 0.2
      });
    }

    if (showElevation) {
      datasets.push({
        type: 'line' as const,
        label: '海拔 (m)',
        data: pts.map(p => p.altitude ?? null),
        borderColor: '#10b981', // emerald-500
        backgroundColor: 'rgba(16, 185, 129, 0.12)',
        fill: true,
        borderWidth: 1.2,
        yAxisID: 'yElevation',
        pointRadius: 0,
        tension: 0.2
      });
    }

    if (showSpeed) {
      datasets.push({
        type: 'line' as const,
        label: '速度 (km/h)',
        data: pts.map(p => p.speed ?? null),
        borderColor: '#3b82f6', // blue-500
        backgroundColor: 'transparent',
        borderWidth: 1.2,
        yAxisID: 'ySpeed',
        pointRadius: 0,
        tension: 0.2
      });
    }

    if (showCadence) {
      datasets.push({
        type: 'line' as const,
        label: '踏频 (rpm)',
        data: pts.map(p => p.cadence ?? null),
        borderColor: '#eab308', // yellow-500
        backgroundColor: 'transparent',
        borderWidth: 1.2,
        yAxisID: 'yCadence',
        pointRadius: 0,
        tension: 0.1
      });
    }

    return { labels, datasets };
  }, [analysis, showPower, showHeartRate, showElevation, showSpeed, showCadence, language]);

  const trendChartOptions: any = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 400 },
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            boxWidth: 12,
            font: { size: 11 },
            color: '#94a3b8'
          }
        },
        tooltip: {
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          titleColor: '#38bdf8',
          bodyColor: '#f1f5f9',
          borderColor: 'rgba(56, 189, 248, 0.3)',
          borderWidth: 1,
          padding: 10,
          boxPadding: 4
        }
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: '#8E8E93',
            maxTicksLimit: 8,
            font: { size: 10 }
          }
        },
        yPower: {
          type: 'linear',
          display: showPower,
          position: 'left',
          grid: { color: 'rgba(148, 163, 184, 0.08)' },
          ticks: { color: '#06b6d4', font: { size: 10 } },
          title: { display: true, text: 'Watts', color: '#06b6d4', font: { size: 10 } }
        },
        yHr: {
          type: 'linear',
          display: showHeartRate,
          position: 'right',
          grid: { display: false },
          ticks: { color: '#f43f5e', font: { size: 10 } },
          title: { display: true, text: 'BPM', color: '#f43f5e', font: { size: 10 } }
        },
        yElevation: {
          type: 'linear',
          display: showElevation && !showHeartRate,
          position: 'right',
          grid: { display: false },
          ticks: { color: '#10b981', font: { size: 10 } }
        },
        ySpeed: { display: false },
        yCadence: { display: false }
      }
    };
  }, [showPower, showHeartRate, showElevation]);

  // Coggan 7-Zone Bar Chart
  const powerZoneBarData = useMemo(() => {
    if (!analysis) return { labels: [], datasets: [] };
    const zones = analysis.timeInPowerZones;
    return {
      labels: zones.map(z => `${z.zone} ${z.label}`),
      datasets: [
        {
          label: '占比 (%)',
          data: zones.map(z => z.percent),
          backgroundColor: zones.map(z => z.color),
          borderRadius: 6
        }
      ]
    };
  }, [analysis, language]);

  // Heart Rate 5-Zone Bar Chart
  const hrZoneBarData = useMemo(() => {
    if (!analysis) return { labels: [], datasets: [] };
    const zones = analysis.timeInHrZones;
    return {
      labels: zones.map(z => `${z.zone} ${z.label}`),
      datasets: [
        {
          label: '占比 (%)',
          data: zones.map(z => z.percent),
          backgroundColor: zones.map(z => z.color),
          borderRadius: 6
        }
      ]
    };
  }, [analysis, language]);

  // Coggan benchmark duration interpolator
  const getBenchmarkWkgForDuration = (b: CogganBenchmarkLevel, sec: number): number => {
    if (sec <= 5) return b.wkg5s;
    if (sec <= 60) {
      const ratio = Math.log(sec / 5) / Math.log(60 / 5);
      return parseFloat((b.wkg5s + ratio * (b.wkg1m - b.wkg5s)).toFixed(1));
    }
    if (sec <= 300) {
      const ratio = Math.log(sec / 60) / Math.log(300 / 60);
      return parseFloat((b.wkg1m + ratio * (b.wkg5m - b.wkg1m)).toFixed(1));
    }
    if (sec <= 1200) {
      const ratio = Math.log(sec / 300) / Math.log(1200 / 300);
      return parseFloat((b.wkg5m + ratio * (b.wkg20m - b.wkg5m)).toFixed(1));
    }
    const ratio = Math.min(1, Math.log(sec / 1200) / Math.log(3600 / 1200));
    return parseFloat((b.wkg20m + ratio * (b.wkg60m - b.wkg20m)).toFixed(1));
  };

  // Skiba W' Balance anaerobic battery calculation
  const wPrimeResult: WPrimeBalanceResult | null = useMemo(() => {
    if (!analysis || !analysis.points || analysis.points.length === 0) return null;
    return calculateSkibaWPrimeBalance(analysis.points, cpWatts, wPrimeKj * 1000);
  }, [analysis, cpWatts, wPrimeKj]);

  // Rider phenotype analysis based on MMP profile
  const riderPhenotype = useMemo(() => {
    if (!analysis || !analysis.mmp || analysis.mmp.length === 0) return null;
    const m5s = analysis.mmp.find(m => m.durationSec === 5)?.wkg || 0;
    const m1m = analysis.mmp.find(m => m.durationSec === 60)?.wkg || 0;
    const m5m = analysis.mmp.find(m => m.durationSec === 300)?.wkg || 0;
    const m20m = analysis.mmp.find(m => m.durationSec === 1200)?.wkg || ((analysis.normalizedPower || 200) / (weightKg || 68));

    // Baseline benchmark scores relative to Cat 3 club standard
    const score5s = m5s / 15.2;
    const score1m = m1m / 7.3;
    const score5m = m5m / 4.3;
    const score20m = m20m / 3.7;

    const maxScore = Math.max(score5s, score1m, score5m, score20m);
    const minScore = Math.min(score5s, score1m, score5m, score20m);

    if (maxScore - minScore < 0.25) {
      return {
        type: 'all_rounder',
        title: language === 'zh-TW' ? '全能均衡型 (All-Rounder)' : '全能均衡型 (All-Rounder)',
        badgeColor: 'text-ios-blue bg-ios-blue/10 border-ios-blue/20',
        description: '冲刺、无氧摄氧与阈值巡航能力全面且均衡，能够从容应对多起伏丘陵、大组突围与平路追击等各类综合赛况。',
        trainingFocus: '建议保持全面素质，结合「训练课表工坊」针对短板（如 VO₂max 4x4 或 2x20 阈值）进行特定专项突破。'
      };
    }
    if (score5s === maxScore) {
      return {
        type: 'sprinter',
        title: language === 'zh-TW' ? '衝刺爆發型 (Sprinter)' : '冲刺爆发型 (Sprinter)',
        badgeColor: 'text-ios-pink bg-ios-pink/10 border-ios-pink/20',
        description: '瞬时神经肌肉爆发力极高，终点冲刺与短陡坡超车优势显著，具备优秀的无氧电量快速放电能力。',
        trainingFocus: '建议搭配「Ronnestad 30/15s 微间歇」提升抗乳酸恢复速度，并补充「Z2 基础耐力」避免后半程电量耗尽。'
      };
    }
    if (score1m === maxScore || score5m === maxScore) {
      return {
        type: 'puncher',
        title: language === 'zh-TW' ? '阿登突圍/陡坡型 (Puncher / Breakaway)' : '阿登突围/陡坡型 (Puncher / Breakaway)',
        badgeColor: 'text-ios-orange bg-ios-orange/10 border-ios-orange/20',
        description: '最大摄氧量 (VO₂max) 与抗乳酸能力突出，擅长 1~5 分钟的短陡坡爆击、反复突围拉扯与追赶。',
        trainingFocus: '可配合「Over-Under 乳酸清除间歇」与「4x4 VO₂max 课表」进一步强化乳酸穿梭再循环能力。'
      };
    }
    return {
      type: 'time_trialist',
      title: language === 'zh-TW' ? '計時賽/長坡巡航型 (Time Trialist / Climber)' : '计时赛/长坡巡航型 (Time Trialist / Climber)',
      badgeColor: 'text-ios-green bg-ios-green/10 border-ios-green/20',
      description: '功能阈值功率 (FTP) 持续输出坚如磐石，有氧底蕴深厚，长距离平路巡航与稳态爬坡表现优异。',
      trainingFocus: '建议使用「2x20 经典阈值巡航」巩固推重比，同时适度补充「Tabata 冲刺」激活无氧能量池储备。'
    };
  }, [analysis, weightKg, language]);

  // Intelligent Targeted Workout Recommendation derived from ride telemetry & physiological deficits
  const smartWorkoutRecommendation = useMemo(() => {
    if (!analysis) return null;

    // 1. Aerobic Decoupling deficiency: Pw:HR > 5% indicates severe cardiac drift & insufficient aerobic base
    if (analysis.aerobicDecoupling !== undefined && analysis.aerobicDecoupling > 5.0) {
      const tmpl = WORKOUT_TEMPLATES.find(t => t.id === 'zone2_endurance') || WORKOUT_TEMPLATES[5];
      return {
        template: tmpl,
        deficiencyTitle: language === 'zh-TW' ? '有氧耐力脫節 (Pw:HR 漂移過大)' : '有氧耐力脱节 (Pw:HR 漂移过大)',
        deficiencyDesc: `本次骑行后程有氧解耦率高达 ${analysis.aerobicDecoupling}%。在同等踩踏功率下心率出现显著代偿性爬升，表明基础有氧能力、肌纤维抗疲劳度与线粒体容量亟待加强。`,
        actionAdvice: '推荐通过 90 分钟 Zone 2 恒定巡航课表，最大化脂肪氧化率 (FatMax)，建立扎实有氧金字塔基石。'
      };
    }

    // Check MMP continuous power scores
    if (analysis.mmp && analysis.mmp.length > 0) {
      const m5s = analysis.mmp.find(m => m.durationSec === 5)?.wkg || 0;
      const m1m = analysis.mmp.find(m => m.durationSec === 60)?.wkg || 0;
      const m5m = analysis.mmp.find(m => m.durationSec === 300)?.wkg || 0;
      const m20m = analysis.mmp.find(m => m.durationSec === 1200)?.wkg || ((analysis.normalizedPower || 200) / (weightKg || 68));

      const score5s = m5s / 15.2;
      const score1m = m1m / 7.3;
      const score5m = m5m / 4.3;
      const score20m = m20m / 3.7;

      const minScore = Math.min(score5s, score1m, score5m, score20m);

      // 2. VO2max / Short climb surge deficiency
      if (minScore === score5m || minScore === score1m) {
        const tmpl = WORKOUT_TEMPLATES.find(t => t.id === 'ronnestad_30_15') || WORKOUT_TEMPLATES[0];
        return {
          template: tmpl,
          deficiencyTitle: language === 'zh-TW' ? '最大攝氧量 (VO₂max) 儲備不足' : '最大摄氧量 (VO₂max) 储备不足',
          deficiencyDesc: `本次骑行 1m~5m 相对推重比偏弱 (5m 推重比: ${m5m.toFixed(1)} W/kg)。面对急陡坡爆击或高强度拉扯突围时易进入急性缺氧力竭。`,
          actionAdvice: '推荐执行 Rønnestad 30/15s 微间歇或 4x4 min 高摄氧课表，快速提升左心室泵血输出与神经抗乳酸效率。'
        };
      }

      // 3. FTP / Sustained threshold cruise deficiency
      if (minScore === score20m) {
        const tmpl = WORKOUT_TEMPLATES.find(t => t.id === 'threshold_2x20') || WORKOUT_TEMPLATES[2];
        return {
          template: tmpl,
          deficiencyTitle: language === 'zh-TW' ? '乳酸閾值 (FTP) 續航持久力不足' : '乳酸阈值 (FTP) 续航持久力不足',
          deficiencyDesc: `本次骑行 20m 稳态功率或长坡表现相对滞后 (20m 推重比: ${m20m.toFixed(1)} W/kg)。乳酸拐点下的维持极限时间 (TTE) 存在短板。`,
          actionAdvice: '推荐执行 2x20 min 经典阈值巡航或 Over-Under 乳酸清除课表，铁壁锚定阈值输出，拓展名山长爬坡统治力。'
        };
      }

      // 4. Sprint peak power deficiency
      if (minScore === score5s) {
        const tmpl = WORKOUT_TEMPLATES.find(t => t.id === 'tabata_sprint') || WORKOUT_TEMPLATES[4];
        return {
          template: tmpl,
          deficiencyTitle: language === 'zh-TW' ? '神經肌肉瞬時衝刺爆發力不足' : '神经肌肉瞬时冲刺爆发力不足',
          deficiencyDesc: `本次骑行 5s 神经肌肉峰值功率相对偏低 (5s 冲刺: ${m5s.toFixed(1)} W/kg)。无氧电量快速放电与高速抢位超车能力待唤醒。`,
          actionAdvice: '推荐执行 Tabata 20/10s 极致冲刺课表，激活快肌纤维运动神经元放电与 ATP-CP 供能效率。'
        };
      }
    }

    // 5. Default/Balanced: Over-Under lactate clearing
    const tmpl = WORKOUT_TEMPLATES.find(t => t.id === 'over_under_lactate') || WORKOUT_TEMPLATES[3];
    return {
      template: tmpl,
      deficiencyTitle: language === 'zh-TW' ? '綜合能力均衡 · 進階抗乳酸突破' : '综合能力均衡 · 进阶抗乳酸突破',
      deficiencyDesc: '各项生理区间推重比表现均衡，无明显单项短板。适合进入乳酸穿梭与动态抗乳酸进阶期，直接推升巡航天花板。',
      actionAdvice: '推荐执行 Over-Under 乳酸清除间歇，在乳酸生成与有氧清除的交替波动中强化学科级乳酸再循环利用能力。'
    };
  }, [analysis, weightKg, language]);

  const handleDispatchSmartWorkout = (targetTemplate?: WorkoutTemplate) => {
    const tmpl = targetTemplate || (selectedSmartTemplateId ? WORKOUT_TEMPLATES.find(t => t.id === selectedSmartTemplateId) : smartWorkoutRecommendation?.template) || WORKOUT_TEMPLATES[0];
    const payload = {
      templateId: tmpl.id,
      title: `${tmpl.name} (针对本次骑行诊断)`,
      reason: smartWorkoutRecommendation?.deficiencyTitle || '骑行诊断补强',
      segments: JSON.parse(JSON.stringify(tmpl.segments))
    };
    try {
      localStorage.setItem('solorider_pending_workout', JSON.stringify(payload));
      showToast('🎯 已生成专属靶向补强课表，正在跳转工坊...', 'success');
      setSmartWorkoutModalOpen(false);
      if (onNavigateTool) {
        onNavigateTool('workout-builder');
      }
    } catch (e) {
      console.error('Failed to dispatch smart workout:', e);
      showToast('生成课表失败，请稍后再试', 'error');
    }
  };

  // MMP Curve Chart Data with Coggan Benchmarks
  const mmpChartData = useMemo(() => {
    if (!analysis) return { labels: [], datasets: [] };
    const labels = analysis.mmp.map(m => m.label);
    const isWkg = mmpUnit === 'wkg';

    const userDataset = {
      type: 'line' as const,
      label: isWkg ? '本次活动峰值 (W/kg)' : '本次活动峰值 (Watts)',
      data: analysis.mmp.map(m => isWkg ? m.wkg : m.watts),
      borderColor: '#8b5cf6',
      backgroundColor: 'rgba(139, 92, 246, 0.18)',
      fill: true,
      tension: 0.3,
      pointRadius: 4,
      pointBackgroundColor: '#8b5cf6',
      borderWidth: 2.5,
      order: 1
    };

    const benchmarkDatasets: any[] = [];
    const tiersToInclude = selectedCogganTier === 'all'
      ? COGGAN_BENCHMARKS
      : selectedCogganTier === 'none'
        ? []
        : COGGAN_BENCHMARKS.filter(b => b.level === selectedCogganTier);

    tiersToInclude.forEach(b => {
      benchmarkDatasets.push({
        type: 'line' as const,
        label: `${b.label} ${isWkg ? '(W/kg)' : '(W)'}`,
        data: analysis.mmp.map(m => {
          const wkgVal = getBenchmarkWkgForDuration(b, m.durationSec);
          return isWkg ? wkgVal : Math.round(wkgVal * weightKg);
        }),
        borderColor: b.color,
        borderDash: [5, 4],
        backgroundColor: 'transparent',
        fill: false,
        tension: 0.25,
        pointRadius: 0,
        borderWidth: 1.5,
        order: 2
      });
    });

    return {
      labels,
      datasets: [userDataset, ...benchmarkDatasets]
    };
  }, [analysis, mmpUnit, selectedCogganTier, weightKg]);

  // Skiba W' Balance Chart Data
  const wPrimeChartData = useMemo(() => {
    if (!wPrimeResult || !wPrimeResult.dataPoints || wPrimeResult.dataPoints.length === 0) {
      return { labels: [], datasets: [] };
    }
    const labels = wPrimeResult.dataPoints.map(p => formatDuration(p.timeSec));
    const wBalData = wPrimeResult.dataPoints.map(p => p.wBalPercent);
    const powerData = wPrimeResult.dataPoints.map(p => p.power);

    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label: "W' 无氧剩余电量 (%)",
          data: wBalData,
          yAxisID: 'yWBal',
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.2,
          pointRadius: 0,
          borderWidth: 2,
          order: 1
        },
        {
          type: 'line' as const,
          label: '实时输出功率 (W)',
          data: powerData,
          yAxisID: 'yPower',
          borderColor: 'rgba(59, 130, 246, 0.4)',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.1,
          pointRadius: 0,
          borderWidth: 1,
          order: 2
        }
      ]
    };
  }, [wPrimeResult]);

  // Coaching Insights Computation
  const coachingNotes = useMemo(() => {
    if (!analysis) return [];
    const notes: { type: 'success' | 'warning' | 'info'; title: string; desc: string }[] = [];

    // IF insight
    if (analysis.intensityFactor < 0.75) {
      notes.push({
        type: 'info',
        title: '恢复与基础耐力骑行 (L2为主)',
        desc: `本次骑行强度系数 IF 为 ${analysis.intensityFactor}，属于标准的有氧低压耐力骑行，促进线粒体增生且对肌肉神经系统破坏小。`
      });
    } else if (analysis.intensityFactor <= 0.90) {
      notes.push({
        type: 'success',
        title: '高效节奏与甜点训练 (Tempo / SweetSpot)',
        desc: `本次骑行强度系数 IF 为 ${analysis.intensityFactor}，训练刺激充分，是提升巡航能力与推重比的黄金区间。`
      });
    } else {
      notes.push({
        type: 'warning',
        title: '高负荷竞赛 / 极限抗乳酸骑行',
        desc: `本次骑行强度系数达到 ${analysis.intensityFactor}，接近或超越比赛工况，糖原消耗剧烈，建议 36-48 小时内以恢复骑或休息为主。`
      });
    }

    // VI insight
    if (analysis.variabilityIndex > 1.20) {
      notes.push({
        type: 'info',
        title: '高波动性输出 (VI > 1.20)',
        desc: `变化指数 VI 达 ${analysis.variabilityIndex}，说明存在大量突围、陡坡踩踏与下坡滑行，属于典型的起伏赛道或绕圈进攻战术。`
      });
    } else if (analysis.variabilityIndex <= 1.06) {
      notes.push({
        type: 'success',
        title: '极平稳巡航配速 (VI ≤ 1.06)',
        desc: `变化指数 VI 仅为 ${analysis.variabilityIndex}，动力输出平稳如钟摆，堪称计时赛（TT）教科书般的配速掌控。`
      });
    }

    // Decoupling insight
    if (analysis.aerobicDecoupling !== undefined) {
      if (Math.abs(analysis.aerobicDecoupling) <= 5.0) {
        notes.push({
          type: 'success',
          title: '极佳有氧耐力稳定性 (心率漂移 < 5%)',
          desc: `有氧解耦率仅为 ${analysis.aerobicDecoupling}%，后半段同等功率下心率几乎未发生代偿性漂移，说明有氧底子扎实、脱水控制极佳。`
        });
      } else {
        notes.push({
          type: 'warning',
          title: '后半程存在显著心率漂移 (Pw:HR > 5%)',
          desc: `后半程有氧解耦率达到 ${analysis.aerobicDecoupling}%，相同瓦数下心率显著爬升，可能由长距离疲劳、环境高温或电解质水化不足引起。`
        });
      }
    }

    return notes;
  }, [analysis, language]);

  // Social Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const handleGeneratePoster = () => {
    if (!analysis) {
      showToast('请先加载或上传码表记录文件', 'warning');
      return;
    }
    try {
      const startDate = analysis.points?.[0]?.timestamp ? new Date(analysis.points[0].timestamp).toLocaleDateString() : new Date().toLocaleDateString();
      const url = generateFitActivityPoster({
        activityName: analysis.fileName?.replace(/\.[^/.]+$/, '') || '骑行活动深度复盘',
        dateStr: startDate,
        distanceKm: analysis.totalDistanceKm,
        durationStr: formatDuration(analysis.movingTimeSec),
        normalizedPower: analysis.normalizedPower,
        avgPower: analysis.avgPower,
        intensityFactor: analysis.intensityFactor,
        tss: analysis.tss,
        elevationGainM: analysis.elevationGainM,
        maxWatts: analysis.maxPower || 0,
        avgHeartRate: analysis.avgHeartRate || 0,
        calories: analysis.caloriesKcal || analysis.workKj || 0,
        powerZones: analysis.timeInPowerZones
      });
      setSharePosterUrl(url);
      setIsShareModalOpen(true);
    } catch (e) {
      showToast('海报生成失败，请重试', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <IOSCard variant="glass" padding="none" className="p-6 sm:p-7 relative overflow-hidden shadow-ios-sm isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-red/15" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-red/10 border border-ios-red/20 text-ios-red text-xs font-semibold">
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{'数据复盘与运动生理学'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {'码表活动与 FIT 航迹深度解析器'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl leading-relaxed">
              {'纯前端离线直接解析 Garmin/Wahoo/迈金/行者/iGPSPORT 等码表生成的 .fit / .gpx / .tcx 活动文件。精准计算加权标准化功率 (NP)、强度系数 (IF)、训练压力 (TSS)、变化指数 (VI)、效率因子 (EF)、有氧解耦率及 Coggan 7 区时间驻留分布，数据绝不上云。'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              onClick={handleGeneratePoster}
              className="apple-touch h-9 px-3.5 sm:px-4 rounded-2xl bg-ios-red hover:bg-ios-red/90 text-white font-semibold text-xs shadow-ios-sm transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
              title="生成码表活动深度复盘长图海报"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{language === 'zh-TW' ? '生成復盤海報' : '生成复盘海报'}</span>
            </button>
            <button
              onClick={() => window.print()}
              className="apple-touch h-9 px-3.5 sm:px-4 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200/80 dark:border-white/10 shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Printer className="w-3.5 h-3.5 text-ios-red" />
              <span>{language === 'zh-TW' ? '列印報告' : '打印报告'}</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="apple-touch h-9 px-3.5 sm:px-4 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200/80 dark:border-white/10 shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-3.5 h-3.5 text-ios-red" />
              <span>{language === 'zh-TW' ? '載入樣本' : '加载样本'}</span>
            </button>
          </div>
        </div>
      </IOSCard>

      {/* File Upload Zone & Rider Anchor Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone & Strava Quick Load Bar */}
        <div className="lg:col-span-2 space-y-3">
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            className="ios-card p-6 sm:p-7 rounded-3xl border-2 border-dashed border-slate-300/80 dark:border-white/20 hover:border-ios-blue dark:hover:border-ios-blue transition flex flex-col items-center justify-center text-center group cursor-pointer relative shadow-ios-card"
          >
            <input
              type="file"
              accept=".fit,.gpx,.tcx"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />

            <div className="w-12 h-12 rounded-2xl bg-ios-blue/10 border border-ios-blue/20 text-ios-blue flex items-center justify-center mb-3 group-hover:scale-105 transition apple-touch">
              <Upload className="w-5 h-5" />
            </div>

            <div className="font-bold text-sm text-slate-800 dark:text-white">
              {'点击选择或拖拽码表文件至此 (.fit / .gpx / .tcx)'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {'全面兼容佳明 Garmin、Wahoo、迈金、行者、iGPSPORT、百锐腾等各大主流品牌'}
            </div>

            {analysis && (
              <div className="mt-3 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-mono">
                <CheckCircle2 className="w-3.5 h-3.5 text-ios-green" />
                <span className="font-semibold">{analysis.fileName}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-ios-blue text-white uppercase font-bold">{analysis.fileType}</span>
              </div>
            )}
          </div>

          {/* Strava Quick Select Bar (when connected) */}
          {isStravaConnected && stravaActivities.length > 0 && (
            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.05] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-[#FC4C02]/15 text-[#FC4C02] flex items-center justify-center shrink-0">
                  <Cloud className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  从 Strava 快速选择骑行深度复盘:
                </span>
                <PoweredByStravaBadge />
              </div>

              <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                <select
                  value={selectedStravaActivityId}
                  onChange={(e) => handleLoadStravaActivity(e.target.value)}
                  className="flex-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1.5 focus:ring-[#FC4C02]"
                >
                  <option value="">-- 选择近期 Strava 骑行 (共 {stravaActivities.length} 条) --</option>
                  {stravaActivities.slice(0, 30).map((act) => (
                    <option key={act.id} value={String(act.id)}>
                      {new Date(act.start_date_local || act.start_date).toLocaleDateString()} • {act.name} ({(act.distance / 1000).toFixed(0)}km | {act.tss || 0} TSS)
                    </option>
                  ))}
                </select>

                <button
                  type="button"
                  onClick={() => syncStravaActivities(false)}
                  disabled={isStravaSyncing}
                  className="apple-touch px-2.5 py-1.5 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] text-slate-600 dark:text-slate-300 text-xs shrink-0 flex items-center gap-1 transition"
                  title="刷新 Strava 活动"
                >
                  <RefreshCw className={`w-3 h-3 ${isStravaSyncing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Dynamic Rider Physiological Anchor Card */}
        <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-ios-blue" />
              {'车手基准生理参数'}
            </span>
            <span className="text-[10px] text-slate-400">{'用于推算 IF/TSS'}</span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="text-[10px] text-slate-500 block mb-1">FTP (W)</label>
              <NumberStepper
                value={ftpWatts}
                onChange={setFtpWatts}
                min={50}
                max={600}
                step={5}
                unit="W"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">
                {'体重 (kg)'}
              </label>
              <NumberStepper
                value={weightKg}
                onChange={setWeightKg}
                min={30}
                max={160}
                step={0.5}
                unit="kg"
                decimals={1}
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 block mb-1">
                {'最大心率'}
              </label>
              <NumberStepper
                value={maxHr}
                onChange={setMaxHr}
                min={120}
                max={240}
                step={1}
                unit="bpm"
              />
            </div>
          </div>

          <button
            onClick={handleProfileRecompute}
            className="w-full py-2 rounded-2xl bg-slate-100/80 dark:bg-white/10 hover:bg-ios-blue/10 hover:text-ios-blue text-slate-700 dark:text-slate-300 text-xs font-semibold transition apple-touch flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '更新分析' : '更新分析'}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <IOSMetricTile
              label="标准化功率 NP"
              value={analysis.normalizedPower}
              unit="W"
              subtext={`${(analysis.normalizedPower / (weightKg || 68)).toFixed(2)} W/kg · 均功率 ${analysis.avgPower}W`}
              theme="blue"
              icon={<Zap className="w-4 h-4 text-ios-blue" />}
            />
            <IOSMetricTile
              label="强度系数 IF"
              value={analysis.intensityFactor}
              subtext={`${Math.round(analysis.intensityFactor * 100)}% FTP负荷`}
              theme="amber"
              icon={<Flame className="w-4 h-4 text-ios-orange" />}
            />
            <IOSMetricTile
              label="训练压力 TSS"
              value={analysis.tss}
              subtext={analysis.tss < 150 ? '低度疲劳' : analysis.tss < 300 ? '中度疲劳' : '重度负荷'}
              theme="purple"
              icon={<Award className="w-4 h-4 text-ios-purple" />}
            />
            <IOSMetricTile
              label="变化指数 VI"
              value={analysis.variabilityIndex}
              subtext={analysis.variabilityIndex <= 1.05 ? 'TT Steady' : analysis.variabilityIndex <= 1.15 ? 'Rolling Hills' : 'Punchy Attack'}
              theme="blue"
              icon={<TrendingUp className="w-4 h-4 text-ios-blue" />}
            />
            <IOSMetricTile
              label="里程与净骑行"
              value={analysis.totalDistanceKm}
              unit="km"
              subtext={`${formatDuration(analysis.movingTimeSec)} (${analysis.avgSpeedKmh} km/h)`}
              theme="green"
              icon={<Timer className="w-4 h-4 text-ios-green" />}
            />
            <IOSMetricTile
              label="累计爬升与做功"
              value={`+${analysis.elevationGainM}`}
              unit="m"
              subtext={`${analysis.workKj} kJ (${analysis.caloriesKcal} kcal)`}
              theme="mint"
              icon={<Mountain className="w-4 h-4 text-ios-mint" />}
            />
          </div>

          {/* Secondary Biological & Efficiency Strip */}
          <div className="ios-card px-5 py-3.5 rounded-2xl border border-slate-200/80 dark:border-white/10 shadow-xs flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-ios-red" />
                <span>{'平均心率'}: <strong className="text-slate-900 dark:text-white">{analysis.avgHeartRate ?? '--'} bpm</strong></span>
                <span className="text-slate-400 text-[10px]">({'最高'} {analysis.maxHeartRate ?? '--'})</span>
              </span>

              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-ios-orange" />
                <span>{'平均踏频'}: <strong className="text-slate-900 dark:text-white">{analysis.avgCadence ?? '--'} rpm</strong></span>
                <span className="text-slate-400 text-[10px]">
                  ({'踩踏'} {analysis.pedalingPercent ?? 100}% · {'滑行'} {100 - (analysis.pedalingPercent ?? 100)}%)
                </span>
              </span>

              {analysis.efficiencyFactor && (
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-ios-blue" />
                  <span>{'效率因子 (EF)'}: <strong className="text-ios-blue">{analysis.efficiencyFactor} W/bpm</strong></span>
                </span>
              )}

              {analysis.aerobicDecoupling !== undefined && (
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-ios-purple" />
                  <span>{'有氧解耦率 (Pw:HR)'}: <strong className={analysis.aerobicDecoupling > 5 ? 'text-ios-orange' : 'text-ios-green'}>{analysis.aerobicDecoupling}%</strong></span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {'总历时'}: {formatDuration(analysis.totalDurationSec)} · {analysis.points.length} {'个秒级采样点'}
            </div>
          </div>

          {/* Interactive Tabbed Navigation & Poster Action */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="w-full sm:max-w-md">
              <IOSSegmentedControl
                options={[
                  { value: 'trends', label: language === 'zh-TW' ? '時序趨勢' : '时序趋势' },
                  { value: 'zones', label: language === 'zh-TW' ? '區間駐留' : '区间驻留' },
                  { value: 'mmp', label: language === 'zh-TW' ? 'MMP 曲線' : 'MMP 曲线' },
                  { value: 'pmc', label: language === 'zh-TW' ? 'PMC 負荷' : 'PMC 负荷' },
                  { value: 'coaching', label: language === 'zh-TW' ? '生理診斷' : '生理诊断' }
                ]}
                value={activeTab}
                onChange={(v) => setActiveTab(v as any)}
              />
            </div>
            <button
              onClick={handleGeneratePoster}
              className="apple-touch px-4 py-2.5 rounded-2xl bg-gradient-to-r from-ios-red to-orange-500 hover:opacity-95 text-white font-semibold text-xs shadow-ios-sm flex items-center justify-center gap-1.5 transition shrink-0"
              title="生成码表活动深度复盘长图海报"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>📸 {language === 'zh-TW' ? '生成深度復盤長圖' : '生成深度复盘长图'}</span>
            </button>
          </div>

          {/* TAB 1: Time-Series Trends */}
          {activeTab === 'trends' && (
            <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-850 dark:text-white">
                  {'多轨遥测曲线 (时间轴：分:秒)'}
                </div>

                {/* Channel Visibility Switches */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <button
                    onClick={() => setShowPower(!showPower)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium apple-touch transition ${
                      showPower ? 'bg-ios-blue text-white shadow-ios-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{language === 'zh-TW' ? '功率' : '功率'}</span>
                  </button>

                  <button
                    onClick={() => setShowHeartRate(!showHeartRate)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium apple-touch transition ${
                      showHeartRate ? 'bg-ios-red text-white shadow-ios-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Heart className="w-3 h-3" />
                    <span>{language === 'zh-TW' ? '心率' : '心率'}</span>
                  </button>

                  <button
                    onClick={() => setShowElevation(!showElevation)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium apple-touch transition ${
                      showElevation ? 'bg-ios-mint text-white shadow-ios-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Mountain className="w-3 h-3" />
                    <span>{language === 'zh-TW' ? '海拔' : '海拔'}</span>
                  </button>

                  <button
                    onClick={() => setShowSpeed(!showSpeed)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium apple-touch transition ${
                      showSpeed ? 'bg-ios-blue text-white shadow-ios-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <Gauge className="w-3 h-3" />
                    <span>{language === 'zh-TW' ? '速度' : '速度'}</span>
                  </button>

                  <button
                    onClick={() => setShowCadence(!showCadence)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium apple-touch transition ${
                      showCadence ? 'bg-ios-orange text-white shadow-ios-sm' : 'bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>{language === 'zh-TW' ? '踏頻' : '踏频'}</span>
                  </button>
                </div>
              </div>

              <div className="h-72 sm:h-96 w-full">
                <Line data={trendChartData} options={trendChartOptions} />
              </div>
            </div>
          )}

          {/* TAB 2: Time in Zones */}
          {activeTab === 'zones' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Coggan 7-Zone Power Distribution */}
              <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Zap className="w-4 h-4 text-ios-blue" />
                    {'Coggan 功率 7 区分布'}
                  </span>
                  <span className="text-xs text-slate-400">FTP: {ftpWatts}W</span>
                </div>

                <div className="h-56">
                  <Bar
                    data={powerZoneBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { font: { size: 9 }, color: '#AEAEB2' } },
                        y: { ticks: { font: { size: 10 }, color: '#8E8E93' } }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {analysis.timeInPowerZones.map((z) => (
                    <div key={z.zone} className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></span>
                        <strong className="text-slate-800 dark:text-white">{z.zone} {z.label}</strong>
                        <span className="text-slate-400 text-[10px]">({z.range})</span>
                      </div>
                      <div className="font-mono flex items-center gap-3">
                        <span className="text-slate-500">{formatDuration(z.seconds)}</span>
                        <span className="font-bold text-slate-900 dark:text-white min-w-[40px] text-right">{z.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heart Rate 5-Zone Distribution */}
              <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-ios-red" />
                    {'心率 5 区分布'}
                  </span>
                  <span className="text-xs text-slate-400">{'最大心率'}: {maxHr}bpm</span>
                </div>

                <div className="h-56">
                  <Bar
                    data={hrZoneBarData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: { legend: { display: false } },
                      scales: {
                        x: { ticks: { font: { size: 9 }, color: '#AEAEB2' } },
                        y: { ticks: { font: { size: 10 }, color: '#8E8E93' } }
                      }
                    }}
                  />
                </div>

                <div className="space-y-2">
                  {analysis.timeInHrZones.map((z) => (
                    <div key={z.zone} className="flex items-center justify-between text-xs py-2 px-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/50 dark:border-white/5">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></span>
                        <strong className="text-slate-800 dark:text-white">{z.zone} {z.label}</strong>
                        <span className="text-slate-400 text-[10px]">({z.range})</span>
                      </div>
                      <div className="font-mono flex items-center gap-3">
                        <span className="text-slate-500">{formatDuration(z.seconds)}</span>
                        <span className="font-bold text-slate-900 dark:text-white min-w-[40px] text-right">{z.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MMP Power Curve & Skiba W' Balance */}
          {activeTab === 'mmp' && (
            <div className="space-y-6">
              {/* Sub-view switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="max-w-xs">
                  <IOSSegmentedControl
                    options={[
                      { value: 'mmp_curve', label: language === 'zh-TW' ? 'MMP 峰值與天梯' : 'MMP 峰值与天梯' },
                      { value: 'w_balance', label: language === 'zh-TW' ? "W' Balance 耗竭模型" : "W' Balance 耗竭模型" }
                    ]}
                    value={mmpSubView}
                    onChange={(v) => setMmpSubView(v as any)}
                  />
                </div>

                {mmpSubView === 'mmp_curve' && (
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    {/* Unit Switcher */}
                    <div className="flex items-center bg-slate-100 dark:bg-white/10 p-0.5 rounded-xl border border-slate-200/80 dark:border-white/10">
                      <button
                        type="button"
                        onClick={() => setMmpUnit('wkg')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition apple-touch ${
                          mmpUnit === 'wkg' ? 'bg-white dark:bg-[#2C2C2E] text-ios-purple shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        W/kg (推重比)
                      </button>
                      <button
                        type="button"
                        onClick={() => setMmpUnit('watts')}
                        className={`px-2.5 py-1 rounded-lg font-medium transition apple-touch ${
                          mmpUnit === 'watts' ? 'bg-white dark:bg-[#2C2C2E] text-ios-purple shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        Watts (瓦特)
                      </button>
                    </div>

                    {/* Coggan Benchmark Tier Selector */}
                    <select
                      value={selectedCogganTier}
                      onChange={(e) => setSelectedCogganTier(e.target.value)}
                      className="bg-white dark:bg-[#1C1C1E] border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:border-ios-purple"
                    >
                      <option value="all">Coggan 全等级天梯标尺</option>
                      <option value="world_tour">WorldTour (世巡职业)</option>
                      <option value="cat1">Cat 1 (国家级精英)</option>
                      <option value="cat2">Cat 2 (省级健将)</option>
                      <option value="cat3">Cat 3 (俱乐部高阶)</option>
                      <option value="cat4">Cat 4 (进阶骑手)</option>
                      <option value="cat5">Cat 5 / Untrained (业余入门)</option>
                      <option value="none">隐藏天梯对比线</option>
                    </select>
                  </div>
                )}
              </div>

              {/* VIEW 1: Continuous MMP Curve & Coggan Benchmarks */}
              {mmpSubView === 'mmp_curve' && (
                <div className="space-y-6">
                  {/* Rider Phenotype Card */}
                  {riderPhenotype && (
                    <div className="ios-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card relative overflow-hidden">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                              {language === 'zh-TW' ? '車手表型畫像診斷' : '车手表型画像诊断'}
                            </span>
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${riderPhenotype.badgeColor}`}>
                              {riderPhenotype.title}
                            </span>
                          </div>
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
                            {riderPhenotype.description}
                          </p>
                          <p className="text-[11px] text-slate-400 dark:text-slate-500">
                            💡 训练建议：{riderPhenotype.trainingFocus}
                          </p>
                        </div>

                        {onNavigateTool && (
                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                if (smartWorkoutRecommendation) {
                                  setSelectedSmartTemplateId(smartWorkoutRecommendation.template.id);
                                }
                                setSmartWorkoutModalOpen(true);
                              }}
                              className="apple-touch inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-2xl bg-gradient-to-r from-ios-purple to-ios-blue hover:opacity-95 text-white text-xs font-bold transition shadow-ios-sm active:scale-95"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                              <span>智能生成靶向补强课表</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => onNavigateTool('workout-builder')}
                              className="apple-touch p-2 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/15 text-slate-600 dark:text-slate-300 text-xs font-semibold transition"
                              title="直接打开训练工坊"
                            >
                              <Dumbbell className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* MMP Chart */}
                  <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {'最佳平均峰值功率 (MMP) 曲线与天梯标尺'}
                        </h3>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {'车手在各个标准时段内所维持的最高平均输出（瓦特与推重比对比 Coggan 世界标准）'}
                        </p>
                      </div>
                    </div>

                    <div className="h-72 sm:h-84">
                      <Line
                        data={mmpChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top' as const,
                              labels: { font: { size: 10 }, boxWidth: 12, color: '#94a3b8' }
                            }
                          },
                          scales: {
                            x: { ticks: { font: { size: 10 }, color: '#AEAEB2' } },
                            y: {
                              ticks: { font: { size: 10 }, color: '#8E8E93' },
                              title: {
                                display: true,
                                text: mmpUnit === 'wkg' ? 'W/kg (推重比)' : 'Watts (瓦特)',
                                color: '#AF52DE',
                                font: { size: 11 }
                              }
                            }
                          }
                        }}
                      />
                    </div>

                    {/* MMP Grid Table */}
                    <div className="pt-2">
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2.5">
                        全时域秒级阶梯最佳峰值数据表 (High-Resolution MMP Matrix)
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                        {analysis.mmp.map((m) => (
                          <div key={m.label} className="p-2.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center space-y-0.5">
                            <div className="text-[11px] font-bold text-ios-purple uppercase">{m.label}</div>
                            <div className="text-base font-extrabold text-slate-900 dark:text-white">{m.watts} W</div>
                            <div className="text-[10px] text-slate-500">{m.wkg} W/kg</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: Skiba W' Balance Anaerobic Battery Exhaustion Model */}
              {mmpSubView === 'w_balance' && wPrimeResult && (
                <div className="space-y-6">
                  {/* Parameter Tuning Bar */}
                  <div className="ios-card p-5 sm:p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <Battery className="w-4 h-4 text-ios-green" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            Skiba (2012) W' Balance 无氧电量动力学模型
                          </h3>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          模拟无氧电池在 CP (临界功率) 以上踩踏时的放电耗竭与低于 CP 时的动态指数重充
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">临界功率 CP:</span>
                          <NumberStepper
                            value={cpWatts}
                            onChange={setCpWatts}
                            min={100}
                            max={500}
                            step={5}
                            unit="W"
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-slate-500">无氧容量 W' max:</span>
                          <NumberStepper
                            value={wPrimeKj}
                            onChange={setWPrimeKj}
                            min={5}
                            max={40}
                            step={1}
                            unit="kJ"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Metric Tiles */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-1">
                        <div className="text-[11px] text-slate-400 font-medium">最低剩余无氧电量</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white flex items-baseline gap-1.5">
                          <span>{wPrimeResult.minWPrimePercent}%</span>
                          <span className="text-xs font-normal text-slate-500">({(wPrimeResult.minWPrimeJoules / 1000).toFixed(1)} kJ)</span>
                        </div>
                        <div className="text-[10px]">
                          {wPrimeResult.minWPrimePercent <= 10 ? (
                            <span className="text-ios-red font-bold">⚠️ 濒临爆缸临界</span>
                          ) : wPrimeResult.minWPrimePercent <= 30 ? (
                            <span className="text-ios-orange font-bold">⚡ 深度无氧亏损</span>
                          ) : (
                            <span className="text-ios-green font-bold">✓ 电量充裕安全</span>
                          )}
                        </div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-1">
                        <div className="text-[11px] text-slate-400 font-medium">电量最低点时刻</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {formatDuration(wPrimeResult.minPointSec)}
                        </div>
                        <div className="text-[10px] text-slate-400">本次骑行最艰苦攻坚点</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-1">
                        <div className="text-[11px] text-slate-400 font-medium">深红放电次数 (&lt;30%)</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {wPrimeResult.matchesBurned} <span className="text-xs font-normal text-slate-500">次火柴</span>
                        </div>
                        <div className="text-[10px] text-slate-400">燃烧极限火柴次数</div>
                      </div>

                      <div className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-1">
                        <div className="text-[11px] text-slate-400 font-medium">超阈值做功 (Work &gt; CP)</div>
                        <div className="text-lg font-extrabold text-slate-900 dark:text-white">
                          {wPrimeResult.workAboveCpKj} <span className="text-xs font-normal text-slate-500">kJ</span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          历时 {formatDuration(wPrimeResult.timeAboveCpSec)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* W' Balance Dynamic Time-Series Chart */}
                  <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-bold text-slate-850 dark:text-white">
                        {"W' Balance 电量耗竭波形 (绿色) 与实时功率 (蓝色) 对照"}
                      </div>
                      <span className="text-[11px] text-slate-400">
                        CP 临界基准: {cpWatts} W · W' max: {wPrimeKj} kJ
                      </span>
                    </div>

                    <div className="h-72 sm:h-84">
                      <Line
                        data={wPrimeChartData}
                        options={{
                          responsive: true,
                          maintainAspectRatio: false,
                          interaction: { mode: 'index', intersect: false },
                          plugins: {
                            legend: {
                              display: true,
                              position: 'top' as const,
                              labels: { font: { size: 10 }, boxWidth: 12, color: '#94a3b8' }
                            }
                          },
                          scales: {
                            x: { ticks: { font: { size: 10 }, color: '#94a3b8' } },
                            yWBal: {
                              type: 'linear' as const,
                              position: 'left' as const,
                              min: 0,
                              max: 100,
                              ticks: { font: { size: 10 }, color: '#10b981', callback: (v) => `${v}%` },
                              title: { display: true, text: "W' 剩余百分比 (%)", color: '#10b981', font: { size: 10 } }
                            },
                            yPower: {
                              type: 'linear' as const,
                              position: 'right' as const,
                              grid: { display: false },
                              ticks: { font: { size: 10 }, color: '#3b82f6', callback: (v) => `${v}W` },
                              title: { display: true, text: '功率 (W)', color: '#3b82f6', font: { size: 10 } }
                            }
                          }
                        }}
                      />
                    </div>

                    {/* Scientific Explanation Banner */}
                    <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div className="flex items-start gap-2.5">
                        <Info className="w-4 h-4 text-ios-blue shrink-0 mt-0.5" />
                        <div className="space-y-0.5 text-slate-600 dark:text-slate-300 leading-relaxed">
                          <p>
                            <strong>科学原理</strong>：当输出功率高于临界功率 (CP) 时，身体主要依靠无氧糖酵解供能，迅速消耗 W' 储备；当功率降回 CP 以下时，机体利用有氧代谢乳酸穿梭逐步重充电量。若 W' 降至 0%，将引发急性力竭（爆缸）。
                          </p>
                        </div>
                      </div>

                      {onNavigateTool && (
                        <button
                          type="button"
                          onClick={() => onNavigateTool('workout-builder')}
                          className="apple-touch self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-ios-blue/10 hover:bg-ios-blue/20 text-ios-blue font-bold text-xs border border-ios-blue/20 transition shadow-2xs"
                        >
                          <Dumbbell className="w-3.5 h-3.5" />
                          <span>去课表工坊强化无氧池</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PMC (Performance Management Chart) */}
          {activeTab === 'pmc' && (
            <div className="space-y-6">
              {/* PMC Overview Card */}
              <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-5">
                {/* Strava Live Sync Banner if Connected */}
                {isStravaConnected && (
                  <div className="p-3.5 rounded-2xl bg-[#FC4C02]/10 border border-[#FC4C02]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-xl bg-[#FC4C02] text-white flex items-center justify-center shrink-0 shadow-xs font-bold">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 dark:text-white block truncate">
                          Strava 云端真实训练负荷时序已激活
                        </span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                          已自动汇入 {stravaActivities.length} 次真实骑行 TSS 驱动 42天 CTL/ATL/TSB 曲线
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => syncStravaActivities(false)}
                      disabled={isStravaSyncing}
                      className="apple-touch self-start sm:self-auto px-3 py-1.5 rounded-xl bg-white dark:bg-[#1C1C1E] hover:bg-slate-50 dark:hover:bg-white/10 text-[#FC4C02] font-semibold text-xs border border-[#FC4C02]/30 shrink-0 flex items-center gap-1.5 transition shadow-2xs disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isStravaSyncing ? 'animate-spin' : ''}`} />
                      <span>{isStravaSyncing ? '同步中...' : '同步最新'}</span>
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-ios-blue" />
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                        {language === 'zh-TW'
                          ? 'PMC 運動表現管理模型 (CTL / ATL / TSB)'
                          : 'PMC 运动表现管理模型 (CTL / ATL / TSB)'}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-ios-blue/10 text-ios-blue border border-ios-blue/20">
                        Bannister EWMA
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      {language === 'zh-TW'
                        ? '長周期體能積累 (CTL 42天)、急性疲勞 (ATL 7天) 與比賽競技狀態 (TSB) 動態時序監測。'
                        : '长周期体能积累 (CTL 42天)、急性疲劳 (ATL 7天) 与比赛竞技状态 (TSB) 动态时序监测。'}
                    </p>
                  </div>

                  {/* Baseline Fitness & Mesocycle Switchers */}
                  <div className="flex flex-col xl:flex-row items-start xl:items-center gap-2.5">
                    <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 overflow-x-auto max-w-full">
                      <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-2 shrink-0">
                        体能起点:
                      </span>
                      {(['rec', 'club', 'elite', 'pro'] as BaselineFitnessLevel[]).map((level) => (
                        <button
                          key={level}
                          onClick={() => setBaselineFitness(level)}
                          className={`apple-touch px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                            baselineFitness === level
                              ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                          }`}
                          title={BASELINE_FITNESS_OPTIONS[level].desc}
                        >
                          {BASELINE_FITNESS_OPTIONS[level].label.split(' ')[0]} ({BASELINE_FITNESS_OPTIONS[level].ctl})
                        </button>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                      <button
                        onClick={() => setPmcMesocycle('base')}
                        className={`apple-touch px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          pmcMesocycle === 'base'
                            ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        基础期 (60天)
                      </button>
                      <button
                        onClick={() => setPmcMesocycle('build')}
                        className={`apple-touch px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          pmcMesocycle === 'build'
                            ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        强化期 (45天)
                      </button>
                      <button
                        onClick={() => setPmcMesocycle('taper')}
                        className={`apple-touch px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          pmcMesocycle === 'taper'
                            ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        减量备战 (28天)
                      </button>
                      <button
                        onClick={() => setPmcMesocycle('grand_tour')}
                        className={`apple-touch px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                          pmcMesocycle === 'grand_tour'
                            ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        多日赛重负荷 (21天)
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4 Core Current Numbers */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-center">
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400 block">
                      当前 CTL (长期体能)
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-blue-600 dark:text-blue-400 block my-1">
                      {latestPmcDay ? latestPmcDay.ctl : '--'}
                    </span>
                    <span className="text-[10px] text-slate-400">42 天衰减滚动均线</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <span className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 block">
                      当前 ATL (急性疲劳)
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-rose-600 dark:text-rose-400 block my-1">
                      {latestPmcDay ? latestPmcDay.atl : '--'}
                    </span>
                    <span className="text-[10px] text-slate-400">7 天短期负荷均线</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 block">
                      当前 TSB (竞技状态)
                    </span>
                    <span
                      className="text-2xl sm:text-3xl font-black font-mono block my-1"
                      style={{ color: currentTsbZone.color }}
                    >
                      {latestPmcDay ? (latestPmcDay.tsb > 0 ? `+${latestPmcDay.tsb}` : latestPmcDay.tsb) : '--'}
                    </span>
                    <span className="text-[10px] text-slate-400">CTL - ATL 差值</span>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-center">
                    <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 block">
                      本次骑行载入 TSS
                    </span>
                    <span className="text-2xl sm:text-3xl font-black font-mono text-slate-900 dark:text-white block my-1">
                      {analysis.tss}
                    </span>
                    <span className="text-[10px] text-emerald-500 font-medium">已合并进末日时间轴</span>
                  </div>
                </div>

                {/* Triple-Curve Line Chart */}
                <div className="h-80 w-full pt-2">
                  <Line
                    data={pmcChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false
                      },
                      scales: {
                        x: {
                          grid: { color: 'rgba(150, 150, 150, 0.08)' },
                          ticks: { color: '#94a3b8', font: { size: 10 } }
                        },
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          grid: { color: 'rgba(150, 150, 150, 0.08)' },
                          ticks: { color: '#AEAEB2', font: { size: 10 } },
                          title: { display: true, text: 'CTL / ATL (负荷点)', color: '#8E8E93', font: { size: 11 } }
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          grid: { drawOnChartArea: false },
                          ticks: { color: '#10b981', font: { size: 10 } },
                          title: { display: true, text: 'TSB (竞技状态)', color: '#10b981', font: { size: 11 } }
                        }
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                          labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 14 }
                        },
                        tooltip: {
                          backgroundColor: 'rgba(15, 23, 42, 0.9)',
                          borderColor: 'rgba(56, 189, 248, 0.3)',
                          borderWidth: 1
                        }
                      }
                    }}
                  />
                </div>
              </div>

              {/* Race Day Peak Predictor & Coach Diagnostic */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left: TSB Status Diagnostic */}
                <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      当前机体竞技状态判定
                    </span>
                    <span
                      className="px-2.5 py-0.5 rounded-full text-xs font-bold font-mono"
                      style={{ backgroundColor: `${currentTsbZone.color}20`, color: currentTsbZone.color }}
                    >
                      {language === 'zh-TW' ? currentTsbZone.labelTw : currentTsbZone.label}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed p-3.5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    {language === 'zh-TW' ? currentTsbZone.adviceTw : currentTsbZone.advice}
                  </p>

                  {/* 5 TSB Reference Zones */}
                  <div className="space-y-1.5 pt-2">
                    <div className="text-[11px] font-bold text-slate-500">TSB 黄金区间速查：</div>
                    <div className="grid grid-cols-5 gap-1 text-[9px] text-center font-mono font-bold">
                      <div className="p-1 rounded-lg bg-red-500/10 text-red-500" title="过度透支">&lt; -30 透支</div>
                      <div className="p-1 rounded-lg bg-blue-500/10 text-blue-500" title="强化提升">-30~-10 增能</div>
                      <div className="p-1 rounded-lg bg-emerald-500/10 text-emerald-500" title="维持">-10~+5 维持</div>
                      <div className="p-1 rounded-lg bg-amber-500/10 text-amber-500" title="巅峰状态">+5~+25 巅峰</div>
                      <div className="p-1 rounded-lg bg-slate-500/10 text-slate-500" title="衰退">&gt; +25 衰退</div>
                    </div>
                  </div>
                </div>

                {/* Right: Target Race Peak Predictor */}
                <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-amber-500" />
                      目标赛事巅峰状态倒计时预测
                    </span>
                    <span className="text-xs font-mono font-bold text-amber-500">
                      目标 TSB: +{targetTsbForPeak}
                    </span>
                  </div>

                  <div>
                    <input
                      type="range"
                      min={5}
                      max={25}
                      value={targetTsbForPeak}
                      onChange={(e) => setTargetTsbForPeak(parseInt(e.target.value))}
                      className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-amber-500"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                      <span>+5 (稳健参赛)</span>
                      <span>+15 (爆发力巅峰)</span>
                      <span>+25 (极限减量)</span>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-center space-y-1">
                    <div className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                      预计所需减量备赛周期
                    </div>
                    <div className="text-3xl font-black font-mono text-amber-600 dark:text-amber-400">
                      {taperPrediction.daysNeeded} <span className="text-sm font-sans">天 (Days)</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-300">
                      出关比赛日预测 CTL 体能保全值：<strong className="font-mono text-slate-900 dark:text-white">{taperPrediction.predictedCtl}</strong>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                    在减量期（Taper）保持每天 20~35 TSS 的低量高频刺激（短冲刺激活神经，缩减总骑行时间 40%），可确保疲劳迅速消退而有氧酶活性不失。
                  </p>
                </div>
              </div>

              {/* Manual TSS Workout Logging Card */}
              <div className="ios-card p-5 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-3">
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-ios-blue" />
                    手动补录日常训练负荷 (Manual TSS Entry)
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    可补记未导出 FIT 文件的骑行台训练、通勤或周末外骑，实时重塑 42 天 CTL 体能与 ATL 疲劳走势。
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <div className="w-28 sm:w-32">
                    <label className="text-[10px] text-slate-400 block mb-1">训练日期</label>
                    <select
                      value={newManualDayOffset}
                      onChange={(e) => setNewManualDayOffset(Number(e.target.value))}
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none"
                    >
                      <option value={0}>今天 (Day 0)</option>
                      <option value={-1}>昨天 (Day -1)</option>
                      <option value={-2}>前天 (Day -2)</option>
                      <option value={-3}>3天前 (Day -3)</option>
                    </select>
                  </div>

                  <div className="w-28 sm:w-32">
                    <label className="text-[10px] text-slate-400 block mb-1">负荷点数 (TSS)</label>
                    <NumberStepper
                      value={newManualTss}
                      onChange={setNewManualTss}
                      min={10}
                      max={400}
                      step={5}
                      unit="TSS"
                    />
                  </div>

                  <div className="flex-1 min-w-[140px]">
                    <label className="text-[10px] text-slate-400 block mb-1">训练备注 (可选)</label>
                    <input
                      type="text"
                      value={newManualTitle}
                      onChange={(e) => setNewManualTitle(e.target.value)}
                      placeholder="例：90min 甜区团骑"
                      className="w-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none"
                    />
                  </div>

                  <button
                    onClick={handleAddManualTss}
                    className="apple-touch self-end px-4 py-2 bg-ios-blue hover:bg-ios-blue/90 text-white rounded-xl text-xs font-semibold shadow-ios-sm active:scale-95 transition"
                  >
                    录入 PMC
                  </button>
                </div>

                {manualTssEntries.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <span className="text-[11px] text-slate-400 self-center">已录入负荷:</span>
                    {manualTssEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-mono"
                      >
                        <span>{entry.dayOffset === 0 ? '今日' : `${Math.abs(entry.dayOffset)}天前`}: {entry.tss} TSS ({entry.title})</span>
                        <button
                          onClick={() => handleRemoveManualTss(entry.id)}
                          className="apple-touch hover:text-red-500 font-bold ml-1 text-slate-400"
                          title="删除"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Physiological Coaching Insights */}
          {activeTab === 'coaching' && (
            <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-ios-blue" />
                <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                  {'自动化运动生理学诊断与复原窗口评估'}
                </h3>
              </div>

              <div className="space-y-3">
                {coachingNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-2xl border flex items-start gap-3 text-xs ${
                      note.type === 'success'
                        ? 'bg-ios-green/10 border-ios-green/30 text-slate-900 dark:text-emerald-100'
                        : note.type === 'warning'
                        ? 'bg-ios-orange/10 border-ios-orange/30 text-slate-900 dark:text-amber-100'
                        : 'bg-ios-blue/10 border-ios-blue/30 text-slate-900 dark:text-sky-100'
                    }`}
                  >
                    {note.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-ios-green shrink-0 mt-0.5" />
                    ) : note.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-ios-orange shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-ios-blue shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm">{note.title}</div>
                      <div className="leading-relaxed opacity-90">{note.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Smart Targeted Workout Recommendation Card */}
              {smartWorkoutRecommendation && (
                <div className="p-5 rounded-3xl bg-gradient-to-br from-ios-purple/10 via-ios-blue/10 to-transparent border border-ios-purple/25 space-y-3.5 shadow-ios-sm relative overflow-hidden">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-ios-purple/15 text-ios-purple text-xs font-bold border border-ios-purple/25">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>运动科学智能靶向补强推荐</span>
                      </div>
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        短板诊断：{smartWorkoutRecommendation.deficiencyTitle}
                      </h4>
                    </div>

                    {onNavigateTool && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSmartTemplateId(smartWorkoutRecommendation.template.id);
                          setSmartWorkoutModalOpen(true);
                        }}
                        className="apple-touch self-start sm:self-auto shrink-0 inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-gradient-to-r from-ios-purple to-ios-blue hover:opacity-95 text-white font-bold text-xs shadow-ios-sm transition active:scale-95"
                      >
                        <Dumbbell className="w-4 h-4" />
                        <span>配置补强课表</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {smartWorkoutRecommendation.deficiencyDesc}
                  </p>

                  <div className="p-3 rounded-2xl bg-white/80 dark:bg-white/5 border border-black/[0.04] dark:border-white/[0.08] flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">推荐专属科学课表</span>
                      <span className="font-bold text-slate-900 dark:text-white">
                        {smartWorkoutRecommendation.template.name}
                      </span>
                    </div>
                    <span className="text-[11px] text-ios-purple font-medium">
                      {smartWorkoutRecommendation.template.targetAdaptation}
                    </span>
                  </div>
                </div>
              )}

              {/* Recovery & Nutrition Advice */}
              <div className="p-4 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-ios-orange" />
                  {'赛后糖原与肌肉超量恢复建议'}
                </div>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  {`本次骑行累计机械做功 ${analysis.workKj} kJ（约消耗 ${analysis.caloriesKcal} kcal 热量）。建议骑行结束后 45 分钟黄金恢复窗口内摄入约 ${(analysis.caloriesKcal * 0.4 / 4).toFixed(0)}g 易吸收碳水化合物，配合 25g 优质乳清蛋白，促进肌糖原重组与肌原纤维合成。`}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Smart Workout Generator Modal */}
      {smartWorkoutModalOpen && smartWorkoutRecommendation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 dark:bg-black/75 backdrop-blur-2xl animate-in fade-in duration-200">
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 border border-black/[0.06] dark:border-white/[0.08] shadow-ios-popover space-y-5 bg-white dark:bg-[#1C1C1E]">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-ios-purple to-ios-blue text-white flex items-center justify-center shadow-ios-sm">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                    智能靶向补强课表生成
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    基于本次骑行真实心率、功率与疲劳数据生成
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSmartWorkoutModalOpen(false)}
                className="apple-touch w-8 h-8 rounded-full bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Physiological Deficit Diagnosis Alert */}
            <div className="p-4 rounded-2xl bg-ios-purple/10 border border-ios-purple/25 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-ios-purple">
                <AlertTriangle className="w-4 h-4" />
                <span>生理学短板评估：{smartWorkoutRecommendation.deficiencyTitle}</span>
              </div>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                {smartWorkoutRecommendation.deficiencyDesc}
              </p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium pt-1">
                💡 训练建议：{smartWorkoutRecommendation.actionAdvice}
              </p>
            </div>

            {/* Scientific Workout Template Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                <span>选择训练课表方案：</span>
                <span className="text-[10px] text-ios-purple font-normal">已预选最匹配短板方案</span>
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {WORKOUT_TEMPLATES.map((tmpl) => {
                  const isRecommended = tmpl.id === smartWorkoutRecommendation.template.id;
                  const isSelected = (selectedSmartTemplateId || smartWorkoutRecommendation.template.id) === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      type="button"
                      onClick={() => setSelectedSmartTemplateId(tmpl.id)}
                      className={`p-3 rounded-2xl border text-left transition relative apple-touch ${
                        isSelected
                          ? 'bg-ios-purple/10 dark:bg-ios-purple/20 border-ios-purple text-slate-900 dark:text-white ring-2 ring-ios-purple/30'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                      }`}
                    >
                      {isRecommended && (
                        <span className="absolute top-2 right-2 px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-ios-purple text-white shadow-2xs">
                          推荐
                        </span>
                      )}
                      <div className="font-bold text-xs pr-8">{tmpl.name}</div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-1">{tmpl.subtitle}</div>
                      <div className="text-[10px] text-ios-purple font-medium mt-1">{tmpl.categoryLabel}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Template Details Preview */}
            {(() => {
              const activeTmpl = WORKOUT_TEMPLATES.find(t => t.id === (selectedSmartTemplateId || smartWorkoutRecommendation.template.id)) || smartWorkoutRecommendation.template;
              return (
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 dark:text-white">{activeTmpl.name}</span>
                    <span className="font-mono text-slate-500">共 {activeTmpl.segments.length} 个结构化分段</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-[11px]">
                    {activeTmpl.description}
                  </p>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                    🎯 靶向适应：{activeTmpl.targetAdaptation}
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSmartWorkoutModalOpen(false)}
                className="apple-touch px-4 py-2.5 rounded-2xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 transition"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => handleDispatchSmartWorkout()}
                className="apple-touch px-5 py-2.5 rounded-2xl bg-gradient-to-r from-ios-purple to-ios-blue hover:opacity-95 text-white text-xs font-bold shadow-ios-sm flex items-center gap-2 transition active:scale-95"
              >
                <Dumbbell className="w-4 h-4" />
                <span>载入课表工坊并开始训练</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        posterUrl={sharePosterUrl}
        fileName={`${analysis?.fileName?.replace(/\.[^/.]+$/, '') || 'Ride'}_复盘海报.png`}
        title="FIT 码表深度复盘海报"
      />
    </div>
  );
};
