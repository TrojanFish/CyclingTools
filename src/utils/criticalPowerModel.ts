/**
 * Critical Power (CP) & Anaerobic Work Capacity (W') Modeling Engine
 *
 * Implements:
 * 1. Monod & Scherrer (1965) 2-Parameter Linear Model: P(t) = CP + W' / t
 * 2. Morton (1996, 2006) 3-Parameter Non-Linear Model: P(t) = CP + W' / (t + k), where k = W' / (Pmax - CP)
 * 3. Analytical Time-to-Exhaustion (TTE) & Attack Duration Predictor
 * 4. Physiological W' classification (J/kg)
 */

export interface PowerTestInput {
  p5s: number;    // 5-second peak power (Watts)
  p1m?: number;   // 1-minute peak power (Watts)
  p5m: number;    // 5-minute peak power (Watts, aerobic VO2)
  p20m: number;   // 20-minute peak power (Watts, threshold proxy)
  pMax?: number;  // Optional explicit neuromuscular peak power (Watts)
  weightKg?: number;
}

export interface TwoParamCPResult {
  cpWatts: number;
  wPrimeJoules: number;
  wPrimeKj: number;
  predictPower: (timeSec: number) => number;
}

export interface ThreeParamCPResult {
  cpWatts: number;
  cpWkg: number;
  wPrimeJoules: number;
  wPrimeKj: number;
  wPrimeJkg: number;
  pMaxWatts: number;
  pMaxWkg: number;
  timeShiftK: number; // k constant in seconds
  phenotypeCategory: 'diesel' | 'allrounder' | 'puncher' | 'sprinter';
  phenotypeDesc: string;
  predictPower: (timeSec: number) => number;
  predictTte: (targetPowerWatts: number) => number | null; // null if power <= CP
}

export interface PowerDurationPoint {
  durationSec: number;
  durationLabel: string;
  power3p: number;
  power2p: number;
}

export interface CPComparisonReport {
  twoParam: TwoParamCPResult;
  threeParam: ThreeParamCPResult;
  curve: PowerDurationPoint[];
}

/**
 * Solves Monod-Scherrer 2-Parameter Critical Power using 5m (300s) and 20m (1200s) points
 */
export function calculate2ParamCP(t1Sec: number, p1Watts: number, t2Sec: number, p2Watts: number): TwoParamCPResult {
  const safeP1 = Math.max(1, p1Watts);
  const safeP2 = Math.max(1, p2Watts);
  const safeT1 = Math.max(1, t1Sec);
  const safeT2 = Math.max(safeT1 + 1, t2Sec);

  const work1 = safeP1 * safeT1;
  const work2 = safeP2 * safeT2;

  // Work = CP * t + W' => CP = (W2 - W1) / (t2 - t1)
  let cpWatts = (work2 - work1) / (safeT2 - safeT1);
  // Defensive clamp: CP should realistically be between 0.75 * P20 and 0.98 * P20
  if (cpWatts >= safeP2) cpWatts = safeP2 * 0.95;
  if (cpWatts < safeP2 * 0.6) cpWatts = safeP2 * 0.85;

  let wPrimeJoules = (safeP2 - cpWatts) * safeT2;
  if (wPrimeJoules < 3000) wPrimeJoules = 15000;

  return {
    cpWatts: Math.round(cpWatts),
    wPrimeJoules: Math.round(wPrimeJoules),
    wPrimeKj: parseFloat((wPrimeJoules / 1000).toFixed(1)),
    predictPower: (timeSec: number) => {
      const t = Math.max(1, timeSec);
      return Math.round(cpWatts + wPrimeJoules / t);
    }
  };
}

/**
 * Solves Morton 3-Parameter Critical Power Model:
 * P(t) = CP + W' / (t + k), where k = W' / (Pmax - CP)
 */
