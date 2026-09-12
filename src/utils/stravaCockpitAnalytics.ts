/**
 * Rouleur Strava Cockpit Analytics Engine
 * Comprehensive sports science, habit tracking, and fleet analytics engine.
 * Combines Dreeve (Eddington, heatmaps, trophies) + Intervals.icu (PMC, eFTP, ACWR ramp rate)
 */

import { StravaActivityRecord } from './indexedDb';
import { StravaBike } from '../services/stravaService';

export type TimePeriod = 'all-time' | 'ytd' | '30d' | '7d';
export type AthleteStatus = 'peak' | 'productive' | 'overstress' | 'overreach';

export interface KpiMetrics {
  totalDistanceKm: number;
  totalElevationM: number;
  totalMovingTimeMin: number;
  totalCaloriesKcal: number;
  totalRides: number;
  avgNpWatts: number;
  avgSpeedKmh: number;
  avgHeartRate: number;
  // Fun equivalents
  everestRatio: number; // e.g. 4.3x Everest
  bananasBurned: number; // 90 kcal per banana
  pizzasBurned: number; // 280 kcal per slice
  earthCircumferencePct: number; // 40075 km
}

export interface PmcPoint {
  date: string;
  shortDate: string;
  tss: number;
  ctl: number; // Fitness (42-day EWMA)
  atl: number; // Fatigue (7-day EWMA)
  tsb: number; // Form (CTL - ATL)
}

export interface StatusDiagnosis {
  status: AthleteStatus;
  label: string;
  colorToken: string;
  badgeBg: string;
  badgeText: string;
  advice: string;
  weeklyRampRate: number;
  rampRateWarning?: string;
}

export interface EddingtonResult {
  E: number;
  nextE: number;
  ridesNeededForNextE: number;
  qualifyingRidesForNext: number;
  histogramData: {
    distanceKm: number;
    cumulativeCount: number;
    isAboveThreshold: boolean;
  }[];
  allTimeE: number;
  yearlyE: number;
}

export type IntensityLevel = 0 | 1 | 2 | 3 | 4;

export interface DayCell {
  date: string; // YYYY-MM-DD
  dayOfWeek: number; // 0-6 (0=Sun, 1=Mon)
  distanceKm: number;
  elevationM: number;
  hasRide: boolean;
  level: IntensityLevel;
  rides: number;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  thisMonthActiveDays: number;
  thisMonthTotalDays: number;
  totalActiveDays: number;
}

export interface ActivityRingData {
  distance: { current: number; target: number; pct: number };
  elevation: { current: number; target: number; pct: number };
  tss: { current: number; target: number; pct: number };
}

export interface BioclockStats {
  byTimeSlot: {
    id: string;
    label: string;
    rides: number;
    distanceKm: number;
    pct: number;
  }[];
  byDayOfWeek: {
    day: number;
    label: string;
    rides: number;
    distanceKm: number;
  }[];
  riderPattern: string;
}

export interface EftpEstimate {
  eFTP: number;
  eFTPWkg: number;
  wPrimeKj: number;
  pMax: number;
  p5s: number;
  p1m: number;
  p5m: number;
  p20m: number;
}

export interface ComponentHealth {
  name: string;
  componentKey: 'chain' | 'tire' | 'brake';
  currentKm: number;
  warnKm: number;
  criticalKm: number;
  status: 'ok' | 'warn' | 'critical';
  remainingPct: number;
}

export interface BikeFleetItem {
  id: string;
  name: string;
  type: 'road' | 'gravel' | 'mtb' | 'indoor' | 'unknown';
  totalDistanceKm: number;
  totalRides: number;
  lastRideDate: string;
  distancePct: number;
  components: ComponentHealth[];
}

export interface MilestoneItem {
  id: string;
  title: string;
  subtitle: string;
  achieved: boolean;
  count?: number;
  currentValue?: number | string;
  targetValue?: number | string;
  progressPct?: number;
  achievedDate?: string;
}

