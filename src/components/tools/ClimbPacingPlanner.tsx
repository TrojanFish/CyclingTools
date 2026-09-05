import React, { useState, useMemo, useEffect } from 'react';
import { Mountain, Activity, Zap, Play, Plus, Trash2, Clock, ArrowUpRight, Flame, ShieldAlert, Award, Copy, CheckCircle2, TrendingUp, Upload } from 'lucide-react';
import { Line } from 'react-chartjs-2';
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
  Filler,
} from 'chart.js';
import { NumberStepper } from '../common/NumberStepper';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useToast } from '../../context/ToastContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

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

interface ClimbSegment {
  id: string;
  name: string;
  distanceKm: number;
  gradePct: number;
  customPowerTargetPct?: number; // % of FTP
}

export const ClimbPacingPlanner: React.FC = () => {
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const { showToast } = useToast();

  const isImperial = unitSystem === 'imperial';

  const [riderWeight, setRiderWeight] = useState<number>(profile.weightKg || 68);
  const [bikeWeight, setBikeWeight] = useState<number>(profile.bikeWeightKg || 8.5);
  const [ftpWatts, setFtpWatts] = useState<number>(profile.ftpWatts || 240);

  // Reactively synchronize with global rider profile
  useEffect(() => {
    if (profile.weightKg) setRiderWeight(profile.weightKg);
    if (profile.bikeWeightKg) setBikeWeight(profile.bikeWeightKg);
    if (profile.ftpWatts) setFtpWatts(profile.ftpWatts);
  }, [profile.weightKg, profile.bikeWeightKg, profile.ftpWatts]);

  const [pacingStrategy, setPacingStrategy] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');

  const [segments, setSegments] = useState<ClimbSegment[]>([
    { id: '1', name: '起步缓坡过渡段', distanceKm: 2.0, gradePct: 4.5 },
    { id: '2', name: '核心陡坡攻坚段', distanceKm: 3.5, gradePct: 8.5 },
    { id: '3', name: '盘山连续发卡弯', distanceKm: 2.5, gradePct: 6.8 },
    { id: '4', name: '终点冲刺顶峰段', distanceKm: 1.5, gradePct: 5.2 },
  ]);

  const [climbName, setClimbName] = useState<string>('莫干山经典挑战爬坡线');

  // Manual GPX / TCX Climbing Route Upload & Intelligent Auto-segmentation
  const handleGpxClimbUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(content, 'text/xml');
        let trkpts = xmlDoc.getElementsByTagName('trkpt');
        if (trkpts.length === 0) trkpts = xmlDoc.getElementsByTagName('rtept');
        if (trkpts.length === 0) trkpts = xmlDoc.getElementsByTagName('Trackpoint');

        if (trkpts.length < 2) {
          showToast('未能识别到有效的 GPS 航迹点数据！', 'error', '请确认上传的是标准 .gpx / .tcx 爬坡路线文件');
          return;
        }

        interface RawPoint {
          lat: number;
          lon: number;
          ele: number;
        }
        const rawPoints: RawPoint[] = [];
        for (let i = 0; i < trkpts.length; i++) {
          const pt = trkpts[i];
          let lat = parseFloat(pt.getAttribute('lat') || '0');
          let lon = parseFloat(pt.getAttribute('lon') || '0');
          if (!lat) {
            const pos = pt.getElementsByTagName('Position')[0];
            if (pos) {
              lat = parseFloat(pos.getElementsByTagName('LatitudeDegrees')[0]?.textContent || '0');
              lon = parseFloat(pos.getElementsByTagName('LongitudeDegrees')[0]?.textContent || '0');
            }
          }
          const eleNode = pt.getElementsByTagName('ele')[0] || pt.getElementsByTagName('AltitudeMeters')[0];
          const ele = eleNode ? parseFloat(eleNode.textContent || '0') : 0;
          if (lat && lon) {
            rawPoints.push({ lat, lon, ele });
          }
        }

        if (rawPoints.length < 4) {
          showToast('轨迹点数量过少，无法进行高精度分段！', 'warning');
          return;
        }

        // Distance calc
        const distanceHaversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
          const R = 6371000;
          const dLat = (lat2 - lat1) * Math.PI / 180;
          const dLon = (lon2 - lon1) * Math.PI / 180;
          const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
          return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        };

        let totalDistM = 0;
        const ptsWithDist: { distM: number; ele: number }[] = [{ distM: 0, ele: rawPoints[0].ele }];
        for (let i = 1; i < rawPoints.length; i++) {
          const d = distanceHaversine(rawPoints[i - 1].lat, rawPoints[i - 1].lon, rawPoints[i].lat, rawPoints[i].lon);
          totalDistM += d;
          ptsWithDist.push({ distM: totalDistM, ele: rawPoints[i].ele });
        }

        // Slice into natural 3~7 segments
        const numSegments = Math.min(7, Math.max(3, Math.round(totalDistM / 2200)));
        const segTargetDist = totalDistM / numSegments;

        const generatedSegments: ClimbSegment[] = [];
        let currentSegStartIdx = 0;

        for (let s = 1; s <= numSegments; s++) {
          const targetDist = s * segTargetDist;
          let endIdx = ptsWithDist.findIndex(p => p.distM >= targetDist);
          if (endIdx === -1 || s === numSegments) endIdx = ptsWithDist.length - 1;

          const startPt = ptsWithDist[currentSegStartIdx];
          const endPt = ptsWithDist[endIdx];
          const distKm = parseFloat(((endPt.distM - startPt.distM) / 1000).toFixed(1));
          const eleDiff = endPt.ele - startPt.ele;
          let gradePct = distKm > 0 ? parseFloat(((eleDiff / (distKm * 1000)) * 100).toFixed(1)) : 0;
          gradePct = Math.max(-15, Math.min(25, gradePct));

          let segTypeLabel = '平缓推进段';
          if (gradePct >= 9.5) segTypeLabel = '极限发卡急陡坡';
          else if (gradePct >= 6.8) segTypeLabel = '核心陡坡攻坚段';
          else if (gradePct >= 4.0) segTypeLabel = '持续盘山爬升段';
          else if (gradePct < 0) segTypeLabel = '起伏/下坡缓和段';

          generatedSegments.push({
            id: Date.now().toString() + s,
            name: `第${s}段: ${segTypeLabel} (${gradePct >= 0 ? '+' : ''}${gradePct}%)`,
            distanceKm: Math.max(0.2, distKm),
            gradePct: gradePct
          });

          currentSegStartIdx = endIdx;
        }

        setSegments(generatedSegments);
        const parsedName = file.name.replace(/\.[^/.]+$/, '');
        setClimbName(parsedName);
        showToast('GPX 爬坡路线导入成功！', 'success', `已智能拆解为 ${generatedSegments.length} 个爬坡分段，总里程 ${(totalDistM / 1000).toFixed(1)}km`);
      } catch (err) {
        showToast('GPX 文件解析失败，请检查文件格式！', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Classic Mountain Presets (Domestic & International Grand Tours)
  const loadPreset = (key: string) => {
    if (key === 'longjing') {
      setClimbName('杭州龙井问茶经典爬坡');
      setSegments([
        { id: '1', name: '龙井路口起步', distanceKm: 1.0, gradePct: 4.2 },
        { id: '2', name: '中段陡坡发卡弯', distanceKm: 1.4, gradePct: 7.8 },
        { id: '3', name: '翁家山顶峰冲刺', distanceKm: 0.8, gradePct: 5.5 }
      ]);
      showToast('已加载龙井问茶爬坡预设', 'info');
    } else if (key === 'miaofeng') {
      setClimbName('北京门头沟妙峰山经典路段');
      setSegments([
        { id: '1', name: '牌坊起步热身', distanceKm: 5.0, gradePct: 3.8 },
        { id: '2', name: '涧沟村前持续爬坡', distanceKm: 6.5, gradePct: 5.2 },
        { id: '3', name: '涧沟村发卡陡坡', distanceKm: 4.0, gradePct: 7.0 },
        { id: '4', name: '顶峰娘娘庙终点', distanceKm: 5.0, gradePct: 4.5 }
      ]);
      showToast('已加载北京妙峰山预设', 'info');
    } else if (key === 'tianhuang') {
      setClimbName('安吉天荒坪江南天池天路');
      setSegments([
        { id: '1', name: '大溪峡谷入山口', distanceKm: 4.0, gradePct: 4.5 },
        { id: '2', name: '长谷洞天连续弯道', distanceKm: 5.5, gradePct: 6.2 },
        { id: '3', name: '藏龙百瀑高坡段', distanceKm: 5.0, gradePct: 7.5 },
        { id: '4', name: '天池大坝冲顶', distanceKm: 3.5, gradePct: 4.8 }
      ]);
      showToast('已加载安吉天荒坪预设', 'info');
    } else if (key === 'balang') {
      setClimbName('川西巴朗山熊猫王国巅峰天路');
      setSegments([
        { id: '1', name: '邓生沟峡谷段 (海拔2700m)', distanceKm: 8.0, gradePct: 4.6 },
        { id: '2', name: '贝母坪高山草甸 (海拔3400m)', distanceKm: 10.0, gradePct: 5.8 },
        { id: '3', name: '巴朗山垭口冲顶 (海拔4487m)', distanceKm: 12.0, gradePct: 6.5 }
      ]);
      showToast('已加载巴朗山高原天路预设', 'info');
    } else if (key === 'alpedhuez') {
      setClimbName('环法·阿尔普迪埃 (Alpe d\'Huez)');
      setSegments([
        { id: '1', name: '谷底起步急升弯 (Bourg d\'Oisans)', distanceKm: 2.5, gradePct: 10.2 },
        { id: '2', name: '圣尼古拉森林路段 (St. Nicolas)', distanceKm: 4.5, gradePct: 8.5 },
        { id: '3', name: '于埃村中间平缓段 (Huez Village)', distanceKm: 3.5, gradePct: 7.2 },
        { id: '4', name: '终点滑雪场冲刺 (Alpe Station 1860m)', distanceKm: 3.3, gradePct: 8.9 }
      ]);
      showToast('已加载环法阿尔普迪埃 21道拐预设', 'info');
    } else if (key === 'stelvio') {
      setClimbName('环意·斯泰尔维奥 (Passo dello Stelvio)');
      setSegments([
        { id: '1', name: '特劳福伊入山口 (Trafoi)', distanceKm: 8.0, gradePct: 5.8 },
        { id: '2', name: '48道高山发卡弯攻坚', distanceKm: 9.0, gradePct: 8.2 },
        { id: '3', name: '终点雪山垭口冲顶 (海拔2757m)', distanceKm: 7.3, gradePct: 8.6 }
      ]);
      showToast('已加载环意最高殿堂斯泰尔维奥预设', 'info');
    } else if (key === 'sacalobra') {
      setClimbName('马略卡·卡洛布拉 (Sa Calobra)');
      setSegments([
        { id: '1', name: '海港峡湾起点盘旋', distanceKm: 2.5, gradePct: 6.5 },
        { id: '2', name: '悬崖岩石发卡急坡', distanceKm: 4.0, gradePct: 7.8 },
        { id: '3', name: '领带扣360度立交冲顶', distanceKm: 2.9, gradePct: 6.8 }
      ]);
      showToast('已加载马略卡骑行圣地卡洛布拉预设', 'info');
    }
  };

  // Base strategy factor on FTP
  const baseStrategyFactor = useMemo(() => {
    if (pacingStrategy === 'conservative') return 0.88; // 88% FTP (Z3 Tempo)
    if (pacingStrategy === 'balanced') return 0.96; // 96% FTP (SweetSpot/Threshold)
    return 1.05; // 105% FTP (Z4 Threshold/Z5)
  }, [pacingStrategy]);

  // Main Calculation Engine for Pacing & Climbing Physics
  const planResults = useMemo(() => {
    const g = 9.80665;
    const totalMass = riderWeight + bikeWeight;
    const crr = 0.0038;
    const cda = 0.32;
    const rho = 1.20;

    let accumulatedDistanceKm = 0;
    let accumulatedElevationM = 0;
    let totalSeconds = 0;
    let weightedPowerSeconds = 0;

    const segmentOutputs = segments.map((seg, idx) => {
      const eleGain = seg.distanceKm * 1000 * (seg.gradePct / 100);
      accumulatedElevationM += eleGain;

      // Smart Gradient Pacing: on steep slopes (>7%), slightly increase power up to +6%, on gentle slopes (<4%), save energy
      let slopePacingMod = 1.0;
      if (seg.gradePct >= 8) slopePacingMod = 1.05;
      else if (seg.gradePct >= 6) slopePacingMod = 1.02;
      else if (seg.gradePct <= 3.5) slopePacingMod = 0.94;

      const targetWatts = Math.round(ftpWatts * baseStrategyFactor * slopePacingMod);
      const targetWkg = parseFloat((targetWatts / riderWeight).toFixed(2));
      const targetFtpPct = Math.round((targetWatts / ftpWatts) * 100);

      // Solve velocity for this segment: P = (F_g + F_r + F_a) * v
      const gradeRad = Math.atan(seg.gradePct / 100);
      const fGrav = totalMass * g * Math.sin(gradeRad);
      const fRoll = totalMass * g * Math.cos(gradeRad) * crr;

      let low = 0.5, high = 30, v = 3;
      for (let i = 0; i < 40; i++) {
        v = (low + high) / 2;
        const fAero = 0.5 * rho * cda * (v * v);
        const reqPower = (fGrav + fRoll + fAero) * v;
        if (reqPower < targetWatts) low = v;
        else high = v;
      }

      const speedKmh = parseFloat((v * 3.6).toFixed(1));
      const segSeconds = (seg.distanceKm / Math.max(1, speedKmh)) * 3600;
      totalSeconds += segSeconds;
      weightedPowerSeconds += targetWatts * segSeconds;

      const vam = Math.round(v * (seg.gradePct / 100) * 3600);
      const minutes = Math.floor(segSeconds / 60);
      const seconds = Math.round(segSeconds % 60);
      const timeStr = `${minutes}分${seconds < 10 ? '0' : ''}${seconds}秒`;

      accumulatedDistanceKm += seg.distanceKm;

      // Cadence calculation under compact 34-34T ratio (~2.15m rollout)
      const estimatedCadenceRpm = Math.max(30, Math.round((speedKmh * 1000 / 60) / 2.15));
      const isSteepTorqueHazard = seg.gradePct >= 11 && estimatedCadenceRpm < 65;

      return {
        ...seg,
        eleGain: Math.round(eleGain),
        targetWatts,
        targetWkg,
        targetFtpPct,
        speedKmh,
        segSeconds,
        timeStr,
        vam,
        estimatedCadenceRpm,
        isSteepTorqueHazard,
        isOverThreshold: targetFtpPct > 102
      };
    });

    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalRemSeconds = Math.round(totalSeconds % 60);
    const totalHours = (totalSeconds / 3600).toFixed(2);
    const overallTimeStr = totalMinutes >= 60
      ? `${Math.floor(totalMinutes / 60)}小时${totalMinutes % 60}分${totalRemSeconds}秒`
      : `${totalMinutes}分${totalRemSeconds}秒`;

    const avgWatts = Math.round(weightedPowerSeconds / Math.max(1, totalSeconds));
    const avgWkg = parseFloat((avgWatts / riderWeight).toFixed(2));
    const overallVam = totalSeconds > 0 ? Math.round((accumulatedElevationM / totalSeconds) * 3600) : 0;
    const avgGrade = accumulatedDistanceKm > 0 ? parseFloat(((accumulatedElevationM / (accumulatedDistanceKm * 1000)) * 100).toFixed(1)) : 0;
    const hasSteepTorqueHazard = segmentOutputs.some(s => s.isSteepTorqueHazard);

    return {
      totalDistanceKm: parseFloat(accumulatedDistanceKm.toFixed(1)),
      totalElevationM: Math.round(accumulatedElevationM),
      avgGrade,
      overallTimeStr,
      avgWatts,
      avgWkg,
      overallVam,
      hasSteepTorqueHazard,
      segmentOutputs
    };
  }, [segments, riderWeight, bikeWeight, ftpWatts, baseStrategyFactor]);

  // Chart dataset for Elevation Profile vs Target Power
  const chartData = useMemo(() => {
    const labels = planResults.segmentOutputs.map(s => s.name);
    return {
      labels,
      datasets: [
        {
          type: 'line' as const,
          label: '坡度 (%)',
          data: planResults.segmentOutputs.map(s => s.gradePct),
          borderColor: '#f59e0b',
          backgroundColor: 'transparent',
          borderWidth: 2.5,
          yAxisID: 'y1',
          tension: 0.2,
          pointRadius: 4,
          pointBackgroundColor: '#f59e0b'
        },
        {
          type: 'bar' as const,
          label: '建议输出功率 (W)',
          data: planResults.segmentOutputs.map(s => s.targetWatts),
          backgroundColor: 'rgba(0, 175, 255, 0.4)',
          borderColor: '#00AFFF',
          borderWidth: 1.5,
          borderRadius: 6,
          yAxisID: 'y',
        }
      ]
    };
  }, [planResults]);

  const addSegment = () => {
    const newId = (segments.length + 1).toString();
    setSegments(prev => [
      ...prev,
      { id: newId, name: `分段 #${newId}`, distanceKm: 2.0, gradePct: 6.0 }
    ]);
  };

  const removeSegment = (id: string) => {
    if (segments.length <= 1) return;
    setSegments(prev => prev.filter(s => s.id !== id));
  };

  const copyPacingPlan = () => {
    const text = `SoloRiderTools 爬坡路段分段配速与功率规划 (${climbName}):
- 路线全长: ${planResults.totalDistanceKm} km | 累计爬升: +${planResults.totalElevationM} m (平均坡度 ${planResults.avgGrade}%)
- 预计登顶总耗时: ${planResults.overallTimeStr}
- 建议全程均瓦: ${planResults.avgWatts} W (${planResults.avgWkg} W/kg) | 平均 VAM: ${planResults.overallVam} m/h
----------------------------------------
分段目标功率明细:
${planResults.segmentOutputs.map((s, idx) => `${idx + 1}. [${s.name}] ${s.distanceKm}km @ ${s.gradePct}% -> 目标 ${s.targetWatts}W (${s.targetFtpPct}% FTP, ${s.speedKmh}km/h, 耗时 ${s.timeStr})`).join('\n')}`;
    navigator.clipboard.writeText(text);
    showToast('完整爬坡配速规划报告已复制到剪贴板！', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="ios-card p-6 sm:p-7 rounded-3xl relative overflow-hidden shadow-ios-sm isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-blue/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-semibold mb-2">
              <Mountain className="w-3.5 h-3.5" />
              {language === 'zh-TW' ? '爬坡體能分配與動力學模擬' : '爬坡体能分配与动力学仿真'}
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              {language === 'zh-TW' ? '爬坡路段分段配速與功率規劃器' : '爬坡路段分段配速与功率规划器'}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 text-sm mt-1">
              {language === 'zh-TW'
                ? '挑戰名山防爆缸神器！分段拆解爬坡路段坡度，結合 FTP 與推重比科學規劃各分段目標功率，預估登頂耗時與體能負荷。'
                : '挑战名山防爆缸神器！分段拆解爬坡路段坡度，结合 FTP 与推重比科学规划各分段目标功率，预估登顶耗时与体能负荷。'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <label className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 cursor-pointer transition shadow-ios-sm apple-touch">
              <Upload className="w-4 h-4 text-ios-blue" />
              <span>{language === 'zh-TW' ? '匯入 GPX 路線' : '导入 GPX 爬坡路线'}</span>
              <input type="file" accept=".gpx,.tcx,.xml" onChange={handleGpxClimbUpload} className="hidden" />
            </label>

            <button
              onClick={copyPacingPlan}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 rounded-2xl text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            >
              <Copy className="w-3.5 h-3.5 text-ios-blue" />
              <span>{language === 'zh-TW' ? '複製計劃' : '复制计划'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Mountains & Route Upload Bar */}
      <div className="ios-card p-4 rounded-3xl border border-slate-200/80 dark:border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-ios-card">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {language === 'zh-TW' ? '精選名山:' : '精选名山:'}
          </span>
          <button
            onClick={() => loadPreset('longjing')}
            className="px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="杭州龙井 (3.2km)"
          >
            杭州龙井
          </button>
          <button
            onClick={() => loadPreset('miaofeng')}
            className="px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="北京妙峰山 (20.5km)"
          >
            北京妙峰山
          </button>
          <button
            onClick={() => loadPreset('tianhuang')}
            className="px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="安吉天荒坪 (18km)"
          >
            安吉天荒坪
          </button>
          <button
            onClick={() => loadPreset('balang')}
            className="px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="巴朗山 (30km)"
          >
            巴朗山
          </button>
          <button
            onClick={() => loadPreset('alpedhuez')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-ios-blue text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="环法殿堂 Alpe d'Huez 21道拐 (13.8km)"
          >
            <Mountain className="w-3.5 h-3.5 text-ios-blue" />
            <span>阿尔普迪埃</span>
          </button>
          <button
            onClick={() => loadPreset('stelvio')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-ios-blue text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="环意最高峰 Passo dello Stelvio 48弯 (24.3km)"
          >
            <Mountain className="w-3.5 h-3.5 text-ios-blue" />
            <span>斯泰尔维奥</span>
          </button>
          <button
            onClick={() => loadPreset('sacalobra')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-2xl bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/15 text-ios-blue text-xs font-semibold border border-slate-200/80 dark:border-white/10 transition shadow-ios-sm apple-touch"
            title="马略卡骑行圣地 Sa Calobra (9.4km)"
          >
            <Mountain className="w-3.5 h-3.5 text-ios-blue" />
            <span>卡洛布拉</span>
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 max-w-xs">
          <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
            {language === 'zh-TW' ? '當前爬坡:' : '当前爬坡:'}
          </label>
          <input
            type="text"
            value={climbName}
            onChange={(e) => setClimbName(e.target.value)}
            className="w-full bg-white/80 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-2xl px-3 py-1 text-xs text-ios-blue font-semibold focus:outline-none focus:border-ios-blue"
          />
        </div>
      </div>

      {/* 4 Hero Metric Summary Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <IOSMetricTile
          label={language === 'zh-TW' ? '預計登頂總耗時' : '预计登顶总耗时'}
          value={planResults.overallTimeStr}
          unit=""
          subValue={`${planResults.totalDistanceKm} km`}
          accent="blue"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '累計爬升高度' : '累计爬升高度'}
          value={`+${planResults.totalElevationM}`}
          unit="m"
          subValue={`${language === 'zh-TW' ? '平均坡度' : '平均坡度'} ${planResults.avgGrade}%`}
          accent="orange"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '建議全程均瓦' : '建议全程均瓦'}
          value={planResults.avgWatts}
          unit="W"
          subValue={`${planResults.avgWkg} W/kg`}
          accent="green"
        />
        <IOSMetricTile
          label={language === 'zh-TW' ? '預估垂直升速' : '预估垂直升速'}
          value={planResults.overallVam}
          unit="m/h"
          subValue="VAM"
          accent="purple"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs & Segments */}
        <div className="lg:col-span-5 space-y-6">
          {/* Rider Parameters */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-5 shadow-ios-card">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-ios-blue" />
              {language === 'zh-TW' ? '車手功率與爬坡攻堅策略' : '车手功率与爬坡攻坚策略'}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '車手 FTP 閾值功率' : '车手 FTP 阈值功率'} (W)
                </label>
                <NumberStepper value={ftpWatts} onChange={setFtpWatts} step={5} min={100} max={500} unit="W" />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1.5">
                  {language === 'zh-TW' ? '車手淨重' : '车手净重'} ({isImperial ? 'lbs' : 'kg'})
                </label>
                <NumberStepper
                  value={isImperial ? parseFloat((riderWeight * 2.20462).toFixed(1)) : riderWeight}
                  onChange={(v) => setRiderWeight(isImperial ? parseFloat((v / 2.20462).toFixed(1)) : v)}
                  step={isImperial ? 1 : 0.5}
                  min={isImperial ? 66 : 40}
                  max={isImperial ? 330 : 120}
                  unit={isImperial ? 'lbs' : 'kg'}
                  decimals={1}
                />
              </div>
            </div>

            {/* Pacing Strategy Segmented Control */}
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-2">
                {language === 'zh-TW' ? '攀爬攻堅策略激進度' : '攀爬攻坚策略激进度'}
              </label>
              <IOSSegmentedControl
                options={[
                  { value: 'conservative', label: language === 'zh-TW' ? '穩妥 (88%)' : '稳妥 (88%)' },
                  { value: 'balanced', label: language === 'zh-TW' ? '均衡 (96%)' : '均衡 (96%)' },
                  { value: 'aggressive', label: language === 'zh-TW' ? '極限 (105%)' : '极限 (105%)' }
                ]}
                value={pacingStrategy}
                onChange={(v) => setPacingStrategy(v as any)}
              />
            </div>
          </div>

          {/* Segments Editor */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-4 shadow-ios-card">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Mountain className="w-4 h-4 text-ios-blue" />
                {language === 'zh-TW' ? `爬坡路段分段拆解 (${segments.length} 個分段)` : `爬坡路段分段拆解 (${segments.length} 个分段)`}
              </h2>
              <button
                onClick={addSegment}
                className="flex items-center gap-1 text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                {language === 'zh-TW' ? '添加分段' : '添加分段'}
              </button>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {segments.map((seg, idx) => (
                <div key={seg.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={seg.name}
                      onChange={(e) => {
                        const copy = [...segments];
                        copy[idx].name = e.target.value;
                        setSegments(copy);
                      }}
                      className="text-xs font-bold text-slate-900 dark:text-slate-200 bg-transparent focus:outline-none focus:text-cyan-500 flex-1 mr-2"
                    />
                    {segments.length > 1 && (
                      <button
                        onClick={() => removeSegment(seg.id)}
                        className="text-slate-400 hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        {language === 'zh-TW' ? '分段長度' : '分段长度'} (km) {isImperial ? `(${(seg.distanceKm * 0.621371).toFixed(1)} mi)` : ''}
                      </span>
                      <NumberStepper
                        value={seg.distanceKm}
                        onChange={(v) => {
                          const copy = [...segments];
                          copy[idx].distanceKm = v;
                          setSegments(copy);
                        }}
                        step={0.5}
                        min={0.2}
                        max={30}
                        unit="km"
                        decimals={1}
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block mb-1">
                        {language === 'zh-TW' ? '平均坡度' : '平均坡度'} (%)
                      </span>
                      <NumberStepper
                        value={seg.gradePct}
                        onChange={(v) => {
                          const copy = [...segments];
                          copy[idx].gradePct = v;
                          setSegments(copy);
                        }}
                        step={0.5}
                        min={0.5}
                        max={25}
                        unit="%"
                        decimals={1}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Output & Pacing Blueprint */}
        <div className="lg:col-span-7 space-y-6">
          {/* Visual Chart: Elevation Profile & Target Watts */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-ios-card">
            <div className="flex justify-between items-center text-xs">
              <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-ios-blue" />
                {language === 'zh-TW' ? '各分段坡度與目標配速功率階梯曲線' : '各分段坡度与目标配速功率阶梯曲线'}
              </span>
              <span className="text-slate-400 dark:text-slate-500 text-[10px]">
                {'*双坐标轴动态拟合'}
              </span>
            </div>

            <div className="h-56">
              <Line
                data={chartData as any}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  scales: {
                    x: { grid: { color: 'rgba(255, 255, 255, 0.05)' }, ticks: { font: { size: 10 } } },
                    y: {
                      type: 'linear' as const,
                      display: true,
                      position: 'left' as const,
                      grid: { color: 'rgba(255, 255, 255, 0.05)' },
                      title: { display: true, text: '功率 (Watts)', color: '#007aff', font: { size: 10 } }
                    },
                    y1: {
                      type: 'linear' as const,
                      display: true,
                      position: 'right' as const,
                      grid: { drawOnChartArea: false },
                      title: { display: true, text: '坡度 (%)', color: '#ff9500', font: { size: 10 } }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Steep Slope Low-Cadence Torque Alert */}
          {planResults.hasSteepTorqueHazard && (
            <div className="ios-card p-5 rounded-3xl border border-ios-red/30 bg-ios-red/10 flex items-start gap-3 shadow-ios-card">
              <ShieldAlert className="w-5 h-5 text-ios-red shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'zh-TW' ? '陡坡極低踏頻與肌力負荷預警' : '陡坡极低踏频与肌力负荷预警'}</span>
                  <span className="font-mono px-2 py-0.5 bg-ios-red/20 text-ios-red rounded-full text-[10px] font-bold">
                    {'踏频 < 65 RPM'}
                  </span>
                </div>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {language === 'zh-TW'
                    ? '檢測到路線存在坡度 ≥11% 的攻堅分段！在常規 34-34T 齒比下，踩踏踏頻將逼近 60 RPM 甚至更低。重踏（Grinding）危害：極低踏頻將急劇加大膝蓋髕股關節剪切壓，引發局部乳酸暴增與抽筋。戰術建議：① 改裝 36T / 40T 爬坡大飛輪；② 進坡前提前拉高踏頻蓄勢；③ 採取「坐騎結合間歇站姿搖車」卸載股四頭肌峰值扭矩。'
                    : '检测到路线存在坡度 ≥11% 的攻坚分段！在常规 34-34T 齿比下，踩踏踏频将逼近 60 RPM 甚至更低。重踏（Grinding）危害：极低踏频将急剧加大膝盖髌股关节剪切压，引发局部肌酸暴增与抽筋。战术建议：① 改装 36T / 40T 爬坡大飞轮；② 进坡前提前拉高踏频蓄势；③ 采取「坐骑结合间歇站姿摇车」卸载股四头肌峰值扭矩。'}
                </p>
              </div>
            </div>
          )}

          {/* Segment Details Table */}
          <div className="ios-card p-6 rounded-3xl border border-slate-200/80 dark:border-white/10 space-y-3 shadow-ios-card">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white">
              {language === 'zh-TW' ? '各路段功率執行方案與預計耗時明細表' : '各路段功率执行方案与预计耗时明细表'}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-slate-200/80 dark:border-white/10 text-slate-500 dark:text-slate-400">
                    <th className="pb-2">{language === 'zh-TW' ? '分段名' : '分段名'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '距離 / 坡度' : '距离 / 坡度'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '建議功率' : '建议功率'}</th>
                    <th className="pb-2">{'推重比 / FTP%'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '預估踏頻' : '预估踏频'}</th>
                    <th className="pb-2">{language === 'zh-TW' ? '預估耗時' : '预估耗时'}</th>
                    <th className="pb-2">{'VAM'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 dark:divide-white/5 font-mono text-slate-700 dark:text-slate-300">
                  {planResults.segmentOutputs.map((s, idx) => (
                    <tr key={idx} className="hover:bg-black/5 dark:hover:bg-white/5 transition">
                      <td className="py-2.5 font-sans font-semibold text-slate-900 dark:text-white">{s.name}</td>
                      <td>
                        {s.distanceKm}km {isImperial ? `(${(s.distanceKm * 0.621371).toFixed(1)}mi)` : ''} /{' '}
                        <span className="text-ios-orange font-bold">{s.gradePct}%</span>
                      </td>
                      <td className="text-ios-blue font-bold">{s.targetWatts} W</td>
                      <td>{s.targetWkg} W/kg ({s.targetFtpPct}%)</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          s.isSteepTorqueHazard
                            ? 'bg-ios-red/15 text-ios-red font-bold'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}>
                          ~{s.estimatedCadenceRpm} RPM
                        </span>
                      </td>
                      <td className="text-ios-green font-semibold">{s.timeStr}</td>
                      <td className="text-ios-purple">
                        {s.vam} m/h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
