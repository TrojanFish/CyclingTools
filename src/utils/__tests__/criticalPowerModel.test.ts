import { describe, it, expect } from 'vitest';
import {
  calculate2ParamCP,
  calculateMorton3ParamCP,
  generateCPComparisonReport
} from '../criticalPowerModel';

describe('criticalPowerModel (Morton 3-Parameter & 2-Parameter Tests)', () => {
  const sampleRider = {
    p5s: 1050,
    p1m: 540,
    p5m: 350,
    p20m: 270,
    weightKg: 68
  };

  it('correctly calculates Monod-Scherrer 2-Parameter CP and shows classic short-time blowup', () => {
    const twoParam = calculate2ParamCP(300, sampleRider.p5m, 1200, sampleRider.p20m);

    expect(twoParam.cpWatts).toBeGreaterThanOrEqual(230);
    expect(twoParam.cpWatts).toBeLessThanOrEqual(270);
    expect(twoParam.wPrimeKj).toBeGreaterThan(10);
    expect(twoParam.wPrimeKj).toBeLessThan(40);

    // 2-param blows up unrealistically at 1 second
    const p1s = twoParam.predictPower(1);
    expect(p1s).toBeGreaterThan(5000); // Proves the theoretical limitation of 2-parameter model
  });

  it('correctly solves Morton 3-Parameter model with realistic neuromuscular ceiling Pmax', () => {
    const threeParam = calculateMorton3ParamCP(sampleRider);

    expect(threeParam.cpWatts).toBeGreaterThanOrEqual(230);
    expect(threeParam.cpWatts).toBeLessThanOrEqual(265);
    expect(threeParam.pMaxWatts).toBeGreaterThanOrEqual(sampleRider.p5s);
    expect(threeParam.wPrimeKj).toBeGreaterThan(10);
    expect(threeParam.wPrimeKj).toBeLessThan(40);
    expect(threeParam.timeShiftK).toBeGreaterThan(0);

    // 3-param caps at Pmax at 0s / 1s
    const p0s = threeParam.predictPower(0);
    const p1s = threeParam.predictPower(1);
    expect(p0s).toBe(threeParam.pMaxWatts);
    expect(p1s).toBeLessThanOrEqual(threeParam.pMaxWatts);
    expect(p1s).toBeGreaterThan(sampleRider.p5s);
  });

  it('enforces strict monotonicity across duration spectrum for 3-parameter model', () => {
    const threeParam = calculateMorton3ParamCP(sampleRider);

    const p5s = threeParam.predictPower(5);
    const p30s = threeParam.predictPower(30);
    const p60s = threeParam.predictPower(60);
    const p300s = threeParam.predictPower(300);
    const p1200s = threeParam.predictPower(1200);
    const p3600s = threeParam.predictPower(3600);

    expect(p5s).toBeGreaterThan(p30s);
    expect(p30s).toBeGreaterThan(p60s);
    expect(p60s).toBeGreaterThan(p300s);
    expect(p300s).toBeGreaterThan(p1200s);
    expect(p1200s).toBeGreaterThanOrEqual(p3600s);
    expect(p3600s).toBeGreaterThanOrEqual(threeParam.cpWatts);
  });

  it('accurately predicts Time-to-Exhaustion (TTE) for attack powers', () => {
    const threeParam = calculateMorton3ParamCP(sampleRider);

    // Sub-CP is sustainable
    expect(threeParam.predictTte(threeParam.cpWatts - 10)).toBeNull();

    // 500W attack (> CP)
    const tte500 = threeParam.predictTte(500);
    expect(tte500).not.toBeNull();
    expect(tte500!).toBeGreaterThan(20);
    expect(tte500!).toBeLessThan(200);

    // 700W attack (> 500W) should exhaust faster than 500W
    const tte700 = threeParam.predictTte(700);
    expect(tte700).not.toBeNull();
    expect(tte700!).toBeLessThan(tte500!);

    // Beyond Pmax
    expect(threeParam.predictTte(threeParam.pMaxWatts + 100)).toBe(0);
  });

  it('correctly generates comparison report between 2p and 3p curves', () => {
    const report = generateCPComparisonReport(sampleRider);

    expect(report.curve.length).toBeGreaterThan(8);
    const pt1s = report.curve.find(p => p.durationSec === 1);
    expect(pt1s).toBeDefined();
    // 2-param predicts absurd wattage at 1s, 3-param stays physiologically bounded
    expect(pt1s!.power2p).toBeGreaterThan(pt1s!.power3p * 2);
  });

  it('handles edge cases defensively with grace', () => {
    const edgeRider = {
      p5s: 0,
      p5m: 0,
      p20m: 0,
      weightKg: 0
    };
    const res = calculateMorton3ParamCP(edgeRider);
    expect(res.cpWatts).toBeGreaterThan(0);
    expect(res.wPrimeJoules).toBeGreaterThan(0);
    expect(res.pMaxWatts).toBeGreaterThan(0);
    expect(isFinite(res.timeShiftK)).toBe(true);
  });
});