export function calculateMorton3ParamCP(input: PowerTestInput): ThreeParamCPResult {
  const weight = Math.max(30, input.weightKg || 68);
  const p5s = Math.max(50, input.p5s);
  const p5m = Math.max(40, input.p5m);
  const p20m = Math.max(30, input.p20m);

  // If pMax is not explicitly given, estimate from 5s peak power:
  // Van Cutsem & Martin biomechanics: Pmax (instantaneous) ≈ P5s / 0.90
  const pMaxWatts = Math.round(input.pMax ? Math.max(p5s, input.pMax) : p5s / 0.90);

  const t1 = 300;   // 5 minutes
  const t2 = 1200;  // 20 minutes
  const p1 = p5m;
  const p2 = p20m;

  // Bisection solver for CP in [0.70 * p2, 0.99 * p2]
  // Function: t1 * (1/(p2 - CP) - 1/(pMax - CP)) - t2 * (1/(p1 - CP) - 1/(pMax - CP)) = 0
  let low = p2 * 0.65;
  let high = Math.min(p2 * 0.985, pMaxWatts * 0.9);
  let bestCp = p2 * 0.92;

  const evalCpDiff = (cp: number): number => {
    const denom2 = p2 - cp;
    const denom1 = p1 - cp;
    const denomMax = pMaxWatts - cp;
    if (denom2 <= 0 || denom1 <= 0 || denomMax <= 0) return 999999;
    const term2 = (1 / denom2) - (1 / denomMax);
    const term1 = (1 / denom1) - (1 / denomMax);
    return t1 * term2 - t2 * term1;
  };

  const fLow = evalCpDiff(low);
  const fHigh = evalCpDiff(high);

  if (fLow * fHigh <= 0) {
    for (let iter = 0; iter < 40; iter++) {
      const mid = (low + high) / 2;
      const fMid = evalCpDiff(mid);
      if (Math.abs(fMid) < 0.0001) {
        bestCp = mid;
        break;
      }
      if (fLow * fMid < 0) {
        high = mid;
      } else {
        low = mid;
      }
      bestCp = mid;
    }
  } else {
    // Fallback to standard physiology approximation
    bestCp = p20m * 0.93;
  }

  // Calculate W' and k
  const denom2 = p2 - bestCp;
  const denom1 = p1 - bestCp;
  let wPrimeJoules = denom2 > 0 && denom1 > 0 ? (t2 - t1) / ((1 / denom2) - (1 / denom1)) : 20000;

  // Physiological boundary protection
  if (wPrimeJoules < 5000 || !isFinite(wPrimeJoules)) wPrimeJoules = 16000;
  if (wPrimeJoules > 45000) wPrimeJoules = 32000;

  const cpWatts = Math.round(bestCp);
  const timeShiftK = parseFloat((wPrimeJoules / (pMaxWatts - cpWatts)).toFixed(2));
  const wPrimeKj = parseFloat((wPrimeJoules / 1000).toFixed(1));
  const wPrimeJkg = Math.round(wPrimeJoules / weight);
  const cpWkg = parseFloat((cpWatts / weight).toFixed(2));
  const pMaxWkg = parseFloat((pMaxWatts / weight).toFixed(1));

  // Phenotype categorization
  let phenotypeCategory: ThreeParamCPResult['phenotypeCategory'] = 'allrounder';
  let phenotypeDesc = '中规中矩的综合型体质，无氧储备与有氧门槛均衡。';

  if (wPrimeJkg < 180) {
    phenotypeCategory = 'diesel';
    phenotypeDesc = '纯正柴油机耐力型：无氧电池容量较小，但拥有出色的乳酸清除与长时间巡航效率。';
  } else if (wPrimeJkg <= 250) {
    phenotypeCategory = 'allrounder';
    phenotypeDesc = '均衡竞技型：兼顾突围进攻与巡航门槛，可自如应对各类复杂公路赛段。';
  } else if (wPrimeJkg <= 320) {
    phenotypeCategory = 'puncher';
    phenotypeDesc = '短坡突围攻击手：庞大的无氧电池，在 1~3 分钟的连续攻坡中具备致命撕扯力。';
  } else {
    phenotypeCategory = 'sprinter';
    phenotypeDesc = '终点爆发冲刺手：极为庞大的无氧储能与瞬间峰值功率，终点线 200 米内的统治者。';
  }

  const predictPower = (timeSec: number): number => {
    const t = Math.max(0, timeSec);
    const p = cpWatts + wPrimeJoules / (t + timeShiftK);
    return Math.round(Math.min(pMaxWatts, p));
  };

  const predictTte = (targetPowerWatts: number): number | null => {
    if (targetPowerWatts <= cpWatts) return null; // Aerobically sustainable
    if (targetPowerWatts >= pMaxWatts) return 0;  // Exceeds neuromuscular capacity
    const t = wPrimeJoules / (targetPowerWatts - cpWatts) - timeShiftK;
    return Math.max(0, Math.round(t));
  };

  return {
    cpWatts,
    cpWkg,
    wPrimeJoules: Math.round(wPrimeJoules),
    wPrimeKj,
    wPrimeJkg,
    pMaxWatts,
    pMaxWkg,
    timeShiftK,
    phenotypeCategory,
    phenotypeDesc,
    predictPower,
    predictTte
  };
}

/**
 * Generates Power-Duration Comparison between 2-Parameter and 3-Parameter models
 */
export function generateCPComparisonReport(input: PowerTestInput): CPComparisonReport {
  const twoParam = calculate2ParamCP(300, input.p5m, 1200, input.p20m);
  const threeParam = calculateMorton3ParamCP(input);

  const durationConfigs = [
    { sec: 1, label: '1秒' },
    { sec: 5, label: '5秒' },
    { sec: 10, label: '10秒' },
    { sec: 15, label: '15秒' },
    { sec: 30, label: '30秒' },
    { sec: 60, label: '1分' },
    { sec: 120, label: '2分' },
    { sec: 300, label: '5分' },
    { sec: 600, label: '10分' },
    { sec: 1200, label: '20分' },
    { sec: 1800, label: '30分' },
    { sec: 3600, label: '60分' },
  ];

  const curve: PowerDurationPoint[] = durationConfigs.map(d => ({
    durationSec: d.sec,
    durationLabel: d.label,
    power3p: threeParam.predictPower(d.sec),
    power2p: twoParam.predictPower(d.sec)
  }));

  return {
    twoParam,
    threeParam,
    curve
  };
}
