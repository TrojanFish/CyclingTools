import React, { useState, useMemo } from 'react';
import {
  Disc,
  Wrench,
  RotateCw,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  Info,
  Layers,
  Scale,
  ShieldAlert,
  ArrowRight,
  Sliders,
  Check,
  Lightbulb
} from 'lucide-react';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';
import { useToast } from '../../context/ToastContext';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { NumberStepper } from '../common/NumberStepper';
import { IOSCard, IOSMetricTile } from '../common/IOSCard';

export const SpokeLengthCalculator: React.FC = () => {
  const { language, unitSystem } = useLanguageAndUnit();
  const { showToast } = useToast();

  // Wheel Architecture Type
  const [wheelPosition, setWheelPosition] = useState<'rear' | 'front'>('rear');
  const [brakeType, setBrakeType] = useState<'disc' | 'rim'>('disc');

  // Rim Parameters
  const [erdMm, setErdMm] = useState<number>(540); // 50mm carbon rim standard
  const [rimOffsetMm, setRimOffsetMm] = useState<number>(0); // Asymmetric rim offset
  const [spokeCount, setSpokeCount] = useState<number>(24); // 24H is standard road/gravel

  // Hub Geometry (Left & Right independent)
  // Left: Non-Drive Side (Rear) or Disc Rotor Side (Front)
  const [leftPcdMm, setLeftPcdMm] = useState<number>(58); // Flange bolt circle diameter
  const [leftCenterDistMm, setLeftCenterDistMm] = useState<number>(34.5); // Center to Left Flange
  const [leftCross, setLeftCross] = useState<number>(2); // 2-cross

  // Right: Drive Side (Rear) or Non-Disc Side (Front)
  const [rightPcdMm, setRightPcdMm] = useState<number>(58);
  const [rightCenterDistMm, setRightCenterDistMm] = useState<number>(19.2); // Center to Right Flange
  const [rightCross, setRightCross] = useState<number>(2); // 2-cross

  // Spoke & Hardware Nuances
  const [spokeHoleDiaMm, setSpokeHoleDiaMm] = useState<number>(2.5); // Hub spoke hole diameter
  const [spokeStretchCompensationMm, setSpokeStretchCompensationMm] = useState<number>(0.6); // Under 1200N tension
  const [nippleLengthMm, setNippleLengthMm] = useState<number>(12); // 12mm standard, 14mm, 16mm
  const [nippleWasherMm, setNippleWasherMm] = useState<number>(0); // 0mm, 0.5mm, 1.0mm DT/Sapim washers

  // Quick Hardware Presets
  const applyPreset = (preset: 'dt350_rear_50' | 'dt350_front_50' | 'gravel_asym_45' | 'mtb_29_xc' | 'rim_rear_classic') => {
    if (preset === 'dt350_rear_50') {
      setWheelPosition('rear');
      setBrakeType('disc');
      setErdMm(540);
      setRimOffsetMm(0);
      setSpokeCount(24);
      setLeftPcdMm(58);
      setLeftCenterDistMm(34.5);
      setLeftCross(2);
      setRightPcdMm(58);
      setRightCenterDistMm(19.2);
      setRightCross(2);
      showToast(language === 'zh-TW' ? '已載入 DT350 碟煞後輪 + 50mm 碳圈預設' : '已载入 DT350 碟刹后轮 + 50mm 碳圈预设', 'info');
    } else if (preset === 'dt350_front_50') {
      setWheelPosition('front');
      setBrakeType('disc');
      setErdMm(540);
      setRimOffsetMm(0);
      setSpokeCount(24);
      setLeftPcdMm(58);
      setLeftCenterDistMm(22.5);
      setLeftCross(2);
      setRightPcdMm(58);
      setRightCenterDistMm(35.5);
      setRightCross(2);
      showToast(language === 'zh-TW' ? '已載入 DT350 碟煞前輪 + 50mm 碳圈預設' : '已载入 DT350 碟刹前轮 + 50mm 碳圈预设', 'info');
    } else if (preset === 'gravel_asym_45') {
      setWheelPosition('rear');
      setBrakeType('disc');
      setErdMm(550);
      setRimOffsetMm(2.6); // Asymmetric offset
      setSpokeCount(28);
      setLeftPcdMm(58);
      setLeftCenterDistMm(34.5);
      setLeftCross(2);
      setRightPcdMm(58);
      setRightCenterDistMm(19.2);
      setRightCross(2);
      showToast(language === 'zh-TW' ? '已載入 Gravel 偏心圈 (2.6mm 偏心)' : '已载入 Gravel 偏心圈 (2.6mm 偏心)', 'info');
    } else if (preset === 'mtb_29_xc') {
      setWheelPosition('rear');
      setBrakeType('disc');
      setErdMm(602);
      setRimOffsetMm(3.0);
      setSpokeCount(28);
      setLeftPcdMm(58);
      setLeftCenterDistMm(35.0);
      setLeftCross(3);
      setRightPcdMm(58);
      setRightCenterDistMm(22.0);
      setRightCross(3);
      showToast(language === 'zh-TW' ? '已載入 29er 登山車 Boost 後輪 3X 交叉預設' : '已载入 29er 山地 Boost 后轮 3X 交叉预设', 'info');
    } else if (preset === 'rim_rear_classic') {
      setWheelPosition('rear');
      setBrakeType('rim');
      setErdMm(577); // Shallow alloy rim
      setRimOffsetMm(0);
      setSpokeCount(24);
      setLeftPcdMm(45);
      setLeftCenterDistMm(37.5);
      setLeftCross(0); // Radial left
      setRightPcdMm(45);
      setRightCenterDistMm(16.0);
      setRightCross(2); // 2X drive side
      showToast(language === 'zh-TW' ? '已載入框煞經典 (左側直拉 / 右側2X交叉)' : '已载入圈刹经典 (左侧直拉 / 右侧2X交叉)', 'info');
    }
  };

  // Jobst Brandt Mathematical Trigonometry
  const result = useMemo(() => {
    // Hardware compensation:
    // DT Swiss / Sapim standard: 12mm nipple is the standard baseline.
    // 14mm nipple has deeper thread entry (~0.5mm shorter spoke needed), 16mm nipple (~1.0mm shorter).
    // Nipple washer (e.g. DT Swiss PHR / Sapim washer) raises the nipple bed, effectively increasing ERD by 2 * washerThickness.
    const effectiveErd = erdMm + (nippleWasherMm * 2) + (nippleLengthMm === 14 ? -0.5 : nippleLengthMm === 16 ? -1.0 : 0);
    const rRim = effectiveErd / 2;
    const rLeftHub = leftPcdMm / 2;
    const rRightHub = rightPcdMm / 2;

    // Rim asymmetry offset moves rim holes toward Left or Right:
    // On rear wheel, offset is toward Left (NDS) to increase drive-side bracing angle.
    // On front disc wheel, offset is toward Right (non-rotor) to balance disc side.
    let effLeftCenter = leftCenterDistMm;
    let effRightCenter = rightCenterDistMm;

    if (wheelPosition === 'rear') {
      effLeftCenter = Math.max(5, leftCenterDistMm - rimOffsetMm);
      effRightCenter = Math.max(5, rightCenterDistMm + rimOffsetMm);
    } else {
      effLeftCenter = Math.max(5, leftCenterDistMm + rimOffsetMm);
      effRightCenter = Math.max(5, rightCenterDistMm - rimOffsetMm);
    }

    // Cross angle theta in radians: (720 * X) / N
    const thetaLeft = ((720 * leftCross) / spokeCount) * (Math.PI / 180);
    const thetaRight = ((720 * rightCross) / spokeCount) * (Math.PI / 180);

    // 2D chord distance in wheel plane
    const chordSqLeft = rRim * rRim + rLeftHub * rLeftHub - 2 * rRim * rLeftHub * Math.cos(thetaLeft);
    const chordSqRight = rRim * rRim + rRightHub * rRightHub - 2 * rRim * rRightHub * Math.cos(thetaRight);

    // 3D spoke vector length
    const rawLeft = Math.sqrt(chordSqLeft + effLeftCenter * effLeftCenter);
    const rawRight = Math.sqrt(chordSqRight + effRightCenter * effRightCenter);

    // Correction for hub spoke hole diameter and tensile elongation
    const holeRadius = spokeHoleDiaMm / 2;
    const netLeft = rawLeft - holeRadius - spokeStretchCompensationMm;
    const netRight = rawRight - holeRadius - spokeStretchCompensationMm;

    // Commercial integer spoke length (round to nearest integer mm, or round down to avoid bottoming out threads)
    const roundedLeft = Math.round(netLeft);
    const roundedRight = Math.round(netRight);

    // Lateral Bracing Angle
    const angleLeftDeg = (Math.atan(effLeftCenter / rRim) * 180) / Math.PI;
    const angleRightDeg = (Math.atan(effRightCenter / rRim) * 180) / Math.PI;

    // Tension Balance Ratio
    // Horizontal equilibrium: T_Left * effLeftCenter ≈ T_Right * effRightCenter
    // Ratio = smaller bracing distance / larger bracing distance
    const leftTensionRatio = effRightCenter / effLeftCenter;
    const rightTensionRatio = effLeftCenter / effRightCenter;

    let tensionDesc = '';
    let tensionRatioPercent = 100;

    if (wheelPosition === 'rear') {
      // Right side (DS) is 100% tension baseline
      tensionRatioPercent = Math.min(100, Math.round(leftTensionRatio * 100));
      tensionDesc = `驱动侧 DS 100% (基准 120kgf) : 非驱动侧 NDS ${tensionRatioPercent}% (${Math.round(120 * (tensionRatioPercent / 100))}kgf)`;
    } else {
      // Disc front: Left side (disc) is 100% tension baseline
      tensionRatioPercent = Math.min(100, Math.round(rightTensionRatio * 100));
      tensionDesc = `碟刹侧 100% (基准 120kgf) : 右侧 ${tensionRatioPercent}% (${Math.round(120 * (tensionRatioPercent / 100))}kgf)`;
    }

    // Safety & Engineering Warnings
    const warnings: string[] = [];

    if (brakeType === 'disc' && wheelPosition === 'front' && leftCross === 0) {
      warnings.push('严重安全隐患：碟刹前轮左侧严禁采用 0X 放射状直拉！刹车卡钳将产生数百牛米扭矩，直拉编法极易撕裂花鼓法兰或断条！');
    }
    if (brakeType === 'disc' && wheelPosition === 'rear' && leftCross === 0) {
      warnings.push('安全警告：碟刹后轮碟刹侧采用 0X 直拉无法承受制动扭矩，必须至少采用 1X 或 2X 交叉！');
    }
    if (wheelPosition === 'rear' && rightCross === 0) {
      warnings.push('传动警告：后轮驱动侧 (塔基侧) 采用 0X 直拉无法有效传递链条踩踏扭矩，除非搭配超粗筒体花鼓或 2:1 异索编法。');
    }
    if (spokeCount <= 24 && (leftCross >= 3 || rightCross >= 3)) {
      warnings.push('几何提示：24孔或更少孔数下采用 3X 交叉，辐条出条角度过大可能遮挡相邻辐条孔头或引起折角。建议 24孔使用 2X。');
    }

    return {
      effectiveErd: parseFloat(effectiveErd.toFixed(1)),
      netLeft: parseFloat(netLeft.toFixed(1)),
      netRight: parseFloat(netRight.toFixed(1)),
      roundedLeft,
      roundedRight,
      angleLeftDeg: parseFloat(angleLeftDeg.toFixed(1)),
      angleRightDeg: parseFloat(angleRightDeg.toFixed(1)),
      tensionRatioPercent,
      tensionDesc,
      warnings,
      effLeftCenter: parseFloat(effLeftCenter.toFixed(1)),
      effRightCenter: parseFloat(effRightCenter.toFixed(1))
    };
  }, [
    erdMm,
    rimOffsetMm,
    spokeCount,
    leftPcdMm,
    leftCenterDistMm,
    leftCross,
    rightPcdMm,
    rightCenterDistMm,
    rightCross,
    spokeHoleDiaMm,
    spokeStretchCompensationMm,
    nippleLengthMm,
    nippleWasherMm,
    wheelPosition,
    brakeType
  ]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="ios-card p-6 sm:p-7 rounded-3xl relative overflow-hidden shadow-ios-sm isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-blue/15" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-semibold">
              <Disc className="w-3.5 h-3.5" />
              <span>{language === 'zh-TW' ? '技師級編輪幾何學' : '技师级编轮几何学'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display">
              {language === 'zh-TW' ? '單車編輪與輻條長度計算器' : '自行车编轮与辐条长度计算器'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl">
              {language === 'zh-TW'
                ? '基於經典 Jobst Brandt 編輪空間三角幾何方程。精確推算驅動側 (DS) 與非驅動側 (NDS) 毫米級輻條下料尺寸、市售整數規格、偏心圈 Offset 張力最佳化比及碟煞/踩踏扭矩編法安全校核。'
                : '基于经典 Jobst Brandt 编轮空间三角几何方程。精确推算驱动侧 (DS) 与非驱动侧 (NDS) 毫米级辐条下料尺寸、市售整数规格、偏心圈 Offset 张力优化比及碟刹/踩踏扭矩编法安全校核。'}
            </p>
          </div>

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
            {[
              { id: 'dt350_rear_50', label: 'DT350 后轮' },
              { id: 'dt350_front_50', label: 'DT350 前轮' },
              { id: 'gravel_asym_45', label: '偏心圈' },
              { id: 'mtb_29_xc', label: '山地 3X' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => applyPreset(p.id as any)}
                className="apple-touch px-3 py-1.5 rounded-xl bg-black/[0.04] hover:bg-black/[0.08] dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-semibold border border-black/[0.04] dark:border-white/[0.06] transition active:scale-95"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Warnings Banner (If any) */}
      {result.warnings.length > 0 && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs space-y-1.5">
          <div className="font-bold flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
            <ShieldAlert className="w-4 h-4" />
            <span>编轮安全与结构力学警示</span>
          </div>
          {result.warnings.map((w, idx) => (
            <div key={idx} className="flex items-start gap-2 leading-relaxed">
              <span className="text-amber-500 font-bold">•</span>
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid: Inputs (7 cols) + Results (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* Wheel Position & Brake System */}
          <IOSCard variant="default" className="space-y-4">
            <div className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-ios-blue" />
              <span>轮组架构与制动形式</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">车轮位置</label>
                <IOSSegmentedControl
                  options={[
                    { id: 'rear', label: language === 'zh-TW' ? '後輪' : '后轮' },
                    { id: 'front', label: language === 'zh-TW' ? '前輪' : '前轮' },
                  ]}
                  value={wheelPosition}
                  onChange={(val) => {
                    const pos = val as 'rear' | 'front';
                    setWheelPosition(pos);
                    if (pos === 'rear') {
                      setLeftCenterDistMm(34.5);
                      setRightCenterDistMm(19.2);
                    } else {
                      setLeftCenterDistMm(22.5);
                      setRightCenterDistMm(35.5);
                    }
                  }}
                  size="sm"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1.5">制动形式</label>
                <IOSSegmentedControl
                  options={[
                    { id: 'disc', label: language === 'zh-TW' ? '碟煞' : '碟刹' },
                    { id: 'rim', label: language === 'zh-TW' ? '圈煞' : '圈刹' },
                  ]}
                  value={brakeType}
                  onChange={(val) => setBrakeType(val as any)}
                  size="sm"
                />
              </div>
            </div>
          </IOSCard>

          {/* Rim Specification */}
          <IOSCard variant="default" className="space-y-4">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Disc className="w-4 h-4 text-cyan-500" />
                <span>车圈有效内径与偏心距 (Rim Specifications)</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">ERD 必须包含条帽沉头接触面</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* ERD */}
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">ERD 有效内径 (mm)</label>
                <NumberStepper
                  value={erdMm}
                  onChange={setErdMm}
                  min={300}
                  max={700}
                  step={1}
                  unit="mm"
                />
                <span className="text-[10px] text-slate-400 block mt-1">如 50mm高~540, 38mm高~564</span>
              </div>

              {/* Asymmetric Rim Offset */}
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">偏心距 Offset (mm)</label>
                <NumberStepper
                  value={rimOffsetMm}
                  onChange={setRimOffsetMm}
                  min={0}
                  max={10}
                  step={0.5}
                  unit="mm"
                  decimals={1}
                />
                <span className="text-[10px] text-slate-400 block mt-1">对称圈填 0，偏心圈一般 2.0-3.5</span>
              </div>

              {/* Spoke Count */}
              <div>
                <label className="text-[11px] text-slate-500 block mb-1">单轮总孔数 (Holes)</label>
                <select
                  value={spokeCount}
                  onChange={(e) => setSpokeCount(Number(e.target.value))}
                  className="w-full bg-slate-100/80 dark:bg-white/5 border border-slate-200/80 dark:border-white/10 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 dark:text-slate-100 focus:outline-none focus:border-ios-blue"
                >
                  <option value={16}>16 孔 (TT/前轮超轻)</option>
                  <option value={20}>20 孔 (圈刹标准前轮)</option>
                  <option value={24}>24 孔 (现代公路/碟刹主流)</option>
                  <option value={28}>28 孔 (Gravel / 山地XC)</option>
                  <option value={32}>32 孔 (长途重载 / Enduro)</option>
                  <option value={36}>36 孔 (旅行车 / 经典重负荷)</option>
                </select>
                <span className="text-[10px] text-slate-400 block mt-1">碟刹后轮通常 24H 或 28H</span>
              </div>
            </div>

            {/* 条帽与垫片规格 (Nipple & Washer Compensation) */}
            <div className="pt-3 border-t border-black/[0.05] dark:border-white/[0.08] grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-[11px] text-slate-500 block mb-1.5">条帽长度规格 (Nipple Length)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 12, label: '12mm 标准' },
                    { val: 14, label: '14mm 加长' },
                    { val: 16, label: '16mm 深圈' }
                  ].map((item) => {
                    const isSelected = nippleLengthMm === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setNippleLengthMm(item.val)}
                        className={`py-1.5 text-xs rounded-xl border transition apple-touch ${
                          isSelected
                            ? 'bg-ios-blue text-white border-ios-blue font-bold shadow-xs ring-1.5 ring-ios-blue/30 scale-[1.01]'
                            : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 font-medium'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">14/16mm 条帽咬合点更深，系统已自动补偿微调避底</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-500 block mb-1.5">辐条孔垫片 (Rim Washer)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { val: 0, label: '无垫片' },
                    { val: 0.5, label: 'PHR 0.5mm' },
                    { val: 1.0, label: '厚垫 1.0mm' }
                  ].map((item) => {
                    const isSelected = nippleWasherMm === item.val;
                    return (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => setNippleWasherMm(item.val)}
                        className={`py-1.5 text-xs rounded-xl border transition apple-touch ${
                          isSelected
                            ? 'bg-ios-blue text-white border-ios-blue font-bold shadow-xs ring-1.5 ring-ios-blue/30 scale-[1.01]'
                            : 'bg-slate-100/80 dark:bg-white/5 border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20 font-medium'
                        }`}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
                <span className="text-[10px] text-slate-400 block mt-1">修正后有效 ERD: <strong className="font-mono text-ios-blue dark:text-ios-blue-dark">{result.effectiveErd} mm</strong></span>
              </div>
            </div>
          </IOSCard>

          {/* Hub Flange Geometry (Left vs Right) */}
          <IOSCard variant="default" className="space-y-4">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-purple-500" />
                <span>花鼓法兰参数与交叉编法 (Hub Flange & Cross Patterns)</span>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Left Side (NDS rear or Disc front) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400">
                    {wheelPosition === 'rear' ? '左侧：非驱动侧 (NDS)' : '左侧：碟刹盘侧 (Disc)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    有效中心距: {result.effLeftCenter}mm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">法兰中心距 W_L (mm)</label>
                    <NumberStepper
                      value={leftCenterDistMm}
                      onChange={setLeftCenterDistMm}
                      min={10}
                      max={60}
                      step={0.5}
                      unit="mm"
                      decimals={1}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">法兰 PCD 孔径 (mm)</label>
                    <NumberStepper
                      value={leftPcdMm}
                      onChange={setLeftPcdMm}
                      min={20}
                      max={120}
                      step={0.5}
                      unit="mm"
                      decimals={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">左侧交叉数 (Cross Pattern)</label>
                  <select
                    value={leftCross}
                    onChange={(e) => setLeftCross(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-ios-blue"
                  >
                    <option value={0}>0X (直拉/放射状 Radial)</option>
                    <option value={1}>1X (1交叉)</option>
                    <option value={2}>2X (2交叉 - 24H主流)</option>
                    <option value={3}>3X (3交叉 - 28/32H主流)</option>
                    <option value={4}>4X (4交叉 - 36H经典)</option>
                  </select>
                </div>
              </div>

              {/* Right Side (DS rear or Non-disc front) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                    {wheelPosition === 'rear' ? '右侧：驱动塔基侧 (DS)' : '右侧：无盘侧 (Non-Disc)'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    有效中心距: {result.effRightCenter}mm
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">法兰中心距 W_R (mm)</label>
                    <NumberStepper
                      value={rightCenterDistMm}
                      onChange={setRightCenterDistMm}
                      min={10}
                      max={60}
                      step={0.5}
                      unit="mm"
                      decimals={1}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-500 block mb-1">法兰 PCD 孔径 (mm)</label>
                    <NumberStepper
                      value={rightPcdMm}
                      onChange={setRightPcdMm}
                      min={20}
                      max={120}
                      step={0.5}
                      unit="mm"
                      decimals={1}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block mb-1">右侧交叉数 (Cross Pattern)</label>
                  <select
                    value={rightCross}
                    onChange={(e) => setRightCross(Number(e.target.value))}
                    className="w-full bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:border-ios-blue"
                  >
                    <option value={0}>0X (直拉/放射状 Radial)</option>
                    <option value={1}>1X (1交叉)</option>
                    <option value={2}>2X (2交叉 - 24H主流)</option>
                    <option value={3}>3X (3交叉 - 28/32H主流)</option>
                    <option value={4}>4X (4交叉 - 36H经典)</option>
                  </select>
                </div>
              </div>
            </div>
          </IOSCard>
        </div>

        {/* Right Output Results (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Spoke Length Result Card */}
          <IOSCard variant="default" className="space-y-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-ios-blue uppercase tracking-wider flex items-center gap-1.5">
                <Disc className="w-4 h-4" />
                <span>精确辐条下料尺寸</span>
              </span>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-ios-blue/10 text-ios-blue font-mono font-semibold">
                {spokeCount} 根 / 轮
              </span>
            </div>

            {/* Left & Right Twin Big Numbers */}
            <div className="grid grid-cols-2 gap-4">
              {/* Left Spoke Length */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-1">
                <div className="text-[11px] font-bold text-blue-600 dark:text-blue-400 flex items-center justify-between">
                  <span>左侧 ({wheelPosition === 'rear' ? 'NDS' : 'Disc'})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-500/10 font-mono">{leftCross}X</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {result.roundedLeft} <span className="text-sm font-bold text-blue-500 font-sans">mm</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  精算值: {result.netLeft} mm
                </div>
                <div className="text-[10px] text-slate-400">
                  张力角: {result.angleLeftDeg}° · 需 {spokeCount / 2} 根
                </div>
              </div>

              {/* Right Spoke Length */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-1">
                <div className="text-[11px] font-bold text-rose-600 dark:text-rose-400 flex items-center justify-between">
                  <span>右侧 ({wheelPosition === 'rear' ? 'DS' : 'Non-Disc'})</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/10 font-mono">{rightCross}X</span>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
                  {result.roundedRight} <span className="text-sm font-bold text-rose-500 font-sans">mm</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  精算值: {result.netRight} mm
                </div>
                <div className="text-[10px] text-slate-400">
                  张力角: {result.angleRightDeg}° · 需 {spokeCount / 2} 根
                </div>
              </div>
            </div>

            {/* Tension Balance Ratio Progress Bar */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Scale className="w-4 h-4 text-purple-500" />
                  <span>左右侧张力平衡比例</span>
                </span>
                <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                  {result.tensionRatioPercent}%
                </span>
              </div>

              {/* Progress Track */}
              <div className="w-full h-2.5 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    result.tensionRatioPercent >= 68
                      ? 'bg-emerald-500'
                      : result.tensionRatioPercent >= 55
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, result.tensionRatioPercent)}%` }}
                ></div>
              </div>

              <div className="text-[11px] text-slate-500 leading-relaxed">
                {result.tensionDesc}
              </div>

              {result.tensionRatioPercent < 60 && rimOffsetMm === 0 && (
                <div className="text-[11px] text-amber-600 dark:text-amber-400 pt-1 flex items-start gap-1">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span>{language === 'zh-TW' ? '提示：當前對稱圈非驅動側張力偏低。若選用 2.5~3.0mm 偏心圈 (Asymmetric Rim)，張力比可大幅提升至 ~70%，顯著增強輪組側向剛性並減少斷條幾率！' : '提示：当前对称圈非驱动侧张力偏低。若选用 2.5~3.0mm 偏心圈 (Asymmetric Rim)，张力比可大幅提升至 ~70%，显著增强轮组侧向刚性并减少断条几率！'}</span>
                </div>
              )}
            </div>
          </IOSCard>

          {/* Interactive Wheel Vector Geometry Diagram */}
          <IOSCard variant="default" className="space-y-3">
            <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>编轮几何投影与交叉角度仿真</span>
              <span className="text-[10px] text-slate-400 font-mono">Jobst Brandt 2D Chord</span>
            </div>

            <div className="h-52 w-full flex items-center justify-center bg-black/[0.02] dark:bg-black/40 rounded-2xl p-2 border border-black/[0.05] dark:border-white/[0.08] relative overflow-hidden">
              <svg viewBox="0 0 200 200" className="w-full h-full max-h-48">
                {/* Rim Circle */}
                <circle cx="100" cy="100" r="85" fill="none" stroke="#64748b" strokeWidth="2.5" strokeDasharray="3 3" />
                <circle cx="100" cy="100" r="89" fill="none" stroke="#94a3b8" strokeWidth="1" />

                {/* Hub Circle */}
                <circle cx="100" cy="100" r="24" fill="rgba(6, 182, 212, 0.08)" stroke="#06b6d4" strokeWidth="2" />
                <circle cx="100" cy="100" r="6" fill="#06b6d4" />

                {/* Generate Spokes based on cross count */}
                {Array.from({ length: spokeCount / 2 }).map((_, i) => {
                  const angleStep = (2 * Math.PI) / (spokeCount / 2);
                  const rimAngle = i * angleStep;

                  // Cross shift angle on hub
                  const crossShiftLeft = ((720 * leftCross) / spokeCount) * (Math.PI / 180);
                  const crossShiftRight = ((720 * rightCross) / spokeCount) * (Math.PI / 180);

                  const hubAngleLeft = rimAngle - crossShiftLeft;
                  const hubAngleRight = rimAngle + crossShiftRight;

                  const rx = 100 + 85 * Math.cos(rimAngle);
                  const ry = 100 + 85 * Math.sin(rimAngle);

                  const hxL = 100 + 24 * Math.cos(hubAngleLeft);
                  const hyL = 100 + 24 * Math.sin(hubAngleLeft);

                  const hxR = 100 + 24 * Math.cos(hubAngleRight);
                  const hyR = 100 + 24 * Math.sin(hubAngleRight);

                  return (
                    <g key={i}>
                      {/* Left Spoke (Blue) */}
                      <line x1={hxL} y1={hyL} x2={rx} y2={ry} stroke="#3b82f6" strokeWidth="1.2" opacity="0.85" />
                      {/* Right Spoke (Rose) */}
                      <line x1={hxR} y1={hyR} x2={rx} y2={ry} stroke="#f43f5e" strokeWidth="1.2" opacity="0.85" />
                      {/* Rim Spoke Hole Dot */}
                      <circle cx={rx} cy={ry} r="2" fill="#cbd5e1" />
                    </g>
                  );
                })}

                {/* Center Labels */}
                <text x="100" y="96" textAnchor="middle" fill="#06b6d4" fontSize="8" fontWeight="bold">
                  {wheelPosition === 'rear' ? 'REAR' : 'FRONT'}
                </text>
                <text x="100" y="108" textAnchor="middle" fill="#94a3b8" fontSize="7">
                  {spokeCount}H
                </text>
              </svg>
            </div>

            <div className="flex items-center justify-center gap-6 text-[11px]">
              <span className="flex items-center gap-1.5 text-blue-500">
                <span className="w-3 h-0.5 bg-blue-500"></span>
                <span>左侧辐条 ({result.roundedLeft}mm · {leftCross}X)</span>
              </span>
              <span className="flex items-center gap-1.5 text-rose-500">
                <span className="w-3 h-0.5 bg-rose-500"></span>
                <span>右侧辐条 ({result.roundedRight}mm · {rightCross}X)</span>
              </span>
            </div>
          </IOSCard>
        </div>
      </div>

      {/* Mechanics Wheelbuilding Checklist & Best Practices */}
      <IOSCard variant="default" className="space-y-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-5 h-5 text-ios-blue" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            自行车高级技师编轮规范与装配细节
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-2">
            <div className="font-bold text-ios-blue flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>1. 辐条螺纹与条帽咬合深度</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              标准 12mm/14mm 铝条帽螺纹全长约 9mm。当下料长度完全正确时，辐条末端在最终 120kgf 高张力下拉伸后应恰好与条帽一字槽平齐。辐条偏短超过 2mm 将导致螺纹吃力不全而崩裂条帽。
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-2">
            <div className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>2. 气门嘴对准与商标美学</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              职业编轮首条辐条定位法则：后轮驱动侧与非驱动侧交叉后的两条平行辐条之间，必须正对轮圈气门嘴孔！使气门嘴位于开阔间隙内，严禁两根辐条交叉遮挡打气筒气嘴夹头。
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08] space-y-2">
            <div className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
              <Check className="w-4 h-4" />
              <span>3. 应力释放 (Stress Relieving)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              调圈上紧至目标张力后，必须用双手用力对捏相邻交叉辐条，或将轮组放置在地面用掌心按压轮圈外缘数次。听到清脆的“噼啪”金属微摩擦释放声后再次微调偏摆与真圆，杜绝首骑松弛。
            </p>
          </div>
        </div>
      </IOSCard>
    </div>
  );
};
