/**
 * SoloRiderTools High-Resolution Canvas Share Poster Generator
 * Pure client-side 2D Canvas rendering with 2x/3x Retina crisp aesthetics
 */

// Common Canvas Helpers
function createPosterCanvas(width: number, height: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { canvas, ctx };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accentColor: string = '#007AFF'
) {
  // Deep Night Gradient
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#0a0e17');
  bgGrad.addColorStop(0.5, '#111827');
  bgGrad.addColorStop(1, '#070a10');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Ambient top light orb
  const orb = ctx.createRadialGradient(w / 2, 0, 10, w / 2, 0, 360);
  orb.addColorStop(0, accentColor + '35');
  orb.addColorStop(0.6, accentColor + '10');
  orb.addColorStop(1, 'transparent');
  ctx.fillStyle = orb;
  ctx.fillRect(0, 0, w, 400);

  // Outer border with subtle neon
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 2;
  roundRect(ctx, 1, 1, w - 2, h - 2, 0);
  ctx.stroke();
}

function drawHeader(
  ctx: CanvasRenderingContext2D,
  w: number,
  category: string,
  title: string,
  subtitle?: string,
  accentColor: string = '#007AFF'
) {
  // Brand Header
  ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '1.5px';
  ctx.fillText('SOLORIDERTOOLS PRO · 骑行极客工坊', 40, 52);

  // Category Badge
  ctx.save();
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const badgeText = category;
  const badgeWidth = ctx.measureText(badgeText).width + 24;
  roundRect(ctx, 40, 72, badgeWidth, 26, 13);
  ctx.fillStyle = accentColor + '25';
  ctx.fill();
  ctx.strokeStyle = accentColor + '60';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = accentColor;
  ctx.fillText(badgeText, 52, 89);
  ctx.restore();

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.letterSpacing = '0.5px';
  ctx.fillText(title, 40, 134);

  // Subtitle
  if (subtitle) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(subtitle, 40, 162);
  }

  // Divider
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, 182);
  ctx.lineTo(w - 40, 182);
  ctx.stroke();
}

function drawMetricTile(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  value: string | number,
  unit?: string,
  accentColor: string = '#007AFF'
) {
  // Tile background
  roundRect(ctx, x, y, w, h, 18);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Label
  ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(label, x + 16, y + 26);

  // Value
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const valStr = String(value);
  ctx.fillText(valStr, x + 16, y + 62);

  // Unit
  if (unit) {
    const valWidth = ctx.measureText(valStr).width;
    ctx.fillStyle = accentColor;
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(unit, x + 16 + valWidth + 6, y + 62);
  }
}

