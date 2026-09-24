/**
 * Bike Fit Geometry & Cockpit Decoupling Engine
 *
 * Provides rigorous trigonometric decoupling between:
 * 1. Bare frame Stack & Reach (BB to head tube top-center)
 * 2. Cockpit hardware (headset conical cap, spacers, stem clamp, stem length, stem angle)
 * 3. Handlebar clamp space coordinates (Handlebar Stack HY & Handlebar Reach HX from BB)
 * 4. Saddle-to-handlebar drop and steerer spacer adjustment recommendations
 */

export interface CockpitConfig {
  headTubeAngleDeg: number;   // e.g. 73.0 (degrees)
  headsetCapMm: number;        // e.g. 10 (mm, typically 5-25mm)
  spacersMm: number;           // e.g. 15 (mm, typically 0-40mm)
  stemClampHeightMm?: number;  // e.g. 40 (mm, clamp stack on steerer, default 40mm)
  stemLengthMm: number;        // e.g. 100 (mm, center-to-center)
  stemAngleDeg: number;        // e.g. -6 or -17 (signed degrees relative to 90° steerer perpendicular)
}

export interface HandlebarCoords {
  handlebarStackMm: number; // HY: Vertical height from BB to handlebar clamp center
  handlebarReachMm: number; // HX: Horizontal distance from BB to handlebar clamp center
  steererRiseMm: number;    // Vertical gain from headtube top due to cap + spacers + stem half-clamp
  steererSetbackMm: number; // Horizontal setback (loss of reach) from headtube top due to steerer angle
  stemRiseMm: number;       // Vertical gain from stem angle & length
  stemReachMm: number;      // Horizontal gain from stem angle & length
}

export interface FrameGeometry {
  stackMm: number;
  reachMm: number;
}

export interface SpacerFitResult {
  spacersNeededMm: number;
  roundedSpacersMm: number; // rounded to 2.5mm steps
  fitStatus: 'slammed' | 'optimal' | 'acceptable' | 'high_spacers' | 'unreachable_too_high' | 'unreachable_too_low';
  message: string;
  actualDropMm: number;
  dropErrorMm: number;
}

export interface StemDeltaResult {
  deltaStackMm: number; // New Stack - Old Stack (positive = handlebar raises)
  deltaReachMm: number; // New Reach - Old Reach (positive = handlebar moves forward)
  summaryText: string;
}

const DEG_TO_RAD = Math.PI / 180;

/**
 * Calculates the forward vector from frame Stack/Reach to Handlebar Stack/Reach (HX / HY)
 */
export function calculateHandlebarPosition(
  frame: FrameGeometry,
  cockpit: CockpitConfig
): HandlebarCoords {
  const clampHeight = cockpit.stemClampHeightMm ?? 40;
  const totalSteererLength = Math.max(0, cockpit.headsetCapMm) + Math.max(0, cockpit.spacersMm) + clampHeight / 2;

  const htAngleRad = cockpit.headTubeAngleDeg * DEG_TO_RAD;

  // Steerer offset
  const steererRiseMm = totalSteererLength * Math.sin(htAngleRad);
  const steererSetbackMm = totalSteererLength * Math.cos(htAngleRad);

  // Stem angle relative to horizontal:
  // Forward perpendicular to steerer is at (90° - headTubeAngle) above horizontal.
  // Stem angle is signed offset from perpendicular (e.g. -6° points 6° lower than perpendicular).
  const stemAngleToHorizDeg = 90 - cockpit.headTubeAngleDeg + cockpit.stemAngleDeg;
  const stemAngleToHorizRad = stemAngleToHorizDeg * DEG_TO_RAD;

  const stemRiseMm = cockpit.stemLengthMm * Math.sin(stemAngleToHorizRad);
  const stemReachMm = cockpit.stemLengthMm * Math.cos(stemAngleToHorizRad);

  const handlebarStackMm = frame.stackMm + steererRiseMm + stemRiseMm;
  const handlebarReachMm = frame.reachMm - steererSetbackMm + stemReachMm;

  return {
    handlebarStackMm: parseFloat(handlebarStackMm.toFixed(1)),
    handlebarReachMm: parseFloat(handlebarReachMm.toFixed(1)),
    steererRiseMm: parseFloat(steererRiseMm.toFixed(1)),
    steererSetbackMm: parseFloat(steererSetbackMm.toFixed(1)),
    stemRiseMm: parseFloat(stemRiseMm.toFixed(1)),
    stemReachMm: parseFloat(stemReachMm.toFixed(1))
  };
}

