import React, { useState, useMemo, useEffect } from 'react';
import { Users, Play, Activity, TrendingUp, Sliders, Shield, Zap, Plus, Trash2, Sparkles } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface Rider {
  id: string;
  name: string;
  weight: number;
  ftp: number;
  wPrime: number;
  followOnly: boolean;
}

export const GroupRideSimulator: React.FC = () => {
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const isImperial = unitSystem === 'imperial';

  const [distanceKm, setDistanceKm] = useState<number>(80);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(38);
  const [rotationMinutes, setRotationMinutes] = useState<number>(2.0);
  const [gradePercent, setGradePercent] = useState<number>(0);
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(10);
  const [windDirection, setWindDirection] = useState<'headwind' | 'crosswind' | 'tailwind'>('headwind');

  const [riders, setRiders] = useState<Rider[]>([
    { id: '1', name: '车手 1 (主将)', weight: 68, ftp: 300, wPrime: 22, followOnly: false },
    { id: '2', name: '车手 2 (破风手)', weight: 74, ftp: 320, wPrime: 25, followOnly: false },
    { id: '3', name: '车手 3 (爬坡手)', weight: 62, ftp: 270, wPrime: 18, followOnly: false },
    { id: '4', name: '车手 4 (副将)', weight: 70, ftp: 280, wPrime: 20, followOnly: false }
  ]);

  // Reactively sync lead rider with rider profile
  useEffect(() => {
    if (profile.weightKg || profile.ftpWatts) {
      setRiders(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const currentLead = updated[0];
        const newWeight = profile.weightKg || currentLead.weight;
        const newFtp = profile.ftpWatts || currentLead.ftp;
        if (currentLead.weight === newWeight && currentLead.ftp === newFtp) {
          return prev;
        }
        updated[0] = {
          ...currentLead,
          weight: newWeight,
          ftp: newFtp
        };
        return updated;
      });
    }
  }, [profile.weightKg, profile.ftpWatts]);

  const RHO = 1.225, CRR = 0.004, G = 9.80665, CDA_SOLO = 0.32;

  const getDraftingBenefit = (pos: number, count: number) => {
    if (pos === 1) return 0;
    const relativeDepth = pos / count;
    let benefit = 0.45 * (1 - Math.exp(-6 * relativeDepth));
    if (windDirection === 'crosswind') benefit *= 0.75;
    if (windDirection === 'tailwind') benefit *= 0.85;
    return benefit;
  };

  const calculatePower = (speedKmh: number, weightKg: number, benefit: number) => {
    const v = speedKmh / 3.6;
    const vWind = windSpeedKmh / 3.6;
    const fRoll = (weightKg + 8.5) * G * Math.cos(Math.atan(gradePercent / 100)) * CRR;
    const fGrav = (weightKg + 8.5) * G * Math.sin(Math.atan(gradePercent / 100));
    
    let vAir = v;
    if (windDirection === 'headwind') vAir += vWind;
    else if (windDirection === 'tailwind') vAir = Math.max(0, vAir - vWind);
    else vAir = Math.sqrt(v * v + vWind * vWind);

    const fAero = 0.5 * RHO * CDA_SOLO * (1 - benefit) * (vAir * vAir);
    return Math.max(0, (fRoll + fGrav + fAero) * v);
  };

  const simulationResult = useMemo(() => {
    const totalMinutes = (distanceKm / Math.max(5, avgSpeedKmh)) * 60;
    const timeSteps = 50;
    const stepDurationMinutes = totalMinutes / timeSteps;
    const activeLeadRiders = riders.filter(r => !r.followOnly);
    const count = riders.length;

    const timeLabels: string[] = [];
    const riderWPrimePercent: Record<number, number[]> = {};
    const riderPowers: Record<number, number[]> = {};
    const currentWPrimeBalance: Record<number, number> = {};

    riders.forEach((r, idx) => {
      riderWPrimePercent[idx] = [];
      riderPowers[idx] = [];
      currentWPrimeBalance[idx] = r.wPrime * 1000;
    });

    for (let step = 0; step <= timeSteps; step++) {
      const curMinute = step * stepDurationMinutes;
      timeLabels.push(`${curMinute.toFixed(0)}m`);

      const leadIndexInActive = Math.floor(curMinute / rotationMinutes) % (activeLeadRiders.length || 1);
      const currentLeadRider = activeLeadRiders[leadIndexInActive];

      riders.forEach((r, idx) => {
        const isLeading = currentLeadRider && r.name === currentLeadRider.name && !r.followOnly;
        const posInLine = isLeading ? 1 : 2 + (idx % (count - 1));
        const draftBenefit = getDraftingBenefit(posInLine, count);
        const powerRequired = calculatePower(avgSpeedKmh, r.weight, draftBenefit);

        riderPowers[idx].push(Math.round(powerRequired));

        const deltaSec = stepDurationMinutes * 60;
        if (powerRequired > r.ftp) {
          const expendedJ = (powerRequired - r.ftp) * deltaSec;
          currentWPrimeBalance[idx] = Math.max(0, currentWPrimeBalance[idx] - expendedJ);
        } else {
          const diff = r.ftp - powerRequired;
          const tau = 546 * Math.exp(-0.01 * diff) + 316;
          const maxW = r.wPrime * 1000;
          const currentW = currentWPrimeBalance[idx];
          currentWPrimeBalance[idx] = maxW - (maxW - currentW) * Math.exp(-deltaSec / tau);
        }

        const pct = Math.round((currentWPrimeBalance[idx] / (r.wPrime * 1000)) * 100);
        riderWPrimePercent[idx].push(Math.max(0, Math.min(100, pct)));
      });
    }

    const droppedRiders = riders.map((r, idx) => {
      const minW = Math.min(...riderWPrimePercent[idx]);
      return {
        name: r.name,
        isDropped: minW <= 0,
        minWPrimePct: minW,
        avgPowerW: Math.round(riderPowers[idx].reduce((a, b) => a + b, 0) / riderPowers[idx].length)
      };
    });

    return {
      timeLabels,
      riderWPrimePercent,
      droppedRiders,
      leadPower: calculatePower(avgSpeedKmh, 70, 0),
      draftPower: calculatePower(avgSpeedKmh, 70, 0.38)
    };
  }, [distanceKm, avgSpeedKmh, rotationMinutes, gradePercent, windSpeedKmh, windDirection, riders]);

  // Auto-find optimal non-dropping cruise speed
  const findOptimalCruiseSpeed = () => {
    let low = 25, high = 55, bestSpeed = 25;
    for (let s = 50; s >= 20; s -= 1) {
      let anyDropped = false;
      const totalMinutes = (distanceKm / s) * 60;
      const count = riders.length;
      const activeLeads = riders.filter(r => !r.followOnly);

      for (let idx = 0; idx < riders.length; idx++) {
        const r = riders[idx];
        const avgBenefit = r.followOnly ? 0.38 : (0 * (1 / (activeLeads.length || 1)) + 0.38 * ((activeLeads.length - 1) / (activeLeads.length || 1)));
        const p = calculatePower(s, r.weight, avgBenefit);
        if (p > r.ftp * 1.05) {
          anyDropped = true;
          break;
        }
      }
      if (!anyDropped) {
        bestSpeed = s;
        break;
      }
    }
    setAvgSpeedKmh(bestSpeed);
  };

  const addRider = () => {
    if (riders.length >= 8) return;
    const newId = (riders.length + 1).toString();
    setRiders(prev => [
      ...prev,
      { id: newId, name: `车手 ${newId}`, weight: 68, ftp: 260, wPrime: 20, followOnly: false }
    ]);
  };

  const removeRider = (id: string) => {
    if (riders.length <= 2) return;
    setRiders(prev => prev.filter(r => r.id !== id));
  };

  const chartColors = ['#00AFFF', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#a855f7'];
  const chartData = useMemo(() => {
    return {
      labels: simulationResult.timeLabels,
      datasets: riders.map((r, idx) => ({
        label: `${r.name} (FTP: ${r.ftp}W)`,
        data: simulationResult.riderWPrimePercent[idx],
        borderColor: chartColors[idx % chartColors.length],
        backgroundColor: 'transparent',
        borderWidth: 2,
        tension: 0.2,
        pointRadius: 1
      }))
    };
  }, [simulationResult, riders]);

  const displayDistance = isImperial ? Math.round(distanceKm * 0.621371 * 10) / 10 : distanceKm;
  const handleDistanceChange = (val: number) => {
    setDistanceKm(isImperial ? Math.round((val / 0.621371) * 10) / 10 : val);
  };

  const displayAvgSpeed = isImperial ? Math.round(avgSpeedKmh * 0.621371 * 10) / 10 : avgSpeedKmh;
  const handleAvgSpeedChange = (val: number) => {
    setAvgSpeedKmh(isImperial ? Math.round((val / 0.621371) * 10) / 10 : val);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -z-10 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-semibold mb-2">
              <Users className="w-3.5 h-3.5" />
              团队空气动力学与无氧能量仿真
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">公路车团骑/跟骑阻力与战术模拟器</h1>
            <p className="text-slate-600 dark:text-slate-400 text-sm mt-1">
              模拟编队破风减阻（高达 35%~42% 瓦数节省）、轮转策略及各车手 $W'$ 无氧储备消耗与掉队预警。
            </p>
          </div>
          <button
            onClick={findOptimalCruiseSpeed}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 rounded-xl border border-emerald-500/30 text-xs font-semibold transition shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            {language === 'zh-TW' ? '求解團隊均速' : '求解团队均速'}
          </button>
        </div>
      </div>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">领骑破风所需功率</span>
          <div className="text-2xl font-bold font-mono text-rose-500 dark:text-rose-400 mt-1">
            {Math.round(simulationResult.leadPower)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">W</span>
          </div>
          <span className="text-[11px] text-slate-500">1 号位 100% 迎风阻力</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">编队跟骑节省功率</span>
          <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {Math.round(simulationResult.draftPower)} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">W</span>
          </div>
          <span className="text-[11px] text-slate-500">
            立省 {Math.round(simulationResult.leadPower - simulationResult.draftPower)} W (减阻 ~38%)
          </span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">团队巡航速度</span>
          <div className="text-2xl font-bold font-mono text-cyan-600 dark:text-cyan-400 mt-1">
            {displayAvgSpeed} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">{isImperial ? 'mph' : 'km/h'}</span>
          </div>
          <span className="text-[11px] text-slate-500">轮转间隔: {rotationMinutes} 分钟/人</span>
        </div>

        <div className="glass-card p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/60 shadow-xs">
          <span className="text-slate-500 dark:text-slate-400 text-xs font-medium block">车手生存状态</span>
          <div className="text-lg font-bold mt-1 text-slate-900 dark:text-slate-200">
            {simulationResult.droppedRiders.every(r => !r.isDropped) ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">全员安全完赛</span>
            ) : (
              <span className="text-rose-500 dark:text-rose-400 font-semibold">
                {simulationResult.droppedRiders.filter(r => r.isDropped).length} 人体力透支掉队
              </span>
            )}
          </div>
          <span className="text-[11px] text-slate-500">基于 W' 储备动态仿真</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Settings & Rider List */}
        <div className="lg:col-span-5 space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
              编队巡航与环境设定
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  巡航总距离 ({isImperial ? 'mi' : 'km'})
                </label>
                <input
                  type="number"
                  value={displayDistance}
                  onChange={(e) => handleDistanceChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">
                  目标均速 ({isImperial ? 'mph' : 'km/h'})
                </label>
                <input
                  type="number"
                  value={displayAvgSpeed}
                  onChange={(e) => handleAvgSpeedChange(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-900 dark:text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300">领骑轮转周期 (分钟/人)</label>
                <span className="text-cyan-600 dark:text-cyan-400 font-mono font-semibold text-xs">{rotationMinutes} 分钟</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="8"
                step="0.5"
                value={rotationMinutes}
                onChange={(e) => setRotationMinutes(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">坡度 (%)</label>
                <input
                  type="number"
                  step="0.5"
                  value={gradePercent}
                  onChange={(e) => setGradePercent(parseFloat(e.target.value) || 0)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:border-cyan-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">风向风速</label>
                <select
                  value={windDirection}
                  onChange={(e) => setWindDirection(e.target.value as any)}
                  className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-900 dark:text-slate-200 focus:border-cyan-500 focus:outline-none"
                >
                  <option value="headwind">顶风 ({isImperial ? '6 mph' : '10 km/h'})</option>
                  <option value="crosswind">侧风 ({isImperial ? '6 mph' : '10 km/h'})</option>
                  <option value="tailwind">顺风 ({isImperial ? '6 mph' : '10 km/h'})</option>
                </select>
              </div>
            </div>
          </div>

          {/* Rider Roster Management */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                团队车手名单 ({riders.length} 人)
              </h2>
              {riders.length < 8 && (
                <button
                  onClick={addRider}
                  className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  添加车手
                </button>
              )}
            </div>

            <div className="space-y-3">
              {riders.map((r, idx) => (
                <div key={r.id} className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => {
                        const updated = [...riders];
                        updated[idx].name = e.target.value;
                        setRiders(updated);
                      }}
                      className="text-xs font-bold text-slate-900 dark:text-slate-200 bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-slate-700 focus:border-cyan-500 focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={r.followOnly}
                          onChange={(e) => {
                            const updated = [...riders];
                            updated[idx].followOnly = e.target.checked;
                            setRiders(updated);
                          }}
                          className="rounded accent-cyan-500"
                        />
                        纯跟骑
                      </label>
                      {riders.length > 2 && (
                        <button
                          onClick={() => removeRider(r.id)}
                          className="text-slate-400 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                        体重 ({isImperial ? 'lbs' : 'kg'})
                      </span>
                      <input
                        type="number"
                        value={isImperial ? Math.round(r.weight * 2.20462) : r.weight}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          const weightKg = isImperial ? Math.round((val / 2.20462) * 10) / 10 : val;
                          const updated = [...riders];
                          updated[idx].weight = weightKg || 65;
                          setRiders(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-slate-900 dark:text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">FTP 功率 (W)</span>
                      <input
                        type="number"
                        value={r.ftp}
                        onChange={(e) => {
                          const updated = [...riders];
                          updated[idx].ftp = parseFloat(e.target.value) || 250;
                          setRiders(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-cyan-600 dark:text-cyan-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">W' 无氧储备 (kJ)</span>
                      <input
                        type="number"
                        value={r.wPrime}
                        onChange={(e) => {
                          const updated = [...riders];
                          updated[idx].wPrime = parseFloat(e.target.value) || 20;
                          setRiders(updated);
                        }}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:border-cyan-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Charts & Survival Panel */}
        <div className="lg:col-span-7 space-y-6">
          {/* W' Balance Timeline Chart */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                全员 W' 无氧能量储备消耗曲线 (W' Balance %)
              </h3>
              <span className="text-xs text-slate-500">低于 0% 发生透支掉队</span>
            </div>
            <div className="h-64 w-full">
              <Line
                data={chartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: {
                      grid: { color: 'rgba(150, 150, 150, 0.08)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } }
                    },
                    y: {
                      min: 0,
                      max: 100,
                      grid: { color: 'rgba(150, 150, 150, 0.08)' },
                      ticks: { color: '#94a3b8', font: { size: 10 } },
                      title: { display: true, text: '剩余体力 (W\' %)', color: '#64748b', font: { size: 11 } }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#94a3b8', font: { size: 11 }, boxWidth: 12 }
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

          {/* Rider Survival Analysis Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              团队战术与体能负荷分析
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {simulationResult.droppedRiders.map((dr, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-1 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">{dr.name}</span>
                    <span className={`text-[11px] font-medium ${dr.isDropped ? 'text-rose-500 dark:text-rose-400 font-bold' : 'text-emerald-600 dark:text-emerald-400'}`}>
                      {dr.isDropped ? '⚠️ 严重透支掉队' : '✅ 稳定跟骑完赛'}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between pt-1">
                    <span>全程平均功率: <strong className="text-slate-700 dark:text-slate-300 font-mono">{dr.avgPowerW}W</strong></span>
                    <span>最低剩余储备: <strong className="text-cyan-600 dark:text-cyan-400 font-mono">{dr.minWPrimePct}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