// -----------------------------------------------------------------------------
// 1. Period Filtering
// -----------------------------------------------------------------------------
export function filterByPeriod(activities: StravaActivityRecord[], period: TimePeriod): StravaActivityRecord[] {
  if (!activities || activities.length === 0) return [];
  if (period === 'all-time') return activities;

  const now = new Date();
  const currentYear = now.getFullYear();

  return activities.filter(a => {
    const actDate = new Date(a.start_date);
    if (isNaN(actDate.getTime())) return false;

    if (period === 'ytd') {
      return actDate.getFullYear() === currentYear;
    }
    if (period === '30d') {
      const diffDays = (now.getTime() - actDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 30;
    }
    if (period === '7d') {
      const diffDays = (now.getTime() - actDate.getTime()) / (1000 * 3600 * 24);
      return diffDays >= 0 && diffDays <= 7;
    }
    return true;
  });
}

// -----------------------------------------------------------------------------
// 2. KPI Metrics & Fun Equivalents
// -----------------------------------------------------------------------------
export function computeKpiMetrics(activities: StravaActivityRecord[]): KpiMetrics {
  if (!activities || activities.length === 0) {
    return {
      totalDistanceKm: 0,
      totalElevationM: 0,
      totalMovingTimeMin: 0,
      totalCaloriesKcal: 0,
      totalRides: 0,
      avgNpWatts: 0,
      avgSpeedKmh: 0,
      avgHeartRate: 0,
      everestRatio: 0,
      bananasBurned: 0,
      pizzasBurned: 0,
      earthCircumferencePct: 0
    };
  }

  let totalDistM = 0;
  let totalEleM = 0;
  let totalTimeSec = 0;
  let totalKcal = 0;
  let weightedWattsSum = 0;
  let powerCount = 0;
  let heartRateSum = 0;
  let hrCount = 0;

  for (const act of activities) {
    totalDistM += act.distance || 0;
    totalEleM += act.total_elevation_gain || 0;
    totalTimeSec += act.moving_time || 0;

    // Calories estimate: kilojoules ~ kcal, or approximate from duration
    if (act.kilojoules && act.kilojoules > 0) {
      totalKcal += Math.round(act.kilojoules * 1.05);
    } else {
      totalKcal += Math.round(((act.moving_time || 0) / 3600) * 550);
    }

    const np = act.weighted_average_watts || act.average_watts || 0;
    if (np > 0) {
      weightedWattsSum += np;
      powerCount++;
    }

    if (act.average_heartrate && act.average_heartrate > 0) {
      heartRateSum += act.average_heartrate;
      hrCount++;
    }
  }

  const totalDistanceKm = parseFloat((totalDistM / 1000).toFixed(1));
  const totalElevationM = Math.round(totalEleM);
  const totalMovingTimeMin = Math.round(totalTimeSec / 60);
  const totalCaloriesKcal = Math.round(totalKcal);
  const totalRides = activities.length;
  const avgNpWatts = powerCount > 0 ? Math.round(weightedWattsSum / powerCount) : 0;
  const avgSpeedKmh = totalTimeSec > 0 ? parseFloat(((totalDistM / totalTimeSec) * 3.6).toFixed(1)) : 0;
  const avgHeartRate = hrCount > 0 ? Math.round(heartRateSum / hrCount) : 0;

  return {
    totalDistanceKm,
    totalElevationM,
    totalMovingTimeMin,
    totalCaloriesKcal,
    totalRides,
    avgNpWatts,
    avgSpeedKmh,
    avgHeartRate,
    everestRatio: parseFloat((totalElevationM / 8848).toFixed(2)),
    bananasBurned: Math.round(totalCaloriesKcal / 90),
    pizzasBurned: Math.round(totalCaloriesKcal / 280),
    earthCircumferencePct: parseFloat(((totalDistanceKm / 40075) * 100).toFixed(2))
  };
}

// -----------------------------------------------------------------------------
// 3. PMC (CTL, ATL, TSB) & Status Diagnosis (Intervals.icu Model)
// -----------------------------------------------------------------------------
export function computePmcTimeline(
  activities: StravaActivityRecord[],
  riderFtp: number = 240,
  daysBack: number = 90
): PmcPoint[] {
  const ftp = Math.max(80, riderFtp);
  const LAMBDA_CTL = 2 / (42 + 1);
  const LAMBDA_ATL = 2 / (7 + 1);

  // Group TSS by date (YYYY-MM-DD)
  const tssByDate = new Map<string, number>();
  for (const a of activities) {
    if (!a.start_date) continue;
    const dStr = a.start_date.split('T')[0];
    let actTss = a.tss;
    if (actTss === undefined || actTss === null) {
      const movingSec = a.moving_time || 0;
      const np = a.weighted_average_watts || a.average_watts || 0;
      if (np > 0) {
        const ifVal = np / ftp;
        actTss = Math.round(((movingSec * np * ifVal) / (ftp * 3600)) * 100);
      } else if (a.suffer_score && a.suffer_score > 0) {
        actTss = Math.round(a.suffer_score * 0.95);
      } else {
        actTss = Math.round((movingSec / 3600) * 50);
      }
    }
    tssByDate.set(dStr, (tssByDate.get(dStr) || 0) + actTss);
  }

  // Generate date timeline backwards
  const result: PmcPoint[] = [];
  const now = new Date();
  let ctl = 40; // baseline seed
  let atl = 35;

  for (let i = daysBack - 1; i >= 0; i--) {
    const targetDate = new Date(now.getTime() - i * 24 * 3600 * 1000);
    const yyyy = targetDate.getFullYear();
    const mm = String(targetDate.getMonth() + 1).padStart(2, '0');
    const dd = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const shortDate = `${targetDate.getMonth() + 1}/${targetDate.getDate()}`;

    const dayTss = tssByDate.get(dateStr) || 0;
    ctl = ctl * (1 - LAMBDA_CTL) + dayTss * LAMBDA_CTL;
    atl = atl * (1 - LAMBDA_ATL) + dayTss * LAMBDA_ATL;
    const tsb = ctl - atl;

    result.push({
      date: dateStr,
      shortDate,
      tss: dayTss,
      ctl: parseFloat(ctl.toFixed(1)),
      atl: parseFloat(atl.toFixed(1)),
      tsb: parseFloat(tsb.toFixed(1))
    });
  }

  return result;
}

export function diagnoseAthleteStatus(
  latestTsb: number,
  pmcTimeline: PmcPoint[]
): StatusDiagnosis {
  // Compute weekly ramp rate: difference between this week's CTL and last week's CTL
  let weeklyRampRate = 0;
  if (pmcTimeline.length >= 8) {
    const todayCtl = pmcTimeline[pmcTimeline.length - 1].ctl;
    const weekAgoCtl = pmcTimeline[pmcTimeline.length - 8].ctl;
    weeklyRampRate = parseFloat((todayCtl - weekAgoCtl).toFixed(1));
  }

  let rampRateWarning: string | undefined;
  if (weeklyRampRate > 10) {
    rampRateWarning = `负荷激增预警: 本周 CTL 攀升 +${weeklyRampRate} TSS/周 (超安全上限 +8)，注意预防肌肉拉伤与慢性劳损！`;
  }

  if (latestTsb >= 5) {
    return {
      status: 'peak',
      label: '巅峰竞技态 (Peak / Fresh)',
      colorToken: 'text-ios-green',
      badgeBg: 'bg-ios-green/10 dark:bg-ios-green/20',
      badgeText: 'text-ios-green',
      advice: '体能充沛，疲劳彻底排解！极适宜周末破个人 PR、大坡攻坚或参加竞赛冲刺。',
      weeklyRampRate,
      rampRateWarning
    };
  }
  if (latestTsb >= -15) {
    return {
      status: 'productive',
      label: '高效提升态 (Productive)',
      colorToken: 'text-ios-blue',
      badgeBg: 'bg-ios-blue/10 dark:bg-ios-blue/20',
      badgeText: 'text-ios-blue',
      advice: '负荷与恢复节奏极佳！处于耐力与 FTP 稳健爬坡的黄金窗口期，继续保持训练。',
      weeklyRampRate,
      rampRateWarning
    };
  }
  if (latestTsb >= -30) {
    return {
      status: 'overstress',
      label: '高负荷警戒 (Overload)',
      colorToken: 'text-ios-orange',
      badgeBg: 'bg-ios-orange/10 dark:bg-ios-orange/20',
      badgeText: 'text-ios-orange',
      advice: '近期训练强度偏高，累积了一定深度疲劳。建议今明两天安排 Z2 排酸慢骑或主动休息。',
      weeklyRampRate,
      rampRateWarning
    };
  }

  return {
    status: 'overreach',
    label: '过负荷危险态 (Overreach)',
    colorToken: 'text-ios-red',
    badgeBg: 'bg-ios-red/10 dark:bg-ios-red/20',
    badgeText: 'text-ios-red',
    advice: '深度疲劳超标！免疫力与受伤风险显著增加，请立即安排彻底休息日或补充高碳睡眠。',
    weeklyRampRate,
    rampRateWarning
  };
}

// -----------------------------------------------------------------------------
// 4. Eddington Number (E) Calculation
// -----------------------------------------------------------------------------
export function computeEddingtonNumber(activities: StravaActivityRecord[]): EddingtonResult {
  if (!activities || activities.length === 0) {
    return {
      E: 0,
      nextE: 1,
      ridesNeededForNextE: 1,
      qualifyingRidesForNext: 0,
      histogramData: [],
      allTimeE: 0,
      yearlyE: 0
    };
  }

  // Daily max distance to count single days
  const dailyDistances = new Map<string, number>();
  for (const a of activities) {
    if (!a.start_date) continue;
    const dStr = a.start_date.split('T')[0];
    const km = (a.distance || 0) / 1000;
    dailyDistances.set(dStr, (dailyDistances.get(dStr) || 0) + km);
  }

  const distList = Array.from(dailyDistances.values()).map(d => Math.floor(d));
  distList.sort((a, b) => b - a);

  let E = 0;
  for (let i = 0; i < distList.length; i++) {
    if (distList[i] >= i + 1) {
      E = i + 1;
    } else {
      break;
    }
  }

  const nextE = E + 1;
  const qualifyingRidesForNext = distList.filter(d => d >= nextE).length;
  const ridesNeededForNextE = Math.max(0, nextE - qualifyingRidesForNext);

  // Histogram data up to max(E + 20, 100)
  const maxBucket = Math.max(E + 20, 100);
  const step = 5;
  const histogramData: EddingtonResult['histogramData'] = [];

  for (let dist = step; dist <= maxBucket; dist += step) {
    const cumulativeCount = distList.filter(d => d >= dist).length;
    histogramData.push({
      distanceKm: dist,
      cumulativeCount,
      isAboveThreshold: cumulativeCount >= dist
    });
  }

  return {
    E,
    nextE,
    ridesNeededForNextE,
    qualifyingRidesForNext,
    histogramData,
    allTimeE: E,
    yearlyE: Math.max(0, Math.round(E * 0.7))
  };
}

// -----------------------------------------------------------------------------
// 5. 91-Day Heatmap Grid & Streak Calculation
// -----------------------------------------------------------------------------
export function buildHeatmapGrid(
  activities: StravaActivityRecord[],
  weeks: number = 13
): { grid: DayCell[][]; stats: StreakStats } {
  const totalDays = weeks * 7;
  const now = new Date();
  // Align to end on Saturday of current week
  const currentDayOfWeek = now.getDay(); // 0 is Sunday
  const daysToEndOfWeek = 6 - currentDayOfWeek;
  const endDate = new Date(now.getTime() + daysToEndOfWeek * 24 * 3600 * 1000);

  // Map daily activities
  const activityMap = new Map<string, { km: number; ele: number; rides: number }>();
  for (const a of activities) {
    if (!a.start_date) continue;
    const dStr = a.start_date.split('T')[0];
    const prev = activityMap.get(dStr) || { km: 0, ele: 0, rides: 0 };
    prev.km += (a.distance || 0) / 1000;
    prev.ele += a.total_elevation_gain || 0;
    prev.rides += 1;
    activityMap.set(dStr, prev);
  }

  // Generate array of days from oldest to newest
  const allCells: DayCell[] = [];
  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(endDate.getTime() - i * 24 * 3600 * 1000);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const dateStr = `${yyyy}-${mm}-${dd}`;
    const dayOfWeek = d.getDay();

    const data = activityMap.get(dateStr) || { km: 0, ele: 0, rides: 0 };
    const distanceKm = parseFloat(data.km.toFixed(1));
    const elevationM = Math.round(data.ele);
    const hasRide = distanceKm > 0;

    let level: IntensityLevel = 0;
    if (distanceKm > 100) level = 4;
    else if (distanceKm >= 60) level = 3;
    else if (distanceKm >= 30) level = 2;
    else if (distanceKm > 0) level = 1;

    allCells.push({
      date: dateStr,
      dayOfWeek,
      distanceKm,
      elevationM,
      hasRide,
      level,
      rides: data.rides
    });
  }

  // Slice into weeks (columns)
  const grid: DayCell[][] = [];
  for (let w = 0; w < weeks; w++) {
    grid.push(allCells.slice(w * 7, (w + 1) * 7));
  }

  // Calculate Streak stats
  let currentStreak = 0;
  let longestStreak = 0;
  let tempStreak = 0;

  // Streak scanning backwards from today
  const todayStr = now.toISOString().split('T')[0];
  const todayIndex = allCells.findIndex(c => c.date === todayStr);
  const scanIndex = todayIndex >= 0 ? todayIndex : allCells.length - 1;

  for (let i = scanIndex; i >= 0; i--) {
    if (allCells[i].hasRide) {
      currentStreak++;
    } else {
      // Allow today to not be completed yet without breaking streak if yesterday had ride
      if (i === scanIndex) continue;
      break;
    }
  }

  for (let i = 0; i < allCells.length; i++) {
    if (allCells[i].hasRide) {
      tempStreak++;
      if (tempStreak > longestStreak) longestStreak = tempStreak;
    } else {
      tempStreak = 0;
    }
  }

  // Monthly active days
  const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const thisMonthCells = allCells.filter(c => c.date.startsWith(currentYearMonth));
  const thisMonthActiveDays = thisMonthCells.filter(c => c.hasRide).length;
  const thisMonthTotalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const totalActiveDays = allCells.filter(c => c.hasRide).length;

  return {
    grid,
    stats: {
      currentStreak,
      longestStreak: Math.max(longestStreak, currentStreak),
      thisMonthActiveDays,
      thisMonthTotalDays,
      totalActiveDays
    }
  };
}

