import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  generateSimulatedStravaStream,
  stravaStreamsToActivityPoints,
  stravaStreamsToWaypoints,
  exportStravaActivityToGpxXml,
  convertStravaToLocalRecord
} from '../stravaStreamAdapter';
import {
  StravaActivityRecord,
  saveActivitiesToDb,
  getAllActivitiesFromDb,
  saveStreamToDb,
  getStreamFromDb,
  seedDemoStravaActivitiesToDb
} from '../indexedDb';
import { setPendingTransfer, consumePendingTransfer } from '../../hooks/useToolDraftState';
import { generateDemoStravaActivities } from '../stravaCockpitAnalytics';

class MockStorage implements Storage {
  private store: Map<string, string> = new Map();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    return this.store.has(key) ? this.store.get(key)! : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    this.store.delete(key);
  }

  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

function createMockIndexedDB() {
  const storeData: Record<string, Map<any, any>> = {
    activities: new Map(),
    streams: new Map(),
    routes: new Map(),
    meta: new Map()
  };

  const mockDb = {
    objectStoreNames: {
      contains: (name: string) => !!storeData[name]
    },
    createObjectStore: (name: string) => {
      if (!storeData[name]) storeData[name] = new Map();
      return {};
    },
    transaction: (_storeNames: string | string[], _mode: 'readonly' | 'readwrite') => {
      const tx: any = {
        error: null,
        oncomplete: null as any,
        onerror: null as any,
        objectStore: (storeName: string) => {
          const map = storeData[storeName] || new Map();
          return {
            put: (val: any) => {
              const key = val.id !== undefined ? val.id : (val.activityId !== undefined ? val.activityId : val.key);
              map.set(key, JSON.parse(JSON.stringify(val)));
            },
            get: (key: any) => {
              const req: any = { result: map.get(key) ? JSON.parse(JSON.stringify(map.get(key))) : undefined };
              queueMicrotask(() => req.onsuccess && req.onsuccess({ target: req }));
              return req;
            },
            getAll: () => {
              const req: any = { result: Array.from(map.values()).map(v => JSON.parse(JSON.stringify(v))) };
              queueMicrotask(() => req.onsuccess && req.onsuccess({ target: req }));
              return req;
            },
            count: () => {
              const req: any = { result: map.size };
              queueMicrotask(() => req.onsuccess && req.onsuccess({ target: req }));
              return req;
            },
            clear: () => {
              map.clear();
            }
          };
        }
      };

      queueMicrotask(() => {
        if (tx.oncomplete) tx.oncomplete({ target: tx });
      });

      return tx;
    }
  };

  return {
    open: (_name: string, _version: number) => {
      const req: any = {
        result: mockDb,
        onsuccess: null as any,
        onerror: null as any,
        onupgradeneeded: null as any
      };
      queueMicrotask(() => {
        if (req.onupgradeneeded) {
          req.onupgradeneeded({ target: req });
        }
        if (req.onsuccess) {
          req.onsuccess({ target: req });
        }
      });
      return req;
    }
  };
}

