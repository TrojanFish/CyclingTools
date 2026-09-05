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
import {
  ActivityAnalysis,
  parseFitFile,
  parseGpxFile,
  parseTcxFile,
  generateRealisticDemoRide,
  analyzePoints
} from '../../utils/activityParser';

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
  const [activeTab, setActiveTab] = useState<'trends' | 'zones' | 'mmp' | 'coaching'>('trends');

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
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 relative overflow-hidden bg-gradient-to-br from-white via-slate-50 to-cyan-50/60 dark:from-slate-900 dark:via-slate-950 dark:to-cyan-950/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold">
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>{'数据复盘与运动生理学'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100">
              {'码表活动与 FIT 航迹深度解析器'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              {'纯前端离线直接解析 Garmin/Wahoo/迈金/行者/iGPSPORT 等码表生成的 .fit / .gpx / .tcx 活动文件。精准计算加权标准化功率 (NP)、强度系数 (IF)、训练压力 (TSS)、变化指数 (VI)、效率因子 (EF)、有氧解耦率及 Coggan 7 区时间驻留分布，数据绝不上云。'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>{'打印分析报告'}</span>
            </button>
            <button
              onClick={handleLoadDemo}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-500/20 active:scale-95 transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{'加载实测样本数据'}</span>
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
          className="lg:col-span-2 glass-panel p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-400 transition flex flex-col items-center justify-center text-center group cursor-pointer relative"
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

          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center mb-3 group-hover:scale-110 transition">
            <Upload className="w-6 h-6" />
          </div>

          <div className="font-bold text-sm text-slate-800 dark:text-slate-200">
            {'点击选择或拖拽码表文件至此 (.fit / .gpx / .tcx)'}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {'全面兼容佳明 Garmin、Wahoo、迈金、行者、iGPSPORT、百锐腾等各大主流品牌'}
          </div>

          {analysis && (
            <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 text-xs font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span className="font-semibold">{analysis.fileName}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-500/20 uppercase font-bold">{analysis.fileType}</span>
            </div>
          )}
        </div>

        {/* Dynamic Rider Physiological Anchor Card */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-cyan-500" />
              {'车手基准生理参数'}
            </span>
            <span className="text-[10px] text-slate-500">{'用于推算 IF/TSS'}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-[11px] text-slate-500 block mb-1">FTP (W)</label>
              <input
                type="number"
                value={ftpWatts}
                onChange={(e) => setFtpWatts(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {'体重 (kg)'}
              </label>
              <input
                type="number"
                value={weightKg}
                onChange={(e) => setWeightKg(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-500 block mb-1">
                {'最大心率'}
              </label>
              <input
                type="number"
                value={maxHr}
                onChange={(e) => setMaxHr(Number(e.target.value))}
                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            onClick={handleProfileRecompute}
            className="w-full py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-cyan-500/15 hover:text-cyan-500 text-slate-700 dark:text-slate-300 text-xs font-semibold transition flex items-center justify-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{'更新并刷新分析'}</span>
          </button>
        </div>
      </div>

      {/* Main Analysis Display */}
      {analysis && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            {/* Normalized Power */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'标准化功率 NP'}</span>
                <Zap className="w-3.5 h-3.5 text-cyan-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-cyan-500">
                {analysis.normalizedPower} <span className="text-xs font-normal text-slate-400">W</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {(analysis.normalizedPower / (weightKg || 68)).toFixed(2)} W/kg · {'均功率'} {analysis.avgPower}W
              </div>
            </div>

            {/* Intensity Factor */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'强度系数 IF'}</span>
                <Flame className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-amber-500">
                {analysis.intensityFactor}
              </div>
              <div className="text-[10px] text-slate-500">
                {Math.round(analysis.intensityFactor * 100)}% {'FTP负荷'}
              </div>
            </div>

            {/* Training Stress Score */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'训练压力 TSS'}</span>
                <Award className="w-3.5 h-3.5 text-purple-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-purple-500">
                {analysis.tss}
              </div>
              <div className="text-[10px] text-slate-500">
                {analysis.tss < 150 ? ('低度疲劳') : analysis.tss < 300 ? ('中度疲劳') : ('重度负荷')}
              </div>
            </div>

            {/* Variability Index */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'变化指数 VI'}</span>
                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-blue-500">
                {analysis.variabilityIndex}
              </div>
              <div className="text-[10px] text-slate-500">
                {analysis.variabilityIndex <= 1.05 ? 'TT Steady' : analysis.variabilityIndex <= 1.15 ? 'Rolling Hills' : 'Punchy Attack'}
              </div>
            </div>

            {/* Distance & Moving Time */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'里程与净骑行'}</span>
                <Timer className="w-3.5 h-3.5 text-emerald-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-emerald-500">
                {analysis.totalDistanceKm} <span className="text-xs font-normal text-slate-400">km</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {formatDuration(analysis.movingTimeSec)} ({analysis.avgSpeedKmh} km/h)
              </div>
            </div>

            {/* Elevation & Work Done */}
            <div className="glass-panel p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium flex items-center justify-between">
                <span>{'累计爬升与做功'}</span>
                <Mountain className="w-3.5 h-3.5 text-rose-500" />
              </div>
              <div className="text-xl sm:text-2xl font-extrabold text-rose-500">
                +{analysis.elevationGainM} <span className="text-xs font-normal text-slate-400">m</span>
              </div>
              <div className="text-[10px] text-slate-500">
                {analysis.workKj} kJ ({analysis.caloriesKcal} kcal)
              </div>
            </div>
          </div>

          {/* Secondary Biological & Efficiency Strip */}
          <div className="glass-panel px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 text-slate-600 dark:text-slate-300">
              <span className="flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-500" />
                <span>{'平均心率'}: <strong className="text-slate-900 dark:text-slate-100">{analysis.avgHeartRate ?? '--'} bpm</strong></span>
                <span className="text-slate-400 text-[10px]">({'最高'} {analysis.maxHeartRate ?? '--'})</span>
              </span>

              <span className="flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-500" />
                <span>{'平均踏频'}: <strong className="text-slate-900 dark:text-slate-100">{analysis.avgCadence ?? '--'} rpm</strong></span>
                <span className="text-slate-400 text-[10px]">
                  ({'踩踏'} {analysis.pedalingPercent ?? 100}% · {'滑行'} {100 - (analysis.pedalingPercent ?? 100)}%)
                </span>
              </span>

              {analysis.efficiencyFactor && (
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <Gauge className="w-4 h-4 text-cyan-500" />
                  <span>{'效率因子 (EF)'}: <strong className="text-cyan-500">{analysis.efficiencyFactor} W/bpm</strong></span>
                </span>
              )}

              {analysis.aerobicDecoupling !== undefined && (
                <span className="hidden sm:inline-flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-purple-500" />
                  <span>{'有氧解耦率 (Pw:HR)'}: <strong className={analysis.aerobicDecoupling > 5 ? 'text-amber-500' : 'text-emerald-500'}>{analysis.aerobicDecoupling}%</strong></span>
                </span>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {'总历时'}: {formatDuration(analysis.totalDurationSec)} · {analysis.points.length} {'个秒级采样点'}
            </div>
          </div>

          {/* Interactive Tabbed Navigation */}
          <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-2 sm:space-x-4">
            <button
              onClick={() => setActiveTab('trends')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'trends'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <LineChartIcon className="w-4 h-4" />
              <span>{'全景时序趋势'}</span>
            </button>

            <button
              onClick={() => setActiveTab('zones')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'zones'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{'功率/心率区间驻留'}</span>
            </button>

            <button
              onClick={() => setActiveTab('mmp')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'mmp'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{'峰值功率曲线 (MMP)'}</span>
            </button>

            <button
              onClick={() => setActiveTab('coaching')}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition ${
                activeTab === 'coaching'
                  ? 'border-cyan-500 text-cyan-500'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              <span>{'训练生理学诊断'}</span>
            </button>
          </div>

          {/* TAB 1: Time-Series Trends */}
          {activeTab === 'trends' && (
            <div className="glass-panel p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {'多轨遥测曲线 (时间轴：分:秒)'}
                </div>

                {/* Channel Visibility Switches */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-[11px]">
                  <button
                    onClick={() => setShowPower(!showPower)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      showPower ? 'bg-cyan-500/20 text-cyan-500 border border-cyan-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    ⚡ {'功率'}
                  </button>

                  <button
                    onClick={() => setShowHeartRate(!showHeartRate)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      showHeartRate ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    ❤️ {'心率'}
                  </button>

                  <button
                    onClick={() => setShowElevation(!showElevation)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      showElevation ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    ⛰️ {'海拔'}
                  </button>

                  <button
                    onClick={() => setShowSpeed(!showSpeed)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      showSpeed ? 'bg-blue-500/20 text-blue-500 border border-blue-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    🚴 {'速度'}
                  </button>

                  <button
                    onClick={() => setShowCadence(!showCadence)}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                      showCadence ? 'bg-amber-500/20 text-amber-500 border border-amber-500/40' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                    }`}
                  >
                    🔄 {'踏频'}
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
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-cyan-500" />
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

                <div className="space-y-1.5">
                  {analysis.timeInPowerZones.map((z) => (
                    <div key={z.zone} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></span>
                        <strong className="text-slate-800 dark:text-slate-200">{z.zone} {z.label}</strong>
                        <span className="text-slate-400 text-[10px]">({z.range})</span>
                      </div>
                      <div className="font-mono flex items-center gap-3">
                        <span className="text-slate-500">{formatDuration(z.seconds)}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[40px] text-right">{z.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Heart Rate 5-Zone Distribution */}
              <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500" />
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

                <div className="space-y-1.5">
                  {analysis.timeInHrZones.map((z) => (
                    <div key={z.zone} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-50 dark:bg-slate-900/60">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: z.color }}></span>
                        <strong className="text-slate-800 dark:text-slate-200">{z.zone} {z.label}</strong>
                        <span className="text-slate-400 text-[10px]">({z.range})</span>
                      </div>
                      <div className="font-mono flex items-center gap-3">
                        <span className="text-slate-500">{formatDuration(z.seconds)}</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 min-w-[40px] text-right">{z.percent}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MMP Power Curve */}
          {activeTab === 'mmp' && (
            <div className="glass-panel p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
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
                  <div key={m.label} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-center space-y-1">
                    <div className="text-xs font-bold text-purple-500 uppercase">{m.label}</div>
                    <div className="text-lg font-extrabold text-slate-900 dark:text-slate-100">{m.watts} W</div>
                    <div className="text-[11px] text-slate-500">{m.wkg} W/kg</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: Physiological Coaching Insights */}
          {activeTab === 'coaching' && (
            <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {'自动化运动生理学诊断与复原窗口评估'}
                </h3>
              </div>

              <div className="space-y-3">
                {coachingNotes.map((note, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                      note.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-900 dark:text-emerald-200'
                        : note.type === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-amber-200'
                        : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-900 dark:text-cyan-200'
                    }`}
                  >
                    {note.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    ) : note.type === 'warning' ? (
                      <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <Info className="w-5 h-5 text-cyan-500 shrink-0 mt-0.5" />
                    )}
                    <div className="space-y-1">
                      <div className="font-bold text-sm">{note.title}</div>
                      <div className="leading-relaxed opacity-90">{note.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recovery & Nutrition Advice */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-rose-500" />
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
