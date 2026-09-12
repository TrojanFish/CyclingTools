export type BikeCategory =
  | 'road_aero'
  | 'road_climb'
  | 'road_allround'
  | 'road_endurance'
  | 'road_tt'
  | 'gravel'
  | 'mtb_xc'
  | 'mtb_trail';

export interface DrivetrainConfig {
  chainringType: 'double' | 'single';
  bigRing: number;           // e.g. 50, 52, 54, 48, 40
  smallRing: number;         // e.g. 34, 36, 40, 35 (or bigRing for 1x)
  cassette: number[];        // e.g. [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34]
  crankLengthMm: number;     // e.g. 170, 165, 172.5
  chainstayLengthMm: number; // e.g. 410, 415
}

export interface WheelTireConfig {
  wheelStandard: '700c' | '650b' | '29er' | '26er';
  rimInternalWidthMm: number; // e.g. 21
  nominalWidthMm: number;    // e.g. 28
  actualWidthMm: number;     // e.g. 29.5
  tireSetup: 'tubeless' | 'tube' | 'tubular';
  isHookless: boolean;
  tireModel?: string;        // e.g. 'GP5000 S TR'
  frontPressurePsi?: number; // e.g. 66
  rearPressurePsi?: number;  // e.g. 70
}

export interface FittingGeometryConfig {
  saddleHeightMm?: number;   // e.g. 715 (71.5cm)
  saddleSetbackMm?: number;  // e.g. 65
  saddleDropMm?: number;     // e.g. 60
  stemLengthMm?: number;     // e.g. 100
  handlebarWidthMm?: number; // e.g. 400
  reachMm?: number;          // e.g. 385
  stackMm?: number;          // e.g. 545
}

export interface BikeProfile {
  id: string;
  name: string;
  type: BikeCategory;
  weightKg: number;
  crr: number;               // 滚阻系数
  cda: number;               // 迎风面积 CdA (m²)
  drivetrain: DrivetrainConfig;
  wheelTire: WheelTireConfig;
  geometry?: FittingGeometryConfig;
  notes?: string;
  mileageKm?: number;
  stravaGearId?: string;
}