function drawFooter(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const y = h - 65;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(40, y);
  ctx.lineTo(w - 40, y);
  ctx.stroke();

  // Left text
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const now = new Date();
  const dateStr = `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
  ctx.fillText(`SoloRiderTools · 纯前端科学骑行计算引擎 · ${dateStr}`, 40, y + 36);

  // Right tag
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  const rightTag = 'solorider.tools';
  const rightWidth = ctx.measureText(rightTag).width;
  ctx.fillText(rightTag, w - 40 - rightWidth, y + 36);
}

// 1. Power Profile Radar Poster
export interface PowerProfilePosterData {
  phenotype: string;
  phenotypeDesc: string;
  p5s: number;
  w5s: number | string;
  p1m: number;
  w1m: number | string;
  p5m: number;
  w5m: number | string;
  p20m: number;
  w20m: number | string;
  ftpWatts: number;
  weightKg: number;
  sweetSpotMin: number;
  sweetSpotMax: number;
}

export function generatePowerProfilePoster(data: PowerProfilePosterData): string {
  const w = 750;
  const h = 1080;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#FF3B30'; // ios-red

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚡ 生理动力学 · 功率能力画像', '车手能力雷达与极化靶心战报', `车手自重 ${data.weightKg} kg · 功能阈值功率 (FTP) ${data.ftpWatts} W`, accent);

  // Phenotype Card
  roundRect(ctx, 40, 204, w - 80, 94, 20);
  ctx.fillStyle = 'rgba(255, 59, 48, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 59, 48, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FF453A';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🏆 车手类型判定', 60, 228);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.phenotype, 60, 256);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(data.phenotypeDesc, 60, 280);

  // Peak Power Metrics (4 Tiles)
  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 312, tileW, 80, '5秒 神经肌肉冲刺', data.p5s, `W (${data.w5s} W/kg)`, '#FF375F');
  drawMetricTile(ctx, 40 + tileW + 15, 312, tileW, 80, '1分钟 无氧容量', data.p1m, `W (${data.w1m} W/kg)`, '#FF9F0A');
  drawMetricTile(ctx, 40, 406, tileW, 80, '5分钟 最大摄氧量 (VO₂)', data.p5m, `W (${data.w5m} W/kg)`, '#30D158');
  drawMetricTile(ctx, 40 + tileW + 15, 406, tileW, 80, '20分钟 乳酸阈值 (FTP)', data.p20m, `W (${data.w20m} W/kg)`, '#0A84FF');

  // Radar Polygon Simulation Box
  const radarY = 500;
  const radarH = 340;
  roundRect(ctx, 40, radarY, w - 80, radarH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  // Draw 6-axis Radar Web in Canvas
  const centerX = w / 2;
  const centerY = radarY + radarH / 2;
  const radius = 110;
  const angles = [
    -Math.PI / 2,
    -Math.PI / 6,
    Math.PI / 6,
    Math.PI / 2,
    (5 * Math.PI) / 6,
    (-5 * Math.PI) / 6
  ];
  const axisLabels = ['5s 冲刺', '1m 无氧', '5m VO₂', '20m 阈值', '有氧耐力', '抗疲劳度'];

  // Concentric polygon grids
  [0.25, 0.5, 0.75, 1.0].forEach(level => {
    ctx.beginPath();
    angles.forEach((angle, i) => {
      const x = centerX + Math.cos(angle) * radius * level;
      const y = centerY + Math.sin(angle) * radius * level;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // Spokes
  angles.forEach(angle => {
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.stroke();
  });

  // User Radar Filled Polygon
  const p5sScore = Math.min(1.0, Math.max(0.3, Number(data.w5s) / 18));
  const p1mScore = Math.min(1.0, Math.max(0.3, Number(data.w1m) / 9.5));
  const p5mScore = Math.min(1.0, Math.max(0.3, Number(data.w5m) / 5.5));
  const p20mScore = Math.min(1.0, Math.max(0.3, Number(data.w20m) / 4.6));
  const scores = [p5sScore, p1mScore, p5mScore, p20mScore, (p20mScore + p5mScore) / 2, (p20mScore + p1mScore) / 2];

  ctx.beginPath();
  angles.forEach((angle, i) => {
    const r = radius * scores[i];
    const x = centerX + Math.cos(angle) * r;
    const y = centerY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.closePath();
  ctx.fillStyle = 'rgba(255, 59, 48, 0.35)';
  ctx.fill();
  ctx.strokeStyle = '#FF453A';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Axis Labels
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  angles.forEach((angle, i) => {
    const labelX = centerX + Math.cos(angle) * (radius + 28);
    const labelY = centerY + Math.sin(angle) * (radius + 28);
    ctx.fillText(axisLabels[i], labelX, labelY);
  });
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';

  // Bottom Training Zones Box
  const zoneY = 860;
  roundRect(ctx, 40, zoneY, w - 80, 120, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#FF9F0A';
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🎯 黄金训练区间推荐', 60, zoneY + 32);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`• 甜点训练 (Sweet Spot 88%~94%): ${data.sweetSpotMin} - ${data.sweetSpotMax} W`, 60, zoneY + 62);
  ctx.fillText(`• Seiler 80/20 极化低强度基石 (< 77%): < ${Math.round(data.ftpWatts * 0.77)} W`, 60, zoneY + 90);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 2. Climb Pacing Poster
export interface ClimbPacingPosterData {
  climbName: string;
  totalDistanceKm: number;
  totalElevationM: number;
  avgGrade: number;
  overallTimeStr: string;
  avgWatts: number;
  avgWkg: number;
  overallVam: number;
  ftpWatts: number;
  segments: Array<{ name: string; distanceKm: number; gradePct: number; targetWatts: number; targetFtpPct: number; timeStr: string }>;
}

export function generateClimbPacingPoster(data: ClimbPacingPosterData): string {
  const w = 750;
  const h = 1120;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF'; // ios-blue

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🏔️ 爬坡动力学 · 攻坚配速战报', data.climbName || '名山爬坡攻坚规划', `基准 FTP ${data.ftpWatts}W · 智能重力/滚阻/空气阻力分段解算`, accent);

  // Core Climb Stat Box (4 Tiles)
  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 80, '赛段全长 / 累计爬升', `${data.totalDistanceKm}km`, `+${data.totalElevationM}m`, '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 80, '平均坡度', `${data.avgGrade}`, '%', '#FF9F0A');
  drawMetricTile(ctx, 40, 299, tileW, 80, '预计登顶耗时', data.overallTimeStr, undefined, '#30D158');
  drawMetricTile(ctx, 40 + tileW + 15, 299, tileW, 80, '建议巡航功率 / VAM', `${data.avgWatts}W`, `${data.overallVam}m/h`, '#BF5AF2');

  // Segments Header
  const segStartY = 405;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🚩 分段路况与目标配速功率表', 40, segStartY);

  // Segments List Table Box
  const segments = data.segments || [];
  const listH = Math.min(520, Math.max(260, segments.length * 68 + 30));
  roundRect(ctx, 40, segStartY + 15, w - 80, listH, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  // Table header
  ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
  ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('分段名称 / 里程', 60, segStartY + 45);
  ctx.fillText('平均坡度', 260, segStartY + 45);
  ctx.fillText('目标输出', 410, segStartY + 45);
  ctx.fillText('预计耗时', 560, segStartY + 45);

  segments.slice(0, 7).forEach((seg, idx) => {
    const rowY = segStartY + 80 + idx * 62;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.beginPath();
    ctx.moveTo(60, rowY - 18);
    ctx.lineTo(w - 60, rowY - 18);
    ctx.stroke();

    // Segment Index & Name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${idx + 1}. ${seg.name}`, 60, rowY + 5);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${seg.distanceKm} km`, 60, rowY + 24);

    // Grade
    ctx.fillStyle = seg.gradePct >= 8 ? '#FF453A' : seg.gradePct >= 5 ? '#FF9F0A' : '#30D158';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${seg.gradePct}%`, 260, rowY + 12);

    // Target Watts
    ctx.fillStyle = '#0A84FF';
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${seg.targetWatts} W`, 410, rowY + 8);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${seg.targetFtpPct}% FTP`, 410, rowY + 24);

    // Time
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(seg.timeStr, 560, rowY + 12);
  });

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 3. Gear Speed Cadence Poster
export interface GearSpeedPosterData {
  chainringStr: string;
  cogsStr: string;
  cadenceRpm: number;
  maxSpeed: string | number;
  maxRatio: number;
  minSpeed: string | number;
  minRatio: number;
  unitStr: string;
  presetName?: string;
}

