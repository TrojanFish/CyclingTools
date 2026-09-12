/**
 * Annual Training Plan (ATP) & Periodization Engine
 * 
 * Implements:
 * 1. Tudor Bompa & Joe Friel endurance periodization models (Base, Build, Peak, Taper, Race)
 * 2. Target race backward-solving algorithm from athlete current CTL/ATL
 * 3. 3:1 Mesocycle loading (3 weeks progressive overload + 1 week active recovery)
 * 4. Day-by-day continuous Banister impulse-response projection for future CTL / ATL / TSB
 * 5. Structured workout matching from library templates
 */

import { LocalActivityRecord } from './localActivityDb';

export type TrainingPhase =
  | 'base_1'
  | 'base_2'
  | 'base_3'
  | 'build_1'
  | 'build_2'
  | 'peak'
  | 'taper'
  | 'race'
  | 'transition';

export type RacePriority = 'A' | 'B' | 'C';

export type RaceDiscipline =
  | 'road_race'
  | 'criterium'
  | 'time_trial'
  | 'gran_fondo'
  | 'climb_kom'
  | 'gravel';

export interface GoalEvent {
  id: string;
  name: string;
  date: string; // 'YYYY-MM-DD'
  priority: RacePriority;
  discipline: RaceDiscipline;
  targetCtl: number;
  targetTsb: number; // usually +15 to +25 for A-race
  distanceKm?: number;
  elevationGainM?: number;
  notes?: string;
}

export interface PlannedWorkout {
  id: string;
  date: string; // 'YYYY-MM-DD'
  title: string;
  targetTss: number;
  durationMin: number;
  category: 'recovery' | 'endurance' | 'tempo' | 'sweetspot' | 'threshold' | 'vo2max' | 'anaerobic' | 'race';
  templateId?: string;
  notes?: string;
  isCompleted?: boolean;
}

export interface WeekPlan {
  weekIndex: number; // 1-based index in the plan
  startDate: string; // Monday 'YYYY-MM-DD'
  endDate: string;   // Sunday 'YYYY-MM-DD'
  phase: TrainingPhase;
  phaseLabel: string;
  phaseColor: string; // Apple HIG semantic color
  targetTss: number;
  targetHours: number;
  focusAdaptation: string;
  recommendedWorkouts: string[];
  events: GoalEvent[];
  isRecoveryWeek: boolean;
  isCurrentWeek: boolean;
}

export interface ProjectedPmcPoint {
  date: string; // 'YYYY-MM-DD'
  timestamp: number;
  dateLabel: string; // 'M/D'
  tss: number;
  ctl: number;
  atl: number;
  tsb: number;
  isFuture: boolean;
  event?: GoalEvent;
  phaseLabel?: string;
}

export interface PeriodizationPlanSummary {
  goalEvent: GoalEvent;
  totalWeeks: number;
  daysUntilRace: number;
  startingCtl: number;
  targetRaceCtl: number;
  targetRaceTsb: number;
  currentWeekIndex: number;
  weeks: WeekPlan[];
  projectedPmc: ProjectedPmcPoint[];
  totalPlannedTss: number;
  avgWeeklyTss: number;
}

const PHASE_METADATA: Record<TrainingPhase, { label: string; color: string; desc: string }> = {
  base_1: { label: '基础有氧 1 (Base 1)', color: '#10B981', desc: '建立线粒体密度，Z2 长距离有氧巡航' },
  base_2: { label: '基础有氧 2 (Base 2)', color: '#10B981', desc: '提升肌糖原储备与肌纤维效率，渐进加量' },
  base_3: { label: '基础有氧 3 (Base 3)', color: '#34D399', desc: '有氧底盘筑基收尾，引入适度节奏骑行' },
  build_1: { label: '进阶建立 1 (Build 1)', color: '#F59E0B', desc: '乳酸阈值攻坚，2x20min 甜区与爬坡' },
  build_2: { label: '进阶建立 2 (Build 2)', color: '#F97316', desc: 'VO2max 最大摄氧量拓展，微间歇高负荷' },
  peak: { label: '巅峰储备 (Peak)', color: '#8B5CF6', desc: '模拟比赛强度，极高强度与适度减容' },
  taper: { label: '赛前减量 (Taper)', color: '#06B6D4', desc: '训练容积削减 40-50%，快速清空疲劳' },
  race: { label: '决战比赛周 (Race Week)', color: '#EF4444', desc: '激活排酸，糖原超量充能，决战 A 级目标' },
  transition: { label: '赛后过渡 (Transition)', color: '#94A3B8', desc: '主动恢复，线粒体与神经系统重置' }
};

