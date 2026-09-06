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
  Printer
} from 'lucide-react';
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
import {
  ActivityAnalysis,
  parseFitFile,
  parseGpxFile,
  parseTcxFile,
  generateRealisticDemoRide,
  analyzePoints
} from '../../utils/activityParser';
import {
  generatePmcSeries,
  getTsbZoneInfo,
  predictTaperDays,
  PmcMesocycleType,
  PmcDayData
} from '../../utils/pmcCalculator';

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

export const FitActivityAnalyzer: React.FC = () => {
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

  // Activity State
  const [analysis, setAnalysis] = useState<ActivityAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'trends' | 'zones' | 'mmp' | 'coaching' | 'pmc'>('trends');
  const [pmcMesocycle, setPmcMesocycle] = useState<PmcMesocycleType>('build');
  const [targetTsbForPeak, setTargetTsbForPeak] = useState<number>(15);

  // PMC Calculation
  const pmcData = useMemo(() => {
    return generatePmcSeries(pmcMesocycle, analysis?.tss);
  }, [pmcMesocycle, analysis?.tss]);

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
            color: '#64748b',
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

  // MMP Curve Chart Data
  const mmpChartData = useMemo(() => {
    if (!analysis) return { labels: [], datasets: [] };
    return {
      labels: analysis.mmp.map(m => m.label),
      datasets: [
        {
          type: 'line' as const,
          label: '峰值平均功率 (W)',
          data: analysis.mmp.map(m => m.watts),
          borderColor: '#8b5cf6',
          backgroundColor: 'rgba(139, 92, 246, 0.12)',
          fill: true,
          tension: 0.3,
          pointRadius: 4,
          pointBackgroundColor: '#8b5cf6'
        }
      ]
    };
  }, [analysis, language]);

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

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="ios-card p-6 sm:p-7 rounded-3xl relative overflow-hidden shadow-ios-sm isolate">
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

          <div className="flex items-center gap-2.5 self-start sm:self-center shrink-0">
            <button
              onClick={() => window.print()}
              className="px-4 py-2.5 rounded-full bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200/80 dark:border-white/10 shadow-xs apple-touch transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '列印報告' : '打印报告'}</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2.5 rounded-full bg-ios-blue hover:bg-ios-blue/90 text-white font-semibold text-xs shadow-ios-sm apple-touch transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '載入樣本' : '加载样本'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* File Upload Zone & Rider Anchor Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          className="lg:col-span-2 ios-card p-6 sm:p-8 rounded-3xl border-2 border-dashed border-slate-300/80 dark:border-white/20 hover:border-ios-blue dark:hover:border-ios-blue transition flex flex-col items-center justify-center text-center group cursor-pointer relative shadow-ios-card"
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

          <div className="w-14 h-14 rounded-2xl bg-ios-blue/10 border border-ios-blue/20 text-ios-blue flex items-center justify-center mb-3.5 group-hover:scale-105 transition apple-touch">
            <Upload className="w-6 h-6" />
          </div>

          <div className="font-bold text-sm text-slate-800 dark:text-white">
            {'点击选择或拖拽码表文件至此 (.fit / .gpx / .tcx)'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {'全面兼容佳明 Garmin、Wahoo、迈金、行者、iGPSPORT、百锐腾等各大主流品牌'}
          </div>

          {analysis && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5 text-ios-green" />
              <span className="font-semibold">{analysis.fileName}</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-ios-blue text-white uppercase font-bold">{analysis.fileType}</span>
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

          {/* Interactive Tabbed Navigation */}
          <div className="max-w-md">
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
                        x: { ticks: { font: { size: 9 }, color: '#94a3b8' } },
                        y: { ticks: { font: { size: 10 }, color: '#64748b' } }
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
                        x: { ticks: { font: { size: 9 }, color: '#94a3b8' } },
                        y: { ticks: { font: { size: 10 }, color: '#64748b' } }
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

          {/* TAB 3: MMP Power Curve */}
          {activeTab === 'mmp' && (
            <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                    {'最佳平均峰值功率 (MMP) 曲线'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {'本次骑行中车手在各个标准时段内所维持的最高平均输出（瓦特与推重比）'}
                  </p>
                </div>
              </div>

              <div className="h-64 sm:h-80">
                <Line
                  data={mmpChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      x: { ticks: { font: { size: 10 }, color: '#94a3b8' } },
                      y: { ticks: { font: { size: 10 }, color: '#64748b' } }
                    }
                  }}
                />
              </div>

              {/* MMP Grid Table */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {analysis.mmp.map((m) => (
                  <div key={m.label} className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 text-center space-y-1">
                    <div className="text-xs font-bold text-ios-purple uppercase">{m.label}</div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-white">{m.watts} W</div>
                    <div className="text-[11px] text-slate-500">{m.wkg} W/kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: PMC (Performance Management Chart) */}
          {activeTab === 'pmc' && (
            <div className="space-y-6">
              {/* PMC Overview Card */}
              <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 shadow-ios-card space-y-5">
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

                  {/* Mesocycle Switcher */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/10">
                    <button
                      onClick={() => setPmcMesocycle('base')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        pmcMesocycle === 'base'
                          ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      基础期 (60天)
                    </button>
                    <button
                      onClick={() => setPmcMesocycle('build')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        pmcMesocycle === 'build'
                          ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      强化期 (45天)
                    </button>
                    <button
                      onClick={() => setPmcMesocycle('taper')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        pmcMesocycle === 'taper'
                          ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      减量备战 (28天)
                    </button>
                    <button
                      onClick={() => setPmcMesocycle('grand_tour')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        pmcMesocycle === 'grand_tour'
                          ? 'bg-white dark:bg-white/20 text-ios-blue shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      大环赛多日 (24天)
                    </button>
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
                          ticks: { color: '#94a3b8', font: { size: 10 } },
                          title: { display: true, text: 'CTL / ATL (负荷点)', color: '#64748b', font: { size: 11 } }
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
                      className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
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
    </div>
  );
};