export function generateGearSpeedPoster(data: GearSpeedPosterData): string {
  const w = 750;
  const h = 980;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚙️ 传动几何 · 齿比与速度矩阵', '传动比与巡航踏频极速战报', `大盘 ${data.chainringStr} · 飞轮 ${data.cogsStr} · 基准踏频 ${data.cadenceRpm} RPM`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '大盘平路极限极速', data.maxSpeed, data.unitStr, '#30D158');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '最大平路传动齿比', data.maxRatio, undefined, '#0A84FF');
  drawMetricTile(ctx, 40, 304, tileW, 85, '小盘陡坡爬坡下限', data.minSpeed, data.unitStr, '#FF9F0A');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '最小爬坡救命齿比', data.minRatio, undefined, '#FF453A');

  // Specs Showcase
  const specY = 415;
  roundRect(ctx, 40, specY, w - 80, 260, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📊 传动系统核心技术规格', 65, specY + 35);

  const specs = [
    { label: '牙盘大盘配置', val: data.chainringStr },
    { label: '后飞轮档位跨度', val: data.cogsStr },
    { label: '基准巡航踩踏踏频', val: `${data.cadenceRpm} RPM` },
    { label: '齿比调校方案预设', val: data.presetName || '自定义调校' },
    { label: '齿比调节跨度范围', val: `${data.minRatio} ~ ${data.maxRatio}` }
  ];

  specs.forEach((s, idx) => {
    const sy = specY + 75 + idx * 36;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.label, 65, sy);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.val, 320, sy);
  });

  // Tips Box
  const tipY = 700;
  roundRect(ctx, 40, tipY, w - 80, 150, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 技师换档与踏频建议', 65, tipY + 35);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• 保持 85~95 RPM 黄金踏频可最大化肌肉血流灌注并延缓乳酸堆积。', 65, tipY + 68);
  ctx.fillText('• 极限大对大 (Big-Big) 与小对小 (Small-Small) 会急剧增加链条斜拉磨损与摩擦瓦数损失。', 65, tipY + 98);
  ctx.fillText('• 针对 10%+ 持续陡坡，建议传动最小齿比维持在 ≤ 1.0 (例如 34T 盘片配 34T 飞轮)。', 65, tipY + 128);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 4. Tire Pressure Poster
export interface TirePressurePosterData {
  bikeType: string;
  totalWeightKg: number;
  tireSetup: string;
  tireWidth: number;
  surface: string;
  frontRec: number;
  rearRec: number;
  frontRange: string;
  rearRange: string;
  unit: string;
  isHookless: boolean;
}

