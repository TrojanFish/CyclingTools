import { describe, it, expect } from 'vitest';
import {
  computeWeeklyVolume,
  computeAnnualGoalProgress,
  computePmcTimeline,
  findOptimalRaceWindow,
  generateDemoStravaActivities,
  computePowerZoneDistribution,
  computeRampRateHistory,
  computeFtpHistory,
  computePersonalRecordsTimeline,
  computeAerobicEfficiency,
  exportActivitiesToCsv,
  exportActivitiesToJson
} from '../stravaCockpitAnalytics';
import { StravaActivityRecord } from '../indexedDb';

describe('StravaCockpitAnalytics - Sports Science Calculations', () => {
  const demoActivities = generateDemoStravaActivities();

  describe('computeWeeklyVolume', () => {
    it('handles empty activities gracefully', () => {
      const res = computeWeeklyVolume([], 250, 12);
      expect(res.weeks).toHaveLength(12);
      expect(res.peakTssWeek).toBeNull();
      expect(res.peakDistanceWeek).toBeNull();
      expect(res.avgWeeklyTss).toBe(0);
      expect(res.avgWeeklyDistanceKm).toBe(0);
      expect(res.totalVolumeTss).toBe(0);
      expect(res.totalVolumeDistanceKm).toBe(0);
    });

    it('aggregates demo activities correctly across weeks', () => {
      const res = computeWeeklyVolume(demoActivities, 250, 26);
      expect(res.weeks).toHaveLength(26);
      expect(res.totalVolumeDistanceKm).toBeGreaterThan(0);
      expect(res.totalVolumeTss).toBeGreaterThan(0);
      expect(res.avgWeeklyDistanceKm).toBeGreaterThan(0);
      expect(res.avgWeeklyTss).toBeGreaterThan(0);

      // Verify peak week detection
      if (res.peakTssWeek) {
        expect(res.peakTssWeek.tss).toBeGreaterThanOrEqual(res.avgWeeklyTss);
        expect(res.peakTssWeek.isPeakTss).toBe(true);
      }
      if (res.peakDistanceWeek) {
        expect(res.peakDistanceWeek.distanceKm).toBeGreaterThanOrEqual(res.avgWeeklyDistanceKm);
        expect(res.peakDistanceWeek.isPeakDistance).toBe(true);
      }
    });

    it('accurately groups custom activities in the same week', () => {
      const now = new Date();
      const mockActivities: StravaActivityRecord[] = [
        {
          id: 1,
          name: 'Ride 1',
          distance: 50000,
          moving_time: 5400,
          elapsed_time: 6000,
          total_elevation_gain: 400,
          type: 'Ride',
          start_date: now.toISOString(),
          start_date_local: now.toISOString(),
          average_speed: 9.2,
          max_speed: 15.0,
          average_watts: 200,
          weighted_average_watts: 210,
          tss: 90
        },
        {
          id: 2,
          name: 'Ride 2',
          distance: 70000,
          moving_time: 7200,
          elapsed_time: 7800,
          total_elevation_gain: 600,
          type: 'Ride',
          start_date: now.toISOString(),
          start_date_local: now.toISOString(),
          average_speed: 9.7,
          max_speed: 16.0,
          average_watts: 210,
          weighted_average_watts: 220,
          tss: 120
        }
      ];

      const res = computeWeeklyVolume(mockActivities, 250, 4);
      const currentWeek = res.weeks[res.weeks.length - 1];
      expect(currentWeek.rides).toBe(2);
      expect(currentWeek.distanceKm).toBe(120);
      expect(currentWeek.elevationM).toBe(1000);
      expect(currentWeek.tss).toBe(210);
      expect(currentWeek.isPeakTss).toBe(true);
      expect(currentWeek.isPeakDistance).toBe(true);
    });
  });

  describe('computeAnnualGoalProgress', () => {
    const currentYear = new Date().getFullYear();

    it('handles empty activities with zero progress', () => {
      const goal = computeAnnualGoalProgress([], 5000, currentYear);
      expect(goal.year).toBe(currentYear);
      expect(goal.targetKm).toBe(5000);
      expect(goal.currentKm).toBe(0);
      expect(goal.progressPct).toBe(0);
      expect(goal.remainingKm).toBe(5000);
      expect(goal.monthlyBreakdown).toHaveLength(12);
      expect(goal.isAheadOfPace).toBe(false);
      expect(goal.projectedCompletionDate).toBeNull();
    });

    it('correctly calculates completed goal status', () => {
      const mockActivities: StravaActivityRecord[] = [
        {
          id: 101,
          name: 'Epic Ultra',
          distance: 6000000, // 6,000 km
          moving_time: 360000,
          elapsed_time: 400000,
          total_elevation_gain: 30000,
          type: 'Ride',
          start_date: `${currentYear}-02-15T08:00:00Z`,
          start_date_local: `${currentYear}-02-15T08:00:00Z`,
          average_speed: 8.5,
          max_speed: 15.0
        }
      ];

      const goal = computeAnnualGoalProgress(mockActivities, 5000, currentYear);
      expect(goal.currentKm).toBe(6000);
      expect(goal.progressPct).toBe(120);
      expect(goal.remainingKm).toBe(0);
      expect(goal.isAheadOfPace).toBe(true);
      expect(goal.projectedCompletionDate).toBe('已达成');
      expect(goal.monthlyBreakdown[1].actualKm).toBe(6000); // February is index 1
    });

    it('calculates pace delta and required daily km for ongoing season', () => {
      const goal = computeAnnualGoalProgress(demoActivities, 6000, currentYear);
      expect(goal.monthlyBreakdown).toHaveLength(12);
      expect(goal.daysPassed).toBeGreaterThan(0);
      expect(goal.totalDaysInYear).toBeGreaterThanOrEqual(365);
      expect(typeof goal.isAheadOfPace).toBe('boolean');
      expect(typeof goal.requiredDailyKm).toBe('number');
    });
  });

  describe('computePmcTimeline with forward projection', () => {
    it('creates forward projection points with 0 TSS and increasing/decaying metrics', () => {
      const timeline = computePmcTimeline(demoActivities, 250, 60, 14);
      expect(timeline).toHaveLength(60 + 14);

      const history = timeline.slice(0, 60);
      const projection = timeline.slice(60);

      expect(history.every(p => p.isProjection === false)).toBe(true);
      expect(projection.every(p => p.isProjection === true)).toBe(true);
      expect(projection.every(p => p.tss === 0)).toBe(true);

      const firstProj = projection[0];
      const lastProj = projection[projection.length - 1];
      expect(lastProj.atl).toBeLessThan(firstProj.atl);
      expect(lastProj.ctl).toBeLessThan(firstProj.ctl);
      expect(lastProj.tsb).toBeGreaterThan(firstProj.tsb);
    });

    it('findOptimalRaceWindow identifies valid race form window', () => {
      const timeline = computePmcTimeline(demoActivities, 250, 60, 14);
      const raceWindow = findOptimalRaceWindow(timeline);

      expect(raceWindow.peakDate).toBeDefined();
      expect(raceWindow.daysUntilPeak).toBeGreaterThanOrEqual(1);
      expect(raceWindow.daysUntilPeak).toBeLessThanOrEqual(14);
      expect(typeof raceWindow.peakTsb).toBe('number');
    });
  });

  describe('computePowerZoneDistribution (Phase 2)', () => {
    it('calculates all 7 Coggan zones summing to 100%', () => {
      const result = computePowerZoneDistribution(demoActivities, 250);
      expect(result.zones).toHaveLength(7);
      expect(result.totalMovingSec).toBeGreaterThan(0);

      const sumPct = result.zones.reduce((sum, z) => sum + z.pct, 0);
      expect(Math.round(sumPct)).toBeGreaterThanOrEqual(99);
      expect(Math.round(sumPct)).toBeLessThanOrEqual(101);

      expect(result.zones[0].zone).toBe('Z1');
      expect(result.zones[1].zone).toBe('Z2');
      expect(result.zones[6].zone).toBe('Z7');
      expect(result.pattern).toBeDefined();
      expect(result.patternLabel).toBeDefined();
    });

    it('handles empty activities safely', () => {
      const result = computePowerZoneDistribution([], 250);
      expect(result.zones).toHaveLength(7);
      expect(result.totalMovingSec).toBe(1); // guarded safe minimum
      expect(result.pattern).toBe('unstructured');
    });
  });

  describe('computeRampRateHistory (Phase 2)', () => {
    it('computes weekly CTL differences and classifies safety', () => {
      const timeline = computePmcTimeline(demoActivities, 250, 90, 0);
      const rampResult = computeRampRateHistory(timeline, 10);

      expect(rampResult.weeks.length).toBeGreaterThan(0);
      expect(typeof rampResult.maxRamp).toBe('number');
      expect(typeof rampResult.avgRamp).toBe('number');

      for (const w of rampResult.weeks) {
        expect(['recovery', 'safe', 'aggressive', 'danger']).toContain(w.status);
        expect(w.colorHex).toBeDefined();
      }
    });
  });

  describe('computeFtpHistory (Phase 2)', () => {
    it('generates chronological progression and breakthrough markers', () => {
      const history = computeFtpHistory(demoActivities, 260, 68);
      expect(history.timeline.length).toBeGreaterThanOrEqual(2);
      expect(history.currentFtp).toBe(260);
      expect(history.currentWkg).toBe(parseFloat((260 / 68).toFixed(2)));
      expect(history.gainWatts).toBeGreaterThanOrEqual(0);
      expect(history.peakFtp).toBeGreaterThanOrEqual(260);
    });
  });

  describe('computePersonalRecordsTimeline (Phase 3)', () => {
    it('extracts progressive PR breakthroughs chronologically', () => {
      const prs = computePersonalRecordsTimeline(demoActivities);
      expect(prs.length).toBeGreaterThan(0);

      // Verify that every PR has label, formattedValue, and activity details
      const firstPr = prs[0];
      expect(firstPr.type).toBeDefined();
      expect(firstPr.label).toBeDefined();
      expect(firstPr.formattedValue).toBeDefined();
      expect(firstPr.date).toBeDefined();
    });

    it('handles empty activities without crashing', () => {
      const prs = computePersonalRecordsTimeline([]);
      expect(prs).toEqual([]);
    });
  });

  describe('computeAerobicEfficiency (Phase 3)', () => {
    it('computes EF (NP/HR) and detects trend for eligible rides', () => {
      const result = computeAerobicEfficiency(demoActivities);
      expect(result.avgEf).toBeGreaterThan(0);
      expect(result.ridesWithEfCount).toBeGreaterThan(0);
      expect(['improving', 'stable', 'declining']).toContain(result.trend);
      expect(result.recentEf.length).toBeGreaterThan(0);
    });

    it('handles activities with missing heart rate cleanly', () => {
      const activitiesWithoutHr: StravaActivityRecord[] = [
        {
          id: 999,
          name: 'No HR Ride',
          distance: 50000,
          moving_time: 3600,
          elapsed_time: 3600,
          total_elevation_gain: 100,
          type: 'Ride',
          start_date: '2026-05-01T08:00:00Z',
          start_date_local: '2026-05-01T08:00:00Z',
          average_speed: 10.0,
          max_speed: 15.0,
          weighted_average_watts: 200
        }
      ];
      const result = computeAerobicEfficiency(activitiesWithoutHr);
      expect(result.avgEf).toBe(0);
      expect(result.ridesWithEfCount).toBe(0);
      expect(result.trend).toBe('stable');
    });
  });

  describe('Client-side Data Export (Phase 3)', () => {
    it('generates valid UTF-8 BOM CSV string with escaped fields', () => {
      const csv = exportActivitiesToCsv(demoActivities.slice(0, 3));
      expect(csv.startsWith('\uFEFF')).toBe(true);
      expect(csv).toContain('活动ID');
      expect(csv).toContain('加权功率(W NP)');

      const lines = csv.split('\n');
      expect(lines.length).toBe(4); // 1 header + 3 data lines
    });

    it('generates valid parseable JSON string', () => {
      const jsonStr = exportActivitiesToJson(demoActivities.slice(0, 2));
      const parsed = JSON.parse(jsonStr);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);
      expect(parsed[0].id).toBe(demoActivities[0].id);
    });
  });
});
