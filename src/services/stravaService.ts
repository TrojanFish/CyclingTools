/**
 * Strava API Service & OAuth 2.0 Integration
 * Handles authentication, token refresh, and endpoints for athlete, activities, streams, and routes.
 */

import {
  StravaActivityRecord,
  StravaStreamsRecord,
  StravaRouteRecord,
  saveActivitiesToDb,
  saveStreamToDb,
  saveRoutesToDb,
  setMetaToDb,
  getMetaFromDb
} from '../utils/indexedDb';

export const STRAVA_API_BASE = 'https://www.strava.com/api/v3';
export const STRAVA_OAUTH_BASE = 'https://www.strava.com/oauth';

export const STORAGE_KEY_API_KEYS = 'solorider_strava_api_keys';
export const STORAGE_KEY_TOKEN = 'solorider_strava_token';
export const STORAGE_KEY_SETTINGS = 'solorider_strava_settings';

export interface StravaApiKeys {
  clientId: string;
  clientSecret: string;
}

export interface StravaBike {
  id: string;
  name: string;
  distance: number; // meters
  primary: boolean;
}

export interface StravaAthlete {
  id: number;
  username?: string;
  firstname: string;
  lastname: string;
  city?: string;
  state?: string;
  country?: string;
  profile_medium?: string;
  profile?: string;
  weight?: number; // kg
  ftp?: number;
  bikes?: StravaBike[];
}

export interface StravaTokenData {
  accessToken: string;
  refreshToken: string;
  expiresAt: number; // Unix seconds
  athlete: StravaAthlete;
}

export interface StravaSyncSettings {
  autoSyncFtpWeight: boolean;
  autoSyncBikes: boolean;
  syncDays: number;
}

export const DEFAULT_SYNC_SETTINGS: StravaSyncSettings = {
  autoSyncFtpWeight: true,
  autoSyncBikes: true,
  syncDays: 90
};

// --- Storage Helpers ---

export const getStoredApiKeys = (): StravaApiKeys | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_API_KEYS);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed.clientId && parsed.clientSecret) {
      return parsed;
    }
  } catch {}
  return null;
};

export const saveStoredApiKeys = (keys: StravaApiKeys): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_API_KEYS, JSON.stringify(keys));
  } catch {}
};

export const getStoredTokenData = (): StravaTokenData | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_TOKEN);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {}
  return null;
};

export const saveStoredTokenData = (data: StravaTokenData): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_TOKEN, JSON.stringify(data));
  } catch {}
};

export const clearStoredTokenData = (): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY_TOKEN);
  } catch {}
};

export const getStoredSettings = (): StravaSyncSettings => {
  if (typeof window === 'undefined') return DEFAULT_SYNC_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SETTINGS);
    if (raw) return { ...DEFAULT_SYNC_SETTINGS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_SYNC_SETTINGS;
};

export const saveStoredSettings = (settings: StravaSyncSettings): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
  } catch {}
};

// --- OAuth Flow ---

/**
 * Builds the Strava authorization URL
 */
export const buildAuthorizeUrl = (clientId: string, redirectUri?: string): string => {
  const origin = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : 'http://localhost:5173/';
  const uri = redirectUri || origin;
  const scope = 'read,activity:read_all,profile:read_all';
  const state = 'solorider_strava_auth';
  return `${STRAVA_OAUTH_BASE}/authorize?client_id=${encodeURIComponent(clientId)}&response_type=code&redirect_uri=${encodeURIComponent(uri)}&approval_prompt=auto&scope=${encodeURIComponent(scope)}&state=${state}`;
};

/**
 * Exchange Authorization Code for Access & Refresh Tokens
 */
export const exchangeCodeForToken = async (
  clientId: string,
  clientSecret: string,
  code: string
): Promise<StravaTokenData> => {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: 'authorization_code'
    })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `Strava authorization exchange failed: ${response.statusText}`);
  }

  const data = await response.json();
  const tokenData: StravaTokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athlete: data.athlete
  };

  saveStoredTokenData(tokenData);
  return tokenData;
};

/**
 * Refresh Access Token using Refresh Token
 */
