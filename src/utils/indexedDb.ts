/**
 * SoloRiderTools Native IndexedDB Cache
 * Provides zero-dependency, large-capacity persistent storage for Strava activities, streams, and routes.
 * Avoids LocalStorage 5MB QuotaExceeded limitations.
 */

const DB_NAME = 'solorider_strava_db';
const DB_VERSION = 1;

export interface StravaActivityRecord {
  id: number;
  name: string;
  distance: number; // meters
  moving_time: number; // seconds
  elapsed_time: number;
  total_elevation_gain: number;
  type: string;
  sport_type?: string;
  start_date: string; // ISO
  start_date_local: string;
  start_latlng?: [number, number];
  end_latlng?: [number, number];
  average_speed: number; // m/s
  max_speed: number;
  average_watts?: number;
  weighted_average_watts?: number; // Normalized Power
  kilojoules?: number;
  device_watts?: boolean;
  has_heartrate?: boolean;
  average_heartrate?: number;
  max_heartrate?: number;
  suffer_score?: number;
  gear_id?: string;
  summary_polyline?: string;
  // Calculated fields
  tss?: number;
  intensityFactor?: number;
}

export interface StravaStreamsRecord {
  activityId: number;
  updatedAt: number;
  time?: number[];
  watts?: number[];
  heartrate?: number[];
  cadence?: number[];
  velocity_smooth?: number[];
  altitude?: number[];
  latlng?: [number, number][];
}

export interface StravaRouteRecord {
  id: string;
  name: string;
  distance: number;
  elevation_gain: number;
  summary_polyline?: string;
  coordinates?: [number, number][];
  sub_type?: number;
  created_at?: string;
}

let dbInstance: IDBDatabase | null = null;

const getDb = (): Promise<IDBDatabase> => {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }

  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('activities')) {
        db.createObjectStore('activities', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('streams')) {
        db.createObjectStore('streams', { keyPath: 'activityId' });
      }
      if (!db.objectStoreNames.contains('routes')) {
        db.createObjectStore('routes', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
};

/**
 * Save multiple Strava activity summaries in a single transaction
 */
export const saveActivitiesToDb = async (activities: StravaActivityRecord[]): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readwrite');
    const store = tx.objectStore('activities');
    for (const act of activities) {
      store.put(act);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get all Strava activity summaries sorted by start_date descending
 */
export const getAllActivitiesFromDb = async (): Promise<StravaActivityRecord[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('activities', 'readonly');
    const store = tx.objectStore('activities');
    const request = store.getAll();
    request.onsuccess = () => {
      const list = (request.result as StravaActivityRecord[]) || [];
      list.sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
      resolve(list);
    };
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save detailed second-by-second activity stream
 */
export const saveStreamToDb = async (stream: StravaStreamsRecord): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('streams', 'readwrite');
    const store = tx.objectStore('streams');
    store.put(stream);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get detailed stream for a specific activity
 */
export const getStreamFromDb = async (activityId: number): Promise<StravaStreamsRecord | null> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('streams', 'readonly');
    const store = tx.objectStore('streams');
    const request = store.get(activityId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Save routes list
 */
export const saveRoutesToDb = async (routes: StravaRouteRecord[]): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('routes', 'readwrite');
    const store = tx.objectStore('routes');
    for (const route of routes) {
      store.put(route);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

/**
 * Get all cached Strava routes
 */
export const getAllRoutesFromDb = async (): Promise<StravaRouteRecord[]> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('routes', 'readonly');
    const store = tx.objectStore('routes');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Generic meta key-value helper
 */
export const setMetaToDb = async <T>(key: string, value: T): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readwrite');
    const store = tx.objectStore('meta');
    store.put({ key, value });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getMetaFromDb = async <T>(key: string): Promise<T | null> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('meta', 'readonly');
    const store = tx.objectStore('meta');
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result ? (request.result.value as T) : null);
    request.onerror = () => reject(request.error);
  });
};

/**
 * Clear all Strava data on disconnect
 */
export const clearStravaDb = async (): Promise<void> => {
  const db = await getDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['activities', 'streams', 'routes', 'meta'], 'readwrite');
    tx.objectStore('activities').clear();
    tx.objectStore('streams').clear();
    tx.objectStore('routes').clear();
    tx.objectStore('meta').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