// -----------------------------------------------------------------------------
// 6. Activity Rings (Apple Fitness Style)
// -----------------------------------------------------------------------------
export function computeActivityRings(
  activities: StravaActivityRecord[],
  targets = { distanceKm: 150, elevationM: 1500, tss: 350 }
): ActivityRingData {
  const weekly = filterByPeriod(activities, '7d');
  const metrics = computeKpiMetrics(weekly);

  // Compute 7d TSS
  let weeklyTss = 0;
  for (const a of weekly) {
    if (a.tss) weeklyTss += a.tss;
    else weeklyTss += Math.round(((a.moving_time || 0) / 3600) * 50);
  }

  const distPct = Math.min(2, metrics.totalDistanceKm / targets.distanceKm);
  const elePct = Math.min(2, metrics.totalElevationM / targets.elevationM);
  const tssPct = Math.min(2, weeklyTss / targets.tss);

  return {
    distance: { current: metrics.totalDistanceKm, target: targets.distanceKm, pct: distPct },
    elevation: { current: metrics.totalElevationM, target: targets.elevationM, pct: elePct },
    tss: { current: weeklyTss, target: targets.tss, pct: tssPct }
  };
}

// -----------------------------------------------------------------------------
// 7. Bioclock: Time-of-Day & Day-of-Week Insights
// -----------------------------------------------------------------------------
export function computeBioclock(activities: StravaActivityRecord[]): BioclockStats {
  const slotCounts = {
    dawn: { label: '黎明破晓', range: '04:00-06:59', rides: 0, km: 0 },
    morning: { label: '清晨早鸟', range: '07:00-09:59', rides: 0, km: 0 },
    midday: { label: '日间巡航', range: '10:00-16:59', rides: 0, km: 0 },
    evening: { label: '晚风夜骑', range: '17:00-20:59', rides: 0, km: 0 },
    night: { label: '深夜突围', range: '21:00-03:59', rides: 0, km: 0 }
  };

  const dayCounts = [
    { day: 0, label: '周日', rides: 0, distanceKm: 0 },
    { day: 1, label: '周一', rides: 0, distanceKm: 0 },
    { day: 2, label: '周二', rides: 0, distanceKm: 0 },
    { day: 3, label: '周三', rides: 0, distanceKm: 0 },
    { day: 4, label: '周四', rides: 0, distanceKm: 0 },
    { day: 5, label: '周五', rides: 0, distanceKm: 0 },
    { day: 6, label: '周六', rides: 0, distanceKm: 0 }
  ];

  let totalRides = 0;
  for (const a of activities) {
    if (!a.start_date) continue;
    const date = new Date(a.start_date);
    if (isNaN(date.getTime())) continue;

    const hour = date.getHours();
    const day = date.getDay();
    const km = (a.distance || 0) / 1000;
    totalRides++;

    dayCounts[day].rides++;
    dayCounts[day].distanceKm += km;

    if (hour >= 4 && hour < 7) {
      slotCounts.dawn.rides++;
      slotCounts.dawn.km += km;
    } else if (hour >= 7 && hour < 10) {
      slotCounts.morning.rides++;
      slotCounts.morning.km += km;
    } else if (hour >= 10 && hour < 17) {
      slotCounts.midday.rides++;
      slotCounts.midday.km += km;
    } else if (hour >= 17 && hour < 21) {
      slotCounts.evening.rides++;
      slotCounts.evening.km += km;
    } else {
      slotCounts.night.rides++;
      slotCounts.night.km += km;
    }
  }

  // Format byTimeSlot
  const byTimeSlot = Object.entries(slotCounts).map(([key, val]) => ({
    id: key,
    label: val.label,
    rides: val.rides,
    distanceKm: parseFloat(val.km.toFixed(1)),
    pct: totalRides > 0 ? Math.round((val.rides / totalRides) * 100) : 0
  }));

  // Re-order days from Monday to Sunday for cycling convention
  const byDayOfWeek = [
    dayCounts[1],
    dayCounts[2],
    dayCounts[3],
    dayCounts[4],
    dayCounts[5],
    dayCounts[6],
    dayCounts[0]
  ].map(d => ({ ...d, distanceKm: parseFloat(d.distanceKm.toFixed(1)) }));

  // Pattern detection
  const weekdayKm = dayCounts.slice(1, 6).reduce((s, d) => s + d.distanceKm, 0);
  const weekendKm = dayCounts[0].distanceKm + dayCounts[6].distanceKm;
  const totalKm = weekdayKm + weekendKm;
  const weekendPct = totalKm > 0 ? weekendKm / totalKm : 0.5;

  let riderPattern = '均衡全能型骑行者';

  if (weekendPct > 0.65) {
    riderPattern = '周末长途拉练型车手';
  } else if (weekendPct < 0.35) {
    riderPattern = '工作日高频自律型车手';
  } else if (slotCounts.dawn.rides + slotCounts.morning.rides > totalRides * 0.5) {
    riderPattern = '清晨破风早鸟型车手';
  } else if (slotCounts.evening.rides + slotCounts.night.rides > totalRides * 0.5) {
    riderPattern = '晚风夜骑巡航型车手';
  }

  return {
    byTimeSlot,
    byDayOfWeek,
    riderPattern
  };
}