export function generateTirePressurePoster(data: TirePressurePosterData): string {
  const w = 750;
  const h = 960;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';
  const unitStr = String(data.unit || 'PSI').toUpperCase();
  const tireSetupStr = data.tireSetup || '真空胎 (Tubeless)';
  const surfaceStr = data.surface || '综合平整铺装路面';
  const totalWeightStr = data.totalWeightKg ? `${data.totalWeightKg} kg` : '--';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚡ 滚阻与形变 · 智能胎压', '科学胎压与抓地力调校卡', `总系统重量 ${totalWeightStr} · ${tireSetupStr} · ${surfaceStr}`, accent);

  // Large Dual Pressure Pods
  const podW = (w - 80 - 20) / 2;
  const podH = 220;

  // Front Pod
  roundRect(ctx, 40, 204, podW, podH, 24);
  ctx.fillStyle = 'rgba(10, 132, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 132, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('前轮最佳充气胎压 (FRONT)', 60, 240);

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(String(data.frontRec ?? '--'), 60, 315);
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(unitStr, 60 + ctx.measureText(String(data.frontRec ?? '--')).width * 2.8 + 10, 315);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`建议安全区间: ${data.frontRange || '--'} ${unitStr}`, 60, 370);

  // Rear Pod
  roundRect(ctx, 40 + podW + 20, 204, podW, podH, 24);
  ctx.fillStyle = 'rgba(48, 209, 88, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(48, 209, 88, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('后轮最佳充气胎压 (REAR)', 40 + podW + 40, 240);

  ctx.fillStyle = '#30D158';
  ctx.font = 'bold 54px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(String(data.rearRec ?? '--'), 40 + podW + 40, 315);
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(unitStr, 40 + podW + 40 + ctx.measureText(String(data.rearRec ?? '--')).width * 2.8 + 10, 315);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`建议安全区间: ${data.rearRange || '--'} ${unitStr}`, 40 + podW + 40, 370);

  // Parameter Details Table
  const detailY = 450;
  roundRect(ctx, 40, detailY, w - 80, 220, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📋 调校技术参数摘要', 65, detailY + 35);

  const params = [
    { label: '车种类型 / 设定', val: data.bikeType },
    { label: '外胎标称宽度', val: `${data.tireWidth} mm` },
    { label: '胎胎结构形式', val: data.tireSetup },
    { label: '骑行路面条件', val: data.surface },
    { label: '无钩圈 (Hookless) 安全限制', val: data.isHookless ? '是 (上限 72.5 PSI / 5.0 Bar)' : '标准有钩圈 (Clincher)' }
  ];

  params.forEach((p, idx) => {
    const py = detailY + 70 + idx * 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(p.label, 65, py);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(p.val, 320, py);
  });

  // Notice
  const noticeY = 690;
  roundRect(ctx, 40, noticeY, w - 80, 160, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#64D2FF';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 科学胎压为何快人一步？', 65, noticeY + 35);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• 传统“胎压越打越硬越快”已被 Silca 等顶级风洞实验室推翻。', 65, noticeY + 68);
  ctx.fillText('• 真实沥青路面上，适度降低胎压可大幅消除阻抗损耗 (Impedance Loss)，平顺更省瓦。', 65, noticeY + 98);
  ctx.fillText('• 骑手重心通常 40:60 偏向后轮，因此前轮胎压应比后轮低 8%~12% 以换取极佳过弯抓地力。', 65, noticeY + 128);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 5. Upgrade ROI Poster
export interface UpgradeRoiPosterData {
  activeCount: number;
  totalWeightSaveG: number;
  totalPowerSaveWatts: number;
  totalCost: number;
  currency: string;
  flatTimeSavedSec: number;
  climbTimeSavedSec: number;
  costPerWatt: number | string;
  roiLevel: string;
}

export function generateUpgradeRoiPoster(data: UpgradeRoiPosterData): string {
  const w = 750;
  const h = 980;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚖️ 边际效益 · 改装升级省瓦', '零件减重与气动升级性价比战报', `选定 ${data.activeCount} 项改装升级 · 综合预算 ${data.currency} ${data.totalCost}`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '总减重净收益', `-${data.totalWeightSaveG}`, 'g', '#30D158');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '气动/滚阻总省瓦', `+${data.totalPowerSaveWatts}`, 'W', '#0A84FF');
  drawMetricTile(ctx, 40, 304, tileW, 85, '40km 平路预计提速', `${data.flatTimeSavedSec}`, '秒', '#64D2FF');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '10km 爬坡预计提速', `${data.climbTimeSavedSec}`, '秒', '#FF9F0A');

  // ROI Rating Banner
  const roiY = 415;
  roundRect(ctx, 40, roiY, w - 80, 110, 20);
  ctx.fillStyle = 'rgba(255, 214, 10, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 214, 10, 0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('⭐ 每省 1 瓦边际投入指数 (ROI)', 65, roiY + 36);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${data.currency} ${data.costPerWatt} / W`, 65, roiY + 78);

  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`[${data.roiLevel}]`, 65 + ctx.measureText(`${data.currency} ${data.costPerWatt} / W`).width * 1.5 + 10, roiY + 78);

  // Geek Advice
  const tipY = 550;
  roundRect(ctx, 40, tipY, w - 80, 300, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 顶级风洞与职业车队边际效益铁律', 65, tipY + 40);

  const tips = [
    '1. 贴身气动连体骑行服与气动破风头盔是每瓦成本最低的提速利器 (ROI 极高)。',
    '2. 升级乳胶内胎 (TPU) 或顶级真空胎，仅需数百元即可在平路节省 5~10 瓦纯机械滚阻。',
    '3. 减重 500g 在平路巡航中收益几乎为零，但在 8%+ 爬坡中每减重 1kg 可省约 3~4 瓦。',
    '4. 昂贵的高框碳轮主要收益在于 40km/h+ 高速下的气动帆船效应与风阻缩减。',
    '5. 保持链条超声波清洁并采用热熔石蜡浸润，可在传动端稳定挽回 3~6 瓦阻力损失。'
  ];

  tips.forEach((t, i) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(t, 65, tipY + 80 + i * 42);
  });

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 6. Cycle Power & Dynamics Poster
export interface CyclePowerPosterData {
  speedKmh: number;
  power: number;
  wkg: number;
  levelTitle: string;
  grade: number;
  kcalPerHour: number;
  vam: number;
  aeroPct: number;
  gravityPct: number;
  rollingPct: number;
}

export function generateCyclePowerPoster(data: CyclePowerPosterData): string {
  const w = 750;
  const h = 960;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚡ 动力学方程 · 单车功率与速度', '巡航速度与推重比动力学战报', `巡航车速 ${data.speedKmh} km/h · 当前坡度 ${data.grade}%`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '需要维持功率', data.power, 'W', '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '功能推重比', data.wkg, 'W/kg', '#30D158');
  drawMetricTile(ctx, 40, 304, tileW, 85, '车手等级画像', data.levelTitle, undefined, '#FF9F0A');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '爬坡垂直爬升率 (VAM)', data.vam, 'm/h', '#BF5AF2');

  // Resistance Split Bar
  const splitY = 415;
  roundRect(ctx, 40, splitY, w - 80, 180, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📊 骑行阻力三要素构成占比', 65, splitY + 35);

  // Multi-color progress bar
  const barX = 65;
  const barY = splitY + 65;
  const barW = w - 130;
  const barH = 24;

  const aeroW = (barW * data.aeroPct) / 100;
  const gravW = (barW * data.gravityPct) / 100;
  const rollW = barW - aeroW - gravW;

  ctx.fillStyle = '#0A84FF'; // Aero
  roundRect(ctx, barX, barY, Math.max(0, aeroW), barH, 6);
  ctx.fill();

  ctx.fillStyle = '#FF453A'; // Gravity
  roundRect(ctx, barX + aeroW, barY, Math.max(0, gravW), barH, 6);
  ctx.fill();

  ctx.fillStyle = '#30D158'; // Rolling
  roundRect(ctx, barX + aeroW + gravW, barY, Math.max(0, rollW), barH, 6);
  ctx.fill();

  // Legend
  ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillStyle = '#0A84FF';
  ctx.fillText(`• 空气阻力: ${data.aeroPct}%`, 65, splitY + 130);
  ctx.fillStyle = '#FF453A';
  ctx.fillText(`• 重力分量: ${data.gravityPct}%`, 280, splitY + 130);
  ctx.fillStyle = '#30D158';
  ctx.fillText(`• 机械滚阻: ${data.rollingPct}%`, 480, splitY + 130);

  // Aerodynamics Insight
  const aeroInsightY = 620;
  roundRect(ctx, 40, aeroInsightY, w - 80, 220, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#64D2FF';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 空气阻力立方定律', 65, aeroInsightY + 35);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• 克服风阻所需的功率与车速的【三次方】成正比！', 65, aeroInsightY + 68);
  ctx.fillText('• 车速从 30 km/h 提升到 40 km/h，功率需要增加将近 140% 而非 33%。', 65, aeroInsightY + 98);
  ctx.fillText('• 在超过 35 km/h 的平路巡航中，骑手总阻力的 80%~90% 来自于空气撞击。', 65, aeroInsightY + 128);
  ctx.fillText(`• 按照当前工况持续踩踏，预估每小时代谢消耗能耗约为 ${data.kcalPerHour} kcal。`, 65, aeroInsightY + 158);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 7. Chain Length Poster
export interface ChainLengthPosterData {
  chainstayMm: number;
  frontRings: string;
  rearCogs: string;
  recommendedLinks: number;
  chainLengthInches: number;
  requiredCapacity: number;
  derailleurRecommendation: string;
  isFullSuspension: boolean;
}

export function generateChainLengthPoster(data: ChainLengthPosterData): string {
  const w = 750;
  const h = 940;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🔗 传动几何 · 链条物理', '技师级截链规范与后拨容量核算卡', `后下叉 RC: ${data.chainstayMm} mm · 搭配 ${data.frontRings} + ${data.rearCogs}`, accent);

  // Big Recommended Links Pod
  roundRect(ctx, 40, 204, w - 80, 150, 24);
  ctx.fillStyle = 'rgba(10, 132, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 132, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('推荐链条精准截取节数 (含魔术扣)', 65, 240);

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 64px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(String(data.recommendedLinks), 65, 320);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('节 (Links)', 65 + ctx.measureText(String(data.recommendedLinks)).width * 2.8 + 15, 320);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`展开总长度约: ${data.chainLengthInches} 英寸`, 450, 320);

  // Capacity & derailleurs
  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 375, tileW, 85, '传动系统所需总齿容量', `${data.requiredCapacity}T`, undefined, '#FF9F0A');
  drawMetricTile(ctx, 40 + tileW + 15, 375, tileW, 85, '后拨导板规格建议', data.derailleurRecommendation, undefined, '#30D158');

  // Specs
  const specY = 485;
  roundRect(ctx, 40, specY, w - 80, 200, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('⚙️ 传动几何装配基准', 65, specY + 35);

  const specs = [
    { label: '车架后下叉长度 (Chainstay RC)', val: `${data.chainstayMm} mm` },
    { label: '前牙盘齿数规格', val: data.frontRings },
    { label: '后飞轮极限跨度', val: data.rearCogs },
    { label: '车架结构形态', val: data.isFullSuspension ? '全避震软尾 (含避震压缩轴距补偿)' : '公路/硬尾硬架' }
  ];

  specs.forEach((s, idx) => {
    const sy = specY + 70 + idx * 30;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.label, 65, sy);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.val, 360, sy);
  });

  // Mechanic Rules
  const ruleY = 710;
  roundRect(ctx, 40, ruleY, w - 80, 140, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🔧 技师截链防坑指南', 65, ruleY + 32);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('• 链条过短：大对大档位会直接拉爆后拨导板或尾钩！', 65, ruleY + 62);
  ctx.fillText('• 链条过长：小对小档位后拨弹簧无法拉紧，导致跳链、掉链与打后下叉。', 65, ruleY + 90);
  ctx.fillText('• 截链时请宁长勿短，截断前务必将魔术扣的一节公母计算在内。', 65, ruleY + 118);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 8. Road Bike Pain Checker Poster
export interface PainCheckPosterData {
  areaTitle?: string;
  checkedCount?: number;
  totalChecks?: number;
  progressPct?: number;
  causes?: Array<{ category: string; details: string[] }>;
  checklist?: string[];
  symptoms?: string[];
  solutions?: string[];
  expertAdvice?: string;
}

export function generatePainCheckPoster(data: PainCheckPosterData): string {
  const w = 750;
  const h = 1060;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#BF5AF2'; // ios-purple

  const areaTitle = data.areaTitle || '骑行不适部位';
  const checklist = data.checklist || data.solutions || [];
  const checkedCount = data.checkedCount ?? 0;
  const totalChecks = data.totalChecks || (checklist.length > 0 ? checklist.length : 1);
  const progressPct = data.progressPct ?? Math.round((checkedCount / totalChecks) * 100);
  const causes = data.causes || [];

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🩺 运动医学 · 疼痛自诊处方', `${areaTitle}自纠处方卡`, `已完成排查 ${checkedCount}/${totalChecks} 项 (${progressPct}%) · 科学调车指南`, accent);

  // Progress banner
  roundRect(ctx, 40, 204, w - 80, 80, 20);
  ctx.fillStyle = 'rgba(191, 90, 242, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(191, 90, 242, 0.25)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#BF5AF2';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🎯 排查进度状态', 65, 234);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${checkedCount} / ${totalChecks} 项疑点已核实 · 诊断完成率 ${progressPct}%`, 65, 264);

  // Targeted Prescriptions Box
  const rxY = 305;
  roundRect(ctx, 40, rxY, w - 80, 360, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#30D158';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📋 针对性调车自纠处方清单 (Bike Fitting)', 65, rxY + 36);

  checklist.slice(0, 6).forEach((item, idx) => {
    const iy = rxY + 75 + idx * 46;
    ctx.fillStyle = '#30D158';
    ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`✓ 方案 ${idx + 1}:`, 65, iy);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const itemStr = String(item || '');
    ctx.fillText(itemStr.length > 38 ? itemStr.slice(0, 38) + '...' : itemStr, 155, iy);
  });

  // Root Causes Box
  const causeY = 685;
  roundRect(ctx, 40, causeY, w - 80, 280, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#FF9F0A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🔍 根本成因与生物力学机理分析', 65, causeY + 36);

  if (causes.length > 0) {
    causes.slice(0, 3).forEach((c, idx) => {
      const cy = causeY + 75 + idx * 64;
      ctx.fillStyle = '#FF9F0A';
      ctx.font = 'bold 13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`[${c.category || '诊断分析'}]`, 65, cy);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const detailText = Array.isArray(c.details) ? c.details.join('； ') : String(c.details || '');
      ctx.fillText(detailText.length > 40 ? detailText.slice(0, 40) + '...' : detailText, 65, cy + 24);
    });
  } else if (data.expertAdvice) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`专家建议: ${data.expertAdvice}`, 65, causeY + 80);
  }

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 9. Structured Workout Poster
export interface WorkoutPosterData {
  workoutTitle?: string;
  workoutName?: string;
  ftpWatts: number;
  totalDurationStr?: string;
  totalMinutes?: number;
  tss: number;
  intensityFactor: number;
  calories: number;
  description?: string;
  segments?: Array<{ name: string; durationSec: number; powerPct: number; cadenceRpm?: number; targetWatts?: number; type?: string }>;
}

export function generateWorkoutPoster(data: WorkoutPosterData): string {
  const w = 750;
  const h = 1040;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#FF3B30';

  const title = data.workoutTitle || data.workoutName || '科学间歇训练课表';
  const desc = data.description || '根据生理动力学与代谢功率阶梯科学定制的间歇训练课表。';
  const durationStr = data.totalDurationStr || (data.totalMinutes ? `${data.totalMinutes} 分钟` : '60 分钟');
  const segments = data.segments || [];

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🏋️ 科学训练 · 结构化间歇课表', title, `基准 FTP ${data.ftpWatts || 200}W · 智能靶向踏频与功率阶梯`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '课表总执行时长', durationStr, undefined, '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '训练压力指数 (TSS)', data.tss || 0, undefined, '#FF9F0A');
  drawMetricTile(ctx, 40, 304, tileW, 85, '强度系数 (IF)', data.intensityFactor || 0, undefined, '#FF375F');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '预估能量代谢消耗', data.calories || 0, 'kcal', '#30D158');

  // Description
  const descY = 410;
  roundRect(ctx, 40, descY, w - 80, 80, 16);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(desc.length > 50 ? desc.slice(0, 50) + '...' : desc, 60, descY + 45);

  // Intervals Breakdown Bar & List
  const listY = 510;
  roundRect(ctx, 40, listY, w - 80, 440, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('⚡ 课表分段间歇执行明细', 65, listY + 35);

  segments.slice(0, 7).forEach((seg, idx) => {
    const sy = listY + 75 + idx * 50;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.moveTo(65, sy - 14);
    ctx.lineTo(w - 65, sy - 14);
    ctx.stroke();

    // Segment color badge
    const color = seg.powerPct >= 115 ? '#FF375F' : seg.powerPct >= 95 ? '#FF9F0A' : seg.powerPct >= 75 ? '#30D158' : '#0A84FF';
    ctx.fillStyle = color;
    roundRect(ctx, 65, sy, 8, 26, 4);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${idx + 1}. ${seg.name}`, 85, sy + 18);

    const durMins = Math.floor(seg.durationSec / 60);
    const durSecs = seg.durationSec % 60;
    const durStr = durMins > 0 ? `${durMins}m ${durSecs}s` : `${durSecs}s`;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(durStr, 340, sy + 18);

    const targetWatts = Math.round(data.ftpWatts * (seg.powerPct / 100));
    ctx.fillStyle = color;
    ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(`${seg.powerPct}% FTP (${targetWatts}W)`, 460, sy + 18);
  });

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 10. Roadbook & GPX Poster
export interface RoadbookPosterData {
  routeName: string;
  sourceCode?: string;
  distanceKm: number;
  elevationGainM: number;
  maxAltitudeM: number;
  avgGradePct: number;
  sceneryRating: number;
  roadCondition: string;
  highlights: string[];
  description: string;
}

export function generateRoadbookPoster(data: RoadbookPosterData): string {
  const w = 750;
  const h = 1000;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#00C7BE'; // ios-mint

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🧭 经典路书 · 骑行漫游', data.routeName, `${data.sourceCode ? `[${data.sourceCode}] ` : ''}${data.roadCondition}`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '路线总里程', data.distanceKm, 'km', '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '累计爬升海拔', `+${data.elevationGainM}`, 'm', '#30D158');
  drawMetricTile(ctx, 40, 304, tileW, 85, '最高海拔标高', data.maxAltitudeM, 'm', '#FF9F0A');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '平均综合坡度', data.avgGradePct, '%', '#BF5AF2');

  // Highlights & Badges
  const hlY = 410;
  roundRect(ctx, 40, hlY, w - 80, 100, 20);
  ctx.fillStyle = 'rgba(0, 199, 190, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(0, 199, 190, 0.25)';
  ctx.stroke();

  ctx.fillStyle = '#00C7BE';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('✨ 路线特色标签', 65, hlY + 34);

  let badgeOffset = 65;
  const highlights = data.highlights || ['经典骑行', '山野风光'];
  highlights.slice(0, 4).forEach(h => {
    ctx.font = 'bold 12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const bw = ctx.measureText(h).width + 20;
    roundRect(ctx, badgeOffset, hlY + 50, bw, 26, 13);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(h, badgeOffset + 10, hlY + 67);
    badgeOffset += bw + 10;
  });

  // Description
  const descY = 530;
  roundRect(ctx, 40, descY, w - 80, 370, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📖 路线简介与骑行体验', 65, descY + 40);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  // Multiline wrapping
  const words = data.description || '经典骑行探索路线，尽情领略户外破风骑行之美。可将本航迹导入码表进行全程导航。';
  let line = '';
  let lineY = descY + 75;
  for (let i = 0; i < words.length; i++) {
    line += words[i];
    if (line.length >= 28 || i === words.length - 1) {
      ctx.fillText(line, 65, lineY);
      line = '';
      lineY += 28;
    }
  }

  // Scenery stars
  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`风景推荐指数: ${'★'.repeat(data.sceneryRating || 5)}`, 65, descY + 330);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 11. Suspension Setup Poster
export interface SuspensionPosterData {
  riderName?: string;
  totalWeightKg?: number;
  riderWeightKg?: number;
  bikeCategory?: string;
  discipline?: string;
  ridingStyle?: string;
  forkModel?: string;
  forkTravel?: number;
  forkPsi?: number;
  forkPressurePsi?: number;
  forkSagPct?: number;
  forkSagMm?: number;
  forkLsr?: number;
  forkReboundClicks?: number;
  forkLsc?: number;
  forkLscClicks?: number;
  forkTokens?: number;
  shockType?: string;
  shockTravel?: number;
  shockPsiOrSpring?: string;
  shockPressurePsi?: number;
  shockSagPct?: number;
  shockSagMm?: number;
  shockRebound?: number;
  shockReboundClicks?: number;
  shockLscClicks?: number;
  shockSpacers?: number;
}

export function generateSuspensionPoster(data: SuspensionPosterData): string {
  const w = 750;
  const h = 1000;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  const disciplineStr = String(data.discipline || data.bikeCategory || 'MTB 越野').toUpperCase();
  const weight = data.totalWeightKg || data.riderWeightKg || 70;
  const forkModel = data.forkModel || '避震气压前叉';
  const forkTravel = data.forkTravel || 120;
  const forkPsi = data.forkPsi ?? data.forkPressurePsi ?? 80;
  const forkSagPct = data.forkSagPct ?? 25;
  const forkLsr = data.forkLsr ?? data.forkReboundClicks ?? 6;
  const forkLsc = data.forkLsc ?? data.forkLscClicks ?? 4;
  const shockType = data.shockType || 'air';
  const shockTravel = data.shockTravel || 120;
  const shockPsiOrSpring = data.shockPsiOrSpring || (data.shockPressurePsi ? `${data.shockPressurePsi} PSI` : '标准气压');
  const shockSagPct = data.shockSagPct ?? 28;
  const shockRebound = data.shockRebound ?? data.shockReboundClicks ?? 5;

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '🚵 山地避震 · 悬挂调校设定', `${disciplineStr} 战车避震调校档案`, `车手全备重 ${weight} kg · 前后悬挂气压与阻尼基准`, accent);

  // Dual Suspension Pods
  const podW = (w - 80 - 20) / 2;
  const podH = 340;

  // Fork Pod
  roundRect(ctx, 40, 204, podW, podH, 24);
  ctx.fillStyle = 'rgba(10, 132, 255, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 132, 255, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('前叉避震设定 (FORK)', 65, 240);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${forkModel} · ${forkTravel}mm 行程`, 65, 266);

  const forkSpecs = [
    { label: '主气室推荐气压', val: `${forkPsi} PSI` },
    { label: '下沉量 (SAG)', val: `${forkSagPct}%` },
    { label: '低速回弹 (LSR)', val: `${forkLsr} Clicks` },
    { label: '低速压缩 (LSC)', val: `${forkLsc} Clicks` }
  ];

  forkSpecs.forEach((s, idx) => {
    const fy = 310 + idx * 45;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.label, 65, fy);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.val, 65, fy + 22);
  });

  // Shock Pod
  roundRect(ctx, 40 + podW + 20, 204, podW, podH, 24);
  ctx.fillStyle = 'rgba(48, 209, 88, 0.08)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(48, 209, 88, 0.3)';
  ctx.stroke();

  ctx.fillStyle = '#30D158';
  ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('后避震设定 (REAR SHOCK)', 40 + podW + 45, 240);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`${shockType === 'coil' ? '弹簧胆 Coil' : '气压胆 Air'} · ${shockTravel}mm 行程`, 40 + podW + 45, 266);

  const shockSpecs = [
    { label: '气压 / 弹簧磅数', val: shockPsiOrSpring },
    { label: '后胆下沉量 (SAG)', val: `${shockSagPct}%` },
    { label: '回弹阻尼 (Rebound)', val: `${shockRebound} Clicks` },
    { label: '压缩平台阻尼', val: '平衡开档' }
  ];

  shockSpecs.forEach((s, idx) => {
    const sy = 310 + idx * 45;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.label, 40 + podW + 45, sy);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(s.val, 40 + podW + 45, sy + 22);
  });

  // Tuning Insights
  const insY = 570;
  roundRect(ctx, 40, insY, w - 80, 330, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#FFD60A';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 山地车下坡姿态与悬挂平衡原则', 65, insY + 40);

  const insights = [
    '• 阻尼调整基准：所有阻尼点击数均从“全关 (Fully Closed / Firmest)”反向顺时针数出。',
    '• SAG 黄金原则：林道/耐力前后 SAG 建议维持在 25%~30%，过小易跳弹过大易打底。',
    '• 动态平衡：快速按压车体时，前后避震应同步压缩与回弹，防止“跷跷板”推头失控。',
    '• 气压微调：在连续颠簸碎石路若感到手部剧烈酸痛，可尝试适度降低 3~5 PSI 并放慢一格回弹。'
  ];

  insights.forEach((ins, idx) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(ins, 65, insY + 80 + idx * 55);
  });

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 12. Road Bike Fitter Poster
export interface FittingPosterData {
  height: number;
  inseam: number;
  armLength: number;
  torso: number;
  ridingStyle: string;
  saddleHeight: number;
  effectiveTopTube: number;
  stemLength: number;
  saddleDrop: number;
  handlebarWidth: number;
  crankLength: number;
  frameSize: string;
  sittingNote: string;
}

