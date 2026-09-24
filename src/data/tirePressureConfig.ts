export const SURFACE_FACTORS: Record<string, { label: string; factor: number; desc: string }> = {
  smooth_asphalt: { label: '平整柏油路 (Smooth Asphalt)', factor: 1.0, desc: '平整铺装路面，滚阻最低' },
  rough_pavement: { label: '粗糙柏油路/水泥路 (Rough Pavement)', factor: 0.95, desc: '轻微起伏或粗颗粒路面，微降胎压提升贴地性' },
  gravel_hard: { label: '压实碎石硬路 (Hardpack Gravel)', factor: 0.88, desc: '硬质泥土碎石路，兼顾速度与缓冲' },
  gravel_loose: { label: '松散碎石路 (Loose Gravel/Dirt)', factor: 0.82, desc: '松散砂石路面，需要增大接地面积防打滑' },
  cobblestone: { label: '鹅卵石/石板路 (Cobblestones)', factor: 0.80, desc: '高频强烈颠簸，降低胎压降低震动损耗' },
  wet_slick: { label: '湿滑/雨天路面 (Wet/Slick)', factor: 0.90, desc: '湿滑路面降低胎压以提升橡胶抓地力与刹车安全' }
};

export const TIRE_SETUP_FACTORS: Record<string, { label: string; factor: number; desc: string }> = {
  tube: { label: '普通内胎 (Clinchers with Tube)', factor: 1.0, desc: '传统内胎系统，胎压需维持充足防止蛇咬爆胎' },
  tubeless: { label: '真空胎 (Tubeless)', factor: 0.92, desc: '无内胎系统，可使用更低气压获得更佳抓地力与极低滚阻且无蛇咬风险' },
  tubular: { label: '管胎 (Tubular)', factor: 1.03, desc: '专业胶粘管胎，支持较高气压' }
};

// Base PSI lookup for nominal tire width vs total system weight (kg)
//
// Formula source: Adapted from Frank Berto's empirical tire pressure research (1993, "The Dancing
// Chain") combined with Silca's updated 15% casing deflection target method for minimizing
// rolling resistance on textured road surfaces.
//
// P ≈ K × (SystemWeight_kg / Width_mm^1.45)
//
// The K-coefficients (120/112/108) and exponent (1.45) are experience-based calibration
// values tuned to match real-world recommendations for modern road/gravel/MTB tires.
// Surface-type multipliers and tube-setup multipliers are engineering estimates without
// independent laboratory validation — they represent reasonable heuristic adjustments.
//
// IMPORTANT: This formula is a starting-point guide. Rider feel, rim internal width,
// tread compound, and casing suppleness all affect optimal pressure. Always fine-tune
// on the bike. Output should not be treated as a precision specification.
export function getBaseTirePsi(nominalWidthMm: number, systemWeightKg: number, bikeType: 'road' | 'gravel' | 'mtb'): number {
  // K-coefficients are empirical calibration constants (not derived from first principles).
  // Road: tuned for 23–32mm tires; Gravel: 33–50mm; MTB: 2.0–2.6" knobby.
  let k = 120;
  if (bikeType === 'gravel') k = 112;
  if (bikeType === 'mtb') k = 108;

  const basePressure = (systemWeightKg * k) / Math.pow(nominalWidthMm, 1.45);
  
  // Bound limits by bike type
  if (bikeType === 'road') {
    return Math.max(45, Math.min(115, basePressure));
  } else if (bikeType === 'gravel') {
    return Math.max(25, Math.min(65, basePressure));
  } else {
    return Math.max(18, Math.min(45, basePressure));
  }
}