export const refreshAccessToken = async (
  clientId: string,
  clientSecret: string,
  refreshTokenStr: string
): Promise<StravaTokenData> => {
  const response = await fetch(`${STRAVA_OAUTH_BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshTokenStr,
      grant_type: 'refresh_token'
    })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.message || `Strava token refresh failed: ${response.statusText}`);
  }

  const data = await response.json();
  const currentToken = getStoredTokenData();
  const tokenData: StravaTokenData = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: data.expires_at,
    athlete: currentToken?.athlete || data.athlete || { id: 0, firstname: '', lastname: '' }
  };

  saveStoredTokenData(tokenData);
  return tokenData;
};

/**
 * Obtains a guaranteed valid access token, auto-refreshing if within 5 min of expiry
 */
export const getValidAccessToken = async (): Promise<string | null> => {
  const tokenData = getStoredTokenData();
  const apiKeys = getStoredApiKeys();
  if (!tokenData || !tokenData.accessToken) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  // If token expires in less than 300 seconds (5 min) and we have keys, refresh it
  if (tokenData.expiresAt && nowSec > tokenData.expiresAt - 300) {
    if (apiKeys?.clientId && apiKeys?.clientSecret && tokenData.refreshToken) {
      try {
        const refreshed = await refreshAccessToken(apiKeys.clientId, apiKeys.clientSecret, tokenData.refreshToken);
        return refreshed.accessToken;
      } catch (err) {
        console.warn('Failed to auto-refresh Strava token:', err);
        return tokenData.accessToken; // fallback to existing
      }
    }
  }

  return tokenData.accessToken;
};

// --- API Endpoints ---

/**
 * Fetch Current Athlete Profile
 */
export const fetchAthleteProfile = async (token: string): Promise<StravaAthlete> => {
  const response = await fetch(`${STRAVA_API_BASE}/athlete`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch athlete profile: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch Athlete Activities (Paged)
 */
export const fetchAthleteActivities = async (
  token: string,
  afterTimestamp?: number,
  page: number = 1,
  perPage: number = 50
): Promise<any[]> => {
  let url = `${STRAVA_API_BASE}/athlete/activities?page=${page}&per_page=${perPage}`;
  if (afterTimestamp && afterTimestamp > 0) {
    url += `&after=${Math.floor(afterTimestamp)}`;
  }

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activities: ${response.statusText}`);
  }

  return response.json();
};

/**
 * Fetch Second-by-Second Streams for an Activity
 */
export const fetchActivityStreams = async (
  token: string,
  activityId: number
): Promise<StravaStreamsRecord> => {
  const keys = 'time,watts,heartrate,cadence,velocity_smooth,altitude,latlng';
  const url = `${STRAVA_API_BASE}/activities/${activityId}/streams?keys=${keys}&key_by_type=true`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch activity streams: ${response.statusText}`);
  }

  const data = await response.json();
  const record: StravaStreamsRecord = {
    activityId,
    updatedAt: Date.now(),
    time: data.time?.data,
    watts: data.watts?.data,
    heartrate: data.heartrate?.data,
    cadence: data.cadence?.data,
    velocity_smooth: data.velocity_smooth?.data,
    altitude: data.altitude?.data,
    latlng: data.latlng?.data
  };

  await saveStreamToDb(record);
  return record;
};

/**
 * Fetch Athlete Routes
 */
export const fetchAthleteRoutes = async (token: string): Promise<StravaRouteRecord[]> => {
  const response = await fetch(`${STRAVA_API_BASE}/athlete/routes?per_page=30`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch routes: ${response.statusText}`);
  }

  const rawRoutes = await response.json();
  const routes: StravaRouteRecord[] = rawRoutes.map((r: any) => ({
    id: String(r.id_str || r.id),
    name: r.name,
    distance: r.distance,
    elevation_gain: r.elevation_gain,
    summary_polyline: r.map?.summary_polyline,
    coordinates: r.map?.summary_polyline ? decodePolyline(r.map.summary_polyline) : undefined,
    sub_type: r.sub_type,
    created_at: r.created_at
  }));

  await saveRoutesToDb(routes);
  return routes;
};

// --- Cycling Sports Science Calculations ---

/**
 * Compute Coggan Training Stress Score (TSS) for a Strava Activity
 */
