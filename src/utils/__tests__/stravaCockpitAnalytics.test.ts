import { describe, it, expect } from 'vitest';
import {
  computeWeeklyVolume,
  computeAnnualGoalProgress,
  computePmcTimeline,
  findOptimalRaceWindow,
  generateDemoStravaActivities
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

      // Under rest/taper (0 TSS), fatigue (ATL) must decrease faster than fitness (CTL)
      const firstProj = projection[0];
      const lastProj = projection[projection.length - 1];
      expect(lastProj.atl).toBeLessThan(firstProj.atl);
      expect(lastProj.ctl).toBeLessThan(firstProj.ctl);
      // Freshness (TSB = CTL - ATL) should improve
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
});
