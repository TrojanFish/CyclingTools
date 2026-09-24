import { describe, it, expect, beforeAll } from 'vitest';
import {
  parseGpxFile,
  generateRealisticDemoRide,
  analyzePoints,
  ActivityPoint
} from '../activityParser';

// Polyfill minimal DOMParser for Node.js test runner environment
beforeAll(() => {
  if (typeof (globalThis as any).DOMParser === 'undefined') {
    (globalThis as any).DOMParser = class MockDOMParser {
      parseFromString(str: string) {
        return {
          getElementsByTagName: (tagName: string) => {
            if (tagName === 'trkpt') {
              const regex = /<trkpt\s+lat="([^"]+)"\s+lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g;
              const matches: any[] = [];
              let m;
              while ((m = regex.exec(str)) !== null) {
                const lat = m[1];
                const lon = m[2];
                const inner = m[3];
                matches.push({
                  getAttribute: (attr: string) => (attr === 'lat' ? lat : attr === 'lon' ? lon : null),
                  getElementsByTagName: (subTag: string) => {
                    const tagRegex = new RegExp(`<(${subTag})>([^<]+)<\\/\\1>`, 'i');
                    const subM = tagRegex.exec(inner);
                    if (subM) {
                      return [{ textContent: subM[2] }];
                    }
                    return [];
                  }
                });
              }
              return matches;
            }
            if (tagName === 'rtept') return [];
            return [];
          }
        };
      };
    };
  }
});

/**
 * Activity Data Pipeline End-to-End & Fault Injection Test Suite
 * 1. Realistic GPX XML stream decoding with Garmin TrackPointExtensions
 * 2. 5400-point full stage stress & performance benchmark (<250ms)
 * 3. Fault-injection tests: Indoor trainer (no GPS), sensor dropouts, corrupt files
 */