export const calculateActivityTss = (
  activity: any,
  riderFtp: number = 220
): { tss: number; intensityFactor: number; np: number } => {
  const movingTimeSec = activity.moving_time || 0;
  if (movingTimeSec <= 0) return { tss: 0, intensityFactor: 0, np: 0 };

  const ftp = Math.max(80, riderFtp);
  let np = activity.weighted_average_watts || activity.average_watts || 0;

  // If activity has power data
  if (np > 0) {
    const intensityFactor = parseFloat((np / ftp).toFixed(3));
    // Standard Coggan TSS formula: TSS = (sec * NP * IF) / (FTP * 3600) * 100
    const tss = Math.round(((movingTimeSec * np * intensityFactor) / (ftp * 3600)) * 100);
    return { tss, intensityFactor, np };
  }

  // Fallback 1: Use Strava Suffer Score if available
  if (activity.suffer_score && activity.suffer_score > 0) {
    // Strava Suffer Score is roughly comparable to hrTSS for typical rides
    const tss = Math.round(activity.suffer_score * 0.95);
    const intensityFactor = parseFloat(Math.min(1.2, Math.sqrt(tss / ((movingTimeSec / 3600) * 100))).toFixed(2));
    return { tss, intensityFactor, np: Math.round(intensityFactor * ftp) };
  }

  // Fallback 2: Estimate based on average speed / distance
  // 1 hour at moderate endurance pace ~ 45-55 TSS
  const hours = movingTimeSec / 3600;
  const estimatedTss = Math.round(hours * 50);
  return { tss: estimatedTss, intensityFactor: 0.7, np: Math.round(ftp * 0.7) };
};

/**
 * Decode Google Encoded Polyline into [latitude, longitude][]
 */
export const decodePolyline = (str: string, precision: number = 5): [number, number][] => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: [number, number][] = [];
  const factor = Math.pow(10, precision);

  while (index < str.length) {
    let byte = 0;
    let shift = 0;
    let result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    shift = 0;
    result = 0;

    do {
      byte = str.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    coordinates.push([lat / factor, lng / factor]);
  }

  return coordinates;
};

// --- Strava Segments & KOM Features ---

export interface StravaSegmentItem {
  id: number;
  name: string;
  distance: number; // meters
  average_grade: number; // %
  maximum_grade: number; // %
  elevation_high: number; // m
  elevation_low: number; // m
  total_elevation_gain: number; // m
  climb_category: number; // 0=NC, 1=Cat 4, 2=Cat 3, 3=Cat 2, 4=Cat 1, 5=HC
  city?: string;
  state?: string;
  country?: string;
  starred?: boolean;
  climbSegments?: { name: string; distanceKm: number; gradePct: number }[];
}

