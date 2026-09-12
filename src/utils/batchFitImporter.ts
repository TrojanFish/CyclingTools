/**
 * Rouleur Batch Multi-File FIT/GPX/TCX Ingestion Engine
 * Handles concurrent / cooperative scheduled parsing with deduplication,
 * live progress reporting, and bulk IndexedDB insertion.
 */

import {
  parseFitFile,
  parseGpxFile,
  parseTcxFile,
  ActivityAnalysis,
  ActivityPoint,
  ElectronicShiftingEvent
} from './activityParser';
import {
  LocalActivityRecord,
  saveActivitiesBatchToDb,
  getAllLocalActivities
} from './localActivityDb';

export interface BatchImportProgress {
  current: number;
  total: number;
  percent: number;
  currentFileName: string;
  successfulCount: number;
  skippedCount: number;
  failedCount: number;
  currentStatus: 'parsing' | 'saving' | 'done' | 'error';
  errors: Array<{ fileName: string; error: string }>;
}

export interface BatchImportResult {
  total: number;
  successfulCount: number;
  skippedCount: number;
  failedCount: number;
  importedRecords: LocalActivityRecord[];
  errors: Array<{ fileName: string; error: string }>;
}

/**
 * Generate a fast pseudo-hash for duplicate detection
 */
const generateFileHash = (fileName: string, fileSize: number, startTimeMs: number, distanceKm: number): string => {
  return `${fileName}_${fileSize}_${Math.round(startTimeMs / 60000)}_${Math.round(distanceKm * 10)}`;
};

/**
 * Ingest multiple activity files asynchronously with cooperative yields
 */
export async function batchIngestActivityFiles(
  files: File[],
  ftpWatts: number,
  weightKg: number,
  maxHr: number,
  onProgress?: (progress: BatchImportProgress) => void
): Promise<BatchImportResult> {
  const total = files.length;
  let successfulCount = 0;
  let skippedCount = 0;
  let failedCount = 0;
  const errors: Array<{ fileName: string; error: string }> = [];
  const importedRecords: LocalActivityRecord[] = [];
  const batchToSave: Array<{
    record: LocalActivityRecord;
    points?: ActivityPoint[];
    shiftingEvents?: ElectronicShiftingEvent[];
  }> = [];

  // Load existing activities for smart deduplication
  const existingActivities = await getAllLocalActivities();
  const existingSignatures = new Set<string>();

  for (const act of existingActivities) {
    if (act.fileHash) {
      existingSignatures.add(act.fileHash);
    }
    // Also add time+distance signature (rounded to minute and 100m)
    const timeMinute = Math.round(act.startTime / 60000);
    const distTenth = Math.round(act.distanceKm * 10);
    existingSignatures.add(`${timeMinute}_${distTenth}`);
  }

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const fileName = file.name;
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (onProgress) {
      onProgress({
        current: i + 1,
        total,
        percent: Math.round(((i) / total) * 100),
        currentFileName: fileName,
        successfulCount,
        skippedCount,
        failedCount,
        currentStatus: 'parsing',
        errors
      });
    }

    // Yield control to main thread so UI updates smoothly
    await new Promise(resolve => setTimeout(resolve, 15));

    try {
      if (!['fit', 'gpx', 'tcx'].includes(ext)) {
        throw new Error(`不支持的文件格式 .${ext}，仅支持 .fit, .gpx, .tcx`);
      }

      let analysis: ActivityAnalysis;
      if (ext === 'fit') {
        analysis = await parseFitFile(file, ftpWatts, weightKg, maxHr);
      } else if (ext === 'gpx') {
        analysis = await parseGpxFile(file, ftpWatts, weightKg, maxHr);
      } else {
        analysis = await parseTcxFile(file, ftpWatts, weightKg, maxHr);
      }

      // Check for timestamp
      const firstPoint = analysis.points && analysis.points.length > 0 ? analysis.points[0] : null;
      const startTimeMs = firstPoint?.timestamp
        ? new Date(firstPoint.timestamp).getTime()
        : Date.now() - analysis.totalDurationSec * 1000;

      const fileHash = generateFileHash(fileName, file.size, startTimeMs, analysis.totalDistanceKm);
      const timeMinute = Math.round(startTimeMs / 60000);
      const distTenth = Math.round(analysis.totalDistanceKm * 10);
      const genericSig = `${timeMinute}_${distTenth}`;

      if (existingSignatures.has(fileHash) || existingSignatures.has(genericSig)) {
        skippedCount++;
        continue;
      }

      // Register new signatures
      existingSignatures.add(fileHash);
      existingSignatures.add(genericSig);

      const activityId = `act_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      const startDateIso = new Date(startTimeMs).toISOString();

      const record: LocalActivityRecord = {
        id: activityId,
        name: analysis.fileName.replace(/\.(fit|gpx|tcx)$/i, ''),
        startDate: startDateIso,
        startTime: startTimeMs,
        distanceKm: analysis.totalDistanceKm,
        totalDurationSec: analysis.totalDurationSec,
        movingTimeSec: analysis.movingTimeSec,
        elevationGainM: analysis.elevationGainM,
        elevationLossM: analysis.elevationLossM,
        avgPower: analysis.avgPower,
        maxPower: analysis.maxPower,
        normalizedPower: analysis.normalizedPower,
        intensityFactor: analysis.intensityFactor,
        tss: analysis.tss,
        variabilityIndex: analysis.variabilityIndex,
        workKj: analysis.workKj,
        caloriesKcal: analysis.caloriesKcal,
        avgHeartRate: analysis.avgHeartRate,
        maxHeartRate: analysis.maxHeartRate,
        avgCadence: analysis.avgCadence,
        maxCadence: analysis.maxCadence,
        avgSpeedKmh: analysis.avgSpeedKmh,
        maxSpeedKmh: analysis.maxSpeedKmh,
        mmp: analysis.mmp,
        timeInPowerZones: analysis.timeInPowerZones,
        timeInHrZones: analysis.timeInHrZones,
        fileType: ext as any,
        fileName: file.name,
        fileSize: file.size,
        fileHash,
        hasHardwarePower: !analysis.isEstimatedPower,
        hasHeartRate: !!analysis.avgHeartRate,
        hasCadence: !!analysis.avgCadence,
        hasShifting: !!(analysis.shiftingEvents && analysis.shiftingEvents.length > 0),
        shiftCount: analysis.shiftCount,
        isEstimatedPower: analysis.isEstimatedPower,
        createdAt: Date.now()
      };

      batchToSave.push({
        record,
        points: analysis.points,
        shiftingEvents: analysis.shiftingEvents
      });
      importedRecords.push(record);
      successfulCount++;
    } catch (err: any) {
      console.error(`Error parsing file ${fileName}:`, err);
      failedCount++;
      errors.push({
        fileName,
        error: err.message || '解析失败'
      });
    }
  }

  // Bulk save to IndexedDB
  if (batchToSave.length > 0) {
    if (onProgress) {
      onProgress({
        current: total,
        total,
        percent: 100,
        currentFileName: '正在写入本地数据库...',
        successfulCount,
        skippedCount,
        failedCount,
        currentStatus: 'saving',
        errors
      });
    }
    await saveActivitiesBatchToDb(batchToSave);
  }

  if (onProgress) {
    onProgress({
      current: total,
      total,
      percent: 100,
      currentFileName: '解析完成',
      successfulCount,
      skippedCount,
      failedCount,
      currentStatus: 'done',
      errors
    });
  }

  return {
    total,
    successfulCount,
    skippedCount,
    failedCount,
    importedRecords,
    errors
  };
}