export const DEFAULT_ENRICHED_BIKE_GARAGE: BikeProfile[] = [
  {
    id: 'bike-aero',
    name: 'Colnago V4Rs / 顶级气动综合公路车',
    type: 'road_aero',
    weightKg: 6.9,
    crr: 0.0036,
    cda: 0.28,
    notes: '平路巡航与起伏大组赛利器',
    drivetrain: {
      chainringType: 'double',
      bigRing: 52,
      smallRing: 36,
      cassette: [11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 27, 30],
      crankLengthMm: 170,
      chainstayLengthMm: 408
    },
    wheelTire: {
      wheelStandard: '700c',
      rimInternalWidthMm: 21,
      nominalWidthMm: 28,
      actualWidthMm: 29.2,
      tireSetup: 'tubeless',
      isHookless: false,
      tireModel: 'Continental GP5000 S TR',
      frontPressurePsi: 68,
      rearPressurePsi: 72
    },
    geometry: {
      saddleHeightMm: 718,
      saddleSetbackMm: 62,
      saddleDropMm: 65,
      stemLengthMm: 100,
      handlebarWidthMm: 400,
      reachMm: 387,
      stackMm: 542
    }
  },
  {
    id: 'bike-climb',
    name: 'Specialized Aethos / 极限轻量爬坡车',
    type: 'road_climb',
    weightKg: 6.1,
    crr: 0.0034,
    cda: 0.31,
    notes: '高山大坡特化，UCI 6.8kg 极限减重',
    drivetrain: {
      chainringType: 'double',
      bigRing: 50,
      smallRing: 34,
      cassette: [11, 12, 13, 14, 15, 17, 19, 21, 24, 27, 30, 34],
      crankLengthMm: 167.5,
      chainstayLengthMm: 410
    },
    wheelTire: {
      wheelStandard: '700c',
      rimInternalWidthMm: 21,
      nominalWidthMm: 26,
      actualWidthMm: 26.8,
      tireSetup: 'tube',
      isHookless: false,
      tireModel: 'Vittoria Corsa Pro (TPU)',
      frontPressurePsi: 75,
      rearPressurePsi: 78
    },
    geometry: {
      saddleHeightMm: 715,
      saddleSetbackMm: 60,
      saddleDropMm: 55,
      stemLengthMm: 90,
      handlebarWidthMm: 400,
      reachMm: 380,
      stackMm: 545
    }
  },
  {
    id: 'bike-tt',
    name: 'Canyon Speedmax TT / 计时赛战车',
    type: 'road_tt',
    weightKg: 8.4,
    crr: 0.0032,
    cda: 0.22,
    notes: '极限破风头管与封闭轮',
    drivetrain: {
      chainringType: 'double',
      bigRing: 54,
      smallRing: 40,
      cassette: [11, 12, 13, 14, 15, 16, 17, 19, 21, 24, 28, 30],
      crankLengthMm: 165,
      chainstayLengthMm: 405
    },
    wheelTire: {
      wheelStandard: '700c',
      rimInternalWidthMm: 21,
      nominalWidthMm: 25,
      actualWidthMm: 26.0,
      tireSetup: 'tubeless',
      isHookless: false,
      tireModel: 'Michelin Power TT',
      frontPressurePsi: 80,
      rearPressurePsi: 84
    },
    geometry: {
      saddleHeightMm: 725,
      saddleSetbackMm: 45,
      saddleDropMm: 95,
      stemLengthMm: 85,
      handlebarWidthMm: 380,
      reachMm: 410,
      stackMm: 510
    }
  },
  {
    id: 'bike-gravel',
    name: 'Cervélo Áspero / 竞技砂石越野车',
    type: 'gravel',
    weightKg: 8.2,
    crr: 0.0048,
    cda: 0.35,
    notes: '40c 宽胎碎石路耐力设定',
    drivetrain: {
      chainringType: 'single',
      bigRing: 40,
      smallRing: 40,
      cassette: [10, 11, 13, 15, 17, 19, 21, 24, 28, 32, 38, 44],
      crankLengthMm: 172.5,
      chainstayLengthMm: 420
    },
    wheelTire: {
      wheelStandard: '700c',
      rimInternalWidthMm: 25,
      nominalWidthMm: 40,
      actualWidthMm: 41.5,
      tireSetup: 'tubeless',
      isHookless: true,
      tireModel: 'Panaracer GravelKing SK',
      frontPressurePsi: 34,
      rearPressurePsi: 38
    },
    geometry: {
      saddleHeightMm: 710,
      saddleSetbackMm: 60,
      saddleDropMm: 45,
      stemLengthMm: 80,
      handlebarWidthMm: 420,
      reachMm: 388,
      stackMm: 555
    }
  },
  {
    id: 'bike-mtb-xc',
    name: 'Scott Spark RC / 120mm 全避震山地车',
    type: 'mtb_xc',
    weightKg: 10.2,
    crr: 0.0075,
    cda: 0.42,
    notes: 'XC 山地越野双气室避震',
    drivetrain: {
      chainringType: 'single',
      bigRing: 34,
      smallRing: 34,
      cassette: [10, 12, 14, 16, 18, 21, 24, 28, 32, 36, 42, 52],
      crankLengthMm: 175,
      chainstayLengthMm: 435
    },
    wheelTire: {
      wheelStandard: '29er',
      rimInternalWidthMm: 30,
      nominalWidthMm: 57, // 2.25"
      actualWidthMm: 58.0,
      tireSetup: 'tubeless',
      isHookless: true,
      tireModel: 'Maxxis Rekon Race 29x2.25',
      frontPressurePsi: 22,
      rearPressurePsi: 24
    },
    geometry: {
      saddleHeightMm: 705,
      saddleSetbackMm: 50,
      saddleDropMm: 20,
      stemLengthMm: 60,
      handlebarWidthMm: 740,
      reachMm: 440,
      stackMm: 600
    }
  }
];