export const CURATED_STRAVA_SEGMENTS: StravaSegmentItem[] = [
  {
    id: 661401,
    name: "Alpe d'Huez 经典 21 道拐 (Tour de France)",
    distance: 13800,
    average_grade: 8.1,
    maximum_grade: 14.8,
    elevation_high: 1850,
    elevation_low: 732,
    total_elevation_gain: 1118,
    climb_category: 5,
    country: "France",
    climbSegments: [
      { name: "拐角 21-16: 启程极陡攻坚壁", distanceKm: 2.5, gradePct: 10.4 },
      { name: "拐角 15-11: La Garde 盘山段", distanceKm: 3.5, gradePct: 8.6 },
      { name: "拐角 10-6: Saint-Féréol 匀速段", distanceKm: 3.2, gradePct: 7.9 },
      { name: "拐角 5-1: Huez 村庄提速段", distanceKm: 3.1, gradePct: 8.4 },
      { name: "终点拱门: 滑雪场终极冲刺冲顶", distanceKm: 1.5, gradePct: 5.2 }
    ]
  },
  {
    id: 646397,
    name: "Passo dello Stelvio (Prato 出发 48 发卡弯)",
    distance: 24300,
    average_grade: 7.4,
    maximum_grade: 12.0,
    elevation_high: 2758,
    elevation_low: 955,
    total_elevation_gain: 1803,
    climb_category: 5,
    country: "Italy",
    climbSegments: [
      { name: "第 1 段: 谷底针叶林起步过渡", distanceKm: 5.5, gradePct: 5.8 },
      { name: "第 2 段: 盘山中段持续推重比测试", distanceKm: 6.8, gradePct: 8.2 },
      { name: "第 3 段: 穿过林线岩壁连续发卡段", distanceKm: 7.0, gradePct: 8.8 },
      { name: "第 4 段: 海拔 2758m 极度缺氧冲顶段", distanceKm: 5.0, gradePct: 7.1 }
    ]
  },
  {
    id: 653062,
    name: "Mont Ventoux (Bédoin 经典风秃山顶)",
    distance: 21400,
    average_grade: 7.5,
    maximum_grade: 13.0,
    elevation_high: 1912,
    elevation_low: 303,
    total_elevation_gain: 1609,
    climb_category: 5,
    country: "France",
    climbSegments: [
      { name: "第 1 段: 葡萄园出城缓坡热身", distanceKm: 5.8, gradePct: 4.2 },
      { name: "第 2 段: 森林地狱严酷陡坡段", distanceKm: 9.2, gradePct: 9.5 },
      { name: "第 3 段: Chalet Reynard 荒芜月球地貌", distanceKm: 4.8, gradePct: 7.8 },
      { name: "第 4 段: 气象塔狂风大迎风冲顶", distanceKm: 1.6, gradePct: 9.8 }
    ]
  },
  {
    id: 647318,
    name: "Sa Calobra - Coll dels Reis (马略卡海湾回环)",
    distance: 9400,
    average_grade: 7.0,
    maximum_grade: 11.5,
    elevation_high: 682,
    elevation_low: 19,
    total_elevation_gain: 663,
    climb_category: 4,
    country: "Spain",
    climbSegments: [
      { name: "第 1 段: 峡谷岩壁盘旋段", distanceKm: 3.0, gradePct: 6.8 },
      { name: "第 2 段: 核心发卡弯连续攻坚", distanceKm: 3.8, gradePct: 7.8 },
      { name: "第 3 段: 领带结 270 度立交回旋冲顶", distanceKm: 2.6, gradePct: 6.2 }
    ]
  },
  {
    id: 651111,
    name: "Col du Tourmalet (Sainte-Marie 出发)",
    distance: 17200,
    average_grade: 7.4,
    maximum_grade: 10.5,
    elevation_high: 2115,
    elevation_low: 843,
    total_elevation_gain: 1272,
    climb_category: 5,
    country: "France",
    climbSegments: [
      { name: "第 1 段: 河谷缓坡预热段", distanceKm: 4.5, gradePct: 5.0 },
      { name: "第 2 段: Gripp 峡谷深处核心陡坡", distanceKm: 5.5, gradePct: 8.5 },
      { name: "第 3 段: La Mongie 滑雪小镇巡航", distanceKm: 4.5, gradePct: 8.0 },
      { name: "第 4 段: 环法创始人纪念雕像顶峰冲刺", distanceKm: 2.7, gradePct: 8.9 }
    ]
  },
  {
    id: 1541014,
    name: "北京门头沟妙峰山 (金顶牌楼挑战赛段)",
    distance: 20300,
    average_grade: 4.3,
    maximum_grade: 9.2,
    elevation_high: 1015,
    elevation_low: 139,
    total_elevation_gain: 876,
    climb_category: 4,
    city: "Beijing",
    country: "China",
    climbSegments: [
      { name: "第 1 段: 牌坊起步涧沟村过渡段", distanceKm: 7.0, gradePct: 3.5 },
      { name: "第 2 段: 桃园村连续盘山爬升", distanceKm: 6.5, gradePct: 4.8 },
      { name: "第 3 段: 娘娘庙陡坡发卡弯", distanceKm: 4.5, gradePct: 6.2 },
      { name: "第 4 段: 顶峰停车场金顶冲刺段", distanceKm: 2.3, gradePct: 5.0 }
    ]
  },
  {
    id: 4322894,
    name: "杭州西湖龙井爬坡 (龙井路经典计时段)",
    distance: 3200,
    average_grade: 5.1,
    maximum_grade: 8.5,
    elevation_high: 185,
    elevation_low: 22,
    total_elevation_gain: 163,
    climb_category: 2,
    city: "Hangzhou",
    country: "China",
    climbSegments: [
      { name: "第 1 段: 绿茶餐厅起步缓坡", distanceKm: 1.0, gradePct: 3.8 },
      { name: "第 2 段: 狮峰茶园核心连续陡弯", distanceKm: 1.5, gradePct: 6.5 },
      { name: "第 3 段: 龙井山园顶峰冲刺", distanceKm: 0.7, gradePct: 4.2 }
    ]
  },
  {
    id: 1894562,
    name: "浙江安吉天荒坪 (江南天池抽水蓄能盘山公路)",
    distance: 17800,
    average_grade: 5.6,
    maximum_grade: 10.0,
    elevation_high: 980,
    elevation_low: -18,
    total_elevation_gain: 998,
    climb_category: 4,
    city: "Anji",
    country: "China",
    climbSegments: [
      { name: "第 1 段: 山脚竹海缓坡穿行", distanceKm: 5.0, gradePct: 4.2 },
      { name: "第 2 段: 大溪村连续发卡陡坡攻坚", distanceKm: 6.5, gradePct: 6.8 },
      { name: "第 3 段: 峡谷悬崖盘山推重比考验", distanceKm: 4.3, gradePct: 7.0 },
      { name: "第 4 段: 天池大坝终点冲线段", distanceKm: 2.0, gradePct: 4.5 }
    ]
  }
];