export function generateFittingPoster(data: FittingPosterData): string {
  const w = 750;
  const h = 1000;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#007AFF';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '📐 人体工效学 · 车架 Fitting', '公路车个人几何调校档案卡', `身高 ${data.height}cm · 跨高 ${data.inseam}cm · 风格: ${data.ridingStyle === 'racing' ? '激进竞技' : '耐力舒适'}`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '推荐黄金座高 (BB-坐垫顶)', data.saddleHeight, 'cm', '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '推荐车架有效上管 (ETT)', data.effectiveTopTube, 'cm', '#30D158');
  drawMetricTile(ctx, 40, 304, tileW, 85, '建议把立长度 (Stem)', data.stemLength, 'mm', '#FF9F0A');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '座舱落差 (Saddle Drop)', data.saddleDrop, 'cm', '#BF5AF2');

  // Core Geometry Table
  const geomY = 415;
  roundRect(ctx, 40, geomY, w - 80, 260, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🚲 核心几何设定与装车配件规格', 65, geomY + 36);

  const geoms = [
    { label: '车架尺寸参考区间', val: data.frameSize },
    { label: '弯把宽度 (C-to-C)', val: `${data.handlebarWidth} mm` },
    { label: '曲柄长度 (Crank)', val: `${data.crankLength} mm` },
    { label: '躯干与手臂比例分析', val: data.sittingNote }
  ];

  geoms.forEach((g, idx) => {
    const gy = geomY + 75 + idx * 42;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(g.label, 65, gy);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const valStr = String(g.val ?? '--');
    ctx.fillText(valStr.length > 32 ? valStr.slice(0, 32) + '...' : valStr, 280, gy);
  });

  // Fitting Guidelines
  const guideY = 700;
  roundRect(ctx, 40, guideY, w - 80, 200, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#64D2FF';
  ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('💡 专业 Fitting 设定验证要点', 65, guideY + 35);

  const guides = [
    '• 膝关节微屈角：脚踏踩到 6 点钟死点时，膝关节内夹角应保持在 145°~155° 之间。',
    '• 膝盖与脚踏轴心 (KOPS)：曲柄旋转至水平 3 点钟位置时，膝盖骨前缘铅垂线应穿过锁踏轴心。',
    '• 躯干角度：握下把冲刺时躯干与地面夹角约 35°~45°，上身放松无耸肩与手腕过度压迫。'
  ];

  guides.forEach((g, idx) => {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '13px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillText(g, 65, guideY + 70 + idx * 38);
  });

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}

// 13. FIT Activity Post-Ride Poster
export interface FitActivityPosterData {
  activityName: string;
  dateStr: string;
  distanceKm: number;
  durationStr: string;
  normalizedPower: number;
  avgPower: number;
  intensityFactor: number;
  tss: number;
  elevationGainM: number;
  maxWatts: number;
  avgHeartRate: number;
  calories: number;
  phenotype?: string;
  powerZones?: Array<{ zone: string; label: string; percent: number; color: string }>;
}

export function generateFitActivityPoster(data: FitActivityPosterData): string {
  const w = 750;
  const h = 1080;
  const { ctx, canvas } = createPosterCanvas(w, h);
  const accent = '#FF3B30';

  drawBackground(ctx, w, h, accent);
  drawHeader(ctx, w, '⚡ 真实骑行 · 码表深度复盘', data.activityName || '骑行活动深度复盘', `${data.dateStr} · 离线解析高保真运动生理数据`, accent);

  const tileW = (w - 80 - 15) / 2;
  drawMetricTile(ctx, 40, 204, tileW, 85, '总骑行里程', data.distanceKm, 'km', '#0A84FF');
  drawMetricTile(ctx, 40 + tileW + 15, 204, tileW, 85, '总骑行历时', data.durationStr, undefined, '#30D158');
  drawMetricTile(ctx, 40, 304, tileW, 85, '标准化功率 (NP)', data.normalizedPower, 'W', '#FF375F');
  drawMetricTile(ctx, 40 + tileW + 15, 304, tileW, 85, '训练压力 (TSS)', data.tss, undefined, '#FF9F0A');

  // Secondary metrics 4-pack
  const subTileW = (w - 80 - 30) / 4;
  drawMetricTile(ctx, 40, 404, subTileW, 75, '强度 (IF)', data.intensityFactor, undefined, '#BF5AF2');
  drawMetricTile(ctx, 40 + subTileW + 10, 404, subTileW, 75, '累计爬升', `+${data.elevationGainM}`, 'm', '#30D158');
  drawMetricTile(ctx, 40 + (subTileW + 10) * 2, 404, subTileW, 75, '平均心率', data.avgHeartRate > 0 ? data.avgHeartRate : '--', 'bpm', '#FF375F');
  drawMetricTile(ctx, 40 + (subTileW + 10) * 3, 404, subTileW, 75, '卡路里', data.calories, 'kcal', '#FFD60A');

  // Coggan 7-Zone Distribution Bar
  const zoneY = 505;
  roundRect(ctx, 40, zoneY, w - 80, 220, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('📊 Coggan 7 功率区间时间驻留分布', 65, zoneY + 36);

  if (data.powerZones && data.powerZones.length > 0) {
    // Multi-color stacked zone bar
    const barX = 65;
    const barY = zoneY + 65;
    const barW = w - 130;
    const barH = 22;

    let currX = barX;
    data.powerZones.forEach(z => {
      const segW = (barW * z.percent) / 100;
      ctx.fillStyle = z.color;
      ctx.fillRect(currX, barY, segW, barH);
      currX += segW;
    });

    // Zone items legend
    const cols = 2;
    data.powerZones.slice(0, 6).forEach((z, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const lx = 65 + col * 320;
      const ly = zoneY + 115 + row * 30;

      ctx.fillStyle = z.color;
      ctx.fillRect(lx, ly - 10, 10, 10);

      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillText(`${z.zone} ${z.label}: ${z.percent}%`, lx + 18, ly);
    });
  }

  // Tactical Ride Review & Phenotype
  const reviewY = 750;
  roundRect(ctx, 40, reviewY, w - 80, 220, 20);
  ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.stroke();

  ctx.fillStyle = '#0A84FF';
  ctx.font = 'bold 15px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('🏆 本次活动生理画像与骑行战评', 65, reviewY + 36);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.font = '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(`• 判定车手类型: ${data.phenotype || '全能均衡型'}`, 65, reviewY + 70);
  ctx.fillText(`• 平均输出: ${data.avgPower}W | 最大爆发峰值: ${data.maxWatts}W`, 65, reviewY + 102);

  const vi = data.avgPower > 0 ? (data.normalizedPower / data.avgPower).toFixed(2) : '1.00';
  ctx.fillText(`• 变动系数 (VI = NP/AvgP): ${vi} (${Number(vi) > 1.15 ? '波动剧烈，含多次高强度突围/爬坡' : '稳态平顺，节奏控制极佳'})`, 65, reviewY + 134);
  ctx.fillText(`• 训练强度判定: IF ${data.intensityFactor} (${data.intensityFactor >= 0.95 ? '比赛级/竭尽全力' : data.intensityFactor >= 0.85 ? '高强度甜点/阈值' : '基础耐力有氧'})`, 65, reviewY + 166);

  drawFooter(ctx, w, h);
  return canvas.toDataURL('image/png');
}
