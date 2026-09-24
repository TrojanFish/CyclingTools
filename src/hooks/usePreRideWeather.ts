/**
 * usePreRideWeather — Pre-Ride Weather & Air Quality Decision Hook
 *
 * Fetches current weather (Open-Meteo) and air quality (Open-Meteo AQ) for the
 * rider's current location, computes a Cycling Readiness Score (0-100), provides
 * gear advice, risk flags, and caches results for 20 minutes in localStorage.
 *
 * Data sources:
 *   - Weather: https://api.open-meteo.com/v1/forecast (no API key required)
 *   - Air Quality: https://air-quality-api.open-meteo.com/v1/air-quality
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { PRE_RIDE_LOCATIONS, PreRideLocation } from '../data/preRideLocations';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AirQualityData {
  pm25: number;   // μg/m³
  pm10: number;   // μg/m³
  aqi: number;    // Computed AQI value (0-500 scale)
  aqiLabel: string;  // 优 / 良 / 轻度 / 中度 / 重度 / 严重
  aqiColorToken: string; // iOS color token: 'green'|'yellow'|'orange'|'red'|'purple'
}

export interface CurrentConditions {
  temp: number;             // °C
  feelsLike: number;        // °C
  humidity: number;         // %
  precipProb: number;       // % current-hour precipitation probability
  windSpeedKmh: number;     // km/h
  windGustKmh: number;      // km/h
  windDirectionDeg: number; // 0-360°
  windDirectionLabel: string; // 东 / 东南 / 南 / 西南 / 西 / 西北 / 北 / 东北
  uvIndex: number;          // 0-11+
  weatherCode: number;      // WMO weather code
  weatherLabel: string;     // 晴 / 多云 / 小雨 / ...
}

export interface PreRideWeatherData {
  location: PreRideLocation;
  fetchedAt: number;         // Unix ms timestamp
  current: CurrentConditions;
  airQuality: AirQualityData;
  readinessScore: number;    // 0-100
  readinessLabel: string;    // 极佳 / 适宜 / 谨慎 / 不建议
  readinessTint: string;     // 'green' | 'blue' | 'orange' | 'red'
  gearAdvice: string;        // Clothing recommendation
  hydrationAdvice: string;   // Hydration recommendation
  riskFlags: Array<{ label: string; tint: string }>;
}

export type PreRideWeatherStatus = 'idle' | 'locating' | 'loading' | 'success' | 'error';

// ─── Constants ────────────────────────────────────────────────────────────────

const CACHE_KEY = 'solorider_preride_weather';
const LOCATION_KEY = 'solorider_preride_location_id';
const CUSTOM_LOCATION_KEY = 'solorider_preride_custom_location';
const CACHE_TTL_MS = 20 * 60 * 1000; // 20 minutes
const DEFAULT_LOCATION_ID = 'hangzhou';

// ─── WMO Weather Code → Chinese Label ─────────────────────────────────────────

export function decodeWeatherCode(code: number): string {
  if (code === 0) return '晴空万里';
  if (code === 1) return '晴转多云';
  if (code === 2) return '多云';
  if (code === 3) return '阴天';
  if (code >= 45 && code <= 48) return '雾霾';
  if (code >= 51 && code <= 55) return '毛毛雨';
  if (code >= 56 && code <= 57) return '冻雨';
  if (code >= 61 && code <= 65) return '小雨';
  if (code >= 66 && code <= 67) return '冻雨';
  if (code >= 71 && code <= 75) return '小雪';
  if (code === 77) return '冰粒';
  if (code >= 80 && code <= 82) return '阵雨';
  if (code === 85 || code === 86) return '阵雪';
  if (code >= 95 && code <= 99) return '雷暴';
  return '未知';
}

// ─── Wind Direction Deg → Chinese Label ───────────────────────────────────────

export function decodeWindDirection(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const dirs = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return dirs[Math.round(normalized / 45) % 8];
}

// ─── PM2.5 → AQI (GB3095-2012 breakpoints) ──────────────────────────────────

export function computeAqiFromPm25(pm25: number): {
  aqi: number; label: string; colorToken: string
} {
  // AQI breakpoints: [pm25_lo, pm25_hi, aqi_lo, aqi_hi]
  const breakpoints: Array<[number, number, number, number]> = [
    [0,   35,   0,   50],
    [35,  75,   51,  100],
    [75,  115,  101, 150],
    [115, 150,  151, 200],
    [150, 250,  201, 300],
    [250, 500,  301, 500],
  ];

  for (const [cLo, cHi, iLo, iHi] of breakpoints) {
    if (pm25 < cHi) {
      const aqi = Math.round(((iHi - iLo) / (cHi - cLo)) * (pm25 - cLo) + iLo);
      if (aqi <= 50)  return { aqi, label: '优',  colorToken: 'green' };
      if (aqi <= 100) return { aqi, label: '良',  colorToken: 'yellow' };
      if (aqi <= 150) return { aqi, label: '轻度', colorToken: 'orange' };
      if (aqi <= 200) return { aqi, label: '中度', colorToken: 'red' };
      if (aqi <= 300) return { aqi, label: '重度', colorToken: 'red' };
      return { aqi, label: '严重', colorToken: 'purple' };
    }
  }
  return { aqi: 500, label: '严重', colorToken: 'purple' };
}

// ─── Readiness Score ──────────────────────────────────────────────────────────

export function computeReadinessScore(
  pm25: number,
  precipProb: number,
  windGustKmh: number,
  temp: number,
  uvIndex: number
): { score: number; label: string; tint: string } {
  let score = 100;

  // Air quality penalty
  if (pm25 >= 250) score -= 50;
  else if (pm25 >= 150) score -= 40;
  else if (pm25 >= 75)  score -= 30;
  else if (pm25 >= 35)  score -= 15;

  // Precipitation penalty
  if (precipProb >= 80)      score -= 30;
  else if (precipProb >= 60) score -= 20;
  else if (precipProb >= 40) score -= 12;
  else if (precipProb >= 20) score -= 5;

  // Wind gust penalty
  if (windGustKmh >= 60)     score -= 25;
  else if (windGustKmh >= 45) score -= 18;
  else if (windGustKmh >= 35) score -= 10;
  else if (windGustKmh >= 25) score -= 4;

  // Temperature penalties
  if (temp >= 40)      score -= 25;
  else if (temp >= 38) score -= 18;
  else if (temp >= 36) score -= 10;
  else if (temp <= 0)  score -= 20;
  else if (temp <= 3)  score -= 12;
  else if (temp <= 8)  score -= 5;

  // UV penalty (only extreme)
  if (uvIndex >= 11) score -= 5;

  const clampedScore = Math.max(0, Math.min(100, score));

  if (clampedScore >= 85) return { score: clampedScore, label: '极佳出骑时机', tint: 'green' };
  if (clampedScore >= 65) return { score: clampedScore, label: '适宜骑行',     tint: 'blue' };
  if (clampedScore >= 40) return { score: clampedScore, label: '谨慎出行',     tint: 'orange' };
  return                          { score: clampedScore, label: '不建议外骑',   tint: 'red' };
}

// ─── Gear Advice ──────────────────────────────────────────────────────────────

export function computeGearAdvice(feelsLike: number): string {
  if (feelsLike >= 28) return '轻量短袖骑行服 + 冰丝防晒袖套';
  if (feelsLike >= 22) return '短袖骑行服 + 轻薄防风马甲';
  if (feelsLike >= 15) return '短袖骑行服 + 防风马甲 + 长指手套';
  if (feelsLike >= 8)  return '长袖功能内衣 + 骑行软壳马甲 / 抓绒';
  if (feelsLike >= 2)  return '冬季长袖骑行服 + 冬手套 + 保暖帽盔垫';
  return '极寒装备全套 + 冬靴套 + 颈套护脸 (≤0°C 请三思)';
}

// ─── Hydration Advice ────────────────────────────────────────────────────────

export function computeHydrationAdvice(temp: number): string {
  if (temp >= 32) return '双水壶必备，每 15 分钟补充 150~200ml + 电解质';
  if (temp >= 26) return '每小时补水 600~800ml + 运动电解质泡腾片';
  if (temp >= 20) return '每小时补水约 500ml，气温舒适无需额外补盐';
  return '每小时补水 300~400ml，低温易被骗，切勿忽视补水';
}

// ─── Risk Flags ───────────────────────────────────────────────────────────────

export function computeRiskFlags(
  pm25: number,
  precipProb: number,
  windGustKmh: number,
  windSpeedKmh: number,
  uvIndex: number,
  temp: number,
  aqiLabel: string
): Array<{ label: string; tint: string }> {
  const flags: Array<{ label: string; tint: string }> = [];

  if (pm25 < 35 && aqiLabel === '优') {
    flags.push({ label: '空气质量优', tint: 'green' });
  }

  if (precipProb < 15) {
    flags.push({ label: '全程无雨', tint: 'green' });
  } else if (precipProb >= 15 && precipProb < 40) {
    flags.push({ label: `降水概率 ${precipProb}%`, tint: 'yellow' });
  } else if (precipProb >= 40 && precipProb < 70) {
    flags.push({ label: `降雨预警 ${precipProb}%`, tint: 'orange' });
  } else {
    flags.push({ label: `强降雨 ${precipProb}%`, tint: 'red' });
  }

  if (pm25 >= 75) {
    flags.push({ label: '呼吸安全风险', tint: 'red' });
  } else if (pm25 >= 35) {
    flags.push({ label: 'PM2.5 偏高', tint: 'orange' });
  }

  if (windGustKmh >= 50) {
    flags.push({ label: `强阵风 ${windGustKmh}km/h · 碳刀需谨慎`, tint: 'red' });
  } else if (windGustKmh >= 35) {
    flags.push({ label: `阵风预警 ${windGustKmh}km/h`, tint: 'orange' });
  } else if (windSpeedKmh >= 20) {
    flags.push({ label: `风速 ${windSpeedKmh}km/h`, tint: 'yellow' });
  }

  if (uvIndex >= 10) {
    flags.push({ label: `极强紫外线 UV${uvIndex}`, tint: 'red' });
  } else if (uvIndex >= 7) {
    flags.push({ label: `强紫外线 UV${uvIndex} · 防晒必备`, tint: 'orange' });
  } else if (uvIndex >= 4) {
    flags.push({ label: `UV${uvIndex} 中等`, tint: 'yellow' });
  }

  if (temp >= 36) {
    flags.push({ label: '高温预警 · 防中暑', tint: 'red' });
  } else if (temp <= 3) {
    flags.push({ label: '低温结冰风险', tint: 'orange' });
  }

  return flags;
}

// ─── localStorage Helpers ─────────────────────────────────────────────────────

function readCache(): PreRideWeatherData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PreRideWeatherData;
    if (Date.now() - parsed.fetchedAt < CACHE_TTL_MS) return parsed;
    return null;
  } catch {
    return null;
  }
}

function writeCache(data: PreRideWeatherData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Gracefully ignore QuotaExceededError
  }
}

function readSavedLocation(): PreRideLocation | null {
  try {
    const rawCustom = localStorage.getItem(CUSTOM_LOCATION_KEY);
    if (rawCustom) {
      const parsed = JSON.parse(rawCustom) as PreRideLocation;
      if (parsed && typeof parsed.lat === 'number' && typeof parsed.lng === 'number') {
        return parsed;
      }
    }
    const savedId = localStorage.getItem(LOCATION_KEY);
    if (savedId) {
      return PRE_RIDE_LOCATIONS.find(l => l.id === savedId) ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

function writeSavedLocation(loc: PreRideLocation): void {
  try {
    if (loc.isGps || loc.id === 'current-gps') {
      localStorage.setItem(CUSTOM_LOCATION_KEY, JSON.stringify(loc));
      localStorage.removeItem(LOCATION_KEY);
    } else {
      localStorage.setItem(LOCATION_KEY, loc.id);
      localStorage.removeItem(CUSTOM_LOCATION_KEY);
    }
  } catch {
    // Gracefully ignore storage errors
  }
}

// ─── API Fetch ────────────────────────────────────────────────────────────────

async function fetchPreRideData(location: PreRideLocation): Promise<PreRideWeatherData> {
  const { lat, lng } = location;

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,` +
    `precipitation_probability,wind_speed_10m,wind_gusts_10m,` +
    `wind_direction_10m,uv_index,weather_code` +
    `&timezone=auto&forecast_days=1`;

  const aqUrl =
    `https://air-quality-api.open-meteo.com/v1/air-quality` +
    `?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}` +
    `&current=pm2_5,pm10` +
    `&timezone=auto`;

  const [weatherRes, aqRes] = await Promise.allSettled([
    fetch(weatherUrl).then(r => r.json()),
    fetch(aqUrl).then(r => r.json()),
  ]);

  // Parse weather
  const wData = weatherRes.status === 'fulfilled' ? weatherRes.value : null;
  const cur = wData?.current ?? {};

  const temp          = Math.round(cur.temperature_2m ?? 22);
  const feelsLike     = Math.round(cur.apparent_temperature ?? temp);
  const humidity      = Math.round(cur.relative_humidity_2m ?? 60);
  const precipProb    = Math.round(cur.precipitation_probability ?? 0);
  const windSpeedKmh  = Math.round(cur.wind_speed_10m ?? 10);
  const windGustKmh   = Math.round(cur.wind_gusts_10m ?? windSpeedKmh);
  const windDirDeg    = Math.round(cur.wind_direction_10m ?? 90);
  const uvIndex       = Math.round(cur.uv_index ?? 3);
  const weatherCode   = cur.weather_code ?? 1;

  // Parse air quality
  const aqData  = aqRes.status === 'fulfilled' ? aqRes.value : null;
  const aqCur   = aqData?.current ?? {};
  const pm25    = Math.round(aqCur.pm2_5 ?? 15);
  const pm10    = Math.round(aqCur.pm10  ?? 25);

  const { aqi, label: aqiLabel, colorToken: aqiColorToken } = computeAqiFromPm25(pm25);
  const { score, label: readinessLabel, tint: readinessTint } = computeReadinessScore(
    pm25, precipProb, windGustKmh, temp, uvIndex
  );

  const currentConditions: CurrentConditions = {
    temp,
    feelsLike,
    humidity,
    precipProb,
    windSpeedKmh,
    windGustKmh,
    windDirectionDeg: windDirDeg,
    windDirectionLabel: decodeWindDirection(windDirDeg),
    uvIndex,
    weatherCode,
    weatherLabel: decodeWeatherCode(weatherCode),
  };

  const airQuality: AirQualityData = {
    pm25, pm10, aqi, aqiLabel, aqiColorToken,
  };

  const result: PreRideWeatherData = {
    location,
    fetchedAt: Date.now(),
    current: currentConditions,
    airQuality,
    readinessScore: score,
    readinessLabel,
    readinessTint,
    gearAdvice: computeGearAdvice(feelsLike),
    hydrationAdvice: computeHydrationAdvice(temp),
    riskFlags: computeRiskFlags(pm25, precipProb, windGustKmh, windSpeedKmh, uvIndex, temp, aqiLabel),
  };

  writeCache(result);
  return result;
}

// ─── Geolocation & Reverse Geocoding ──────────────────────────────────────────

export function findNearestLocation(lat: number, lng: number): PreRideLocation {
  let nearest = PRE_RIDE_LOCATIONS[0];
  let minDist = Infinity;
  for (const loc of PRE_RIDE_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minDist) { minDist = d; nearest = loc; }
  }
  return nearest;
}

/** Reverse geocodes coordinates to Chinese city/district name using free client API */
export async function reverseGeocode(lat: number, lng: number): Promise<{ name: string; desc: string }> {
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat.toFixed(4)}&longitude=${lng.toFixed(4)}&localityLanguage=zh`
    );
    if (!res.ok) throw new Error('Geocode failed');
    const d = await res.json();
    const city = (d.city || '').replace(/市$/, '');
    const district = d.locality || '';
    const province = d.principalSubdivision || '';

    // If both city and district are available, combine for high precision: e.g. "杭州 · 拱墅区"
    let name = '当地位置';
    if (city && district && city !== district) {
      name = `${city} · ${district}`;
    } else if (city || district) {
      name = city || district;
    }

    const desc = province ? `${province} · GPS 精准定位` : 'GPS 精准定位';
    return { name, desc };
  } catch {
    const nearest = findNearestLocation(lat, lng);
    return {
      name: `${nearest.name} · 当前定位`,
      desc: `${lat.toFixed(2)}°N, ${lng.toFixed(2)}°E · GPS`
    };
  }
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

interface UsePreRideWeatherReturn {
  data: PreRideWeatherData | null;
  status: PreRideWeatherStatus;
  error: string | null;
  selectedLocation: PreRideLocation;
  setLocation: (loc: PreRideLocation) => void;
  requestCurrentLocation: () => void;
  refresh: () => void;
}

export function usePreRideWeather(): UsePreRideWeatherReturn {
  const [data, setData] = useState<PreRideWeatherData | null>(null);
  const [status, setStatus] = useState<PreRideWeatherStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocationState] = useState<PreRideLocation>(() => {
    const saved = readSavedLocation();
    return saved ?? PRE_RIDE_LOCATIONS[0];
  });

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const loadData = useCallback(async (location: PreRideLocation, forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = readCache();
      if (cached && cached.location.id === location.id) {
        if (isMountedRef.current) {
          setData(cached);
          setStatus('success');
        }
        return;
      }
    }

    if (!isMountedRef.current) return;
    setStatus('loading');
    setError(null);

    try {
      const result = await fetchPreRideData(location);
      if (isMountedRef.current) {
        setData(result);
        setStatus('success');
      }
    } catch (err) {
      if (isMountedRef.current) {
        setError('气象数据获取失败，请检查网络连接');
        setStatus('error');
      }
    }
  }, []);

  // Request actual user current location via GPS
  const requestCurrentLocation = useCallback(async () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      setError('当前浏览器或设备不支持 GPS 地理位置定位');
      return;
    }

    setStatus('locating');
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const { name, desc } = await reverseGeocode(lat, lng);

        const gpsLocation: PreRideLocation = {
          id: 'current-gps',
          name,
          desc,
          lat,
          lng,
          isGps: true,
        };

        if (isMountedRef.current) {
          setSelectedLocationState(gpsLocation);
          writeSavedLocation(gpsLocation);
          setData(null);
          loadData(gpsLocation, true);
        }
      },
      (geoErr) => {
        if (!isMountedRef.current) return;
        let msg = '无法获取当前位置，已保留当前城市';
        if (geoErr.code === geoErr.PERMISSION_DENIED) {
          msg = '请在浏览器或系统设置中允许定位权限以获取当地天气';
        } else if (geoErr.code === geoErr.TIMEOUT) {
          msg = '定位获取超时，请检查 GPS 或网络连接';
        }
        setError(msg);
        setStatus('idle');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  }, [loadData]);

  // On mount: if saved location exists, load it; if not, automatically request GPS location
  useEffect(() => {
    const saved = readSavedLocation();
    if (saved) {
      loadData(saved);
      return;
    }

    // First visit: automatically request GPS location
    if (typeof navigator !== 'undefined' && 'geolocation' in navigator) {
      setStatus('locating');
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const { name, desc } = await reverseGeocode(lat, lng);

          const gpsLoc: PreRideLocation = {
            id: 'current-gps',
            name,
            desc,
            lat,
            lng,
            isGps: true,
          };

          if (isMountedRef.current) {
            setSelectedLocationState(gpsLoc);
            writeSavedLocation(gpsLoc);
            loadData(gpsLoc, true);
          }
        },
        () => {
          // Permission denied or timeout -> graceful fallback to default preset
          if (isMountedRef.current) {
            loadData(PRE_RIDE_LOCATIONS[0]);
          }
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      loadData(PRE_RIDE_LOCATIONS[0]);
    }
  }, [loadData]);

  const setLocation = useCallback((loc: PreRideLocation) => {
    setSelectedLocationState(loc);
    writeSavedLocation(loc);
    setData(null);
    loadData(loc, true);
  }, [loadData]);

  const refresh = useCallback(() => {
    loadData(selectedLocation, true);
  }, [loadData, selectedLocation]);

  return { data, status, error, selectedLocation, setLocation, requestCurrentLocation, refresh };
}