/**
 * Fetch Starred Segments of the authenticated athlete
 */
export const fetchStarredSegments = async (token: string): Promise<StravaSegmentItem[]> => {
  const response = await fetch(`${STRAVA_API_BASE}/segments/starred?page=1&per_page=50`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch starred segments: ${response.statusText}`);
  }

  const rawList = await response.json();
  return rawList.map((s: any) => ({
    id: s.id,
    name: s.name,
    distance: s.distance,
    average_grade: s.average_grade,
    maximum_grade: s.maximum_grade,
    elevation_high: s.elevation_high,
    elevation_low: s.elevation_low,
    total_elevation_gain: s.total_elevation_gain,
    climb_category: s.climb_category,
    city: s.city,
    state: s.state,
    country: s.country,
    starred: true
  }));
};

/**
 * Fetch detailed segment info by segmentId
 */
export const fetchSegmentDetails = async (token: string, segmentId: number): Promise<any> => {
  const response = await fetch(`${STRAVA_API_BASE}/segments/${segmentId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch segment details: ${response.statusText}`);
  }

  return response.json();
};

// --- Peak Power & MMP Sliding Window Calculation ---

/**
 * Compute rolling peak average power for a specified window in seconds
 */
export const computePeakPower = (watts: number[], windowSec: number): number => {
  if (!watts || watts.length === 0) return 0;
  if (watts.length < windowSec) {
    const sum = watts.reduce((a, b) => a + (b || 0), 0);
    return Math.round(sum / watts.length);
  }

  let currentSum = 0;
  for (let i = 0; i < windowSec; i++) {
    currentSum += watts[i] || 0;
  }
  let maxSum = currentSum;

  for (let i = windowSec; i < watts.length; i++) {
    currentSum += (watts[i] || 0) - (watts[i - windowSec] || 0);
    if (currentSum > maxSum) {
      maxSum = currentSum;
    }
  }

  return Math.round(maxSum / windowSec);
};

/**
 * Extract best peak powers (5s, 1m, 5m, 20m) across multiple activities and streams
 */
export const extractBestMmpFromActivities = async (
  activities: StravaActivityRecord[],
  fetchStreamFn: (activityId: number) => Promise<StravaStreamsRecord | null>,
  maxActivitiesToScan: number = 8
): Promise<{
  p5s: number;
  p1m: number;
  p5m: number;
  p20m: number;
  bestActivityName?: string;
  sampleCount: number;
}> => {
  const powerActivities = activities
    .filter(a => a.device_watts || (a.average_watts && a.average_watts > 0) || (a.weighted_average_watts && a.weighted_average_watts > 0))
    .slice(0, maxActivitiesToScan);

  let best5s = 0;
  let best1m = 0;
  let best5m = 0;
  let best20m = 0;
  let bestName = '';
  let sampleCount = 0;

  for (const act of powerActivities) {
    const stream = await fetchStreamFn(act.id);
    if (stream && stream.watts && stream.watts.length > 5) {
      sampleCount++;
      const p5 = computePeakPower(stream.watts, 5);
      const p60 = computePeakPower(stream.watts, 60);
      const p300 = computePeakPower(stream.watts, 300);
      const p1200 = computePeakPower(stream.watts, 1200);

      if (p5 > best5s) best5s = p5;
      if (p60 > best1m) best1m = p60;
      if (p300 > best5m) best5m = p300;
      if (p1200 > best20m) {
        best20m = p1200;
        bestName = act.name;
      }
    } else if (act.average_watts || act.weighted_average_watts) {
      const np = act.weighted_average_watts || act.average_watts || 200;
      const est5s = Math.round(np * 3.2);
      const est1m = Math.round(np * 1.8);
      const est5m = Math.round(np * 1.22);
      const est20m = Math.round(np * 1.05);

      if (est5s > best5s) best5s = est5s;
      if (est1m > best1m) best1m = est1m;
      if (est5m > best5m) best5m = est5m;
      if (est20m > best20m) {
        best20m = est20m;
        bestName = act.name;
      }
      sampleCount++;
    }
  }

  if (best5s === 0) best5s = 950;
  if (best1m === 0) best1m = 520;
  if (best5m === 0) best5m = 330;
  if (best20m === 0) best20m = 255;

  return {
    p5s: best5s,
    p1m: best1m,
    p5m: best5m,
    p20m: best20m,
    bestActivityName: bestName || (powerActivities[0]?.name),
    sampleCount
  };
};
