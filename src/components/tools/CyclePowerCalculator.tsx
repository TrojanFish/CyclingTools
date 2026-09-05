import React, { useState, useMemo } from 'react';
import { Zap, Activity, Info, Mountain, Wind, Flame, Gauge, Copy, Award, Sliders, ChevronDown } from 'lucide-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip as ChartTooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Tooltip } from '../common/Tooltip';
import { NumberStepper } from '../common/NumberStepper';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartTooltip,
  Legend,
  Filler
);

export const CyclePowerCalculator: React.FC = () => {
  const { profile, updateProfile } = useRiderProfile();
  const { showToast } = useToast();

  const [calcMode, setCalcMode] = useState<'speed' | 'power' | 'wkg'>('speed');
  const [powerInput, setPowerInput] = useState<number>(profile.ftpWatts || 220);
  const [targetSpeedKmh, setTargetSpeedKmh] = useState<number>(35);
  const [targetWkg, setTargetWkg] = useState<number>(3.5);

  const [riderWeight, setRiderWeight] = useState<number>(profile.weightKg || 68);
  const [bikeWeight, setBikeWeight] = useState<number>(profile.bikeWeightKg || 8.5);
  const [grade, setGrade] = useState<number>(0);
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(0);
  const [windDirection, setWindDirection] = useState<'headwind' | 'tailwind'>('headwind');

  // Advanced aero & physics parameters
  const [altitudeM, setAltitudeM] = useState<number>(50);
  const [tempC, setTempC] = useState<number>(20);
  const [cdaPreset, setCdaPreset] = useState<'tt' | 'drops' | 'hoods' | 'tops'>('hoods');
  const [customCda, setCustomCda] = useState<number>(0.32);
  const [customCrr, setCustomCrr] = useState<number>(0.0035);

  // Dedicated Climb & VAM test parameters
  const [climbDistanceKm, setClimbDistanceKm] = useState<number>(10);
  const [climbElevationGainM, setClimbElevationGainM] = useState<number>(600);

  // Active chart view tab
  const [chartTab, setChartTab] = useState<'speed' | 'weight'>('speed');

  // Dynamic Air Density Barometric Formula: p = p0 * (1 - 0.0000225577 * h)^5.25588, rho = p / (R * T)
  const airDensityRho = useMemo(() => {
    const p0 = 101325;
    const T = tempC + 273.15;
    const pressure = p0 * Math.pow(1 - 0.0000225577 * altitudeM, 5.25588);
    const rho = pressure / (287.05 * T);
    return parseFloat(rho.toFixed(3));
  }, [altitudeM, tempC]);

  const handleCdaPresetChange = (preset: 'tt' | 'drops' | 'hoods' | 'tops') => {
    setCdaPreset(preset);
    if (preset === 'tt') setCustomCda(0.22);
    else if (preset === 'drops') setCustomCda(0.28);
    else if (preset === 'hoods') setCustomCda(0.32);
    else if (preset === 'tops') setCustomCda(0.38);
  };

  // Main Comprehensive Physical Calculation Engine
  const result = useMemo(() => {
    const g = 9.80665;
    const totalMass = riderWeight + bikeWeight;
    const gradeRad = Math.atan(grade / 100);
    const fGravity = totalMass * g * Math.sin(gradeRad);
    const fRolling = totalMass * g * Math.cos(gradeRad) * customCrr;

    const windMs = (windSpeedKmh / 3.6) * (windDirection === 'headwind' ? 1 : -1);

    let effectiveWatts = powerInput;
    let effectiveSpeedKmh = targetSpeedKmh;

    if (calcMode === 'wkg') {
      effectiveWatts = Math.round(targetWkg * riderWeight);
    }

    if (calcMode === 'speed' || calcMode === 'wkg') {
      // Binary search for velocity from power
      let low = 0;
      let high = 45; // m/s
      let v = 0;
      for (let i = 0; i < 50; i++) {
        v = (low + high) / 2;
        const vRel = v + windMs;
        const currentAero = 0.5 * airDensityRho * customCda * Math.pow(Math.max(0, vRel), 2);
        const requiredPower = (fGravity + fRolling + currentAero) * v;
        if (requiredPower < effectiveWatts) {
          low = v;
        } else {
          high = v;
        }
      }
      effectiveSpeedKmh = Math.max(0, parseFloat((v * 3.6).toFixed(1)));
    } else {
      // Direct solve power from speed
      const v = targetSpeedKmh / 3.6;
      const vRel = v + windMs;
      const currentAero = 0.5 * airDensityRho * customCda * Math.pow(Math.max(0, vRel), 2);
      effectiveWatts = Math.max(0, Math.round((fGravity + fRolling + currentAero) * v));
      effectiveSpeedKmh = targetSpeedKmh;
    }

    const vFinal = effectiveSpeedKmh / 3.6;
    const vRelFinal = vFinal + windMs;
    const fAero = 0.5 * airDensityRho * customCda * Math.pow(Math.max(0, vRelFinal), 2);

    const wkg = parseFloat((effectiveWatts / riderWeight).toFixed(2));
    const totalForce = Math.max(0.1, Math.abs(fGravity) + fRolling + fAero);
    const aeroPct = Math.round((Math.max(0, fAero) / totalForce) * 100);
    const rollingPct = Math.round((Math.max(0, fRolling) / totalForce) * 100);
    const gravityPct = Math.max(0, 100 - aeroPct - rollingPct);

    // Coggan FTP Level Evaluation
    let levelTitle = '业余骑游 (Recreational)';
    let levelBadgeColor = 'text-sky-400 bg-sky-500/10 border-sky-500/20';
    if (wkg >= 5.2) {
      levelTitle = '世界职业级 (World Tour / Pro)';
      levelBadgeColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    } else if (wkg >= 4.2) {
      levelTitle = '业余精英一级 (Cat 1-2 / Elite)';
      levelBadgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    } else if (wkg >= 3.2) {
      levelTitle = '强力进阶骑士 (Cat 3-4 / Advanced)';
      levelBadgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (wkg >= 2.4) {
      levelTitle = '活跃俱乐部车手 (Club Rider)';
      levelBadgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    }

    // Coggan 7-Zone FTP Training Ranges
    const ftpBase = calcMode === 'speed' ? effectiveWatts : profile.ftpWatts || 220;
    const ftpZones = [
      { zone: 'Z1 主动恢复 (Active Recovery)', pct: '< 55%', min: 0, max: Math.round(ftpBase * 0.55), desc: '轻松排酸，加速代谢恢复' },
      { zone: 'Z2 有氧耐力 (Endurance Zone)', pct: '56% - 75%', min: Math.round(ftpBase * 0.56), max: Math.round(ftpBase * 0.75), desc: '提升线粒体密度与脂肪燃烧效率' },
      { zone: 'Z3 节奏区间 (Tempo)', pct: '76% - 90%', min: Math.round(ftpBase * 0.76), max: Math.round(ftpBase * 0.90), desc: '高效率巡航与长距离有氧输出' },
      { zone: 'Z4 甜点/乳酸阈值 (Sweetspot/Threshold)', pct: '91% - 105%', min: Math.round(ftpBase * 0.91), max: Math.round(ftpBase * 1.05), desc: '提升 FTP 阈值功率的核心训练区间' },
      { zone: 'Z5 最大摄氧量 (VO2 Max)', pct: '106% - 120%', min: Math.round(ftpBase * 1.06), max: Math.round(ftpBase * 1.20), desc: '3~5分钟短坡与破风突围极限' },
      { zone: 'Z6 无氧耐力 (Anaerobic Capacity)', pct: '121% - 150%', min: Math.round(ftpBase * 1.21), max: Math.round(ftpBase * 1.50), desc: '30秒~2分钟陡坡进攻与超车' },
      { zone: 'Z7 神经肌肉冲刺 (Neuromuscular Power)', pct: '> 150%', min: Math.round(ftpBase * 1.51), max: 9999, desc: '全速冲刺与瞬间终点爆发' }
    ];

    // Metabolic energy consumption (24% mechanical efficiency)
    const kcalPerHour = Math.round((effectiveWatts * 3.6) / 4.184 / 0.24);

    // VAM & Climbing calculation
    const avgClimbGrade = climbDistanceKm > 0 ? (climbElevationGainM / (climbDistanceKm * 1000)) * 100 : 6;
    const climbSpeedMs = (effectiveSpeedKmh / 3.6);
    const vam = Math.round(climbSpeedMs * (avgClimbGrade / 100) * 3600);
    const climbTimeMinutes = vam > 0 ? Math.round((climbElevationGainM / vam) * 60) : 0;

    return {
      power: effectiveWatts,
      speedKmh: effectiveSpeedKmh,
      wkg,
      fGravity: Math.round(fGravity),
      fRolling: Math.round(fRolling),
      fAero: Math.round(fAero),
      aeroPct,
      rollingPct,
      gravityPct,
      levelTitle,
      levelBadgeColor,
      ftpZones,
      kcalPerHour,
      vam,
      climbTimeMinutes,
      avgClimbGrade: avgClimbGrade.toFixed(1)
    };
  }, [calcMode, powerInput, targetSpeedKmh, targetWkg, riderWeight, bikeWeight, grade, windSpeedKmh, windDirection, airDensityRho, customCda, customCrr, climbDistanceKm, climbElevationGainM, profile.ftpWatts]);

  // Chart datasets
  const speedChartData = useMemo(() => {
    const speeds = [20, 25, 30, 35, 40, 45, 50];
    const powers = speeds.map(spd => {
      const v = spd / 3.6;
      const g = 9.80665;
      const totalMass = riderWeight + bikeWeight;
      const fG = totalMass * g * Math.sin(Math.atan(grade / 100));
      const fR = totalMass * g * Math.cos(Math.atan(grade / 100)) * customCrr;
      const fA = 0.5 * airDensityRho * customCda * Math.pow(v, 2);
      return Math.round(Math.max(0, (fG + fR + fA) * v));
    });

    return {
      labels: speeds.map(s => `${s} km/h`),
      datasets: [
        {
          label: '平路/坡道所需功率 (Watts)',
          data: powers,
          borderColor: '#00AFFF',
          backgroundColor: 'rgba(0, 175, 255, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#00AFFF'
        }
      ]
    };
  }, [riderWeight, bikeWeight, grade, airDensityRho, customCda, customCrr]);

  const weightChartData = useMemo(() => {
    const weights = [55, 60, 65, 70, 75, 80, 85];
    const powers = weights.map(w => {
      const v = 35 / 3.6; // 35 km/h standard
      const g = 9.80665;
      const totalMass = w + bikeWeight;
      const fG = totalMass * g * Math.sin(Math.atan(grade / 100));
      const fR = totalMass * g * Math.cos(Math.atan(grade / 100)) * customCrr;
      const fA = 0.5 * airDensityRho * customCda * Math.pow(v, 2);
      return Math.round(Math.max(0, (fG + fR + fA) * v));
    });

    return {
      labels: weights.map(w => `${w} kg`),
      datasets: [
        {
          label: '在 35km/h 巡航下不同体重所需功率 (Watts)',
          data: powers,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.12)',
          fill: true,
          tension: 0.35,
          pointRadius: 4,
          pointBackgroundColor: '#10b981'
        }
      ]
    };
  }, [bikeWeight, grade, airDensityRho, customCda, customCrr]);

  const copyFullReport = () => {
    const text = `🚴 SoloRiderTools 科学骑行功率与推重比报告:\n- 输出功率: ${result.power} W\n- 推重比: ${result.wkg} W/kg (${result.levelTitle})\n- 巡航车速: ${result.speedKmh} km/h\n- 坡度: ${grade}% | 空气密度: ${airDensityRho} kg/m³\n- 能耗代谢: ${result.kcalPerHour} kcal/h\n- 爬坡 VAM: ${result.vam} m/h (预计 ${climbElevationGainM}m 耗时: ${result.climbTimeMinutes} 分钟)`;
    navigator.clipboard.writeText(text);
    showToast('完整功率与能力评估报告已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Zap className="w-3.5 h-3.5" />
              空气动力学与重力方程
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">骑行功率与速度计算器</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              高精度空气阻力、滚阻、重力分量与海拔密度推算，支持功速互推、Coggan 7 区间划分与 VAM 爬坡耗时求解。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={copyFullReport}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-slate-700 transition shadow-xs"
            >
              <Copy className="w-3.5 h-3.5" />
              复制完整报告
            </button>

            {/* Mode Selectors */}
            <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs">
              <button
                onClick={() => setCalcMode('speed')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  calcMode === 'speed' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                已知功率求速度
              </button>
              <button
                onClick={() => setCalcMode('power')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  calcMode === 'power' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                已知速度求功率
              </button>
              <button
                onClick={() => setCalcMode('wkg')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  calcMode === 'wkg' ? 'bg-cyan-500 text-slate-950 font-bold shadow-xs' : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                已知推重比推算
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5 shadow-xs">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              动力与环境变量输入
            </h2>

            {/* Target Input */}
            {calcMode === 'speed' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">输入骑行功率 (Watts)</label>
                <NumberStepper value={powerInput} onChange={setPowerInput} step={5} min={20} max={1500} unit="W" />
              </div>
            )}
            {calcMode === 'power' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">目标巡航速度 (km/h)</label>
                <NumberStepper value={targetSpeedKmh} onChange={setTargetSpeedKmh} step={0.5} min={5} max={90} unit="km/h" decimals={1} />
              </div>
            )}
            {calcMode === 'wkg' && (
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">目标推重比 (W/kg)</label>
                <NumberStepper value={targetWkg} onChange={setTargetWkg} step={0.1} min={1.0} max={8.0} unit="W/kg" decimals={1} />
              </div>
            )}

            {/* Rider & Bike Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">车手体重 (kg)</label>
                <NumberStepper value={riderWeight} onChange={setRiderWeight} step={0.5} min={30} max={150} unit="kg" decimals={1} />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1.5">整车装备重 (kg)</label>
                <NumberStepper value={bikeWeight} onChange={setBikeWeight} step={0.1} min={4} max={25} unit="kg" decimals={1} />
              </div>
            </div>

            {/* Grade & Wind */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">道路坡度 (Grade %)</label>
                  <span className="text-cyan-400 font-mono font-semibold text-xs">{grade}%</span>
                </div>
                <input
                  type="range"
                  min="-15"
                  max="25"
                  step="0.5"
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-300">风速与方向</label>
                  <span className="text-cyan-400 font-mono font-semibold text-xs">
                    {windSpeedKmh} km/h ({windDirection === 'headwind' ? '顶风' : '顺风'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="1"
                    value={windSpeedKmh}
                    onChange={(e) => setWindSpeedKmh(Number(e.target.value))}
                    className="w-full h-2 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                  <button
                    onClick={() => setWindDirection(windDirection === 'headwind' ? 'tailwind' : 'headwind')}
                    className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[10px] text-cyan-400 shrink-0"
                  >
                    {windDirection === 'headwind' ? '顶风' : '顺风'}
                  </button>
                </div>
              </div>
            </div>

            {/* Aero Posture Presets */}
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-2 flex items-center">
                骑行姿态与风阻迎风面积 (CdA)
                <Tooltip content="CdA 代表风阻系数乘以正面投影迎风面积，值越小越气动省力。" />
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  { id: 'tt', label: 'TT 计时姿势', cda: 0.22 },
                  { id: 'drops', label: '下把破风位', cda: 0.28 },
                  { id: 'hoods', label: '手变头位', cda: 0.32 },
                  { id: 'tops', label: '横把直立位', cda: 0.38 },
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleCdaPresetChange(p.id as any)}
                    className={`py-2 px-1 rounded-xl border text-center transition ${
                      cdaPreset === p.id
                        ? 'bg-cyan-500/15 border-cyan-500 text-cyan-400 font-semibold'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    <div className="text-[11px] font-bold">{p.label}</div>
                    <div className="text-[9px] font-mono text-slate-500 mt-0.5">{p.cda} m²</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Precision Altitude & Temperature Air Density */}
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-medium flex items-center gap-1">
                  <Wind className="w-3.5 h-3.5 text-cyan-400" />
                  海拔与气温密度校正
                </span>
                <span className="text-cyan-400 font-mono font-bold">ρ = {airDensityRho} kg/m³</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">骑行海拔: {altitudeM} m</label>
                  <input
                    type="range"
                    min="0"
                    max="4500"
                    step="50"
                    value={altitudeM}
                    onChange={(e) => setAltitudeM(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">环境气温: {tempC} °C</label>
                  <input
                    type="range"
                    min="-10"
                    max="45"
                    step="1"
                    value={tempC}
                    onChange={(e) => setTempC(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded appearance-none cursor-pointer accent-cyan-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output Results & Full Analytics */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Hero Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xs text-slate-400 font-medium block">估算骑行速度</span>
              <div className="text-3xl font-extrabold font-mono text-cyan-400 mt-1">
                {result.speedKmh} <span className="text-xs text-slate-400 font-sans font-normal">km/h</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">
                {(result.speedKmh / 1.609).toFixed(1)} mph
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xs text-slate-400 font-medium block">推重比 (W/kg)</span>
              <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1">
                {result.wkg} <span className="text-xs text-slate-400 font-sans font-normal">W/kg</span>
              </div>
              <span className="text-[10px] text-slate-500">
                {result.power} 瓦实际总输出
              </span>
            </div>

            <div className="glass-card p-5 rounded-2xl border border-slate-800 bg-slate-900/60 text-center">
              <span className="text-xs text-slate-400 font-medium block">人体能耗代谢</span>
              <div className="text-3xl font-extrabold font-mono text-amber-400 mt-1">
                {result.kcalPerHour} <span className="text-xs text-slate-400 font-sans font-normal">kcal/h</span>
              </div>
              <span className="text-[10px] text-slate-500">
                24% 机械效率推算
              </span>
            </div>
          </div>

          {/* Coggan Level Badge */}
          <div className="glass-panel p-4 rounded-xl border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Award className="w-5 h-5 text-cyan-400" />
              <div>
                <span className="text-xs text-slate-400 block">车手竞技水平评估 (Coggan Power Profile)</span>
                <span className="text-sm font-bold text-slate-100">{result.levelTitle}</span>
              </div>
            </div>
            <span className={`text-xs px-3 py-1 rounded-full font-mono font-bold border ${result.levelBadgeColor}`}>
              {result.wkg} W/kg
            </span>
          </div>

          {/* VAM Climbing Estimator Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 bg-cyan-950/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                <Mountain className="w-4 h-4 text-cyan-400" />
                爬坡性能与 VAM (垂直上升速度) 推算
              </h3>
              <span className="text-xs font-mono text-cyan-300 font-bold">
                VAM: {result.vam} m/h
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px]">爬坡路程</span>
                <span className="text-slate-200 font-mono font-bold">{climbDistanceKm} km</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">累计爬升</span>
                <span className="text-slate-200 font-mono font-bold">+{climbElevationGainM} m</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">平均坡度</span>
                <span className="text-slate-200 font-mono font-bold">{result.avgClimbGrade}%</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">预计登顶耗时</span>
                <span className="text-emerald-400 font-mono font-bold">{result.climbTimeMinutes} 分钟</span>
              </div>
            </div>
          </div>

          {/* Resistance Breakdown Bar */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <span className="text-xs font-semibold text-slate-300 block">三大物理阻力占比分解</span>
            <div className="h-3.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
              <div style={{ width: `${result.aeroPct}%` }} className="bg-cyan-500 h-full transition-all duration-300" title={`风阻: ${result.aeroPct}%`}></div>
              <div style={{ width: `${result.rollingPct}%` }} className="bg-emerald-500 h-full transition-all duration-300" title={`滚阻: ${result.rollingPct}%`}></div>
              <div style={{ width: `${result.gravityPct}%` }} className="bg-amber-500 h-full transition-all duration-300" title={`重力阻力: ${result.gravityPct}%`}></div>
            </div>

            <div className="flex justify-between text-[11px] font-mono text-slate-400">
              <span className="text-cyan-400 font-bold">💨 风阻 {result.aeroPct}% ({result.fAero}N)</span>
              <span className="text-emerald-400 font-bold">🚲 滚阻 {result.rollingPct}% ({result.fRolling}N)</span>
              <span className="text-amber-400 font-bold">⛰️ 重力 {result.gravityPct}% ({result.fGravity}N)</span>
            </div>
          </div>

          {/* Coggan 7-Zone FTP Table */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-200">Coggan 7 区间功率训练参考 (FTP: {profile.ftpWatts || 220}W)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-2 font-medium">训练区间</th>
                    <th className="pb-2 font-medium">FTP 比例</th>
                    <th className="pb-2 font-medium">目标功率 (W)</th>
                    <th className="pb-2 font-medium">主要训练效益</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300 font-mono">
                  {result.ftpZones.map((z, idx) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 font-sans font-semibold text-slate-200">{z.zone}</td>
                      <td>{z.pct}</td>
                      <td className="text-cyan-400 font-bold">{z.min} - {z.max === 9999 ? 'MAX' : `${z.max} W`}</td>
                      <td className="font-sans text-slate-400 text-[11px]">{z.desc}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Interactive Chart Tabs */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-300">多维动力学预测曲线</span>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setChartTab('speed')}
                  className={`px-3 py-1 rounded-lg transition ${chartTab === 'speed' ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  速度-功率
                </button>
                <button
                  onClick={() => setChartTab('weight')}
                  className={`px-3 py-1 rounded-lg transition ${chartTab === 'weight' ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400'}`}
                >
                  体重-功率
                </button>
              </div>
            </div>

            <div className="h-56">
              <Line
                data={chartTab === 'speed' ? speedChartData : weightChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      backgroundColor: 'rgba(15, 23, 42, 0.95)',
                      titleColor: '#38bdf8',
                      bodyColor: '#f8fafc',
                      borderColor: 'rgba(56, 189, 248, 0.3)',
                      borderWidth: 1,
                      padding: 10
                    }
                  },
                  scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' } },
                    y: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, title: { display: true, text: '功率 (Watts)' } }
                  }
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
