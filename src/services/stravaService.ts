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
