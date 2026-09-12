/**
 * Rouleur MMP (Mean Maximal Power) Multi-Activity Aggregator & PR Engine
 * Calculates 90-day and all-time best power duration curves across all historical rides.
 * Automatically identifies personal power records (PRs).
 */

import { MmpValue } from './activityParser';
import { LocalActivityRecord } from './localActivityDb';

export interface MmpEnvelopePoint {
  durationSec: number;
  label: string;
  watts: number;
  wkg: number;
  activityId?: string;
  activityName?: string;
  activityDate?: string;
}

export interface ActivityPrDetail {
  durationSec: number;
  label: string;
  watts: number;
  wkg: number;
  is90dPr: boolean;
  isAllTimePr: boolean;
  prevBest90dWatts: number;
  prevBestAllTimeWatts: number;
  wattsGain: number;
}

export interface ActivityPrSummary {
  total90dPrs: number;
  totalAllTimePrs: number;
  prs: ActivityPrDetail[];
}

export const STANDARD_MMP_DURATIONS = [
  { sec: 1, label: '1s' },
  { sec: 5, label: '5s' },
  { sec: 10, label: '10s' },
  { sec: 15, label: '15s' },
  { sec: 30, label: '30s' },
  { sec: 60, label: '1m' },
  { sec: 120, label: '2m' },
  { sec: 180, label: '3m' },
  { sec: 300, label: '5m' },
  { sec: 480, label: '8m' },
  { sec: 600, label: '10m' },
  { sec: 720, label: '12m' },
  { sec: 900, label: '15m' },
  { sec: 1200, label: '20m' },
  { sec: 1800, label: '30m' },
  { sec: 2700, label: '45m' },
  { sec: 3600, label: '60m' }
];

/**
 * Compute the maximum power envelope across a set of activities for a given duration window.
 * @param activities List of activities
 * @param riderWeightKg Rider's body weight for W/kg calculation
 * @param timeWindowDays Optional filter (e.g. 90 days), undefined for all-time
 */
export function computeMmpEnvelope(
  activities: LocalActivityRecord[],
  riderWeightKg: number = 68,
  timeWindowDays?: number
): MmpEnvelopePoint[] {
  const now = Date.now();
  const cutoffTime = timeWindowDays ? now - timeWindowDays * 86400 * 1000 : 0;

  const validActivities = activities.filter(
    act => act.mmp && act.mmp.length > 0 && (cutoffTime === 0 || act.startTime >= cutoffTime)
  );

  return STANDARD_MMP_DURATIONS.map(d => {
    let maxWatts = 0;
    let bestAct: LocalActivityRecord | null = null;

    for (const act of validActivities) {
      const match = act.mmp.find(m => m.durationSec === d.sec);
      if (match && match.watts > maxWatts) {
        maxWatts = match.watts;
        bestAct = act;
      }
    }

    const safeWeight = riderWeightKg > 0 ? riderWeightKg : 68;
    return {
      durationSec: d.sec,
      label: d.label,
      watts: maxWatts,
      wkg: maxWatts > 0 ? parseFloat((maxWatts / safeWeight).toFixed(2)) : 0,
      activityId: bestAct?.id,
      activityName: bestAct?.name,
      activityDate: bestAct?.startDate ? new Date(bestAct.startDate).toLocaleDateString() : undefined
    };
  });
}

/**
 * Compare an activity's MMP curve against historical records to detect 90-day & all-time PRs
 */
export function detectActivityPrs(
  currentMmp: MmpValue[],
  allActivities: LocalActivityRecord[],
  riderWeightKg: number = 68,
  currentActivityId?: string
): ActivityPrSummary {
  // Exclude current activity from historical comparison
  const pastActivities = currentActivityId
    ? allActivities.filter(a => a.id !== currentActivityId)
    : allActivities;

  const env90d = computeMmpEnvelope(pastActivities, riderWeightKg, 90);
  const envAllTime = computeMmpEnvelope(pastActivities, riderWeightKg, undefined);

  let total90dPrs = 0;
  let totalAllTimePrs = 0;

  const prs: ActivityPrDetail[] = currentMmp.map(cur => {
    const hist90 = env90d.find(e => e.durationSec === cur.durationSec);
    const histAll = envAllTime.find(e => e.durationSec === cur.durationSec);

    const prev90Watts = hist90?.watts || 0;
    const prevAllWatts = histAll?.watts || 0;

    const isAllTimePr = prevAllWatts > 0 && cur.watts > prevAllWatts;
    const is90dPr = !isAllTimePr && prev90Watts > 0 && cur.watts > prev90Watts;

    if (isAllTimePr) totalAllTimePrs++;
    if (is90dPr) total90dPrs++;

    const baseline = isAllTimePr ? prevAllWatts : prev90Watts;
    const wattsGain = baseline > 0 ? cur.watts - baseline : 0;

    return {
      durationSec: cur.durationSec,
      label: cur.label,
      watts: cur.watts,
      wkg: cur.wkg,
      is90dPr,
      isAllTimePr,
      prevBest90dWatts: prev90Watts,
      prevBestAllTimeWatts: prevAllWatts,
      wattsGain
    };
  });

  return {
    total90dPrs,
    totalAllTimePrs,
    prs
  };
}
