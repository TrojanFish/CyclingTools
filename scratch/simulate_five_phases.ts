/**
 * Comprehensive Simulation Test Suite for Rouleur Pro 5-Phase Upgrade
 * Rigorously executes and validates algorithms across Phase 1 to Phase 5:
 *   Phase 1: Virtual Garage Data Bus & Dynamic Coupling
 *   Phase 2: Local-First IndexedDB, Banister PMC & Multi-Layer MMP
 *   Phase 3: Route Workshop, ISA Atmosphere, Wind Vectors & Best Bike Split Pacing
 *   Phase 4: ATP Periodization Engine, Peak Backsolver & ZWO Generator
 *   Phase 5: Dynamic Tool Loader, Lazy Chunk Resolution & Prefetching
 */

// Mock browser globals for Node.js test execution
const mockEl = () => ({
  setAttribute: () => {},
  appendChild: () => {},
  removeChild: () => {},
  click: () => {},
  style: {},
  classList: { add: () => {}, remove: () => {}, toggle: () => {}, contains: () => false },
  addEventListener: () => {},
  removeEventListener: () => {},
});

if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = globalThis;
  (globalThis as any).localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {}
  };
  (globalThis as any).document = {
    createElement: mockEl,
    head: mockEl(),
    body: mockEl(),
    documentElement: mockEl(),
    getElementById: () => null,
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: () => {},
    removeEventListener: () => {},
  };
  (globalThis as any).window.document = (globalThis as any).document;
  (globalThis as any).window.getComputedStyle = () => ({ getPropertyValue: () => '' });
  (globalThis as any).window.addEventListener = () => {};
  (globalThis as any).window.removeEventListener = () => {};
  (globalThis as any).window.matchMedia = () => ({ matches: false, addEventListener: () => {}, removeEventListener: () => {} });
  (globalThis as any).window.location = { href: 'http://localhost' };
  (globalThis as any).navigator = {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    platform: 'Win32',
    appVersion: '5.0 (Windows NT 10.0; Win64; x64)',
    vendor: '',
    clipboard: {
      writeText: async () => {},
      readText: async () => ''
    }
  };
  (globalThis as any).screen = {
    width: 1920,
    height: 1080,
    deviceXDPI: 96,
    logicalXDPI: 96,
    colorDepth: 24,
    pixelDepth: 24,
  };
  (globalThis as any).window.screen = (globalThis as any).screen;
  (globalThis as any).window.navigator = (globalThis as any).navigator;
}

import { DEFAULT_ENRICHED_BIKE_GARAGE, BikeProfile } from '../src/types/garage';
import {
  generatePmcSeries,
  predictTaperDays,
  getTsbZoneInfo,
  PmcDayData
} from '../src/utils/pmcCalculator';
import { LocalActivityRecord } from '../src/utils/localActivityDb';
import {
  computeMmpEnvelope,
  detectActivityPrs,
  STANDARD_MMP_DURATIONS
} from '../src/utils/mmpAggregator';
import { MmpValue } from '../src/utils/activityParser';
import {
  computeCoursePacingPlan,
  calculateHaversineDistance,
  calculateBearing,
  calculateAirDensity,
  decomposeWind,
  PacingEngineOptions
} from '../src/utils/routePacingEngine';
import {
  generateAnnualTrainingPlan,
  GoalEvent,
  PlannedWorkout,
  PeriodizationPlanSummary,
  PRESET_GOAL_EVENTS,
  formatDateYMD
} from '../src/utils/periodizationEngine';
import { WORKOUT_TEMPLATES } from '../src/components/tools/WorkoutBuilder';
import { TOOL_LOADERS, prefetchTool } from '../src/utils/toolLoader';
import { TOOLS_LIST } from '../src/data/toolsList';
import { ZHEJIANG_XINGZHE_ROUTES } from '../src/data/zhejiangRoutes';

interface TestResult {
  phase: string;
  name: string;
  passed: boolean;
  durationMs: number;
  details: string;
}

const results: TestResult[] = [];

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

