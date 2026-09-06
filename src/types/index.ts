export interface ToolMetadata {
  id: string;
  title: string;
  titleEn?: string;
  titleTw?: string;
  subtitle: string;
  subtitleEn?: string;
  subtitleTw?: string;
  category: 'dynamics' | 'fitting' | 'route' | 'health' | 'utility';
  categoryLabel: string;
  categoryLabelEn?: string;
  categoryLabelTw?: string;
  icon: string;
  badge?: string;
  badgeEn?: string;
  badgeTw?: string;
  description: string;
  descriptionEn?: string;
  descriptionTw?: string;
  tags: string[];
  tagsEn?: string[];
  tagsTw?: string[];
  hasStravaIntegration?: boolean;
}

export type ToolCategory = 'all' | 'dynamics' | 'fitting' | 'route' | 'health' | 'utility';

export interface PowerCalcParams {
  power?: number;
  speed?: number;
  riderWeight?: number;
  bikeWeight: number;
  grade: number;
  windSpeed: number;
  windDirection: 'headwind' | 'tailwind' | 'calm';
  crr: number;
  cda: number;
  rho: number;
}

export interface PowerCalcResult {
  mode: 'speed' | 'power' | 'weight';
  power: number;
  speedKmh: number;
  speedMph: number;
  riderWeight: number;
  bikeWeight: number;
  totalMass: number;
  wkg: number;
  fGravity: number;
  fRolling: number;
  fAero: number;
  grade: number;
  windSpeed: number;
  advice: string;
  levelTitle: string;
  ftpZones: { zone: string; range: string; min: number; max: number; desc: string }[];
  speedCurve: { speed: number; power: number }[];
  weightCurve: { weight: number; power: number; wkg: number }[];
}

export interface FittingInput {
  height: number;
  inseam: number;
  torso: number;
  armLength: number;
  shoulderWidth: number;
  footLength?: number;
  sittingHeight?: number;
  thighLength?: number;
  lowerLegLength?: number;
  ridingStyle: 'recreational' | 'endurance' | 'racing';
  flexibility: 'low' | 'medium' | 'high';
}

export interface FittingResult {
  effectiveTopTube: number; // ETT (cm)
  saddleHeight: number;     // 坐高 (cm)
  stemLength: number;       // 把立长 (mm)
  handlebarWidth: number;   // 车把宽 (mm)
  crankLength: string;      // 曲柄长 (mm)
  conceptualFrameSize: string;
  stackReachAdvice: string;
  saddleSetback?: number;
  saddleDrop?: number;
  sittingHeightNote?: string;
  thighLowerLegNote?: string;
  generalAdvice: string[];
  calculationNotes?: string[];
}

export interface TirePressureInput {
  bikeType: 'road' | 'gravel' | 'mtb';
  riderWeight: number;
  bikeAndGearWeight: number;
  tireSetup: 'tubeless' | 'tube' | 'tubular';
  nominalTireWidth: number;
  actualTireWidth?: number;
  innerRimWidth?: number;
  surface: 'smooth_asphalt' | 'rough_pavement' | 'gravel_hard' | 'gravel_loose' | 'cobblestone' | 'wet_slick';
  pressureUnit: 'psi' | 'bar' | 'kpa';
}

export interface TirePressureResult {
  frontPsi: { min: number; max: number; rec: number };
  rearPsi: { min: number; max: number; rec: number };
  notes: string[];
  unit: 'psi' | 'bar' | 'kpa';
}
