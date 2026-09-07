import React, { useState, useMemo, useEffect } from 'react';
import { Gauge, Info, AlertTriangle, Layers, Share2, Check, User } from 'lucide-react';
import { SURFACE_FACTORS, TIRE_SETUP_FACTORS, getBaseTirePsi } from '../../data/tirePressureConfig';
import { Tooltip } from '../common/Tooltip';
import { TireGauge } from '../common/TireGauge';
import { IOSCard } from '../common/IOSCard';
import { IOSSegmentedControl } from '../common/IOSSegmentedControl';
import { NumberStepper } from '../common/NumberStepper';
import { ShareCardModal } from '../common/ShareCardModal';
import { generateTirePressurePoster } from '../../utils/shareCardGenerators';
import { useToast } from '../../context/ToastContext';
import { useRiderProfile } from '../../context/RiderProfileContext';
import { useLanguageAndUnit } from '../../context/LanguageAndUnitContext';

export const TirePressureCalculator: React.FC = () => {
  const { showToast } = useToast();
  const { profile } = useRiderProfile();
  const { unitSystem, language } = useLanguageAndUnit();
  const isImperial = unitSystem === 'imperial';

  // Share Poster State
  const [sharePosterUrl, setSharePosterUrl] = useState<string | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);

  const [bikeType, setBikeType] = useState<'road' | 'gravel' | 'mtb'>('road');
  const [riderWeight, setRiderWeight] = useState<number>(profile.weightKg || 68);
  const [bikeGearWeight, setBikeGearWeight] = useState<number>(profile.bikeWeightKg || 8.5);
  const [tireSetup, setTireSetup] = useState<'tubeless' | 'tube' | 'tubular'>('tubeless');
  const [nominalWidth, setNominalWidth] = useState<number>(28);
  const [actualWidth, setActualWidth] = useState<number>(29.5);
  const [rimInnerWidth, setRimInnerWidth] = useState<number>(21);
  const [isHookless, setIsHookless] = useState<boolean>(false);
  const [hasTireInsert, setHasTireInsert] = useState<boolean>(false);
  const [weightDistFront, setWeightDistFront] = useState<number>(44);
  const [isBikepacking, setIsBikepacking] = useState<boolean>(false);
  const [luggageKg, setLuggageKg] = useState<number>(12);
  const [luggageBias, setLuggageBias] = useState<'front' | 'frame' | 'rear'>('rear');
  const [surfaceKey, setSurfaceKey] = useState<string>('smooth_asphalt');
  const [pressureUnit, setPressureUnit] = useState<'psi' | 'bar' | 'kpa'>(isImperial ? 'psi' : 'bar');

  // Reactively sync with global rider profile
  useEffect(() => {
    if (profile.weightKg) setRiderWeight(profile.weightKg);
    if (profile.bikeWeightKg) setBikeGearWeight(profile.bikeWeightKg);
  }, [profile.weightKg, profile.bikeWeightKg]);

  // Reactively sync default unit with global unit system
  useEffect(() => {
    setPressureUnit(unitSystem === 'imperial' ? 'psi' : 'bar');
  }, [unitSystem]);

  const effectiveLuggage = isBikepacking ? Math.max(0, luggageKg) : 0;
  const totalSystemWeight = riderWeight + bikeGearWeight + effectiveLuggage;
  const weightDistRear = 100 - weightDistFront;

  // Dynamic front/rear distribution adjustment when bikepacking luggage is loaded
  const { effectiveFrontPct, effectiveRearPct } = useMemo(() => {
    if (!isBikepacking || effectiveLuggage <= 0) {
      return { effectiveFrontPct: weightDistFront, effectiveRearPct: 100 - weightDistFront };
    }
    const baseFrontKg = (riderWeight + bikeGearWeight) * (weightDistFront / 100);
    const baseRearKg = (riderWeight + bikeGearWeight) * ((100 - weightDistFront) / 100);

    // Front biased (handlebar + fork bags): 60% front, 40% rear
    // Frame bag balanced: 45% front, 55% rear
    // Rear biased (saddle pack / rear rack panniers): 15% front, 85% rear
    const lugFrontRatio = luggageBias === 'front' ? 0.60 : luggageBias === 'frame' ? 0.45 : 0.15;
    const lugRearRatio = 1 - lugFrontRatio;

    const totalFrontKg = baseFrontKg + effectiveLuggage * lugFrontRatio;
    const totalRearKg = baseRearKg + effectiveLuggage * lugRearRatio;
    const frontPct = Math.round((totalFrontKg / totalSystemWeight) * 100);
    return { effectiveFrontPct: frontPct, effectiveRearPct: 100 - frontPct };
  }, [isBikepacking, effectiveLuggage, luggageBias, riderWeight, bikeGearWeight, weightDistFront, totalSystemWeight]);

  // Compute recommendations
  const result = useMemo(() => {
    const basePsi = getBaseTirePsi(nominalWidth, totalSystemWeight, bikeType);
    const surfaceFactor = SURFACE_FACTORS[surfaceKey]?.factor || 1.0;
    const setupFactor = TIRE_SETUP_FACTORS[tireSetup]?.factor || 1.0;

    let adjustedBase = basePsi * surfaceFactor * setupFactor;

    if (actualWidth && nominalWidth && actualWidth !== nominalWidth) {
      const diff = actualWidth - nominalWidth;
      adjustedBase -= diff * 1.8;
    }

    if (rimInnerWidth && rimInnerWidth >= 21 && nominalWidth <= 30) {
      adjustedBase -= 1.5;
    }

    // Adaptive pressure reduction for tire insert (cushcore / vittoria)
    if (hasTireInsert) {
      adjustedBase -= 2.5;
    }

    const frontRatio = (effectiveFrontPct / 50) * 0.94;
    const rearRatio = (effectiveRearPct / 50) * 1.06;

    let frontRec = Math.round(adjustedBase * frontRatio);
    let rearRec = Math.round(adjustedBase * rearRatio);

    if (bikeType === 'road') {
      frontRec = Math.max(45, Math.min(120, frontRec));
      rearRec = Math.max(48, Math.min(125, rearRec));
    }

    const frontMin = Math.round(frontRec * 0.94);
    const frontMax = Math.round(frontRec * 1.06);
    const rearMin = Math.round(rearRec * 0.94);
    const rearMax = Math.round(rearRec * 1.06);

    const formatVal = (psiVal: number) => {
      if (pressureUnit === 'bar') return (psiVal * 0.0689476).toFixed(2);
      if (pressureUnit === 'kpa') return Math.round(psiVal * 6.89476).toString();
      return Math.round(psiVal).toString();
    };

    const isHooklessWidthMismatch = isHookless && rimInnerWidth >= 23 && nominalWidth < 28;
    const isHooklessPressureExceeded = isHookless && (rearRec > 72.5 || frontRec > 72.5);
    const isHooklessPressureWarning = isHookless && !isHooklessPressureExceeded && (rearRec >= 68 || frontRec >= 68);
    const hasHooklessWarning = isHooklessPressureExceeded || isHooklessPressureWarning || isHooklessWidthMismatch;

    return {
      front: { rec: formatVal(frontRec), min: formatVal(frontMin), max: formatVal(frontMax), rawPsi: frontRec },
      rear: { rec: formatVal(rearRec), min: formatVal(rearMin), max: formatVal(rearMax), rawPsi: rearRec },
      hasHooklessWarning,
      isHooklessWidthMismatch,
      isHooklessPressureExceeded,
      isHooklessPressureWarning,
      notes: [
        isHooklessWidthMismatch ? 'ETRTO 规范安全红线：无钩轮圈内宽 ≥23mm 严禁搭配小于 28c 外胎，极易脱圈导致严重摔车事故！' : null,
        surfaceKey === 'wet_slick' ? '雨天/湿滑路面：建议胎压调低 5~8 PSI 提升橡胶抓地力与刹车循迹性。' : null,
        tireSetup === 'tubeless' ? '真空胎优势：自补液自动密封微小穿孔，可安心使用较低胎压享受极致滤震与更低滚阻。' : '普通内胎：请勿低于推荐下限，以防过坑或减速带发生蛇咬(Pinch Flat)爆胎。',
        hasTireInsert ? '已启用真空胎防爆胎垫 (Tire Insert)：胎垫提供侧向渐进支撑并防止轮圈磕底，推荐胎压已自适应调低 2.5 PSI，兼顾极致抓地循迹与轮圈防护。' : null,
        isBikepacking && effectiveLuggage > 0
          ? `🎒 长途重装 Bikepacking 模式 (+${effectiveLuggage}kg 行囊)：前后轮载荷动态平衡重构为 [前 ${effectiveFrontPct}% / 后 ${effectiveRearPct}%]。${
              luggageBias === 'rear'
                ? '后轮承重显著升高，后胎压已自适应调升以防坑洼过坎砸框 (Rim Strike)'
                : luggageBias === 'front'
                ? '前轮载荷升高，转向手感沉稳，已提升前胎气压维持支撑刚性'
                : '中央车架包重心居中均衡，前后胎压同步增强'
            }。重车状态下制动距离显著延长，下长坡务必提前阶梯式制动控速，注意碟片热衰竭。`
          : null,
        actualWidth > nominalWidth ? `实测胎宽(${actualWidth}mm)宽于标称，已自动优化下调胎压以获得更平坦接地印记。` : null,
        isHooklessPressureExceeded ? '无钩圈(Hookless)极限安全气压为 72.5 PSI (5.0 Bar)，计算气压已超标，请立即更换更宽外胎降低胎压！' : null,
        isHooklessPressureWarning ? '当前气压逼近无钩轮圈 72.5 PSI 上限临界点，建议充气时预留余量以防日晒升温爆胎。' : null
      ].filter(Boolean) as string[]
    };
  }, [bikeType, totalSystemWeight, tireSetup, nominalWidth, actualWidth, rimInnerWidth, isHookless, hasTireInsert, effectiveFrontPct, effectiveRearPct, isBikepacking, effectiveLuggage, luggageBias, surfaceKey, pressureUnit]);

  const handleGeneratePoster = () => {
    const url = generateTirePressurePoster({
      bikeType: bikeType === 'road' ? '公路车 Road' : bikeType === 'gravel' ? '全地形 Gravel' : '山地车 MTB',
      totalWeightKg: totalSystemWeight,
      tireSetup: tireSetup === 'tubeless' ? '真空胎 Tubeless' : tireSetup === 'tube' ? '开口胎 + 内胎 Tube' : '管胎 Tubular',
      tireWidth: actualWidth,
      surface: surfaceKey,
      frontRec: parseFloat(result.front.rec) || 0,
      rearRec: parseFloat(result.rear.rec) || 0,
      frontRange: `${result.front.min}-${result.front.max}`,
      rearRange: `${result.rear.min}-${result.rear.max}`,
      unit: pressureUnit,
      isHookless
    });
    setSharePosterUrl(url);
    setIsShareModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <IOSCard variant="glass" className="relative overflow-hidden isolate">
        <div className="pointer-events-none absolute -right-12 -top-12 w-80 h-80 rounded-full blur-3xl opacity-60 bg-ios-blue/15" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-ios-blue/10 border border-ios-blue/20 text-ios-blue text-xs font-semibold mb-2">
              <Gauge className="w-3.5 h-3.5" />
              滚阻与形变算法
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white font-display tracking-tight">公路/全地形智能胎压计算器</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
              综合车手体重、真空胎结构、实测胎宽与路面状况，精准计算前后轮差异化最佳气压。
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleGeneratePoster}
              className="apple-touch h-9 px-3.5 sm:px-4 rounded-2xl bg-ios-blue hover:bg-ios-blue/90 text-white text-xs font-semibold shadow-ios-sm transition flex items-center gap-1.5 whitespace-nowrap shrink-0"
              title="生成科学胎压调校海报卡片"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>生成胎压卡片</span>
            </button>

            {/* Apple Unit Segmented Control */}
            <IOSSegmentedControl
              options={[
                { id: 'psi', label: 'PSI' },
                { id: 'bar', label: 'BAR' },
                { id: 'kpa', label: 'KPA' },
              ]}
              value={pressureUnit}
              onChange={(val) => setPressureUnit(val as any)}
              size="sm"
            />
          </div>
        </div>
      </IOSCard>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs */}
        <div className="lg:col-span-6 space-y-6">
          <IOSCard variant="default" className="space-y-5">
            <h2 className="text-base font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-ios-blue" />
              车辆与骑行参数
            </h2>

            {/* Bike Type Selector */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">{language === 'zh-TW' ? '車輛類型' : '车辆类型'}</label>
              <IOSSegmentedControl
                options={[
                  { id: 'road', label: language === 'zh-TW' ? '公路車' : '公路车' },
                  { id: 'gravel', label: 'Gravel' },
                  { id: 'mtb', label: language === 'zh-TW' ? '山地車' : '山地车' },
                ]}
                value={bikeType}
                onChange={(val) => {
                  const bId = val as 'road' | 'gravel' | 'mtb';
                  setBikeType(bId);
                  const defTire = bId === 'road' ? 28 : bId === 'gravel' ? 40 : 55;
                  setNominalWidth(defTire);
                  setActualWidth(defTire + 1);
                }}
                size="md"
              />
            </div>

            {/* Weight Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    {language === 'zh-TW' ? '車手淨體重' : '车手净体重'}
                    {profile.weightKg ? (
                      <span className="text-[10px] text-ios-blue font-normal">
                        {language === 'zh-TW' ? '已同步檔案' : '已同步档案'}
                      </span>
                    ) : null}
                  </label>
                  <span className="text-ios-blue font-mono font-semibold text-xs">
                    {isImperial ? `${(riderWeight * 2.20462).toFixed(1)} lbs` : `${riderWeight} kg`}
                  </span>
                </div>
                <NumberStepper
                  value={isImperial ? parseFloat((riderWeight * 2.20462).toFixed(1)) : riderWeight}
                  onChange={(val) => setRiderWeight(isImperial ? parseFloat((val / 2.20462).toFixed(1)) : val)}
                  step={isImperial ? 1 : 0.5}
                  min={isImperial ? 66 : 30}
                  max={isImperial ? 330 : 150}
                  unit={isImperial ? 'lbs' : 'kg'}
                  decimals={1}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    {language === 'zh-TW' ? '車重 + 裝備水壺' : '车重 + 装备水壶'}
                  </label>
                  <span className="text-ios-blue font-mono font-semibold text-xs">
                    {isImperial ? `${(bikeGearWeight * 2.20462).toFixed(1)} lbs` : `${bikeGearWeight} kg`}
                  </span>
                </div>
                <NumberStepper
                  value={isImperial ? parseFloat((bikeGearWeight * 2.20462).toFixed(1)) : bikeGearWeight}
                  onChange={(val) => setBikeGearWeight(isImperial ? parseFloat((val / 2.20462).toFixed(1)) : val)}
                  step={isImperial ? 0.2 : 0.1}
                  min={isImperial ? 11 : 4}
                  max={isImperial ? 66 : 30}
                  unit={isImperial ? 'lbs' : 'kg'}
                  decimals={1}
                />
              </div>
            </div>

            {/* Weight Distribution Slider */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center">
                  前后轮重量分配 (Front / Rear Distribution)
                  <Tooltip content="公路车上体前倾常见比例为前轮 42%~45%，后轮 55%~58%" />
                </label>
                <span className="text-ios-blue font-mono font-semibold text-xs">前 {weightDistFront}% / 后 {weightDistRear}%</span>
              </div>
              <input
                type="range"
                min="38"
                max="50"
                step="1"
                value={weightDistFront}
                onChange={(e) => setWeightDistFront(Number(e.target.value))}
                className="w-full h-2 bg-slate-200 dark:bg-white/10 rounded-full appearance-none cursor-pointer accent-ios-blue"
              />
            </div>

            {/* Bikepacking / Long-Distance Luggage Tuning */}
            <div className="p-3.5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎒</span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      长途重装 / Bikepacking 驮包模式
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      附加行囊载荷、重心重构与防砸圈胎压补偿
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={isBikepacking}
                  onChange={(e) => setIsBikepacking(e.target.checked)}
                  className="w-4 h-4 rounded accent-amber-500 cursor-pointer"
                />
              </div>

              {isBikepacking && (
                <div className="pt-2 border-t border-amber-500/15 space-y-3 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      行李行囊净重 (Luggage Weight)
                    </span>
                    <span className="text-amber-600 dark:text-amber-400 font-mono font-bold text-xs">
                      +{luggageKg} kg ({Math.round(luggageKg * 2.20462)} lbs)
                    </span>
                  </div>
                  <NumberStepper
                    value={luggageKg}
                    onChange={(val) => setLuggageKg(val)}
                    step={1}
                    min={1}
                    max={40}
                    unit="kg"
                    decimals={0}
                  />

                  <div>
                    <span className="text-xs text-slate-700 dark:text-slate-300 font-medium block mb-1.5">
                      主要装载重心分布 (Center of Gravity)
                    </span>
                    <IOSSegmentedControl
                      options={[
                        { id: 'front', label: '车头/前叉包' },
                        { id: 'frame', label: '车架包均衡' },
                        { id: 'rear', label: '后鞍包/后驮包' }
                      ]}
                      value={luggageBias}
                      onChange={(val) => setLuggageBias(val as any)}
                      size="sm"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/70 dark:bg-black/20 border border-amber-500/20 text-[11px] flex items-center justify-between text-slate-600 dark:text-slate-300">
                    <span>重构后动态前后载荷比：</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      前轮 {effectiveFrontPct}% / 后轮 {effectiveRearPct}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Tire Setup */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">{language === 'zh-TW' ? '外胎系統' : '轮胎系统'}</label>
              <IOSSegmentedControl
                options={[
                  { id: 'tubeless', label: language === 'zh-TW' ? '真空胎' : '真空胎' },
                  { id: 'tube', label: language === 'zh-TW' ? '內胎' : '内胎' },
                  { id: 'tubular', label: language === 'zh-TW' ? '管胎' : '管胎' },
                ]}
                value={tireSetup}
                onChange={(val) => setTireSetup(val as any)}
                size="md"
              />
            </div>

            {/* Dimensions & Hookless toggle */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">标称胎宽 (mm)</label>
                <select
                  value={nominalWidth}
                  onChange={(e) => {
                    const w = Number(e.target.value);
                    setNominalWidth(w);
                    setActualWidth(w + 1);
                  }}
                  className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200/80 dark:border-white/15 rounded-xl px-3 py-2 text-xs text-slate-900 dark:text-slate-200 focus:outline-none focus:border-ios-blue"
                >
                  {[23, 25, 28, 30, 32, 35, 38, 40, 42, 45, 50, 54].map((w) => (
                    <option key={w} value={w}>{w}c / {w}mm</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">实测胎宽 (mm)</label>
                <NumberStepper
                  value={actualWidth}
                  onChange={setActualWidth}
                  step={0.5}
                  min={18}
                  max={70}
                  unit="mm"
                  decimals={1}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-1">车圈内宽 (mm)</label>
                <NumberStepper
                  value={rimInnerWidth}
                  onChange={setRimInnerWidth}
                  step={0.5}
                  min={13}
                  max={45}
                  unit="mm"
                  decimals={1}
                />
              </div>
            </div>

            {/* Hookless & Tire Insert Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Hookless Rim Option */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block">无钩车圈 (Hookless Rim)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">ETRTO 强制上限 72.5 PSI (5.0 Bar)</span>
                </div>
                <input
                  type="checkbox"
                  checked={isHookless}
                  onChange={(e) => setIsHookless(e.target.checked)}
                  className="w-4 h-4 rounded accent-ios-blue cursor-pointer"
                />
              </div>

              {/* Tire Insert Option */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-black/[0.05] dark:border-white/[0.08]">
                <div>
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 block">防爆胎垫 / 内衬 (Tire Insert)</span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">如 CushCore/Vittoria，防磕圈自适应降压 2.5 PSI</span>
                </div>
                <input
                  type="checkbox"
                  checked={hasTireInsert}
                  onChange={(e) => setHasTireInsert(e.target.checked)}
                  className="w-4 h-4 rounded accent-ios-blue cursor-pointer"
                />
              </div>
            </div>

            {/* Surface Type */}
            <div>
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300 block mb-2">主要路面条件 (Surface Conditions)</label>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(SURFACE_FACTORS).map(([key, s]) => {
                  const isSelected = surfaceKey === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSurfaceKey(key)}
                      className={`p-2.5 rounded-xl border text-left transition apple-touch ${
                        isSelected
                          ? 'bg-ios-blue text-white border-ios-blue font-bold shadow-sm ring-1.5 ring-ios-blue/30 scale-[1.01]'
                          : 'bg-slate-50 dark:bg-white/[0.03] border-slate-200/80 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-white/20'
                      }`}
                    >
                      <div className={`text-xs ${isSelected ? 'font-bold text-white' : 'font-medium'}`}>{s.label}</div>
                      <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/85' : 'text-slate-500 dark:text-slate-400'}`}>{s.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </IOSCard>
        </div>

        {/* Right Output Results */}
        <div className="lg:col-span-6 space-y-6">
          {/* Hookless ETRTO Width Mismatch Banner */}
          {result.isHooklessWidthMismatch && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-950 dark:text-rose-200 text-xs space-y-1.5 shadow-ios-sm animate-pulse">
              <div className="font-bold flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>ETRTO 2023/2024 禁忌组合警报：无钩圈宽胎匹配违规！</span>
              </div>
              <p className="leading-relaxed opacity-95">
                当前车圈内宽为 <strong>{rimInnerWidth}mm</strong>（≥23mm），而外胎规格仅为 <strong>{nominalWidth}c</strong>（&lt;28c）。根据国际自行车轮胎与轮圈组织 (ETRTO) 规范，宽内宽无钩轮圈严禁搭配小于 28c 外胎！此时胎圈无法产生足够的机械锁紧拉力，在压弯、路面坑洼或高速刹车时极易发生<strong>突发性脱圈爆胎事故</strong>。请立即更换 28c 或以上外胎！
              </p>
            </div>
          )}

          {/* Hookless Pressure Danger/Warning */}
          {result.isHooklessPressureExceeded && (
            <div className="p-4 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-rose-900 dark:text-rose-200 text-xs space-y-1.5 shadow-ios-sm">
              <div className="font-bold flex items-center gap-2 text-sm text-rose-600 dark:text-rose-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>突破无钩轮圈 (Hookless) 72.5 PSI 极限安全红线！</span>
              </div>
              <p className="leading-relaxed opacity-95">
                当前计算气压（前 {result.front.rec} / 后 {result.rear.rec} {pressureUnit.toUpperCase()}）已突破国际 ETRTO/ISO 无钩轮圈 <strong>72.5 PSI (5.0 Bar)</strong> 绝对强制安全上限！无钩轮圈没有内扣机械锁止突缘，超压极易导致外胎炸出车圈。强烈建议选用 28c~32c 更宽外胎以将安全气压降至 50~65 PSI。
              </p>
            </div>
          )}

          {result.isHooklessPressureWarning && (
            <div className="p-4 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 shadow-ios-sm">
              <div className="font-bold flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>气压临近无钩圈 72.5 PSI 安全阈值</span>
              </div>
              <p className="leading-relaxed opacity-95">
                当前推荐气压（后轮 {result.rear.rec} {pressureUnit.toUpperCase()}）已处于 68~72.5 PSI 高压临界区间。夏季柏油路面温度可达 50°C+，会导致胎内空气热膨胀再升高 3~5 PSI，建议充气时预留 3 PSI 冗余，或升级更宽外胎获得更高舒适性与安全性。
              </p>
            </div>
          )}

          {/* Visual Dials Row */}
          <div className="grid grid-cols-2 gap-4">
            <TireGauge
              label="前轮推荐气压仪表"
              psi={result.front.rawPsi}
              minPsi={result.front.rawPsi * 0.94}
              maxPsi={result.front.rawPsi * 1.06}
              unit={pressureUnit}
              displayValue={result.front.rec}
            />
            <TireGauge
              label="后轮推荐气压仪表"
              psi={result.rear.rawPsi}
              minPsi={result.rear.rawPsi * 0.94}
              maxPsi={result.rear.rawPsi * 1.06}
              unit={pressureUnit}
              displayValue={result.rear.rec}
            />
          </div>

          {/* Numerical Display Cards */}
          <div className="grid grid-cols-2 gap-4">
            <IOSCard variant="default" className="p-5 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-ios-blue uppercase">前轮建议区间</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-1">
                {result.front.min} - {result.front.max} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">{pressureUnit.toUpperCase()}</span>
              </div>
              <span className="text-[10px] text-slate-500">前轴抓地与舒适滤震</span>
            </IOSCard>

            <IOSCard variant="default" className="p-5 space-y-1">
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-semibold text-ios-blue uppercase">后轮建议区间</span>
              </div>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100 my-1">
                {result.rear.min} - {result.rear.max} <span className="text-xs text-slate-500 dark:text-slate-400 font-sans font-normal">{pressureUnit.toUpperCase()}</span>
              </div>
              <span className="text-[10px] text-slate-500">驱动承重与低滚阻</span>
            </IOSCard>
          </div>

          {/* Tips and Explanation Box */}
          <IOSCard variant="default" className="p-6 space-y-4">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-ios-blue" />
              气压微调与防扎防护建议
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-700 dark:text-slate-300">
              {result.notes.map((note, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-ios-blue mt-1.5 shrink-0"></span>
                  <span className="leading-relaxed">{note}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-ios-blue mt-1.5 shrink-0"></span>
                <span className="leading-relaxed">
                  <strong>温度气压效应：</strong>气温每上升或下降 5°C，外胎气压会随之波动约 1~1.5 PSI。夏季室外暴晒骑行前建议留有余量。
                </span>
              </li>
            </ul>
          </IOSCard>
        </div>
      </div>

      {/* Social Share Poster Modal */}
      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        imageUrl={sharePosterUrl}
        title="科学胎压调校卡"
        downloadFileName={`SoloRider_科学胎压_${actualWidth}mm_${pressureUnit.toUpperCase()}.png`}
      />
    </div>
  );
};