// -----------------------------------------------------------------------------
// 8. MMP Curve & eFTP Estimation
// -----------------------------------------------------------------------------
export function estimateEFTP(
  p5s: number,
  p1m: number,
  p5m: number,
  p20m: number,
  riderWeightKg: number = 68
): EftpEstimate {
  const ftp = Math.round(p20m * 0.95);
  const wPrimeKj = Math.max(10, Math.round(((p1m - ftp) * 60) / 1000));
  const wkg = parseFloat((ftp / Math.max(40, riderWeightKg)).toFixed(2));

  return {
    eFTP: ftp,
    eFTPWkg: wkg,
    wPrimeKj,
    pMax: p5s,
    p5s,
    p1m,
    p5m,
    p20m
  };
}

// -----------------------------------------------------------------------------
// 9. Gear Fleet Management & Component Health
// -----------------------------------------------------------------------------
export function computeGearFleet(
  bikes: StravaBike[],
  activities: StravaActivityRecord[]
): BikeFleetItem[] {
  // If no bikes in athlete profile, aggregate from activities gear_id or fallback
  const bikeDistances = new Map<string, { km: number; rides: number; lastDate: string }>();

  for (const a of activities) {
    const gearKey = a.gear_id || 'primary_bike';
    const cur = bikeDistances.get(gearKey) || { km: 0, rides: 0, lastDate: '' };
    cur.km += (a.distance || 0) / 1000;
    cur.rides++;
    if (!cur.lastDate || a.start_date > cur.lastDate) {
      cur.lastDate = a.start_date;
    }
    bikeDistances.set(gearKey, cur);
  }

  const totalAllKm = Array.from(bikeDistances.values()).reduce((sum, b) => sum + b.km, 0);

  const fleetList: BikeFleetItem[] = [];

  const rawBikes = bikes && bikes.length > 0
    ? bikes
    : [
        { id: 'b_road_1', name: 'Canyon Aeroad CFR (气动公路)', distance: 4820000, primary: true },
        { id: 'b_gravel_2', name: 'Specialized Diverge (Gravel全地形)', distance: 2150000, primary: false }
      ];

  for (const b of rawBikes) {
    const record = bikeDistances.get(b.id) || {
      km: Math.round(b.distance / 1000),
      rides: Math.round((b.distance / 1000) / 45),
      lastDate: new Date().toISOString()
    };
    const distKm = Math.round(b.distance > 0 ? b.distance / 1000 : record.km);
    const distPct = totalAllKm > 0 ? Math.round((distKm / totalAllKm) * 100) : 50;

    // Component health calculation
    const chainWearKm = distKm % 3000;
    const tireWearKm = distKm % 4000;
    const brakeWearKm = distKm % 5000;

    const components: ComponentHealth[] = [
      {
        name: '传动链条',
        componentKey: 'chain',
        currentKm: chainWearKm,
        warnKm: 2500,
        criticalKm: 3000,
        status: chainWearKm >= 3000 ? 'critical' : chainWearKm >= 2500 ? 'warn' : 'ok',
        remainingPct: Math.max(0, Math.round(((3000 - chainWearKm) / 3000) * 100))
      },
      {
        name: '真空外胎',
        componentKey: 'tire',
        currentKm: tireWearKm,
        warnKm: 3500,
        criticalKm: 4000,
        status: tireWearKm >= 4000 ? 'critical' : tireWearKm >= 3500 ? 'warn' : 'ok',
        remainingPct: Math.max(0, Math.round(((4000 - tireWearKm) / 4000) * 100))
      },
      {
        name: '刹车夹片',
        componentKey: 'brake',
        currentKm: brakeWearKm,
        warnKm: 4200,
        criticalKm: 5000,
        status: brakeWearKm >= 5000 ? 'critical' : brakeWearKm >= 4200 ? 'warn' : 'ok',
        remainingPct: Math.max(0, Math.round(((5000 - brakeWearKm) / 5000) * 100))
      }
    ];

    let type: BikeFleetItem['type'] = 'road';
    const lowerName = b.name.toLowerCase();
    if (lowerName.includes('gravel') || lowerName.includes('diverge')) type = 'gravel';
    else if (lowerName.includes('mtb') || lowerName.includes('spark') || lowerName.includes('epic')) type = 'mtb';
    else if (lowerName.includes('zwift') || lowerName.includes('kickr') || lowerName.includes('trainer')) type = 'indoor';

    fleetList.push({
      id: b.id,
      name: b.name,
      type,
      totalDistanceKm: distKm,
      totalRides: record.rides,
      lastRideDate: record.lastDate.split('T')[0] || '近期',
      distancePct: distPct,
      components
    });
  }

  return fleetList;
}