/**
 * Inverse calculation: Solves for bare frame Stack & Reach required to achieve target Handlebar coordinates
 */
export function solveFrameFromHandlebar(
  targetHandlebar: { handlebarStackMm: number; handlebarReachMm: number },
  cockpit: CockpitConfig
): FrameGeometry {
  const clampHeight = cockpit.stemClampHeightMm ?? 40;
  const totalSteererLength = Math.max(0, cockpit.headsetCapMm) + Math.max(0, cockpit.spacersMm) + clampHeight / 2;

  const htAngleRad = cockpit.headTubeAngleDeg * DEG_TO_RAD;
  const steererRiseMm = totalSteererLength * Math.sin(htAngleRad);
  const steererSetbackMm = totalSteererLength * Math.cos(htAngleRad);

  const stemAngleToHorizRad = (90 - cockpit.headTubeAngleDeg + cockpit.stemAngleDeg) * DEG_TO_RAD;
  const stemRiseMm = cockpit.stemLengthMm * Math.sin(stemAngleToHorizRad);
  const stemReachMm = cockpit.stemLengthMm * Math.cos(stemAngleToHorizRad);

  const stackMm = targetHandlebar.handlebarStackMm - steererRiseMm - stemRiseMm;
  const reachMm = targetHandlebar.handlebarReachMm + steererSetbackMm - stemReachMm;

  return {
    stackMm: Math.round(stackMm),
    reachMm: Math.round(reachMm)
  };
}

/**
 * Calculates saddle vertical height from BB center
 */
export function calculateSaddleHeightFromBB(
  saddleHeightMm: number,
  seatTubeAngleDeg = 73.5
): number {
  return saddleHeightMm * Math.sin(seatTubeAngleDeg * DEG_TO_RAD);
}

/**
 * Solves the exact spacer height needed for a given frame and cockpit to hit a target saddle drop
 */
