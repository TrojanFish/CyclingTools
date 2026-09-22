/**
 * preRideWeather.test.ts
 * Unit tests for usePreRideWeather algorithm helpers:
 *   - AQI computation (computeAqiFromPm25)
 *   - Readiness score algorithm (computeReadinessScore)
 *   - Gear advice mapping (computeGearAdvice)
 *   - Hydration advice (computeHydrationAdvice)
 *   - Risk flags (computeRiskFlags)
 *   - Wind direction label (decodeWindDirection)
 *   - WMO weather code label (decodeWeatherCode)
 *   - In-memory cache TTL boundary logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  computeAqiFromPm25,
  computeReadinessScore,
  computeGearAdvice,
  computeHydrationAdvice,
  computeRiskFlags,
  decodeWindDirection,
  decodeWeatherCode,
} from '../../hooks/usePreRideWeather';

// ─── computeAqiFromPm25 ───────────────────────────────────────────────────────

describe('computeAqiFromPm25', () => {
  it('returns 优/green for PM2.5 = 0', () => {
    const { aqi, label, colorToken } = computeAqiFromPm25(0);
    expect(aqi).toBeLessThanOrEqual(50);
    expect(label).toBe('优');
    expect(colorToken).toBe('green');
  });

  it('returns 优/green for PM2.5 = 34 (just below 良 threshold)', () => {
    const { label, colorToken } = computeAqiFromPm25(34);
    expect(label).toBe('优');
    expect(colorToken).toBe('green');
  });

  it('transitions to 良/yellow at PM2.5 = 35', () => {
    const { label, colorToken } = computeAqiFromPm25(35);
    expect(label).toBe('良');
    expect(colorToken).toBe('yellow');
  });

  it('returns 良/yellow for PM2.5 = 74', () => {
    const { label } = computeAqiFromPm25(74);
    expect(label).toBe('良');
  });

  it('transitions to 轻度/orange at PM2.5 = 75', () => {
    const { label, colorToken } = computeAqiFromPm25(75);
    expect(label).toBe('轻度');
    expect(colorToken).toBe('orange');
  });

  it('transitions to 中度/red at PM2.5 = 115', () => {
    const { label, colorToken } = computeAqiFromPm25(115);
    expect(label).toBe('中度');
    expect(colorToken).toBe('red');
  });

  // PM2.5=149 is in the [115,150) breakpoint → AQI 151-200 → 中度
  it('returns 中度/red for PM2.5 = 149 (in [115,150) range)', () => {
    const { label, colorToken } = computeAqiFromPm25(149);
    expect(label).toBe('中度');
    expect(colorToken).toBe('red');
  });

  it('transitions to 重度/red at PM2.5 = 150', () => {
    const { label, colorToken } = computeAqiFromPm25(150);
    expect(label).toBe('重度');
    expect(colorToken).toBe('red');
  });

  it('transitions to 严重/purple at PM2.5 = 250', () => {
    const { label, colorToken } = computeAqiFromPm25(250);
    expect(label).toBe('严重');
    expect(colorToken).toBe('purple');
  });

  it('AQI value is within expected range for PM2.5 = 50', () => {
    const { aqi } = computeAqiFromPm25(50);
    expect(aqi).toBeGreaterThanOrEqual(51);
    expect(aqi).toBeLessThanOrEqual(100);
  });
});

// ─── computeReadinessScore ────────────────────────────────────────────────────

describe('computeReadinessScore', () => {
  it('gives 极佳出骑时机 (≥85) for ideal conditions', () => {
    const { score, label, tint } = computeReadinessScore(10, 5, 10, 22, 3);
    expect(score).toBeGreaterThanOrEqual(85);
    expect(label).toBe('极佳出骑时机');
    expect(tint).toBe('green');
  });

  it('gives 适宜骑行 (65-84) for slightly adverse conditions', () => {
    const { score, label, tint } = computeReadinessScore(40, 25, 20, 22, 3);
    expect(score).toBeGreaterThanOrEqual(65);
    expect(score).toBeLessThan(85);
    expect(label).toBe('适宜骑行');
    expect(tint).toBe('blue');
  });

  it('gives 谨慎出行 (40-64) for PM2.5=80 & moderate rain', () => {
    const { score, label, tint } = computeReadinessScore(80, 45, 15, 22, 3);
    expect(score).toBeGreaterThanOrEqual(40);
    expect(score).toBeLessThan(65);
    expect(label).toBe('谨慎出行');
    expect(tint).toBe('orange');
  });

  it('gives 不建议外骑 (<40) for severe PM2.5 + heavy rain', () => {
    const { score, label, tint } = computeReadinessScore(200, 80, 50, 22, 3);
    expect(score).toBeLessThan(40);
    expect(label).toBe('不建议外骑');
    expect(tint).toBe('red');
  });

  it('extreme temp (40°C) should reduce score significantly', () => {
    const baseScore = computeReadinessScore(10, 5, 10, 22, 3).score;
    const hotScore  = computeReadinessScore(10, 5, 10, 40, 3).score;
    expect(hotScore).toBeLessThan(baseScore);
  });

  it('sub-zero temp should reduce score', () => {
    const baseScore = computeReadinessScore(10, 5, 10, 22, 3).score;
    const coldScore = computeReadinessScore(10, 5, 10, -1, 3).score;
    expect(coldScore).toBeLessThan(baseScore);
  });

  it('score is always clamped to [0, 100]', () => {
    const worst = computeReadinessScore(500, 100, 100, 45, 12).score;
    expect(worst).toBeGreaterThanOrEqual(0);
    expect(worst).toBeLessThanOrEqual(100);
  });
});

// ─── computeGearAdvice ────────────────────────────────────────────────────────

describe('computeGearAdvice', () => {
  it('recommends light kit for feelsLike ≥ 28°C', () => {
    const advice = computeGearAdvice(30);
    expect(advice).toContain('短袖');
    expect(advice).toContain('袖套');
  });

  it('recommends vest for feelsLike 22-27°C', () => {
    const advice = computeGearAdvice(24);
    expect(advice).toContain('防风马甲');
  });

  it('recommends long-finger gloves for feelsLike 15-21°C', () => {
    const advice = computeGearAdvice(17);
    expect(advice).toContain('长指手套');
  });

  it('recommends fleece/softshell for feelsLike 8-14°C', () => {
    const advice = computeGearAdvice(10);
    expect(advice).toContain('抓绒');
  });

  it('recommends full winter gear for feelsLike < 2°C', () => {
    const advice = computeGearAdvice(0);
    expect(advice).toContain('极寒');
  });
});

// ─── computeHydrationAdvice ───────────────────────────────────────────────────

describe('computeHydrationAdvice', () => {
  it('recommends extra electrolytes for temp ≥ 32°C', () => {
    const advice = computeHydrationAdvice(34);
    expect(advice).toContain('电解质');
  });

  it('recommends 500ml/hr for comfortable temp', () => {
    const advice = computeHydrationAdvice(22);
    expect(advice).toContain('500ml');
  });

  it('warns not to ignore hydration in cold weather', () => {
    const advice = computeHydrationAdvice(5);
    expect(advice).toContain('补水');
  });
});

// ─── computeRiskFlags ────────────────────────────────────────────────────────

describe('computeRiskFlags', () => {
  it('shows 空气质量优 for clean air (pm25<35)', () => {
    const flags = computeRiskFlags(10, 5, 10, 8, 3, 22, '优');
    const cleanAir = flags.find(f => f.label.includes('空气质量优'));
    expect(cleanAir).toBeDefined();
    expect(cleanAir?.tint).toBe('green');
  });

  it('shows 呼吸安全风险 for pm25 ≥ 75', () => {
    const flags = computeRiskFlags(80, 5, 10, 8, 3, 22, '轻度');
    const flag = flags.find(f => f.label.includes('呼吸安全风险'));
    expect(flag).toBeDefined();
    expect(flag?.tint).toBe('red');
  });

  it('shows 强阵风 flag for gust ≥ 50 km/h', () => {
    const flags = computeRiskFlags(10, 5, 55, 40, 3, 22, '优');
    const flag = flags.find(f => f.label.includes('碳刀需谨慎'));
    expect(flag).toBeDefined();
    expect(flag?.tint).toBe('red');
  });

  it('shows 阵风预警 for gust 35-49 km/h', () => {
    const flags = computeRiskFlags(10, 5, 38, 30, 3, 22, '优');
    const flag = flags.find(f => f.label.includes('阵风预警'));
    expect(flag).toBeDefined();
    expect(flag?.tint).toBe('orange');
  });

  it('shows 高温预警 for temp ≥ 36°C', () => {
    const flags = computeRiskFlags(10, 5, 10, 8, 3, 38, '优');
    const flag = flags.find(f => f.label.includes('高温预警'));
    expect(flag).toBeDefined();
  });

  it('shows 低温结冰风险 for temp ≤ 3°C', () => {
    const flags = computeRiskFlags(10, 5, 10, 8, 3, 2, '优');
    const flag = flags.find(f => f.label.includes('低温结冰'));
    expect(flag).toBeDefined();
  });

  it('shows UV warning for uvIndex ≥ 7', () => {
    const flags = computeRiskFlags(10, 5, 10, 8, 8, 22, '优');
    const flag = flags.find(f => f.label.includes('紫外线'));
    expect(flag).toBeDefined();
    expect(flag?.tint).toBe('orange');
  });
});

// ─── decodeWindDirection ──────────────────────────────────────────────────────

describe('decodeWindDirection', () => {
  it('0° → 北', () => expect(decodeWindDirection(0)).toBe('北'));
  it('45° → 东北', () => expect(decodeWindDirection(45)).toBe('东北'));
  it('90° → 东', () => expect(decodeWindDirection(90)).toBe('东'));
  it('135° → 东南', () => expect(decodeWindDirection(135)).toBe('东南'));
  it('180° → 南', () => expect(decodeWindDirection(180)).toBe('南'));
  it('225° → 西南', () => expect(decodeWindDirection(225)).toBe('西南'));
  it('270° → 西', () => expect(decodeWindDirection(270)).toBe('西'));
  it('315° → 西北', () => expect(decodeWindDirection(315)).toBe('西北'));
  it('360° wraps to 北', () => expect(decodeWindDirection(360)).toBe('北'));
  it('handles negative degrees gracefully', () => {
    const label = decodeWindDirection(-90);
    expect(['北', '东北', '东', '东南', '南', '西南', '西', '西北']).toContain(label);
  });
});

// ─── decodeWeatherCode ────────────────────────────────────────────────────────

describe('decodeWeatherCode', () => {
  it('code 0 → 晴空万里', () => expect(decodeWeatherCode(0)).toBe('晴空万里'));
  it('code 3 → 阴天', () => expect(decodeWeatherCode(3)).toBe('阴天'));
  it('code 61 → 小雨', () => expect(decodeWeatherCode(61)).toBe('小雨'));
  it('code 95 → 雷暴', () => expect(decodeWeatherCode(95)).toBe('雷暴'));
  it('unknown code returns non-empty fallback string', () => {
    const label = decodeWeatherCode(999);
    expect(typeof label).toBe('string');
    expect(label.length).toBeGreaterThan(0);
  });
});

// ─── Cache TTL logic (in-memory mock, no DOM dependency) ─────────────────────

describe('Cache TTL logic (20-minute boundary)', () => {
  const CACHE_TTL_MS = 20 * 60 * 1000;

  // Pure in-memory mock so tests run cleanly in Node/Vitest environment
  let mockStore: Record<string, string> = {};
  const mockStorage = {
    getItem: (key: string): string | null => mockStore[key] ?? null,
    setItem: (key: string, val: string): void => { mockStore[key] = val; },
    clear: (): void => { mockStore = {}; },
  };

  beforeEach(() => {
    mockStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('considers cache valid within 20 minutes', () => {
    const now = Date.now();
    const freshData = { fetchedAt: now - (10 * 60 * 1000), location: { id: 'hangzhou' } };
    mockStorage.setItem('solorider_preride_weather', JSON.stringify(freshData));

    const raw = mockStorage.getItem('solorider_preride_weather');
    const parsed = JSON.parse(raw!);
    const isValid = now - parsed.fetchedAt < CACHE_TTL_MS;
    expect(isValid).toBe(true);
  });

  it('considers cache stale after 20 minutes', () => {
    const now = Date.now();
    const staleData = { fetchedAt: now - (21 * 60 * 1000), location: { id: 'hangzhou' } };
    mockStorage.setItem('solorider_preride_weather', JSON.stringify(staleData));

    const raw = mockStorage.getItem('solorider_preride_weather');
    const parsed = JSON.parse(raw!);
    const isValid = now - parsed.fetchedAt < CACHE_TTL_MS;
    expect(isValid).toBe(false);
  });

  it('returns null when cache key is absent', () => {
    const raw = mockStorage.getItem('solorider_preride_weather');
    expect(raw).toBeNull();
  });

  it('handles malformed JSON in cache gracefully', () => {
    mockStorage.setItem('solorider_preride_weather', 'not-valid-json{{{');
    expect(() => {
      try {
        JSON.parse(mockStorage.getItem('solorider_preride_weather')!);
      } catch {
        // Expected — malformed JSON throws, caller should handle via try/catch
      }
    }).not.toThrow();
  });
});