// -----------------------------------------------------------------------------
// 10. Milestones & PR Hall
// -----------------------------------------------------------------------------
export function computeMilestones(activities: StravaActivityRecord[]): MilestoneItem[] {
  let centuryCount = 0;
  let imperialCenturyCount = 0;
  let doubleCenturyCount = 0;
  let maxDistanceKm = 0;
  let maxElevationM = 0;
  let maxNpWatts = 0;
  let maxDurationSec = 0;
  let totalElevationM = 0;
  let dawnRideCount = 0;

  for (const a of activities) {
    const km = (a.distance || 0) / 1000;
    const ele = a.total_elevation_gain || 0;
    const sec = a.moving_time || 0;
    const np = a.weighted_average_watts || a.average_watts || 0;

    totalElevationM += ele;

    if (km >= 100) centuryCount++;
    if (km >= 160.9) imperialCenturyCount++;
    if (km >= 200) doubleCenturyCount++;

    if (km > maxDistanceKm) maxDistanceKm = km;
    if (ele > maxElevationM) maxElevationM = ele;
    if (np > maxNpWatts) maxNpWatts = np;
    if (sec > maxDurationSec) maxDurationSec = sec;

    if (a.start_date) {
      const hour = new Date(a.start_date).getHours();
      if (hour >= 4 && hour < 7) dawnRideCount++;
    }
  }

  const everestPct = Math.round((totalElevationM / 8848) * 100);

  return [
    {
      id: 'century',
      title: '破百挑战者 (Century 100km)',
      subtitle: '单次骑行突破 100 公里大关',
      achieved: centuryCount > 0,
      count: centuryCount,
      targetValue: '100 km',
      progressPct: Math.min(100, (maxDistanceKm / 100) * 100)
    },
    {
      id: 'imperial_century',
      title: '百英里大满贯 (160km)',
      subtitle: '完成单次 160.9 公里帝国世纪骑行',
      achieved: imperialCenturyCount > 0,
      count: imperialCenturyCount,
      targetValue: '160.9 km',
      progressPct: Math.min(100, (maxDistanceKm / 160.9) * 100)
    },
    {
      id: 'double_century',
      title: '双百超级壮举 (200km)',
      subtitle: '单日长途耐力极限破 200 公里',
      achieved: doubleCenturyCount > 0,
      count: doubleCenturyCount,
      targetValue: '200 km',
      progressPct: Math.min(100, (maxDistanceKm / 200) * 100)
    },
    {
      id: 'everest_challenge',
      title: '珠峰攀登累计 (Everesting)',
      subtitle: `累计爬升已达 ${everestPct}% (目标 8,848m)`,
      achieved: totalElevationM >= 8848,
      currentValue: `${Math.round(totalElevationM)}m`,
      targetValue: '8,848m',
      progressPct: Math.min(100, everestPct)
    },
    {
      id: 'dawn_patrol',
      title: '破晓先锋 (Dawn Patrol)',
      subtitle: '在清晨 07:00 前破风出征 ≥ 5次',
      achieved: dawnRideCount >= 5,
      count: dawnRideCount,
      targetValue: '5 次',
      progressPct: Math.min(100, (dawnRideCount / 5) * 100)
    },
    {
      id: 'pr_distance',
      title: '个人最远单日记录',
      subtitle: `${maxDistanceKm.toFixed(1)} km 历史巅峰`,
      achieved: maxDistanceKm > 0,
      currentValue: `${maxDistanceKm.toFixed(1)} km`
    },
    {
      id: 'pr_elevation',
      title: '单场最大爬升记录',
      subtitle: `+${Math.round(maxElevationM)} m 垂直攀爬`,
      achieved: maxElevationM > 0,
      currentValue: `+${Math.round(maxElevationM)} m`
    },
    {
      id: 'pr_power',
      title: '单场最高加权功率 (NP)',
      subtitle: `${maxNpWatts} W 强劲输出`,
      achieved: maxNpWatts > 0,
      currentValue: `${maxNpWatts} W`
    }
  ];
}