/**
 * Migrate legacy or incomplete BikeProfile to a fully typed, enriched BikeProfile.
 * Guarantees that drivetrain, wheelTire, and geometry fields are always safely populated.
 */
export function migrateBikeProfile(raw: any): BikeProfile {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_ENRICHED_BIKE_GARAGE[0];
  }

  // Find matching default template by type or fallback to aero road
  const template =
    DEFAULT_ENRICHED_BIKE_GARAGE.find(d => d.type === raw.type) ||
    DEFAULT_ENRICHED_BIKE_GARAGE[0];

  const drivetrain: DrivetrainConfig = {
    chainringType: raw.drivetrain?.chainringType || (raw.type === 'gravel' || raw.type?.startsWith('mtb') ? 'single' : 'double'),
    bigRing: Number(raw.drivetrain?.bigRing) || template.drivetrain.bigRing,
    smallRing: Number(raw.drivetrain?.smallRing) || template.drivetrain.smallRing,
    cassette: Array.isArray(raw.drivetrain?.cassette) && raw.drivetrain.cassette.length > 0
      ? raw.drivetrain.cassette
      : template.drivetrain.cassette,
    crankLengthMm: Number(raw.drivetrain?.crankLengthMm) || template.drivetrain.crankLengthMm,
    chainstayLengthMm: Number(raw.drivetrain?.chainstayLengthMm) || template.drivetrain.chainstayLengthMm,
  };

  const wheelTire: WheelTireConfig = {
    wheelStandard: raw.wheelTire?.wheelStandard || template.wheelTire.wheelStandard,
    rimInternalWidthMm: Number(raw.wheelTire?.rimInternalWidthMm) || template.wheelTire.rimInternalWidthMm,
    nominalWidthMm: Number(raw.wheelTire?.nominalWidthMm) || template.wheelTire.nominalWidthMm,
    actualWidthMm: Number(raw.wheelTire?.actualWidthMm) || template.wheelTire.actualWidthMm,
    tireSetup: raw.wheelTire?.tireSetup || template.wheelTire.tireSetup,
    isHookless: Boolean(raw.wheelTire?.isHookless ?? template.wheelTire.isHookless),
    tireModel: raw.wheelTire?.tireModel || template.wheelTire.tireModel,
    frontPressurePsi: raw.wheelTire?.frontPressurePsi || template.wheelTire.frontPressurePsi,
    rearPressurePsi: raw.wheelTire?.rearPressurePsi || template.wheelTire.rearPressurePsi,
  };

  const geometry: FittingGeometryConfig = {
    saddleHeightMm: raw.geometry?.saddleHeightMm || template.geometry?.saddleHeightMm,
    saddleSetbackMm: raw.geometry?.saddleSetbackMm || template.geometry?.saddleSetbackMm,
    saddleDropMm: raw.geometry?.saddleDropMm || template.geometry?.saddleDropMm,
    stemLengthMm: raw.geometry?.stemLengthMm || template.geometry?.stemLengthMm,
    handlebarWidthMm: raw.geometry?.handlebarWidthMm || template.geometry?.handlebarWidthMm,
    reachMm: raw.geometry?.reachMm || template.geometry?.reachMm,
    stackMm: raw.geometry?.stackMm || template.geometry?.stackMm,
  };

  return {
    id: String(raw.id || `bike-${Date.now()}`),
    name: String(raw.name || template.name),
    type: raw.type || template.type,
    weightKg: Number(raw.weightKg) || template.weightKg,
    crr: Number(raw.crr) || template.crr,
    cda: Number(raw.cda) || template.cda,
    drivetrain,
    wheelTire,
    geometry,
    notes: raw.notes || template.notes,
    mileageKm: raw.mileageKm !== undefined ? Number(raw.mileageKm) : undefined,
    stravaGearId: raw.stravaGearId ? String(raw.stravaGearId) : undefined,
  };
}