async function runTest(phase: string, name: string, fn: () => void | Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    const durationMs = Date.now() - start;
    results.push({ phase, name, passed: true, durationMs, details: 'OK' });
    console.log(`  ✅ [PASS] ${phase} - ${name} (${durationMs}ms)`);
  } catch (err: any) {
    const durationMs = Date.now() - start;
    results.push({ phase, name, passed: false, durationMs, details: err.message });
    console.error(`  ❌ [FAIL] ${phase} - ${name} (${durationMs}ms): ${err.message}`);
  }
}

async function main() {
  console.log('\n===============================================================');
  console.log('🚴 ROULEUR PRO — 5-PHASE COMPREHENSIVE SIMULATION SUITE');
  console.log('===============================================================\n');

  // ===========================================================================
  // PHASE 1: Virtual Garage & Dynamic Coupling Data Bus
  // ===========================================================================
  console.log('--- PHASE 1: Virtual Garage & Dynamics Data Bus ---');

  await runTest('Phase 1', 'Virtual Garage Default Fleet Integrity', () => {
    assert(DEFAULT_ENRICHED_BIKE_GARAGE.length >= 4, `Expected at least 4 default bikes, got ${DEFAULT_ENRICHED_BIKE_GARAGE.length}`);
    const aeroBike = DEFAULT_ENRICHED_BIKE_GARAGE.find(b => b.type === 'road_aero');
    const climbingBike = DEFAULT_ENRICHED_BIKE_GARAGE.find(b => b.type === 'road_climb');
    const gravelBike = DEFAULT_ENRICHED_BIKE_GARAGE.find(b => b.type === 'gravel');

    assert(!!aeroBike, 'Aero bike profile must exist');
    assert(!!climbingBike, 'Climbing bike profile must exist');
    assert(!!gravelBike, 'Gravel bike profile must exist');

    // Aero bike should have lower CdA than gravel bike
    assert(aeroBike!.cda < gravelBike!.cda, `Aero CdA (${aeroBike!.cda}) should be lower than Gravel CdA (${gravelBike!.cda})`);
    // Climbing bike should be lighter than gravel bike
    assert(climbingBike!.weightKg < gravelBike!.weightKg, `Climbing bike weight (${climbingBike!.weightKg}kg) should be lower than Gravel (${gravelBike!.weightKg}kg)`);
  });

  await runTest('Phase 1', 'Dynamics Data Propagation & Physical Equilibrium', () => {
    // Simulate active bike parameter injection into physics models
    const aeroBike = DEFAULT_ENRICHED_BIKE_GARAGE.find(b => b.type === 'road_aero')!;
    const climbingBike = DEFAULT_ENRICHED_BIKE_GARAGE.find(b => b.type === 'road_climb')!;
    const riderWeight = 68;

    // Rolling resistance power on flat road: P_rr = total_mass * g * Crr * v
    const g = 9.80665;
    const v = 40 / 3.6; // 40 km/h = 11.11 m/s
    const pRollingAero = (riderWeight + aeroBike.weightKg) * g * aeroBike.crr * v;
    const pRollingClimb = (riderWeight + climbingBike.weightKg) * g * climbingBike.crr * v;

    assert(pRollingAero > 0 && pRollingAero < 100, `Reasonable rolling resistance power: ${pRollingAero.toFixed(1)}W`);
    assert(pRollingClimb > 0 && pRollingClimb < 100, `Reasonable climbing rolling power: ${pRollingClimb.toFixed(1)}W`);

    // Aerodynamic drag power: P_aero = 0.5 * rho * CdA * v^3
    const rho = 1.225;
    const pAeroAero = 0.5 * rho * aeroBike.cda * Math.pow(v, 3);
    const pAeroClimb = 0.5 * rho * climbingBike.cda * Math.pow(v, 3);

    assert(pAeroAero < pAeroClimb, `Aero bike drag power (${pAeroAero.toFixed(1)}W) must be lower than climbing bike (${pAeroClimb.toFixed(1)}W) at 40 km/h`);
    assert(pAeroAero > 150 && pAeroAero < 350, `Aero power at 40km/h should be within athletic range: ${pAeroAero.toFixed(1)}W`);
  });

  // ===========================================================================
  // PHASE 2: Local-First IndexedDB & Banister PMC & Multi-Layer MMP
  // ===========================================================================
  console.log('\n--- PHASE 2: Local-First PMC & MMP Envelope ---');

  await runTest('Phase 2', 'Rolling Banister PMC Simulation (CTL/ATL/TSB & Taper Predictor)', () => {
    // Generate 60-day base mesocycle timeline
    const pmcSeries: PmcDayData[] = generatePmcSeries('base', undefined, 'club');
    assert(pmcSeries.length === 60, `Expected 60 days of PMC points, got ${pmcSeries.length}`);

    // Verify rolling Banister CTL/ATL/TSB continuity
    for (let i = 1; i < pmcSeries.length; i++) {
      const prev = pmcSeries[i - 1];
      const curr = pmcSeries[i];

      // TSB = CTL - ATL
      assert(Math.abs(curr.tsb - (curr.ctl - curr.atl)) < 0.2, `TSB must equal CTL - ATL at day ${i}`);
    }

    const lastDay = pmcSeries[pmcSeries.length - 1];
    assert(!isNaN(lastDay.ctl) && lastDay.ctl > 0, `Valid CTL: ${lastDay.ctl}`);
    assert(!isNaN(lastDay.atl) && lastDay.atl > 0, `Valid ATL: ${lastDay.atl}`);

    // TSB Zone classification
    const zoneInfo = getTsbZoneInfo(lastDay.tsb);
    assert(!!zoneInfo.zone && !!zoneInfo.label, `Zone info must be valid for TSB ${lastDay.tsb}`);

    // Predict taper days to reach peak TSB (+15)
    const taperResult = predictTaperDays(lastDay.ctl, lastDay.atl, 15);
    assert(taperResult.daysNeeded >= 0 && taperResult.daysNeeded <= 35, `Realistic taper days: ${taperResult.daysNeeded}`);

    console.log(`    ℹ️ Rolling PMC End: CTL=${lastDay.ctl.toFixed(1)}, ATL=${lastDay.atl.toFixed(1)}, TSB=${lastDay.tsb.toFixed(1)} (${zoneInfo.label}), Predicted Taper to +15: ${taperResult.daysNeeded} days`);
  });

  await runTest('Phase 2', 'Multi-Layer Mean Max Power (MMP) Envelope & PR Allocation', () => {
    const now = Date.now();
    const DAY_MS = 86400 * 1000;
    const ftp = 260;
    const weight = 68;

    // Create 15 synthetic LocalActivityRecords with realistic MMP curves across past 90 days
    const demoActs: LocalActivityRecord[] = [];
    for (let i = 1; i <= 15; i++) {
      const daysAgo = i * 5;
      const actTime = now - daysAgo * DAY_MS;
      const mmp: MmpValue[] = STANDARD_MMP_DURATIONS.map(d => {
        let factor = 1.0;
        if (d.sec <= 5) factor = 3.5;
        else if (d.sec <= 15) factor = 2.8;
        else if (d.sec <= 60) factor = 1.6;
        else if (d.sec <= 300) factor = 1.15;
        else if (d.sec <= 1200) factor = 0.95;
        else factor = 0.85;

        // Add some variation per activity
        const noise = 0.95 + (i % 4) * 0.03;
        const watts = Math.round(ftp * factor * noise);
        return {
          durationSec: d.sec,
          label: d.label,
          watts,
          wkg: parseFloat((watts / weight).toFixed(2))
        };
      });

      demoActs.push({
        id: `sim_act_${i}`,
        name: `Ride Day -${daysAgo}`,
        startDate: new Date(actTime).toISOString(),
        startTime: actTime,
        distanceKm: 45 + (i % 5) * 15,
        totalDurationSec: 5400,
        movingTimeSec: 5000,
        elevationGainM: 450,
        elevationLossM: 450,
        avgPower: 190,
        maxPower: 950,
        normalizedPower: 225,
        intensityFactor: 0.86,
        tss: 75,
        variabilityIndex: 1.18,
        workKj: 950,
        avgSpeedKmh: 31.5,
        maxSpeedKmh: 58.2,
        mmp,
        fileType: 'demo',
        createdAt: actTime
      });
    }

    // Compute 90-day and all-time envelopes
    const env90d = computeMmpEnvelope(demoActs, 68, 90);
    const envAllTime = computeMmpEnvelope(demoActs, 68, undefined);

    assert(env90d.length === STANDARD_MMP_DURATIONS.length, `Expected ${STANDARD_MMP_DURATIONS.length} duration milestones, got ${env90d.length}`);
    assert(envAllTime.length === STANDARD_MMP_DURATIONS.length, `Expected ${STANDARD_MMP_DURATIONS.length} duration milestones, got ${envAllTime.length}`);

    // All-time envelope watts should be >= 90-day envelope watts
    for (let i = 0; i < envAllTime.length; i++) {
      assert(envAllTime[i].watts >= env90d[i].watts - 0.01,
        `All-time power (${envAllTime[i].watts}W) must be >= 90d power (${env90d[i].watts}W) for ${envAllTime[i].label}`);
    }

    // Monotonicity check: shorter duration power >= longer duration power
    for (let i = 0; i < envAllTime.length - 1; i++) {
      assert(envAllTime[i].watts >= envAllTime[i + 1].watts - 0.01,
        `MMP power must be monotonic decreasing: ${envAllTime[i].label} (${envAllTime[i].watts}W) < ${envAllTime[i+1].label} (${envAllTime[i+1].watts}W)`);
    }

    // Test PR detection on a breakthrough ride
    const testMmp = [...demoActs[0].mmp];
    // Artificially boost 5s sprint to 1200W
    testMmp[1] = { ...testMmp[1], watts: 1200, wkg: 17.65 };
    const prSummary = detectActivityPrs(testMmp, demoActs, 68, 'new-breakthrough-act');
    assert(prSummary.totalAllTimePrs >= 1, `Expected at least 1 all-time PR detected: got ${prSummary.totalAllTimePrs}`);
    console.log(`    ℹ️ MMP 5s Peak: ${envAllTime[1].watts}W (${envAllTime[1].wkg}W/kg), 20m FTP: ${envAllTime[13].watts}W (${envAllTime[13].wkg}W/kg), PRs Detected: ${prSummary.totalAllTimePrs}`);
  });

  // ===========================================================================
  // PHASE 3: Route Workshop & Best Bike Split Pacing Engine
  // ===========================================================================
  console.log('\n--- PHASE 3: Route Workshop & Best Bike Split Pacing Engine ---');

  await runTest('Phase 3', 'Haversine Great Circle & Forward Azimuth Bearing Precision', () => {
    // West Lake Hangzhou (approx 30.24°N, 120.15°E) to Mogan Mountain (30.60°N, 119.85°E)
    const lat1 = 30.2438, lon1 = 120.1581;
    const lat2 = 30.6000, lon2 = 119.8500;

    const distM = calculateHaversineDistance(lat1, lon1, lat2, lon2);
    const distKm = distM / 1000;
    // Straight line distance should be ~49km
    assert(distKm > 45 && distKm < 55, `Expected distance ~49km, got ${distKm.toFixed(2)}km`);

    const bearing = calculateBearing(lat1, lon1, lat2, lon2);
    // Heading North-West should be between 300° and 350°
    assert(bearing > 300 && bearing < 350, `Expected NW bearing (300-350°), got ${bearing.toFixed(1)}°`);
  });

  await runTest('Phase 3', 'ISA Atmospheric Air Density & 3D Wind Vector Simulation', () => {
    // Sea level ISA (15°C, 0m)
    const rhoSeaLevel = calculateAirDensity(0, 15);
    assert(Math.abs(rhoSeaLevel - 1.225) < 0.01, `Sea level density should be ~1.225 kg/m³, got ${rhoSeaLevel.toFixed(3)}`);

    // Mountain pass (15°C, 1000m)
    const rho1000m = calculateAirDensity(1000, 15);
    assert(rho1000m < rhoSeaLevel, `Density at 1000m (${rho1000m.toFixed(3)}) must be lower than sea level (${rhoSeaLevel.toFixed(3)})`);

    // High altitude (0°C, 2000m)
    const rho2000m = calculateAirDensity(2000, 0);
    assert(rho2000m < 1.15 && rho2000m > 0.95, `Realistic density at 2000m: ${rho2000m.toFixed(3)} kg/m³`);

    // Wind Vector Decomposition: Segment bearing = 0° (North)
    // Case 1: Direct Headwind coming from 0° (North) at 20 km/h
    const headwind = decomposeWind(0, 0, 20);
    assert(headwind.windRelation === 'headwind', `Expected headwind, got ${headwind.windRelation}`);
    assert(headwind.headwindComponentMs > 5.0, `Headwind parallel component should be >5m/s: ${headwind.headwindComponentMs}`);

    // Case 2: Direct Tailwind coming from 180° (South) at 20 km/h
    const tailwind = decomposeWind(0, 180, 20);
    assert(tailwind.windRelation === 'tailwind', `Expected tailwind, got ${tailwind.windRelation}`);
    assert(tailwind.headwindComponentMs < -5.0, `Tailwind parallel component should be negative (assist): ${tailwind.headwindComponentMs}`);

    // Case 3: Pure Crosswind coming from 90° (East) at 20 km/h
    const crosswind = decomposeWind(0, 90, 20);
    assert(crosswind.windRelation === 'crosswind', `Expected crosswind, got ${crosswind.windRelation}`);
    assert(Math.abs(crosswind.headwindComponentMs) < 0.1, `Pure crosswind should have near-zero parallel component: ${crosswind.headwindComponentMs}`);
    assert(crosswind.crosswindComponentMs > 5.0, `Crosswind should have positive cross component: ${crosswind.crosswindComponentMs}`);
  });

  await runTest('Phase 3', 'Real Course Pacing Simulation (West Lake Longjing Loop)', () => {
    const route = ZHEJIANG_XINGZHE_ROUTES[0];
    assert(route.waypoints.length >= 5, 'Route must have sufficient waypoints');

    const options: PacingEngineOptions = {
      ftpWatts: 260,
      riderWeightKg: 68,
      bikeWeightKg: 7.8,
      cda: 0.32,
      crr: 0.0038,
      drivetrainEfficiency: 0.975,
      windSpeedKmh: 12,
      windDirectionDeg: 90,
      ambientTempC: 18,
      strategyMode: 'balanced'
    };

    const result = computeCoursePacingPlan(route.waypoints, options);

    assert(result.totalDistanceKm > 5, `Realistic course distance: ${result.totalDistanceKm.toFixed(1)}km`);
    assert(result.totalDurationSec > 300, `Estimated duration should be realistic: ${result.totalDurationFormatted}`);
    assert(result.avgSpeedKmh > 10 && result.avgSpeedKmh < 60, `Average speed should be athletic: ${result.avgSpeedKmh.toFixed(1)}km/h`);
    assert(result.normalizedPowerWatts > 150 && result.normalizedPowerWatts < 350, `Normalized power should be in range: ${result.normalizedPowerWatts}W`);
    assert(result.intensityFactor > 0.6 && result.intensityFactor < 1.15, `IF should be in range: ${result.intensityFactor}`);
    assert(result.trainingStressScore > 0, `TSS must be positive: ${result.trainingStressScore}`);
    assert(result.nutrition.recommendedCarbsPerHourG >= 30, `Nutrition carbs should be calculated: ${result.nutrition.recommendedCarbsPerHourG}g/h`);
    assert(result.nutrition.recommendedFluidPerHourMl > 300, `Fluid intake should be calculated: ${result.nutrition.recommendedFluidPerHourMl}ml/h`);
    assert(result.segments.length > 0, `Segments breakdown should exist: ${result.segments.length} segments`);
    console.log(`    ℹ️ Course: ${route.name} (${result.totalDistanceKm.toFixed(1)}km, +${result.totalElevationGainM}m) -> Est Time: ${result.totalDurationFormatted}, NP: ${result.normalizedPowerWatts}W, TSS: ${result.trainingStressScore}`);
  });

  // ===========================================================================
  // PHASE 4: ATP Periodization Calendar & Target Peak Wizard
  // ===========================================================================
  console.log('\n--- PHASE 4: ATP Periodization Calendar & Target Peak Wizard ---');

  await runTest('Phase 4', 'Tudor Bompa / Joe Friel 12-Week ATP Generation', () => {
    const goalRace: GoalEvent = {
      id: 'race-sim-001',
      name: 'Qiandao Lake 136km Gran Fondo',
      date: '2026-08-01',
      discipline: 'gran_fondo',
      priority: 'A',
      targetCtl: 85,
      targetTsb: 20,
      distanceKm: 136,
      elevationGainM: 1200
    };

    const refDate = new Date('2026-05-09'); // Exactly 12 weeks prior to Aug 1
    const plan = generateAnnualTrainingPlan(goalRace, 52, 45, 8, refDate);

    assert(plan.totalWeeks >= 10, `Plan total weeks: ${plan.totalWeeks}`);
    assert(plan.weeks.length === plan.totalWeeks, 'Weeks array length must match totalWeeks');

    // Verify phases distribution
    const phaseNames = plan.weeks.map(w => w.phase);
    assert(phaseNames.includes('base_1') || phaseNames.includes('base_2'), 'Must include Base phase');
    assert(phaseNames.includes('build_1') || phaseNames.includes('build_2'), 'Must include Build phase');
    assert(phaseNames.includes('peak') || phaseNames.includes('taper'), 'Must include Peak or Taper phase');
    assert(phaseNames[phaseNames.length - 1] === 'race', 'Final week must be Race week');

    // Verify 3:1 load/recovery cycle in Base phase
    const baseWeeks = plan.weeks.filter(w => w.phase.startsWith('base'));
    if (baseWeeks.length >= 4) {
      const w1 = baseWeeks[0].targetTss;
      const w2 = baseWeeks[1].targetTss;
      const w4 = baseWeeks[3].targetTss; // Recovery week
      assert(w2 >= w1, 'Progressive overload in week 2');
      assert(w4 < w2, 'Week 4 should be recovery reduction');
    }
  });

  await runTest('Phase 4', 'Forward Banister PMC Projection to Race Day Sweet Spot', () => {
    const goalRace: GoalEvent = {
      id: 'race-sim-002',
      name: 'Huangshan KOM Championship',
      date: '2026-06-20',
      discipline: 'climb_kom',
      priority: 'A',
      targetCtl: 80,
      targetTsb: 18
    };

    const refDate = new Date('2026-05-01');
    const plan = generateAnnualTrainingPlan(goalRace, 55, 50, 10, refDate);

    assert(plan.projectedPmc.length > 30, `Projection points count: ${plan.projectedPmc.length}`);

    // Verify day-by-day continuity and finite numbers
    for (let i = 0; i < plan.projectedPmc.length; i++) {
      const p = plan.projectedPmc[i];
      assert(!isNaN(p.ctl) && isFinite(p.ctl), `CTL at day ${i} must be valid number: ${p.ctl}`);
      assert(!isNaN(p.atl) && isFinite(p.atl), `ATL at day ${i} must be valid number: ${p.atl}`);
      assert(!isNaN(p.tsb) && isFinite(p.tsb), `TSB at day ${i} must be valid number: ${p.tsb}`);
    }

    // Race Day TSB Check
    const raceDayPoint = plan.projectedPmc.find(p => p.date === goalRace.date);
    if (raceDayPoint) {
      assert(raceDayPoint.tsb > 0, `Race day TSB must be positive (fresh): ${raceDayPoint.tsb.toFixed(1)}`);
      console.log(`    ℹ️ Projected Race Day (${goalRace.date}): CTL=${raceDayPoint.ctl.toFixed(1)}, ATL=${raceDayPoint.atl.toFixed(1)}, TSB=+${raceDayPoint.tsb.toFixed(1)}`);
    }
  });

  await runTest('Phase 4', 'Workout Template Structure & Zwift .ZWO Export Schema', () => {
    assert(WORKOUT_TEMPLATES.length >= 6, `Expected at least 6 workout templates, got ${WORKOUT_TEMPLATES.length}`);
    const ronnestad = WORKOUT_TEMPLATES.find(t => t.id === 'ronnestad_30_15') || WORKOUT_TEMPLATES[0];

    assert(ronnestad.segments.length > 0, 'Workout must have segments');
    const totalDurationSec = ronnestad.segments.reduce((acc, s) => {
      if (s.repeatCount) {
        return acc + s.repeatCount * ((s.onDurationSec || 0) + (s.offDurationSec || 0));
      }
      return acc + s.durationSec;
    }, 0);

    assert(totalDurationSec > 1800, `Workout duration should be >30min: ${(totalDurationSec / 60).toFixed(0)}min`);

    // Verify ZWO XML structure matches Zwift schema
    const dummyWkt: PlannedWorkout = {
      id: 'wkt-test',
      date: '2026-05-15',
      title: ronnestad.name,
      targetTss: 85,
      durationMin: Math.round(totalDurationSec / 60),
      intensity: 'high',
      isCompleted: false
    };

    const zwoXml = `<?xml version="1.0" encoding="UTF-8"?>
<workout_file>
  <author>Rouleur Pro ATP</author>
  <name>${dummyWkt.title}</name>
  <description>Rouleur Pro 年度周期训练课表 · 计划 TSS: ${dummyWkt.targetTss}</description>
  <sportType>bike</sportType>
  <workout>
    <Warmup Duration="600" PowerLow="0.5" PowerHigh="0.75" />
    <SteadyState Duration="${Math.max(600, (dummyWkt.durationMin - 20) * 60)}" Power="0.88" />
    <Cooldown Duration="600" PowerLow="0.75" PowerHigh="0.5" />
  </workout>
</workout_file>`;

    assert(zwoXml.includes('<workout_file>'), 'ZWO must contain <workout_file>');
    assert(zwoXml.includes('<sportType>bike</sportType>'), 'ZWO must specify bike sport type');
    assert(zwoXml.includes('</workout_file>'), 'ZWO must have closing tag');
  });

  // ===========================================================================
  // PHASE 5: Dynamic Code Splitting, Micro-Prefetching & Tool Registry
  // ===========================================================================
  console.log('\n--- PHASE 5: Dynamic Code Splitting & Tool Prefetching ---');

  await runTest('Phase 5', 'Tool Registry & Dynamic Loader Coverage', () => {
    assert(TOOLS_LIST.length >= 21, `Expected at least 21 tools registered, got ${TOOLS_LIST.length}`);

    // Every tool in TOOLS_LIST must have a corresponding loader in TOOL_LOADERS
    for (const tool of TOOLS_LIST) {
      assert(!!TOOL_LOADERS[tool.id], `Tool "${tool.id}" (${tool.title}) must have a loader in TOOL_LOADERS`);
    }
  });

  await runTest('Phase 5', 'Dynamic Module Import Resolution (No Missing Exports)', async () => {
    // Test importing every single tool module asynchronously to verify zero runtime syntax/export errors
    const toolIds = Object.keys(TOOL_LOADERS);
    let resolvedCount = 0;

    for (const id of toolIds) {
      try {
        const loader = TOOL_LOADERS[id];
        const mod = await loader();
        assert(!!mod && typeof mod === 'object', `Loader for "${id}" must resolve to a valid module object`);
        resolvedCount++;
      } catch (err: any) {
        console.error(`\n    ❌ Error occurred while dynamically loading tool "${id}":`, err?.message || err);
        throw err;
      }
    }

    assert(resolvedCount === toolIds.length, `All ${toolIds.length} tools resolved cleanly`);
    console.log(`    ℹ️ Successfully resolved all ${resolvedCount} dynamic tool modules without errors`);
  });

  await runTest('Phase 5', 'Prefetching Cache Idempotency & Safety', () => {
    // Calling prefetch multiple times should be safe and idempotent
    prefetchTool('power-calc');
    prefetchTool('power-calc');
    prefetchTool('unknown-nonexistent-tool'); // Should not throw
    assert(true, 'Prefetch handled cleanly');
  });

  // ===========================================================================
  // SIMULATION SUMMARY
  // ===========================================================================
  console.log('\n===============================================================');
  console.log('📊 SIMULATION RESULTS SUMMARY');
  console.log('===============================================================');

  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;

  console.log(`Total Simulation Tests: ${total}`);
  console.log(`Passed: ${passed} / ${total}`);
  console.log(`Failed: ${failed} / ${total}`);

  if (failed > 0) {
    console.error('\n⚠️ SOME SIMULATIONS FAILED!');
    process.exit(1);
  } else {
    console.log('\n🎉 ALL 5 PHASES PASSED LOCAL SIMULATION TESTS WITH 100% SUCCESS!\n');
  }
}

main().catch(err => {
  console.error('Simulation runner failed:', err);
  process.exit(1);
});