// -----------------------------------------------------------------------------
// 11. High-Fidelity 90-Day Demo Dataset Generator
// -----------------------------------------------------------------------------
export function generateDemoStravaActivities(): StravaActivityRecord[] {
  const list: StravaActivityRecord[] = [];
  const now = new Date();

  // Route Templates
  const routeTemplates = [
    { name: '西湖龙井与梅灵南路起伏拉练', dist: 38500, ele: 420, np: 215, hr: 148, gear: 'b_road_1' },
    { name: '安吉天荒坪 18km 连续爬坡攻坚', dist: 52000, ele: 1120, np: 245, hr: 165, gear: 'b_road_1' },
    { name: '钱塘江绿道晨风巡航刷脂', dist: 28000, ele: 45, np: 185, hr: 135, gear: 'b_road_1' },
    { name: '千岛湖经典环湖大满贯 140km', dist: 142000, ele: 1250, np: 228, hr: 154, gear: 'b_road_1' },
    { name: '莫干山后山古道 Gravel 探路', dist: 45000, ele: 780, np: 205, hr: 146, gear: 'b_gravel_2' },
    { name: '工作日晨曦破晓通勤刷里程', dist: 22000, ele: 35, np: 175, hr: 130, gear: 'b_road_1' },
    { name: '周末车队百公里破风进攻训练', dist: 105000, ele: 680, np: 238, hr: 158, gear: 'b_road_1' },
    { name: '西溪湿地外环晚间短途有氧', dist: 25000, ele: 30, np: 170, hr: 128, gear: 'b_road_1' }
  ];

  let idCounter = 9001;

  for (let dayOffset = 89; dayOffset >= 0; dayOffset--) {
    const actDate = new Date(now.getTime() - dayOffset * 24 * 3600 * 1000);
    const dayOfWeek = actDate.getDay(); // 0 is Sunday

    // Ride probability: Weekends (Sat/Sun) 90%, Weekdays 45%
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const shouldRide = isWeekend ? Math.random() < 0.9 : Math.random() < 0.45;

    if (!shouldRide) continue;

    // Pick template
    let tpl = routeTemplates[0];
    if (isWeekend) {
      // High chance of long rides on weekends
      tpl = Math.random() < 0.4 ? routeTemplates[3] : Math.random() < 0.7 ? routeTemplates[6] : routeTemplates[1];
    } else {
      tpl = Math.random() < 0.5 ? routeTemplates[5] : routeTemplates[2];
    }

    // Add slight random jitter
    const distance = Math.round(tpl.dist * (0.92 + Math.random() * 0.16));
    const ele = Math.round(tpl.ele * (0.9 + Math.random() * 0.2));
    const avgSpeed = 7.5 + Math.random() * 1.5; // ~27-32 km/h
    const movingTime = Math.round(distance / avgSpeed);
    const np = Math.round(tpl.np * (0.95 + Math.random() * 0.1));
    const hr = Math.round(tpl.hr * (0.96 + Math.random() * 0.08));

    // Time of day
    const hour = isWeekend ? (Math.random() < 0.7 ? 7 : 8) : (Math.random() < 0.6 ? 6 : 19);
    actDate.setHours(hour, Math.floor(Math.random() * 59), 0, 0);

    // Calculate TSS
    const ftp = 240;
    const ifVal = parseFloat((np / ftp).toFixed(3));
    const tss = Math.round(((movingTime * np * ifVal) / (ftp * 3600)) * 100);

    list.push({
      id: idCounter++,
      name: tpl.name,
      distance,
      moving_time: movingTime,
      elapsed_time: Math.round(movingTime * 1.1),
      total_elevation_gain: ele,
      type: 'Ride',
      sport_type: tpl.gear === 'b_gravel_2' ? 'GravelRide' : 'Ride',
      start_date: actDate.toISOString(),
      start_date_local: actDate.toISOString(),
      average_speed: parseFloat(avgSpeed.toFixed(2)),
      max_speed: parseFloat((avgSpeed * 1.6).toFixed(1)),
      average_watts: Math.round(np * 0.92),
      weighted_average_watts: np,
      kilojoules: Math.round(((np * movingTime) / 1000) * 1.05),
      device_watts: true,
      has_heartrate: true,
      average_heartrate: hr,
      max_heartrate: Math.min(195, Math.round(hr * 1.18)),
      suffer_score: Math.round(tss * 0.9),
      gear_id: tpl.gear,
      tss,
      intensityFactor: ifVal
    });
  }

  return list;
}