// Preset Popular Events in China & International
export const PRESET_GOAL_EVENTS: GoalEvent[] = [
  {
    id: 'qiandao_lake_granfondo',
    name: '千岛湖环湖公路自行车赛 (136km)',
    date: '2026-05-24',
    priority: 'A',
    discipline: 'gran_fondo',
    targetCtl: 85,
    targetTsb: 20,
    distanceKm: 136,
    elevationGainM: 1100,
    notes: '起伏丘陵大组赛，需强化 2~5 分钟短陡坡突围与高均速巡航能力。'
  },
  {
    id: 'huangshan_granfondo',
    name: '黄山歙县·天路史诗格兰枫度',
    date: '2026-06-14',
    priority: 'A',
    discipline: 'climb_kom',
    targetCtl: 90,
    targetTsb: 18,
    distanceKm: 120,
    elevationGainM: 2300,
    notes: '连续长坡盘山天路，考验功重比 W/kg 与持续爬坡乳酸耐受力。'
  },
  {
    id: 'mogan_climb_kom',
    name: '莫干山·古典爬坡挑战赛 (KOM)',
    date: '2026-04-26',
    priority: 'B',
    discipline: 'climb_kom',
    targetCtl: 75,
    targetTsb: 15,
    distanceKm: 45,
    elevationGainM: 950,
    notes: '单坡爆发力与 20 分钟极限爬坡测试。'
  },
  {
    id: 'personal_ftp_test',
    name: '个人 20min FTP 突破测试日',
    date: '2026-05-03',
    priority: 'B',
    discipline: 'time_trial',
    targetCtl: 70,
    targetTsb: 16,
    distanceKm: 25,
    elevationGainM: 100,
    notes: '赛前中期体能检阅，校准最新的训练区间。'
  }
];

/**
 * Format Date helper: 'YYYY-MM-DD'
 */