export function solveSpacersForTargetDrop(params: {
  saddleHeightMm: number;
  targetDropMm: number;
  frameStackMm: number;
  headTubeAngleDeg?: number;
  seatTubeAngleDeg?: number;
  headsetCapMm?: number;
  stemLengthMm: number;
  stemAngleDeg: number;
  stemClampHeightMm?: number;
}): SpacerFitResult {
  const htAngle = params.headTubeAngleDeg ?? 73.0;
  const stAngle = params.seatTubeAngleDeg ?? 73.5;
  const cap = params.headsetCapMm ?? 10;
  const clamp = params.stemClampHeightMm ?? 40;

  const saddleVertMm = calculateSaddleHeightFromBB(params.saddleHeightMm, stAngle);
  const targetHandlebarStackMm = saddleVertMm - params.targetDropMm;

  const htAngleRad = htAngle * DEG_TO_RAD;
  const stemAngleToHorizRad = (90 - htAngle + params.stemAngleDeg) * DEG_TO_RAD;
  const stemRiseMm = params.stemLengthMm * Math.sin(stemAngleToHorizRad);

  // S * sin(htAngle) = targetHandlebarStack - frameStack - stemRise
  const sinHt = Math.sin(htAngleRad);
  const neededSteererRise = targetHandlebarStackMm - params.frameStackMm - stemRiseMm;
  const neededTotalSteererLength = sinHt > 0.001 ? neededSteererRise / sinHt : 0;
  const rawSpacersMm = neededTotalSteererLength - cap - clamp / 2;

  // Round to closest 2.5mm (standard commercial spacer step: 2.5mm, 5mm, 10mm)
  const roundedSpacersMm = Math.round(rawSpacersMm / 2.5) * 2.5;

  // Compute actual drop with rounded spacers clamped to safe range
  const practicalSpacersMm = Math.max(0, Math.min(45, roundedSpacersMm));
  const actualCockpit = calculateHandlebarPosition(
    { stackMm: params.frameStackMm, reachMm: 380 },
    {
      headTubeAngleDeg: htAngle,
      headsetCapMm: cap,
      spacersMm: practicalSpacersMm,
      stemClampHeightMm: clamp,
      stemLengthMm: params.stemLengthMm,
      stemAngleDeg: params.stemAngleDeg
    }
  );
  const actualDropMm = parseFloat((saddleVertMm - actualCockpit.handlebarStackMm).toFixed(1));
  const dropErrorMm = parseFloat((actualDropMm - params.targetDropMm).toFixed(1));

  let fitStatus: SpacerFitResult['fitStatus'] = 'optimal';
  let message = '';

  if (rawSpacersMm < -5) {
    fitStatus = 'unreachable_too_high';
    message = `车架 Stack 偏高：即使全切垫圈，实际落差仍比目标小 ${Math.abs(dropErrorMm)}mm。建议更换 -17° 把立或选小一号车架。`;
  } else if (rawSpacersMm < 2.5) {
    fitStatus = 'slammed';
    message = `激进全切设定：需全切垫圈 0mm 直插碗组盖，落差高度与竞技设定高度契合。`;
  } else if (rawSpacersMm <= 25) {
    fitStatus = 'optimal';
    message = `理想余量区间：搭配约 ${Math.max(0, roundedSpacersMm)}mm 垫圈即可达到目标落差，上下皆具备 15mm 以上微调空间。`;
  } else if (rawSpacersMm <= 35) {
    fitStatus = 'acceptable';
    message = `垫圈偏高：需要约 ${roundedSpacersMm}mm 垫圈，已接近碳纤维舵管常规建议上限 35mm。`;
  } else if (rawSpacersMm <= 45) {
    fitStatus = 'high_spacers';
    message = `超量垫圈警报：需要约 ${roundedSpacersMm}mm 垫圈，前叉头管抗扭刚度降低，影响操控质感。`;
  } else {
    fitStatus = 'unreachable_too_low';
    message = `车架 Stack 偏低：所需垫圈超过 45mm 安全极限，存在舵管折损隐患，强烈建议换大一号车架或耐力车系。`;
  }

  return {
    spacersNeededMm: parseFloat(rawSpacersMm.toFixed(1)),
    roundedSpacersMm: Math.max(0, roundedSpacersMm),
    fitStatus,
    message,
    actualDropMm,
    dropErrorMm
  };
}

/**
 * Calculates handlebar shift (Delta Stack / Delta Reach) when changing stem angle or length
 */
export function calculateStemDelta(
  headTubeAngleDeg: number,
  stem1: { lengthMm: number; angleDeg: number },
  stem2: { lengthMm: number; angleDeg: number }
): StemDeltaResult {
  const getStemVector = (len: number, angle: number) => {
    const phi = (90 - headTubeAngleDeg + angle) * DEG_TO_RAD;
    return {
      rise: len * Math.sin(phi),
      reach: len * Math.cos(phi)
    };
  };

  const v1 = getStemVector(stem1.lengthMm, stem1.angleDeg);
  const v2 = getStemVector(stem2.lengthMm, stem2.angleDeg);

  const deltaStackMm = parseFloat((v2.rise - v1.rise).toFixed(1));
  const deltaReachMm = parseFloat((v2.reach - v1.reach).toFixed(1));

  let summaryText = '';
  if (deltaStackMm < 0) {
    summaryText += `车把降低 ${Math.abs(deltaStackMm)}mm`;
  } else if (deltaStackMm > 0) {
    summaryText += `车把抬升 ${deltaStackMm}mm`;
  } else {
    summaryText += `车把高度不变`;
  }

  summaryText += '，';

  if (deltaReachMm > 0) {
    summaryText += `前伸增加 ${deltaReachMm}mm`;
  } else if (deltaReachMm < 0) {
    summaryText += `前伸缩短 ${Math.abs(deltaReachMm)}mm`;
  } else {
    summaryText += `前伸量不变`;
  }

  return {
    deltaStackMm,
    deltaReachMm,
    summaryText
  };
}