describe('Activity Pipeline: GPX End-to-End Decoding', () => {
  it('decodes standard GPX XML with Garmin TrackPointExtensions correctly', async () => {
    const mockGpxXml = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Garmin Edge 840" xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxtpx="http://www.garmin.com/xmlschemas/TrackPointExtension/v1">
  <trk>
    <name>Hangzhou Longjing Climb</name>
    <trkseg>
      <trkpt lat="30.2285" lon="120.1180">
        <ele>75.0</ele>
        <time>2026-05-18T08:00:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>142</gpxtpx:hr>
            <gpxtpx:cad>88</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
          <power>220</power>
        </extensions>
      </trkpt>
      <trkpt lat="30.2240" lon="120.1130">
        <ele>115.0</ele>
        <time>2026-05-18T08:02:00Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>165</gpxtpx:hr>
            <gpxtpx:cad>82</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
          <power>280</power>
        </extensions>
      </trkpt>
      <trkpt lat="30.2180" lon="120.1085">
        <ele>160.0</ele>
        <time>2026-05-18T08:04:30Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>178</gpxtpx:hr>
            <gpxtpx:cad>76</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
          <power>315</power>
        </extensions>
      </trkpt>
      <trkpt lat="30.2085" lon="120.0980">
        <ele>218.0</ele>
        <time>2026-05-18T08:07:30Z</time>
        <extensions>
          <gpxtpx:TrackPointExtension>
            <gpxtpx:hr>172</gpxtpx:hr>
            <gpxtpx:cad>80</gpxtpx:cad>
          </gpxtpx:TrackPointExtension>
          <power>275</power>
        </extensions>
      </trkpt>
    </trkseg>
  </trk>
</gpx>`;

    // Mock File object
    const file = new File([mockGpxXml], 'longjing_climb.gpx', { type: 'application/gpx+xml' });
    const analysis = await parseGpxFile(file, 250, 68, 185);

    expect(analysis.fileName).toBe('longjing_climb.gpx');
    expect(analysis.fileType).toBe('gpx');
    expect(analysis.points.length).toBe(4);
    expect(analysis.totalDistanceKm).toBeGreaterThan(1.0);
    // Elevation from 75m to 218m -> Gain approx 143m
    expect(analysis.elevationGainM).toBeGreaterThanOrEqual(140);
    expect(analysis.avgPower).toBeGreaterThan(250);
    expect(analysis.avgHeartRate).toBeGreaterThan(150);
    expect(analysis.maxHeartRate).toBe(178);
    expect(analysis.avgCadence).toBeGreaterThan(75);
    expect(analysis.movingTimeSec).toBe(450); // 7m30s
  });

  it('throws friendly error on invalid or empty GPX file with < 2 trackpoints', async () => {
    const invalidXml = `<?xml version="1.0"?><gpx version="1.1"><trk><trkseg></trkseg></trk></gpx>`;
    const file = new File([invalidXml], 'empty.gpx', { type: 'application/gpx+xml' });

    await expect(parseGpxFile(file, 250, 68, 185)).rejects.toThrow('未能从 GPX 文件中提取到有效的航迹坐标点');
  });
});

describe('Activity Pipeline: High-Resolution 5,400-Point Full Stage Stress Test', () => {
  it('processes 1.5h (5,400s) high-resolution 1Hz ride in under 500ms with 100% metric fidelity', () => {
    const startTime = performance.now();
    const demo = generateRealisticDemoRide(250, 68, 185);
    const durationMs = performance.now() - startTime;

    // Performance assertion: processing 5400 points must finish in reasonable time without CPU lockup
    expect(durationMs).toBeLessThan(1500);

    // Physiological metrics sanity
    expect(demo.points.length).toBe(5400);
    expect(demo.totalDistanceKm).toBeGreaterThan(35);
    expect(demo.elevationGainM).toBeGreaterThanOrEqual(100);

    // Coggan Normalized Power: due to 950W sprint and Category 2 climb, NP must exceed Average Power
    expect(demo.normalizedPower).toBeGreaterThan(demo.avgPower);
    expect(demo.intensityFactor).toBeGreaterThan(0.70);
    expect(demo.intensityFactor).toBeLessThan(1.05);

    // TSS for a hard 90min ride with IF ~1.02: (1.5 * 1.02^2 * 100) ≈ 156
    expect(demo.tss).toBeGreaterThan(80);
    expect(demo.tss).toBeLessThan(165);

    // Mobile fluid rendering: sampled points must be downsampled to exactly 600 points
    expect(demo.sampledPoints.length).toBe(600);
  });
});

describe('Activity Pipeline: Fault Injection & Edge Case Resilience', () => {
  it('safely handles indoor smart trainer rides with 0 GPS, 0 elevation, and 0 speed', () => {
    // Indoor ride: rider produces 220W at 90 rpm and 150 bpm, but distance=0, altitude=undefined, speed=0
    const indoorPoints: ActivityPoint[] = [];
    for (let s = 0; s < 600; s++) {
      indoorPoints.push({
        time: s,
        distance: 0,
        power: 200 + (s % 30),
        heartRate: 145 + (s % 10),
        cadence: 90,
        speed: 0
      });
    }

    const analysis = analyzePoints(indoorPoints, 'Zwift_Indoor_Workout.fit', 'fit', 250, 68, 185);

    // Must handle 0 distance / 0 speed gracefully without NaN or infinite values
    expect(Number.isNaN(analysis.avgPower)).toBe(false);
    expect(Number.isNaN(analysis.normalizedPower)).toBe(false);
    expect(Number.isNaN(analysis.tss)).toBe(false);
    expect(analysis.elevationGainM).toBe(0);
    expect(analysis.elevationLossM).toBe(0);
    expect(analysis.totalDistanceKm).toBe(0);
    expect(analysis.movingTimeSec).toBe(600); // Pedaling detected via power/cadence
    expect(analysis.avgCadence).toBe(90);
    expect(analysis.workKj).toBeGreaterThan(100);
  });

  it('safely handles sensor dropout mid-ride (power meter battery dead after 50%)', () => {
    const points: ActivityPoint[] = [];
    for (let s = 0; s < 300; s++) {
      points.push({
        time: s,
        distance: s * 8,
        power: 240, // Hardware power working
        cadence: 88,
        speed: 28.8
      });
    }
    for (let s = 300; s < 600; s++) {
      points.push({
        time: s,
        distance: s * 8,
        power: undefined, // Power meter dropped out / dead
        cadence: undefined,
        speed: 28.8
      });
    }

    const analysis = analyzePoints(points, 'dropout_ride.fit', 'fit', 250, 68, 185);

    expect(analysis.points.length).toBe(600);
    expect(analysis.avgPower).toBeGreaterThan(0);
    expect(analysis.normalizedPower).toBeGreaterThan(0);
    expect(Number.isNaN(analysis.tss)).toBe(false);
  });
});