export function formatDateYMD(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get start of week (Monday midnight) for a given date
 */
export function getMondayOfWeek(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  date.setDate(date.getDate() + diff);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Backward-solve and build an Annual Training Plan toward a Goal Event
 */
export function generateAnnualTrainingPlan(
  goalEvent: GoalEvent,
  currentCtl: number = 60,
  currentAtl: number = 50,
  weeklyAvailableHours: number = 8,
  referenceDate: Date = new Date()
): PeriodizationPlanSummary {
  const raceDate = new Date(goalEvent.date);
  raceDate.setHours(0, 0, 0, 0);

  const today = new Date(referenceDate);
  today.setHours(0, 0, 0, 0);

  const diffTime = raceDate.getTime() - today.getTime();
  const daysUntilRace = Math.max(7, Math.ceil(diffTime / (1000 * 3600 * 24)));
  
  // Calculate total weeks between today's Monday and race week
  const startMonday = getMondayOfWeek(today);
  const raceMonday = getMondayOfWeek(raceDate);
  const totalWeeks = Math.max(4, Math.ceil((raceMonday.getTime() - startMonday.getTime()) / (7 * 86400 * 1000)) + 1);

  // Target race CTL and weekly load capacity
  const targetRaceCtl = Math.max(currentCtl, goalEvent.targetCtl || 80);
  const targetRaceTsb = goalEvent.targetTsb || 20;

  // Distribute weeks into Tudor Bompa periods
  // Standard rule:
  // Last 1 week: Race week
  // Prior 2 weeks: Taper & Peak
  // Remaining weeks: 40% Build, 60% Base
  const prepWeeks = Math.max(1, totalWeeks - 3);
  const buildWeeksCount = Math.max(1, Math.round(prepWeeks * 0.45));
  const baseWeeksCount = Math.max(1, prepWeeks - buildWeeksCount);

  const phasesSequence: TrainingPhase[] = [];

  // 1. Base Weeks
  for (let i = 0; i < baseWeeksCount; i++) {
    if (i < baseWeeksCount * 0.35) phasesSequence.push('base_1');
    else if (i < baseWeeksCount * 0.7) phasesSequence.push('base_2');
    else phasesSequence.push('base_3');
  }

  // 2. Build Weeks
  for (let i = 0; i < buildWeeksCount; i++) {
    if (i < buildWeeksCount * 0.5) phasesSequence.push('build_1');
    else phasesSequence.push('build_2');
  }

  // 3. Peak, Taper, Race
  phasesSequence.push('peak');
  phasesSequence.push('taper');
  phasesSequence.push('race');

  // Clamp or extend to exact totalWeeks
  while (phasesSequence.length < totalWeeks) {
    phasesSequence.unshift('base_1');
  }
  if (phasesSequence.length > totalWeeks) {
    phasesSequence.splice(0, phasesSequence.length - totalWeeks);
  }

  // Weekly TSS calculation:
  // Approximate weekly TSS ~ hours * 55 TSS/hr baseline
  const baseWeeklyTss = Math.round(weeklyAvailableHours * 52);
  const maxWeeklyTss = Math.round(weeklyAvailableHours * 68);

  const weeks: WeekPlan[] = [];
  let currentWeekIndex = 1;
  let totalPlannedTss = 0;

  for (let w = 0; w < totalWeeks; w++) {
    const wMonday = new Date(startMonday.getTime() + w * 7 * 86400 * 1000);
    const wSunday = new Date(wMonday.getTime() + 6 * 86400 * 1000);
    const phase = phasesSequence[w];
    const meta = PHASE_METADATA[phase];

    // Mesocycle recovery week check: every 4th week is a recovery drop, UNLESS it's race/taper
    const isRecoveryWeek = (w + 1) % 4 === 0 && phase !== 'race' && phase !== 'taper';

    // Target TSS calculation with progressive loading
    let weekTss = baseWeeklyTss;
    let targetHours = weeklyAvailableHours;

    if (phase === 'base_1' || phase === 'base_2' || phase === 'base_3') {
      const progress = w / Math.max(1, baseWeeksCount);
      weekTss = Math.round(baseWeeklyTss * (0.85 + progress * 0.25));
    } else if (phase === 'build_1' || phase === 'build_2') {
      weekTss = Math.round(baseWeeklyTss * 1.15);
      targetHours = Math.round(weeklyAvailableHours * 1.1);
    } else if (phase === 'peak') {
      weekTss = Math.round(baseWeeklyTss * 0.85); // volume drop, keep intensity
      targetHours = Math.round(weeklyAvailableHours * 0.8);
    } else if (phase === 'taper') {
      weekTss = Math.round(baseWeeklyTss * 0.55); // 45% volume cut
      targetHours = Math.round(weeklyAvailableHours * 0.55);
    } else if (phase === 'race') {
      weekTss = Math.round(baseWeeklyTss * 0.50 + 150); // primer + race itself
      targetHours = Math.round(weeklyAvailableHours * 0.5);
    }

    if (isRecoveryWeek) {
      weekTss = Math.round(weekTss * 0.68); // 32% cut for recovery week
      targetHours = Math.round(targetHours * 0.7);
    }

    totalPlannedTss += weekTss;

    // Recommended workouts
    let recommendedWorkouts = ['Z2 有氧耐力巡航 90m', '主动恢复骑 45m'];
    if (phase === 'base_1' || phase === 'base_2') {
      recommendedWorkouts = ['Z2 基础长距离巡航 (2.5h)', '节奏踏频进阶 (1h)', '主动恢复排酸 (45m)'];
    } else if (phase === 'base_3') {
      recommendedWorkouts = ['甜点巡航 Sweetspot 2x15m', 'Z2 基础耐力 (3h)', '有氧激活 (1h)'];
    } else if (phase === 'build_1') {
      recommendedWorkouts = ['FTP 甜区攻坚 2x20min', 'Over-Under 阈值穿梭间歇', '周末长距离耐力 (3.5h)'];
    } else if (phase === 'build_2') {
      recommendedWorkouts = ['Rønnestad 30/15s 微间歇 (3组)', 'Seiler 4x8min VO₂max', '大齿扭矩力量爬坡'];
    } else if (phase === 'peak') {
      recommendedWorkouts = ['赛道配速仿真模拟 40km', '短冲刺激活 5x30s', '轻松巡航 1h'];
    } else if (phase === 'taper') {
      recommendedWorkouts = ['赛前减量高踏频神经激活 45m', 'Z1 主动排酸巡航 40m', '极简发力测试'];
    } else if (phase === 'race') {
      recommendedWorkouts = ['赛前一日 30min 神经唤醒', 'A 级目标决战日全负荷', '赛后拉伸与排酸'];
    }

    const isCurrentWeek = today >= wMonday && today <= wSunday;
    if (isCurrentWeek) {
      currentWeekIndex = w + 1;
    }

    // Attach event if race falls in this week
    const weekEvents: GoalEvent[] = [];
    if (raceDate >= wMonday && raceDate <= wSunday) {
      weekEvents.push(goalEvent);
    }

    weeks.push({
      weekIndex: w + 1,
      startDate: formatDateYMD(wMonday),
      endDate: formatDateYMD(wSunday),
      phase,
      phaseLabel: meta.label,
      phaseColor: meta.color,
      targetTss: weekTss,
      targetHours,
      focusAdaptation: meta.desc,
      recommendedWorkouts,
      events: weekEvents,
      isRecoveryWeek,
      isCurrentWeek
    });
  }

  // 4. Project Future Day-by-Day PMC via Banister Impulse-Response
  const projectedPmc = projectPmcTimeline(
    today,
    raceDate,
    currentCtl,
    currentAtl,
    weeks,
    goalEvent
  );

  return {
    goalEvent,
    totalWeeks,
    daysUntilRace,
    startingCtl: currentCtl,
    targetRaceCtl,
    targetRaceTsb,
    currentWeekIndex,
    weeks,
    projectedPmc,
    totalPlannedTss,
    avgWeeklyTss: Math.round(totalPlannedTss / Math.max(1, totalWeeks))
  };
}

/**
 * Generate daily projected PMC curve from today to race date + 7 days
 */
function projectPmcTimeline(
  today: Date,
  raceDate: Date,
  initialCtl: number,
  initialAtl: number,
  weeks: WeekPlan[],
  goalEvent: GoalEvent
): ProjectedPmcPoint[] {
  const ONE_DAY_MS = 86400 * 1000;
  const TC_CTL = 42;
  const TC_ATL = 7;

  const points: ProjectedPmcPoint[] = [];

  const raceMonday = getMondayOfWeek(raceDate);
  const endTimestamp = raceDate.getTime() + 7 * ONE_DAY_MS; // +7 days post race

  // Build daily planned TSS lookup: 'YYYY-MM-DD' -> tss
  const dailyPlannedTss = new Map<string, { tss: number; phaseLabel: string }>();

  weeks.forEach(w => {
    const dailyAvgTss = Math.round(w.targetTss / 7);
    const start = new Date(w.startDate).getTime();
    for (let d = 0; d < 7; d++) {
      const dt = new Date(start + d * ONE_DAY_MS);
      const key = formatDateYMD(dt);
      
      // Give rest days (Mon/Fri) lower TSS, weekends higher TSS
      const dayOfWeek = dt.getDay(); // 0 Sun, 6 Sat
      let dayTss = dailyAvgTss;
      if (dayOfWeek === 1) dayTss = 0; // Monday Rest
      else if (dayOfWeek === 6 || dayOfWeek === 0) dayTss = Math.round(dailyAvgTss * 1.6); // Weekend volume
      else if (dayOfWeek === 3) dayTss = Math.round(dailyAvgTss * 1.3); // Midweek hard interval
      else dayTss = Math.round(dailyAvgTss * 0.7);

      // On race day itself, inject race TSS (e.g. 180~250)
      if (key === goalEvent.date) {
        dayTss = 220;
      }

      dailyPlannedTss.set(key, { tss: dayTss, phaseLabel: w.phaseLabel });
    }
  });

  let curCtl = initialCtl;
  let curAtl = initialAtl;

  let cursor = today.getTime();

  while (cursor <= endTimestamp) {
    const dObj = new Date(cursor);
    const key = formatDateYMD(dObj);
    const plan = dailyPlannedTss.get(key) || { tss: 40, phaseLabel: '维持' };

    // In standard exercise physiology (TrainingPeaks/Intervals.icu), TSB represents morning readiness
    // prior to that day's stress: Form_t = CTL_{t-1} - ATL_{t-1}
    const curTsb = curCtl - curAtl;

    curCtl = curCtl + (plan.tss - curCtl) / TC_CTL;
    curAtl = curAtl + (plan.tss - curAtl) / TC_ATL;

    const isRaceDay = key === goalEvent.date;

    points.push({
      date: key,
      timestamp: cursor,
      dateLabel: `${dObj.getMonth() + 1}/${dObj.getDate()}`,
      tss: plan.tss,
      ctl: Math.round(curCtl * 10) / 10,
      atl: Math.round(curAtl * 10) / 10,
      tsb: Math.round(curTsb * 10) / 10,
      isFuture: cursor >= today.getTime(),
      event: isRaceDay ? goalEvent : undefined,
      phaseLabel: plan.phaseLabel
    });

    cursor += ONE_DAY_MS;
  }

  return points;
}

// Local Storage Keys
const STORAGE_KEY_GOAL_EVENT = 'rouleur_atp_goal_event';
const STORAGE_KEY_PLANNED_WORKOUTS = 'rouleur_atp_planned_workouts';

/**
 * Load user's active goal event from local storage
 */
export function loadSavedGoalEvent(): GoalEvent {
  if (typeof window === 'undefined') return PRESET_GOAL_EVENTS[0];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_GOAL_EVENT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.name && parsed.date) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse saved goal event:', e);
  }
  return PRESET_GOAL_EVENTS[0];
}

/**
 * Save user's active goal event
 */
export function saveGoalEvent(event: GoalEvent): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_GOAL_EVENT, JSON.stringify(event));
  } catch (e) {
    console.warn('Failed to save goal event:', e);
  }
}

/**
 * Load planned workouts
 */
export function loadPlannedWorkouts(): PlannedWorkout[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PLANNED_WORKOUTS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to load planned workouts:', e);
  }
  return [];
}

/**
 * Save planned workouts
 */
export function savePlannedWorkouts(workouts: PlannedWorkout[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_PLANNED_WORKOUTS, JSON.stringify(workouts));
  } catch (e) {
    console.warn('Failed to save planned workouts:', e);
  }
}
