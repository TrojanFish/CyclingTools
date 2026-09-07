import React, { useState, useMemo, useEffect } from 'react';
import {
  Users,
  Play,
  Activity,
  TrendingUp,
  Sliders,
  Shield,
  Zap,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Timer,
  Flag,
  Flame,
  Clock,
  ArrowRight,
  RotateCw
} from 'lucide-react';
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
import { IOSCard, IOSCardHeader, IOSMetricTile } from '../common/IOSCard';
import { IOSToolHeader } from '../common/IOSToolHeader';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { NumberStepper } from '../common/NumberStepper';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export interface GroupRider {
  id: string;
  name: string;
  weight: number;
  ftp: number;
  wPrime: number;
  followOnly: boolean;
  // TTT specific properties
  pullSeconds?: number;
  role?: 'leader' | 'rouleur' | 'climber' | 'sprinter' | 'domestique';
  isSacrificial?: boolean;
}

export const GroupRideSimulator: React.FC = () => {
  const { profile, activeRider } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const { showToast } = useToast();
  const isImperial = unitSystem === 'imperial';

  // Simulator Mode: 'peloton' (公路大组团骑) vs 'ttt' (车队计时赛极限轮转)
  const [mode, setMode] = useState<'peloton' | 'ttt'>('peloton');

  // Common Course & Environmental Settings
  const [distanceKm, setDistanceKm] = useState<number>(40);
  const [avgSpeedKmh, setAvgSpeedKmh] = useState<number>(42);
  const [rotationMinutes, setRotationMinutes] = useState<number>(2.0); // For peloton mode
  const [gradePercent, setGradePercent] = useState<number>(0);
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(10);
  const [windDirection, setWindDirection] = useState<'headwind' | 'crosswind' | 'tailwind'>('headwind');

  // TTT Specific Settings
  const [tttFinishRule, setTttFinishRule] = useState<'4th' | '5th' | 'last'>('4th');

  // Initial Roster
  const [riders, setRiders] = useState<GroupRider[]>([
    { id: '1', name: '车手 1 (GC主将)', weight: 68, ftp: 320, wPrime: 22, followOnly: false, pullSeconds: 15, role: 'leader', isSacrificial: false },
    { id: '2', name: '车手 2 (破风手)', weight: 75, ftp: 350, wPrime: 25, followOnly: false, pullSeconds: 30, role: 'rouleur', isSacrificial: false },
    { id: '3', name: '车手 3 (计时赛专家)', weight: 72, ftp: 340, wPrime: 24, followOnly: false, pullSeconds: 25, role: 'rouleur', isSacrificial: false },
    { id: '4', name: '车手 4 (爬坡副将)', weight: 64, ftp: 290, wPrime: 19, followOnly: false, pullSeconds: 15, role: 'climber', isSacrificial: false },
    { id: '5', name: '车手 5 (牺牲破风副将)', weight: 76, ftp: 330, wPrime: 23, followOnly: false, pullSeconds: 35, role: 'domestique', isSacrificial: true },
    { id: '6', name: '车手 6 (平路副将)', weight: 71, ftp: 310, wPrime: 20, followOnly: false, pullSeconds: 20, role: 'domestique', isSacrificial: false }
  ]);

  // Reactively sync lead rider with rider profile
  useEffect(() => {
    const currentWeight = activeRider?.weightKg || profile.weightKg;
    const currentFtp = activeRider?.ftpWatts || profile.ftpWatts;
    if (currentWeight || currentFtp) {
      setRiders(prev => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        const currentLead = updated[0];
        const newWeight = currentWeight || currentLead.weight;
        const newFtp = currentFtp || currentLead.ftp;
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
  }, [profile.weightKg, profile.ftpWatts, activeRider]);

  // Physics constants
  const RHO = 1.225, CRR = 0.004, G = 9.80665;
  // Solo CdA: Peloton road bike (~0.32), TTT TT bike aero setup (~0.23)
  const CDA_SOLO = mode === 'ttt' ? 0.23 : 0.32;

  // Drafting benefit helper
  const getDraftingBenefit = (pos: number, count: number, isPeelingOff: boolean = false) => {
    if (pos === 1) return 0; // Lead rider: 100% wind
    if (isPeelingOff) {
      // Swings off into open wind with side turbulence: only 10% benefit
      return 0.10;
    }

    if (mode === 'ttt') {
      // TTT tight echelon drafting factors
      let benefit = 0.30; // 2nd: 30% savings (70% drag)
      if (pos === 3) benefit = 0.36; // 3rd: 36% savings
      if (pos >= 4) benefit = 0.40; // 4th+: 40% savings
      if (windDirection === 'crosswind') benefit *= 0.80; // crosswind echelon less drafting
      if (windDirection === 'tailwind') benefit *= 0.88;
      return benefit;
    } else {
      // Peloton normal pack drafting
      const relativeDepth = pos / count;
      let benefit = 0.45 * (1 - Math.exp(-6 * relativeDepth));
      if (windDirection === 'crosswind') benefit *= 0.75;
      if (windDirection === 'tailwind') benefit *= 0.85;
      return benefit;
    }
  };

  const calculatePower = (speedKmh: number, weightKg: number, benefit: number, bikeWeight: number = 8.0) => {
    const v = speedKmh / 3.6;
    const vWind = windSpeedKmh / 3.6;
    const fRoll = (weightKg + bikeWeight) * G * Math.cos(Math.atan(gradePercent / 100)) * CRR;
    const fGrav = (weightKg + bikeWeight) * G * Math.sin(Math.atan(gradePercent / 100));

    let vAir = v;
    if (windDirection === 'headwind') vAir += vWind;
    else if (windDirection === 'tailwind') vAir = Math.max(0, vAir - vWind);
    else vAir = Math.sqrt(v * v + vWind * vWind);

    const fAero = 0.5 * RHO * CDA_SOLO * (1 - benefit) * (vAir * vAir);
    return Math.max(0, (fRoll + fGrav + fAero) * v);
  };

  // Switch to preset scenarios
  const [activePreset, setActivePreset] = useState<'peloton_standard' | 'ttt_worldtour' | 'ttt_regional' | null>('peloton_standard');

  const applyPreset = (presetKey: 'peloton_standard' | 'ttt_worldtour' | 'ttt_regional') => {
    setActivePreset(presetKey);
    if (presetKey === 'peloton_standard') {
      setMode('peloton');
      setDistanceKm(80);
      setAvgSpeedKmh(38);
      setRotationMinutes(2.0);
      setGradePercent(0);
      showToast(language === 'zh-TW' ? '已切換為大組團騎模式' : '已切换为大组团骑模式', 'info');
    } else if (presetKey === 'ttt_worldtour') {
      setMode('ttt');
      setDistanceKm(40);
      setAvgSpeedKmh(53);
      setGradePercent(0);
      setTttFinishRule('4th');
      showToast(language === 'zh-TW' ? '已載入世巡賽 40km TTT 戰術預設' : '已载入世巡赛 40km TTT 战术预设', 'info');
    } else if (presetKey === 'ttt_regional') {
      setMode('ttt');
      setDistanceKm(25);
      setAvgSpeedKmh(46);
      setGradePercent(0.5);
      setTttFinishRule('4th');
      showToast(language === 'zh-TW' ? '已載入俱樂部 25km TTT 預設' : '已载入俱乐部 25km TTT 预设', 'info');
    }
  };

  // Main Simulation Engine
  const simulationResult = useMemo(() => {
    const totalMinutes = (distanceKm / Math.max(5, avgSpeedKmh)) * 60;
    const totalSeconds = totalMinutes * 60;
    const timeSteps = 60;
    const stepDurationMinutes = totalMinutes / timeSteps;
    const stepDurationSeconds = stepDurationMinutes * 60;

    const timeLabels: string[] = [];
    const riderWPrimePercent: Record<number, number[]> = {};
    const riderPowers: Record<number, number[]> = {};
    const currentWPrimeBalance: Record<number, number> = {};
    const riderDroppedAtSec: Record<number, number | null> = {};

    riders.forEach((r, idx) => {
      riderWPrimePercent[idx] = [];
      riderPowers[idx] = [];
      currentWPrimeBalance[idx] = r.wPrime * 1000;
      riderDroppedAtSec[idx] = null;
    });

    // Total cycle duration for TTT rotation in seconds
    const activeRidersInRotation = riders.filter(r => !r.followOnly);
    const tttCycleSeconds = activeRidersInRotation.reduce((sum, r) => sum + (r.pullSeconds || 20), 0) || 60;

    for (let step = 0; step <= timeSteps; step++) {
      const curMinute = step * stepDurationMinutes;
      const curSecond = curMinute * 60;
      timeLabels.push(`${curMinute.toFixed(1)}m`);

      // Determine who is leading at this moment
      let leadRiderIndex = 0;
      if (mode === 'ttt') {
        // Find which rider is pulling based on cumulative seconds in the cycle
        const secondInCycle = curSecond % tttCycleSeconds;
        let accum = 0;
        for (let i = 0; i < activeRidersInRotation.length; i++) {
          accum += activeRidersInRotation[i].pullSeconds || 20;
          if (secondInCycle <= accum) {
            leadRiderIndex = riders.findIndex(r => r.id === activeRidersInRotation[i].id);
            break;
          }
        }
      } else {
        // Peloton mode: minutes per rotation
        const activeIdx = Math.floor(curMinute / rotationMinutes) % (activeRidersInRotation.length || 1);
        const leadR = activeRidersInRotation[activeIdx];
        leadRiderIndex = leadR ? riders.findIndex(r => r.id === leadR.id) : 0;
      }

      // Check how many riders are still surviving in the paceline
      const survivingCount = riders.filter((_, idx) => riderDroppedAtSec[idx] === null).length;

      riders.forEach((r, idx) => {
        // If already dropped out
        if (riderDroppedAtSec[idx] !== null) {
          riderPowers[idx].push(0);
          riderWPrimePercent[idx].push(0);
          return;
        }

        const isLeading = idx === leadRiderIndex && !r.followOnly;
        // In TTT, check if peeling off
        const isPeeling = mode === 'ttt' && !isLeading && ((curSecond % (r.pullSeconds || 20)) < 4);
        const posInLine = isLeading ? 1 : 2 + (idx % Math.max(1, survivingCount - 1));
        const draftBenefit = getDraftingBenefit(posInLine, survivingCount, isPeeling);

        const powerRequired = calculatePower(avgSpeedKmh, r.weight, draftBenefit, mode === 'ttt' ? 9.0 : 8.5);
        riderPowers[idx].push(Math.round(powerRequired));

        // W' anaerobic energy depletion or recovery
        if (powerRequired > r.ftp) {
          const expendedJ = (powerRequired - r.ftp) * stepDurationSeconds;
          currentWPrimeBalance[idx] = Math.max(0, currentWPrimeBalance[idx] - expendedJ);
        } else {
          // Recovery formula
          const diff = r.ftp - powerRequired;
          const tau = 546 * Math.exp(-0.01 * diff) + 316;
          const maxW = r.wPrime * 1000;
          const currentW = currentWPrimeBalance[idx];
          currentWPrimeBalance[idx] = maxW - (maxW - currentW) * Math.exp(-stepDurationSeconds / tau);
        }

        const pct = Math.round((currentWPrimeBalance[idx] / (r.wPrime * 1000)) * 100);
        riderWPrimePercent[idx].push(Math.max(0, Math.min(100, pct)));

        // Sacrificial domestique drop condition
        if (pct <= 0) {
          riderDroppedAtSec[idx] = curSecond;
        }
      });
    }

    // Dropped riders analysis
    const droppedRiders = riders.map((r, idx) => {
      const minW = Math.min(...riderWPrimePercent[idx]);
      const droppedSec = riderDroppedAtSec[idx];
      const droppedKm = droppedSec !== null ? Math.round((droppedSec / 3600) * avgSpeedKmh * 10) / 10 : null;
      const validPowers = riderPowers[idx].filter(p => p > 0);
      const avgPower = validPowers.length > 0 ? Math.round(validPowers.reduce((a, b) => a + b, 0) / validPowers.length) : 0;

      return {
        id: r.id,
        name: r.name,
        role: r.role || 'rouleur',
        isSacrificial: r.isSacrificial || false,
        isDropped: minW <= 0,
        droppedKm,
        minWPrimePct: minW,
        avgPowerW: avgPower
      };
    });

    // UCI TTT Finish Time calculation
    const survivingRidersCount = droppedRiders.filter(r => !r.isDropped).length;
    const targetScoringIndex = tttFinishRule === '4th' ? 3 : tttFinishRule === '5th' ? 4 : riders.length - 1;
    const isUciValid = survivingRidersCount > targetScoringIndex;

    const totalSecondsNum = totalSeconds;
    const hours = Math.floor(totalSecondsNum / 3600);
    const minutes = Math.floor((totalSecondsNum % 3600) / 60);
    const seconds = Math.floor(totalSecondsNum % 60);
    const tenths = Math.floor((totalSecondsNum % 1) * 10);
    const formattedTime = hours > 0
      ? `${hours}h ${minutes}m ${seconds}.${tenths}s`
      : `${minutes}分 ${seconds}.${tenths}秒`;

    return {
      timeLabels,
      riderWPrimePercent,
      droppedRiders,
      leadPower: calculatePower(avgSpeedKmh, 72, 0, mode === 'ttt' ? 9.0 : 8.5),
      draftPower: calculatePower(avgSpeedKmh, 72, mode === 'ttt' ? 0.38 : 0.35, mode === 'ttt' ? 9.0 : 8.5),
      formattedTime,
      totalSecondsNum,
      survivingRidersCount,
      isUciValid
    };
  }, [distanceKm, avgSpeedKmh, rotationMinutes, gradePercent, windSpeedKmh, windDirection, riders, mode, tttFinishRule]);

  // Optimal Cruise Speed Finder
  const findOptimalCruiseSpeed = () => {
    let bestSpeed = mode === 'ttt' ? 44 : 30;
    const maxTest = mode === 'ttt' ? 60 : 50;
    const minTest = 25;

    for (let s = maxTest; s >= minTest; s -= 0.5) {
      let failed = false;
      const count = riders.length;
      const activeLeads = riders.filter(r => !r.followOnly);

      for (let idx = 0; idx < riders.length; idx++) {
        const r = riders[idx];
        if (mode === 'ttt' && r.isSacrificial) continue; // Sacrificial riders are expected to drop
        const avgBenefit = r.followOnly
          ? 0.38
          : (0 * (1 / (activeLeads.length || 1)) + 0.38 * ((activeLeads.length - 1) / (activeLeads.length || 1)));
        const p = calculatePower(s, r.weight, avgBenefit, mode === 'ttt' ? 9.0 : 8.5);
        if (p > r.ftp * 1.04) {
          failed = true;
          break;
        }
      }
      if (!failed) {
        bestSpeed = s;
        break;
      }
    }
    setAvgSpeedKmh(Math.round(bestSpeed * 10) / 10);
    showToast(`已求解最佳团队均速: ${bestSpeed} km/h`, 'success');
  };

  const addRider = () => {
    if (riders.length >= 8) return;
    const newId = (riders.length + 1).toString();
    setRiders(prev => [
      ...prev,
      {
        id: newId,
        name: `车手 ${newId}`,
        weight: 70,
        ftp: 300,
        wPrime: 22,
        followOnly: false,
        pullSeconds: 20,
        role: 'rouleur',
        isSacrificial: false
      }
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
        label: `${r.name} (${r.ftp}W${r.isSacrificial ? ' · 牺牲副将' : ''})`,
        data: simulationResult.riderWPrimePercent[idx],
        borderColor: chartColors[idx % chartColors.length],
        backgroundColor: 'transparent',
        borderWidth: r.isSacrificial ? 1.5 : 2.5,
        borderDash: r.isSacrificial ? [4, 4] : [],
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
    <div className="space-y-5">
      {/* Standard Apple HIG Tool Header */}
      <IOSToolHeader
        category={
          mode === 'ttt'
            ? (language === 'zh-TW' ? 'TTT 車隊計時賽極限輪轉' : 'TTT 车队计时赛极限轮转')
            : (language === 'zh-TW' ? '公路大組團騎氣動仿真' : '公路大组团骑气动仿真')
        }
        categoryIcon={Users}
        title={
          mode === 'ttt'
            ? (language === 'zh-TW' ? 'TTT 車隊計時賽秒級推演與戰術模擬器' : 'TTT 车队计时赛秒级推演与战术模拟器')
            : (language === 'zh-TW' ? '公路車團騎/跟騎阻力與戰術模擬器' : '公路车团骑/跟骑阻力与战术模拟器')
        }
        description={
          mode === 'ttt'
            ? '世巡赛 TTT 计时赛秒级轮转换位、侧后方脱离风阻扰动、牺牲副将燃尽退场与 UCI 第 4 人冲线成绩推导。'
            : '模拟大组编队破风减阻（高达 35%~42% 瓦数节省）、轮转策略及各车手 W\' 无氧储备消耗与掉队预警。'
        }
        tint="mint"
        actions={
          <button
            onClick={findOptimalCruiseSpeed}
            className="apple-touch h-9 px-3.5 sm:px-4 bg-ios-mint hover:bg-ios-mint/90 text-slate-950 rounded-xl text-xs font-bold transition shadow-ios-sm flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {language === 'zh-TW' ? '求解最高不破產均速' : '求解最高不破产均速'}
          </button>
        }
      >
        {/* Mode Switcher & Presets */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="w-full sm:w-72">
            <IOSSegmentedControl
              options={[
                { value: 'peloton', label: language === 'zh-TW' ? '公路大組團騎' : '公路大组团骑' },
                { value: 'ttt', label: language === 'zh-TW' ? 'TTT 車隊計時賽' : 'TTT 车队计时赛' }
              ]}
              value={mode}
              onChange={(v) => {
                setMode(v as 'peloton' | 'ttt');
                if (v === 'ttt') {
                  setAvgSpeedKmh(52);
                  setDistanceKm(40);
                } else {
                  setAvgSpeedKmh(38);
                  setDistanceKm(80);
                }
              }}
              size="sm"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-ios-mint" />
              {language === 'zh-TW' ? '場景預設:' : '场景预设:'}
            </span>
            {mode === 'ttt' ? (
              <div className="w-full sm:w-auto">
                <IOSSegmentedControl
                  options={[
                    { value: 'ttt_worldtour', label: '世巡赛 40km TTT' },
                    { value: 'ttt_regional', label: '俱乐部 25km TTT' }
                  ]}
                  value={activePreset === 'ttt_worldtour' || activePreset === 'ttt_regional' ? activePreset : ''}
                  onChange={(v) => applyPreset(v as any)}
                  size="sm"
                />
              </div>
            ) : (
              <div className="w-full sm:w-auto">
                <IOSSegmentedControl
                  options={[
                    { value: 'peloton_standard', label: '标准大组团骑 80km' }
                  ]}
                  value={activePreset === 'peloton_standard' ? 'peloton_standard' : ''}
                  onChange={(v) => applyPreset(v as any)}
                  size="sm"
                />
              </div>
            )}
          </div>
        </div>
      </IOSToolHeader>

      {/* Highlights Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <IOSMetricTile
          label={mode === 'ttt' ? 'TTT 领骑破风功率' : '领骑破风所需功率'}
          value={Math.round(simulationResult.leadPower)}
          unit="W"
          subValue={mode === 'ttt' ? 'TT 车气动位 100% 阻力' : '大组 1 号位 100% 阻力'}
          accent="red"
        />
        <IOSMetricTile
          label={mode === 'ttt' ? '高速跟骑尾流功率' : '编队跟骑功率'}
          value={Math.round(simulationResult.draftPower)}
          unit="W"
          subValue={`省 ${Math.round(simulationResult.leadPower - simulationResult.draftPower)} W (~38%)`}
          accent="green"
        />
        <IOSMetricTile
          label={mode === 'ttt' ? '预测完赛官方成绩' : '团队巡航速度'}
          value={mode === 'ttt' ? simulationResult.formattedTime : displayAvgSpeed}
          unit={mode === 'ttt' ? '' : (isImperial ? 'mph' : 'km/h')}
          subValue={mode === 'ttt' ? `均速: ${avgSpeedKmh} km/h` : `轮转: ${rotationMinutes} 分钟/人`}
          accent="mint"
        />
        <IOSMetricTile
          label={mode === 'ttt' ? 'UCI 冲线标准判定' : '车手体能生存状态'}
          value={
            mode === 'ttt'
              ? (simulationResult.isUciValid ? `达标 (${simulationResult.survivingRidersCount}人完赛)` : '成绩无效 (掉队过多)')
              : (simulationResult.droppedRiders.every(r => !r.isDropped) ? '全员完赛' : `${simulationResult.droppedRiders.filter(r => r.isDropped).length} 人掉队`)
          }
          unit=""
          subValue={mode === 'ttt' ? `基于第 ${tttFinishRule === '4th' ? '4' : '5'} 名冲线规则` : "基于 W' 无氧储备"}
          accent={
            (mode === 'ttt' ? simulationResult.isUciValid : simulationResult.droppedRiders.every(r => !r.isDropped))
              ? 'mint'
              : 'orange'
          }
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Settings & Rider List */}
        <div className="lg:col-span-5 space-y-4">
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-4">
            <IOSCardHeader
              title={mode === 'ttt' ? 'TTT 赛道与极限节奏参数' : '编队巡航与环境设定'}
              icon={Sliders}
              iconColor="mint"
              action={
                <span className="text-[11px] font-mono font-bold text-ios-mint">
                  CdA: {CDA_SOLO}
                </span>
              }
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  {mode === 'ttt' ? 'TTT 赛段总距离' : '巡航总距离'} ({isImperial ? 'mi' : 'km'})
                </label>
                <NumberStepper
                  value={displayDistance}
                  onChange={handleDistanceChange}
                  min={5}
                  max={300}
                  step={1}
                  unit={isImperial ? 'mi' : 'km'}
                  decimals={1}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  目标团队均速 ({isImperial ? 'mph' : 'km/h'})
                </label>
                <NumberStepper
                  value={displayAvgSpeed}
                  onChange={handleAvgSpeedChange}
                  min={20}
                  max={70}
                  step={0.5}
                  unit={isImperial ? 'mph' : 'km/h'}
                  decimals={1}
                />
              </div>
            </div>

            {/* Rotation controls: Second level for TTT vs Minute level for Peloton */}
            {mode === 'ttt' ? (
              <div className="p-3.5 rounded-2xl bg-ios-mint/10 border border-ios-mint/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-ios-mint flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5" />
                    UCI 官方计分冲线规则
                  </span>
                  <span className="text-[10px] text-slate-500">世巡赛标准</span>
                </div>
                <IOSSegmentedControl
                  options={[
                    { value: '4th', label: '第 4 人冲线 (UCI 标准)' },
                    { value: '5th', label: '第 5 人冲线 (7-8人队)' },
                    { value: 'last', label: '全员不掉队' }
                  ]}
                  value={tttFinishRule}
                  onChange={(v) => setTttFinishRule(v as any)}
                />
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  车队总成绩以第 {tttFinishRule === '4th' ? '4' : tttFinishRule === '5th' ? '5' : '最后'} 位过线车手的车头触线时间为准。允许前序破风手牺牲自爆。
                </p>
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">领骑轮转周期 (分钟/人)</label>
                  <span className="text-ios-mint font-mono font-bold text-xs">{rotationMinutes} 分钟</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="8"
                  step="0.5"
                  value={rotationMinutes}
                  onChange={(e) => setRotationMinutes(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-ios-mint"
                />
              </div>
            )}

            <div className="space-y-3 pt-3 border-t border-slate-200/80 dark:border-white/10">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">道路坡度 (%)</label>
                <NumberStepper
                  value={gradePercent}
                  onChange={setGradePercent}
                  min={-15}
                  max={20}
                  step={0.5}
                  unit="%"
                  decimals={1}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">风向风阻</label>
                <IOSSegmentedControl
                  options={[
                    { value: 'headwind', label: `顶风 (${isImperial ? '6 mph' : '10 km/h'})` },
                    { value: 'crosswind', label: `侧风 (${isImperial ? '6 mph' : '10 km/h'})` },
                    { value: 'tailwind', label: `顺风 (${isImperial ? '6 mph' : '10 km/h'})` }
                  ]}
                  value={windDirection}
                  onChange={(v) => setWindDirection(v as any)}
                />
              </div>
            </div>
          </IOSCard>

          {/* Rider Roster Management */}
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-4">
            <IOSCardHeader
              title={`${mode === 'ttt' ? 'TTT 车队出战编队' : '团队车手名单'} (${riders.length} 人)`}
              icon={Users}
              iconColor="mint"
              action={
                riders.length < 8 ? (
                  <button
                    onClick={addRider}
                    className="flex items-center gap-1 text-xs text-ios-mint hover:opacity-80 font-medium apple-touch px-2.5 py-1 rounded-full bg-ios-mint/10 dark:bg-ios-mint/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    添加车手
                  </button>
                ) : undefined
              }
            />

            <div className="space-y-3">
              {riders.map((r, idx) => (
                <div key={r.id} className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={r.name}
                      onChange={(e) => {
                        const updated = [...riders];
                        updated[idx].name = e.target.value;
                        setRiders(updated);
                      }}
                      className="text-xs font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-ios-mint focus:outline-none"
                    />
                    <div className="flex items-center gap-3">
                      {mode === 'ttt' ? (
                        <label className="flex items-center gap-1 text-[11px] font-semibold text-red-500 dark:text-red-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.isSacrificial || false}
                            onChange={(e) => {
                              const updated = [...riders];
                              updated[idx].isSacrificial = e.target.checked;
                              setRiders(updated);
                            }}
                            className="rounded accent-red-500"
                          />
                          牺牲副将
                        </label>
                      ) : (
                        <label className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={r.followOnly}
                            onChange={(e) => {
                              const updated = [...riders];
                              updated[idx].followOnly = e.target.checked;
                              setRiders(updated);
                            }}
                            className="rounded accent-ios-mint"
                          />
                          纯跟骑
                        </label>
                      )}
                      {riders.length > 2 && (
                        <button
                          onClick={() => removeRider(r.id)}
                          className="text-slate-400 hover:text-red-500 transition apple-touch"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
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
                        className="w-full bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-xl px-2 py-1 text-xs text-slate-900 dark:text-white font-mono focus:border-ios-mint focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">FTP (W)</span>
                      <input
                        type="number"
                        value={r.ftp}
                        onChange={(e) => {
                          const updated = [...riders];
                          updated[idx].ftp = parseFloat(e.target.value) || 250;
                          setRiders(updated);
                        }}
                        className="w-full bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-xl px-2 py-1 text-xs text-ios-mint font-mono font-bold focus:border-ios-mint focus:outline-none"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">W' 储备 (kJ)</span>
                      <input
                        type="number"
                        value={r.wPrime}
                        onChange={(e) => {
                          const updated = [...riders];
                          updated[idx].wPrime = parseFloat(e.target.value) || 20;
                          setRiders(updated);
                        }}
                        className="w-full bg-white/90 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-xl px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold focus:border-ios-mint focus:outline-none"
                      />
                    </div>
                    {mode === 'ttt' && (
                      <div>
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">领骑时长 (s)</span>
                        <input
                          type="number"
                          min={5}
                          max={90}
                          step={5}
                          value={r.pullSeconds || 20}
                          onChange={(e) => {
                            const updated = [...riders];
                            updated[idx].pullSeconds = parseInt(e.target.value) || 20;
                            setRiders(updated);
                          }}
                          className="w-full bg-white/90 dark:bg-black/40 border border-amber-500/50 rounded-xl px-2 py-1 text-xs text-amber-600 dark:text-amber-400 font-mono font-bold focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </IOSCard>
        </div>

        {/* Right Charts & Survival Panel */}
        <div className="lg:col-span-7 space-y-4">
          {/* W' Balance Timeline Chart */}
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-3">
            <IOSCardHeader
              title={
                mode === 'ttt'
                  ? 'TTT 编队极限放电: W\' 无氧电池动态消耗曲线'
                  : '全员 W\' 无氧能量储备消耗曲线 (W\' Balance %)'
              }
              icon={TrendingUp}
              iconColor="mint"
              action={<span className="text-xs text-slate-400">低于 0% 即破产脱离</span>}
            />
            <div className="h-60 w-full">
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
                      ticks: { color: '#AEAEB2', font: { size: 10 } },
                      title: { display: true, text: '剩余体力 (W\' %)', color: '#8E8E93', font: { size: 11 } }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: { color: '#AEAEB2', font: { size: 11 }, boxWidth: 12 }
                    },
                    tooltip: {
                      backgroundColor: 'rgba(28, 28, 30, 0.95)',
                      borderColor: 'rgba(0, 199, 190, 0.3)',
                      borderWidth: 1
                    }
                  }
                }}
              />
            </div>
          </IOSCard>

          {/* Rider Survival Analysis Summary */}
          <IOSCard variant="default" className="p-4 sm:p-5 space-y-3.5">
            <IOSCardHeader
              title={mode === 'ttt' ? 'TTT 战术角色履职与体能负载评估' : '团队战术与体能负荷分析'}
              icon={Shield}
              iconColor="mint"
              action={
                mode === 'ttt' ? (
                  <span className="text-[11px] font-mono font-bold text-ios-mint">
                    {simulationResult.survivingRidersCount} / {riders.length} 人通过终点
                  </span>
                ) : undefined
              }
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {simulationResult.droppedRiders.map((dr, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-slate-200/70 dark:border-white/10 space-y-1.5 shadow-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {dr.name}
                      {dr.isSacrificial && (
                        <span className="px-1.5 py-0.2 rounded-sm text-[9px] bg-red-500/15 text-red-500 font-normal">
                          自杀式副将
                        </span>
                      )}
                    </span>
                    <span className={`text-[11px] font-medium flex items-center gap-1 ${dr.isDropped ? 'text-red-500 font-bold' : 'text-emerald-500'}`}>
                      {dr.isDropped ? (
                        <>
                          <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>
                            {dr.droppedKm ? `燃尽于 ${dr.droppedKm}km` : (language === 'zh-TW' ? '嚴重透支掉隊' : '严重透支掉队')}
                          </span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{language === 'zh-TW' ? '穩定跟騎完賽' : '稳定跟骑完赛'}</span>
                        </>
                      )}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex justify-between pt-1">
                    <span>平均功率: <strong className="text-slate-700 dark:text-slate-300 font-mono">{dr.avgPowerW}W</strong></span>
                    <span>最低储备: <strong className="text-ios-mint font-mono">{dr.minWPrimePct}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </IOSCard>

          {/* TTT Tactical Guidance Card */}
          {mode === 'ttt' && (
            <div className="p-4 rounded-2xl bg-ios-mint/10 border border-ios-mint/20 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-ios-mint">
                <Flag className="w-4 h-4 text-ios-mint" />
                世巡赛顶级车队 TTT 战术锦囊
              </div>
              <ul className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1 leading-relaxed list-disc list-inside">
                <li><strong>短平快轮转：</strong>平路秒级轮转（15-25秒）效率远高于长领骑（1分钟），能最大限度阻止乳酸在无氧区堆积；</li>
                <li><strong>平滑脱离交接：</strong>交接车手切忌减速过猛，应沿侧后方平缓滑行，借助尾流在第 4/第 5 位迅速扣回队列；</li>
                <li><strong>副将精准自爆：</strong>牺牲型大马力副将在最后 10km 前完成超长暴力破风后退场，主将与核心小队轻装全速冲刺冲线。</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