describe('Strava ↔ GPX ↔ FIT Cross-Tool Simulation Pipeline', () => {
  let mockSessionStorage: MockStorage;
  let mockLocalStorage: MockStorage;
  let originalIndexedDB: any;

  beforeEach(() => {
    mockSessionStorage = new MockStorage();
    mockLocalStorage = new MockStorage();

    vi.stubGlobal('sessionStorage', mockSessionStorage);
    vi.stubGlobal('localStorage', mockLocalStorage);
    (globalThis as any).window = globalThis;
    (globalThis as any).window.sessionStorage = mockSessionStorage;
    (globalThis as any).window.localStorage = mockLocalStorage;

    originalIndexedDB = (globalThis as any).indexedDB;
    (globalThis as any).indexedDB = createMockIndexedDB();
    (globalThis as any).window.indexedDB = (globalThis as any).indexedDB;
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    (globalThis as any).indexedDB = originalIndexedDB;
  });

  const demoActivity: StravaActivityRecord = {
    id: 99101,
    name: '西湖龙井与梅灵南路起伏拉练 (Simulation Test)',
    distance: 38500,
    moving_time: 4800,
    elapsed_time: 5100,
    total_elevation_gain: 420,
    type: 'Ride',
    start_date: '2026-06-15T08:00:00Z',
    start_date_local: '2026-06-15T16:00:00Z',
    average_speed: 8.02,
    max_speed: 15.5,
    average_watts: 210,
    weighted_average_watts: 228,
    kilojoules: 1008,
    device_watts: true,
    has_heartrate: true,
    average_heartrate: 148,
    max_heartrate: 176
  };

  const mountainActivity: StravaActivityRecord = {
    id: 99102,
    name: '安吉天荒坪 18km 连续爬坡攻坚',
    distance: 52000,
    moving_time: 6800,
    elapsed_time: 7200,
    total_elevation_gain: 1120,
    type: 'Ride',
    start_date: '2026-06-16T07:30:00Z',
    start_date_local: '2026-06-16T15:30:00Z',
    average_speed: 7.64,
    max_speed: 18.2,
    average_watts: 235,
    weighted_average_watts: 252,
    kilojoules: 1598,
    device_watts: true,
    has_heartrate: true,
    average_heartrate: 162,
    max_heartrate: 185
  };

  describe('1. Synthetic Stream Generation (generateSimulatedStravaStream)', () => {
    it('generates fully synchronized multi-channel 1Hz telemetry streams', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 300);

      expect(stream.activityId).toBe(99101);
      expect(stream.time).toBeDefined();
      expect(stream.watts).toBeDefined();
      expect(stream.heartrate).toBeDefined();
      expect(stream.cadence).toBeDefined();
      expect(stream.velocity_smooth).toBeDefined();
      expect(stream.altitude).toBeDefined();
      expect(stream.latlng).toBeDefined();

      const len = stream.time!.length;
      expect(len).toBe(300);
      expect(stream.watts!.length).toBe(len);
      expect(stream.heartrate!.length).toBe(len);
      expect(stream.cadence!.length).toBe(len);
      expect(stream.velocity_smooth!.length).toBe(len);
      expect(stream.altitude!.length).toBe(len);
      expect(stream.latlng!.length).toBe(len);
    });

    it('tailors GPS coordinates and elevation to geographical route anchors', () => {
      // Longjing route anchor: in Hangzhou area (~30.22 lat, ~120.24 lon)
      const longjingStream = generateSimulatedStravaStream(demoActivity, 100);
      const [ljLat, ljLon] = longjingStream.latlng![0];
      expect(ljLat).toBeCloseTo(30.22, 1);
      expect(ljLon).toBeGreaterThan(120.0);
      expect(ljLon).toBeLessThan(120.5);

      // Tianhuangping anchor: ~30.45 lat, ~119.58 lon, higher base altitude
      const mountainStream = generateSimulatedStravaStream(mountainActivity, 100);
      const [mtLat, mtLon] = mountainStream.latlng![0];
      expect(mtLat).toBeCloseTo(30.45, 1);
      expect(mtLon).toBeGreaterThan(119.5);
      expect(mtLon).toBeLessThan(120.0);
      expect(mountainStream.altitude![0]).toBeGreaterThanOrEqual(200);
    });

    it('enforces physiological safety guards (non-negative power, realistic HR/cadence)', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 200);

      for (let i = 0; i < stream.watts!.length; i++) {
        expect(stream.watts![i]).toBeGreaterThanOrEqual(0);
        expect(stream.watts![i]).toBeLessThanOrEqual(1500);

        expect(stream.heartrate![i]).toBeGreaterThanOrEqual(60);
        expect(stream.heartrate![i]).toBeLessThanOrEqual(210);

        expect(stream.cadence![i]).toBeGreaterThanOrEqual(0);
        expect(stream.cadence![i]).toBeLessThanOrEqual(130);

        expect(stream.velocity_smooth![i]).toBeGreaterThan(0);
      }
    });
  });

  describe('2. FIT Telemetry & Coggan Conversion (convertStravaToLocalRecord)', () => {
    it('converts simulated stream to full LocalActivityRecord with Coggan 7 zones and MMP', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 360);
      const { record, analysis, points } = convertStravaToLocalRecord(
        demoActivity,
        stream,
        240, // FTP
        68,  // Weight
        185  // Max HR
      );

      // Record identity
      expect(record.id).toBe('strava-99101');
      expect(record.fileType).toBe('strava');
      expect(record.hasHardwarePower).toBe(true);
      expect(record.hasHeartRate).toBe(true);
      expect(record.hasCadence).toBe(true);

      // Points array
      expect(points.length).toBe(360);
      expect(points[0].power).toBeDefined();
      expect(points[0].heartRate).toBeDefined();
      expect(points[0].cadence).toBeDefined();
      expect(points[0].lat).toBeDefined();
      expect(points[0].lon).toBeDefined();

      // Coggan physiological metrics
      expect(analysis.normalizedPower).toBeGreaterThan(0);
      expect(analysis.intensityFactor).toBeGreaterThan(0);
      expect(analysis.tss).toBeGreaterThan(0);
      expect(analysis.workKj).toBeGreaterThan(0);
      expect(analysis.timeInPowerZones.length).toBe(7);
      expect(analysis.mmp.length).toBeGreaterThan(0);
    });
  });

  describe('3. GPX Waypoints Extraction & Route Planner Linkage', () => {
    it('extracts downsampled waypoints with cumulative Haversine distances', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 400);
      const waypoints = stravaStreamsToWaypoints(demoActivity, stream, 80);

      expect(waypoints.length).toBeLessThanOrEqual(80);
      expect(waypoints.length).toBeGreaterThan(10);

      expect(waypoints[0].distanceKm).toBe(0);
      expect(waypoints[waypoints.length - 1].distanceKm).toBeGreaterThan(5);

      // Waypoints must have lat, lng, elevation for Leaflet rendering
      for (const wp of waypoints) {
        expect(wp.lat).toBeDefined();
        expect(wp.lng).toBeDefined();
        expect(wp.elevation).toBeDefined();
        expect(wp.id).toContain('wp-strava-99101');
      }
    });

    it('transfers waypoints to GPX Route Creator via crossToolBridge', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 150);
      const waypoints = stravaStreamsToWaypoints(demoActivity, stream, 50);

      const success = setPendingTransfer('solorider_pending_gpx_route', {
        name: demoActivity.name,
        waypoints
      });
      expect(success).toBe(true);

      // Consumer side (GpxRouteCreator)
      const consumed = consumePendingTransfer<{ name: string; waypoints: any[] }>('solorider_pending_gpx_route');
      expect(consumed).not.toBeNull();
      expect(consumed!.name).toBe(demoActivity.name);
      expect(consumed!.waypoints.length).toBe(waypoints.length);

      // One-time consumption: second call must be null
      const secondAttempt = consumePendingTransfer('solorider_pending_gpx_route');
      expect(secondAttempt).toBeNull();
    });
  });

  describe('4. Standard GPX 1.1 XML Generation & Sensor Extensions', () => {
    it('generates valid GPX 1.1 XML with Garmin TPX hr, cadence, and power', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 100);
      const xml = exportStravaActivityToGpxXml(demoActivity, stream);

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
      expect(xml).toContain('<gpx version="1.1"');
      expect(xml).toContain('xmlns="http://www.topografix.com/GPX/1/1"');
      expect(xml).toContain('xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1"');
      expect(xml).toContain(`<name>${demoActivity.name}</name>`);
      expect(xml).toContain('<trk>');
      expect(xml).toContain('<trkseg>');

      // Trackpoints must contain elevation, time, and TPX extensions
      expect(xml).toContain('<ele>');
      expect(xml).toContain('<time>');
      expect(xml).toContain('<extensions><gpxtpx:TrackPointExtension>');
      expect(xml).toContain('<gpxtpx:hr>');
      expect(xml).toContain('<gpxtpx:cad>');
      expect(xml).toContain('<gpxtpx:power>');
    });
  });

  describe('5. Cross-Tool Analysis Dispatch (Strava Cockpit ↔ FIT Analyzer)', () => {
    it('dispatches and consumes pending activity analysis transfer', () => {
      const stream = generateSimulatedStravaStream(demoActivity, 120);
      const { record } = convertStravaToLocalRecord(demoActivity, stream, 240, 68, 185);

      const ok = setPendingTransfer('solorider_pending_activity_analysis', {
        activityId: record.id,
        name: demoActivity.name
      });
      expect(ok).toBe(true);

      const pending = consumePendingTransfer<{ activityId: string; name: string }>('solorider_pending_activity_analysis');
      expect(pending).not.toBeNull();
      expect(pending!.activityId).toBe('strava-99101');
      expect(pending!.name).toBe(demoActivity.name);
    });
  });

  describe('6. Climb Pacing Planner Segment Linkage', () => {
    it('transfers climbing route waypoints to Climb Pacing Planner', () => {
      const stream = generateSimulatedStravaStream(mountainActivity, 100);
      const waypoints = stravaStreamsToWaypoints(mountainActivity, stream, 60);

      const ok = setPendingTransfer('solorider_pending_climb_route', {
        name: mountainActivity.name,
        waypoints
      });
      expect(ok).toBe(true);

      const consumed = consumePendingTransfer<{ name: string; waypoints: any[] }>('solorider_pending_climb_route');
      expect(consumed).not.toBeNull();
      expect(consumed!.name).toBe(mountainActivity.name);
      expect(consumed!.waypoints.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('7. Local IndexedDB Demo Seeding Simulation', () => {
    it('seeds demo Strava activities and verifies retrieval', async () => {
      const demoList = generateDemoStravaActivities().slice(0, 4);
      await saveActivitiesToDb(demoList);

      const retrieved = await getAllActivitiesFromDb();
      expect(retrieved.length).toBe(4);
      expect(retrieved[0].id).toBeDefined();

      // Seed stream
      const stream = generateSimulatedStravaStream(demoList[0], 60);
      await saveStreamToDb(stream);

      const retrievedStream = await getStreamFromDb(demoList[0].id);
      expect(retrievedStream).not.toBeNull();
      expect(retrievedStream!.activityId).toBe(demoList[0].id);
      expect(retrievedStream!.watts!.length).toBe(60);
    });

    it('seeds full demo season with streams via seedDemoStravaActivitiesToDb', async () => {
      const seeded = await seedDemoStravaActivitiesToDb();
      expect(seeded.length).toBe(8);

      const all = await getAllActivitiesFromDb();
      expect(all.length).toBe(8);

      // Verify that corresponding stream is saved in IndexedDB
      const firstStream = await getStreamFromDb(seeded[0].id);
      expect(firstStream).not.toBeNull();
      expect(firstStream!.activityId).toBe(seeded[0].id);
      expect(firstStream!.watts!.length).toBeGreaterThan(0);
      expect(firstStream!.latlng!.length).toBeGreaterThan(0);
    });
  });
});
